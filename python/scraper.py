import datetime
from browserbase import Browserbase
from pydantic import BaseModel, Field, HttpUrl
from typing import List
from openai import OpenAI

openai = OpenAI()
browser = Browserbase()


class HNStory(BaseModel):
    title: str
    points: int
    by: str
    url: HttpUrl
    date: datetime.datetime


class HNTop(BaseModel):
    top: List[HNStory] = Field(
        ..., description="Top 5 stories on Hacker News", min_length=5, max_length=5
    )


schema = HNTop.model_json_schema()
html = browser.load_url("https://news.ycombinator.com/")

chat_completion = openai.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {
            "role": "system",
            "content": "You are a web scraper. Extract the contents of the webpage",
        },
        {"role": "user", "content": html},
    ],
    tools=[
        {
            "type": "function",
            "function": {
                "name": "extract_content",
                "description": "Extracts the content from the given webpage(s)",
                "parameters": schema,
            },
        }
    ],
    tool_choice="auto",
)

result = chat_completion.choices[0].message.tool_calls[0].function.arguments  # type: ignore
parsed = HNTop.model_validate_json(result)

print(parsed.top)

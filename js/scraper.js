import { OpenAI } from "openai";
import { Browserbase } from "@browserbasehq/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const openai = new OpenAI();
const browser = new Browserbase();

const schema = z.object({
  top: z
    .array(
      z.object({
        title: z.string(),
        points: z.number(),
        by: z.string(),
        url: z.string(),
        date: z.string(),
      })
    )
    .length(5)
    .describe("Top 5 stories on Hacker News"),
});

const JSONSchema = zodToJsonSchema(schema);
const html = await browser.loadURL("https://news.ycombinator.com/");

const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "Extract the content from the given webpage(s)",
    },
    { role: "user", content: html },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "extract_content",
        description: "Extracts the content from the given webpage(s)",
        parameters: JSONSchema,
      },
    },
  ],
  tool_choice: "auto",
});

const result = completion.choices[0].message.tool_calls[0].function.arguments;
const parsed = schema.parse(JSON.parse(result));

console.log(parsed.top);

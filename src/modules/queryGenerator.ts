import { anthropic } from "../utils/anthropicClient";
import { schemaCache } from "../server";

export async function generateMongoQuery(nlQuery: string) {
  const schemaJson = JSON.stringify(schemaCache, null, 2);

  const response = await anthropic.messages.create({
    model: "claude-3-7-sonnet-latest",
    max_tokens: 512,
    temperature: 0,
    system:
      "You are an expert MongoDB query generator. You must respond with only a JSON object containing the MongoDB query structure.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "The following is the current MongoDB schema (do not include in your response):",
          },
          {
            type: "text",
            text: `\`\`\`json\n${schemaJson}\n\`\`\``,
          },
          {
            type: "text",
            text: `Now generate a MongoDB query for this request: "${nlQuery}". Respond ONLY with a JSON object.`,
          },
        ],
      },
    ],
  });

  const firstBlock = response.content[0];

  if (firstBlock.type === "text" && "text" in firstBlock) {
    const cleaned = firstBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/, "");

    return JSON.parse(cleaned);
  }

  throw new Error("Claude did not return a valid text block");
}

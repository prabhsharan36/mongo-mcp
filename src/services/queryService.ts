import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export const generateMongoQuery = async (
  naturalLanguageQuery: string
): Promise<any> => {
  try {
    const prompt = `Convert the following natural language query to a valid MongoDB query:

    "${naturalLanguageQuery}"`;

    const completion = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const queryText =
      completion?.content[0]?.type === "text"
        ? completion.content[0].text
        : null;

    if (!queryText) throw new Error("Failed to generate MongoDB query.");

    console.log("Generated Mongo Query:", queryText);

    return JSON.parse(queryText);
  } catch (error) {
    console.error("Error generating Mongo query:", error);

    throw error;
  }
};

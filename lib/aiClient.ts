import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error(
    "ANTHROPIC_API_KEY is not set. Please add it to your environment variables."
  );
}

const anthropic = new Anthropic({
  apiKey,
});

export default anthropic;

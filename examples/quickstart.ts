import Cortiqa from "@cortiqa/sdk";

// Initialize client (reads CORTIQA_API_KEY from environment)
const client = new Cortiqa();

async function main() {
  console.log("Sending prompt to Cortiqa Falin-01...");

  // Option A: Anthropic style (client.messages.create)
  const message = await client.messages.create({
    model: "falin-01",
    max_tokens: 300,
    messages: [
      { role: "system", content: "You are a helpful assistant by Cortiqa." },
      { role: "user", content: "Explain Next.js Server Actions in two sentences." },
    ],
  });

  console.log("\nResponse:");
  console.log(message.content);

  if (message.usage) {
    console.log(`\nTokens used: ${message.usage.total_tokens}`);
  }
}

main().catch(console.error);

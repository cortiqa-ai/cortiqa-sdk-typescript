import Cortiqa from "@cortiqa/sdk";

const client = new Cortiqa();

async function main() {
  console.log("Streaming real-time tokens from falin-01:\n");

  const stream = await client.messages.stream({
    model: "falin-01",
    messages: [
      { role: "user", content: "Write a short motivational quote for startup founders." },
    ],
  });

  for await (const token of stream.textStream()) {
    process.stdout.write(token);
  }

  const finalMsg = stream.getFinalMessage();
  console.log(`\n\nStream finished! Accumulated tokens: ${finalMsg.usage?.total_tokens}`);
}

main().catch(console.error);

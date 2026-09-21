import Cortiqa from "@cortiqa/sdk";

const client = new Cortiqa();

async function main() {
  console.log("Fetching live Cortiqa models...");
  const models = await client.models.list();

  console.log(`\nDiscovered ${models.length} AI Models:`);
  console.log("--------------------------------------------------");
  for (const m of models) {
    const tier = m.free ? "Free Tier" : "Pro / Enterprise";
    console.log(`ID:          ${m.id} (${m.name || m.id})`);
    console.log(`Provider:    ${m.provider}`);
    console.log(`Tier:        ${tier}`);
    console.log(`Description: ${m.description}`);
    console.log("--------------------------------------------------");
  }
}

main().catch(console.error);

import Cortiqa, { ChatMessage, Tool } from "@cortiqa/sdk";

const client = new Cortiqa();

// Define tool schema
const tools: Tool[] = [
  {
    type: "function",
    function: {
      name: "get_flight_status",
      description: "Get real-time flight status and departure gate",
      parameters: {
        type: "object",
        properties: {
          flight_number: { type: "string", description: "Flight number e.g. AI-101" },
        },
        required: ["flight_number"],
      },
    },
  },
];

function getFlightStatus(flightNumber: string) {
  return JSON.stringify({
    flight_number: flightNumber,
    status: "On Time",
    gate: "14B",
    estimated_departure: "16:30 IST",
  });
}

async function main() {
  const messages: ChatMessage[] = [
    { role: "user", content: "Is flight AI-101 on time today?" },
  ];

  console.log("Sending message with tool specifications to falin-01...");
  const response = await client.messages.create({
    model: "falin-01",
    messages,
    tools,
  });

  const choice = response.choices[0];
  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    for (const toolCall of choice.message.tool_calls) {
      console.log(`\nModel triggered Tool Call: ${toolCall.function.name}`);
      const args = JSON.parse(toolCall.function.arguments);
      console.log("Arguments:", args);

      const result = getFlightStatus(args.flight_number);

      // Append assistant message and tool response
      messages.push(choice.message);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    console.log("\nSynthesizing final natural language response...");
    const finalAnswer = await client.messages.create({
      model: "falin-01",
      messages,
    });

    console.log("\nFinal Output:");
    console.log(finalAnswer.content);
  } else {
    console.log(response.content);
  }
}

main().catch(console.error);

# Tool Calling (Function Calling) with Cortiqa TypeScript SDK

Cortiqa models support structured tool calling for executing custom functions, invoking external APIs, or connecting agent systems.

---

## Defining a Tool

Tools are specified using JSON Schema:

```typescript
import { Tool } from "@cortiqa/sdk";

export const weatherTool: Tool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get temperature and forecast for a given location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City and state, e.g. Bengaluru, India" },
        unit: { type: "string", enum: ["celsius", "fahrenheit"] },
      },
      required: ["location"],
    },
  },
};
```

---

## Executing Tool Calls

```typescript
import Cortiqa, { ChatMessage } from "@cortiqa/sdk";
import { weatherTool } from "./tools";

const client = new Cortiqa();

async function runAgent(userPrompt: string) {
  const messages: ChatMessage[] = [{ role: "user", content: userPrompt }];

  const response = await client.messages.create({
    model: "falin-01",
    messages,
    tools: [weatherTool],
  });

  const choice = response.choices[0];
  if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
    for (const toolCall of choice.message.tool_calls) {
      if (toolCall.function.name === "get_weather") {
        const args = JSON.parse(toolCall.function.arguments);
        const result = JSON.stringify({ location: args.location, temp: "28°C" });

        // Push assistant tool call and tool result
        messages.push(choice.message);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }

    // Final answer from model
    const finalAnswer = await client.messages.create({
      model: "falin-01",
      messages,
    });

    console.log(finalAnswer.content);
  }
}
```

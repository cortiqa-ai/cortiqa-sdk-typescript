# Cortiqa AI TypeScript & JavaScript SDK

[![npm version](https://img.shields.io/npm/v/@cortiqa/sdk.svg)](https://www.npmjs.com/package/@cortiqa/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Official TypeScript and JavaScript client library for **Cortiqa AI** and **Falin Foundation Models**. Built for modern full-stack web applications, edge runtimes, Next.js, and autonomous AI agents.

---

## ⚡ Installation

```bash
npm install @cortiqa/sdk
```

Or using pnpm / yarn / bun:

```bash
pnpm add @cortiqa/sdk
# or
yarn add @cortiqa/sdk
# or
bun add @cortiqa/sdk
```

---

## 🚀 Quickstart

Set your API key in your environment:

```bash
export CORTIQA_API_KEY="sk-cortiqa-your-api-key"
```

### Option A: Anthropic-Style (`client.messages.create`)

```typescript
import Cortiqa from "@cortiqa/sdk";

const client = new Cortiqa();

const message = await client.messages.create({
  model: "falin-01",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Explain quantum computing in two sentences." }
  ],
});

console.log(message.content);
```

### Option B: OpenAI-Style (`client.chat.completions.create`)

```typescript
import Cortiqa from "@cortiqa/sdk";

const client = new Cortiqa();

const completion = await client.chat.completions.create({
  model: "falin-01",
  messages: [
    { role: "system", content: "You are an AI assistant by Cortiqa." },
    { role: "user", content: "Hello!" }
  ],
});

console.log(completion.choices[0].message.content);
```

---

## 🌊 Real-Time Streaming

Effortlessly stream tokens using the built-in `textStream()` helper:

```typescript
import Cortiqa from "@cortiqa/sdk";

const client = new Cortiqa();

const stream = await client.messages.stream({
  model: "falin-01",
  messages: [{ role: "user", content: "Write a poem about Mumbai." }],
});

for await (const token of stream.textStream()) {
  process.stdout.write(token);
}

const finalMessage = stream.getFinalMessage();
console.log(`\nTokens used: ${finalMessage.usage?.total_tokens}`);
```

---

## 🛠️ Tool Calling (Function Calling)

Cortiqa Falin models support structured tool execution:

```typescript
import Cortiqa, { Tool } from "@cortiqa/sdk";

const client = new Cortiqa();

const tools: Tool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get temperature for a city",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" },
        },
        required: ["city"],
      },
    },
  },
];

const response = await client.messages.create({
  model: "falin-01",
  messages: [{ role: "user", content: "What is the weather in Delhi?" }],
  tools,
});

if (response.choices[0].message.tool_calls) {
  console.log("Tool requested:", response.choices[0].message.tool_calls);
}
```

---

## 🌐 Runtime Support

The SDK uses standard Web APIs (`fetch`, `AbortController`, `ReadableStream`) and runs out-of-the-box on:

* **Node.js (18+)**
* **Next.js (App Router & Server Actions)**
* **Vercel Edge Functions**
* **Cloudflare Workers**
* **Bun & Deno**
* **Browsers**

---

## ⚙️ Configuration

```typescript
const client = new Cortiqa({
  apiKey: "sk-cortiqa-...",              // Defaults to process.env.CORTIQA_API_KEY
  baseURL: "https://api.cortiqa.co",     // Defaults to https://api.cortiqa.co
  timeout: 60_000,                       // 60 seconds
  maxRetries: 2,                         // Retries on 429/5xx errors
});
```

---

## 🛡️ Error Handling

```typescript
import Cortiqa, { AuthenticationError, RateLimitError, APIError } from "@cortiqa/sdk";

const client = new Cortiqa();

try {
  const response = await client.messages.create({
    model: "falin-01",
    messages: [{ role: "user", content: "Hi" }],
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API Key!");
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit hit! Back off requests.");
  } else if (error instanceof APIError) {
    console.error(`API Error ${error.status}: ${error.message}`);
  }
}
```

---

## 📄 Documentation Links

* [API Reference](api.md)
* [Tools & Function Calling](tools.md)
* [Streaming & Helpers](helpers.md)
* [Contributing Guide](CONTRIBUTING.md)
* [Changelog](CHANGELOG.md)

---

## 📄 License

MIT © [Cortiqa AI](https://cortiqa.co)

# Cortiqa TypeScript SDK API Reference

Comprehensive reference for all classes, methods, options, types, and errors in the `@cortiqa/sdk` library.

---

## Table of Contents

- [Client Initialization](#client-initialization)
- [Resources](#resources)
  - [`client.messages.create()`](#clientmessagescreate)
  - [`client.messages.stream()`](#clientmessagesstream)
  - [`client.chat.completions.create()`](#clientchatcompletionscreate)
  - [`client.models.list()`](#clientmodelslist)
- [Data Models & Interfaces](#data-models--interfaces)
- [Error Handling](#error-handling)

---

## Client Initialization

```typescript
import Cortiqa from "@cortiqa/sdk";

const client = new Cortiqa({
  apiKey?: string;        // process.env.CORTIQA_API_KEY
  baseURL?: string;       // "https://api.cortiqa.co"
  timeout?: number;       // 60,000 ms
  maxRetries?: number;    // 2
  fetch?: typeof fetch;   // Custom fetch implementation
});
```

---

## Resources

### `client.messages.create(params)`

Anthropic-style message completion.

```typescript
const message = await client.messages.create({
  model: "falin-01",
  messages: [{ role: "user", content: "Explain gravity." }],
  max_tokens?: 500,
  temperature?: 0.7,
  top_p?: 1.0,
  stream?: false,
  tools?: Tool[],
  tool_choice?: "auto" | "required" | { type: "function"; function: { name: string } },
});
```

### `client.messages.stream(params)`

Helper to stream tokens with an AsyncIterable stream.

```typescript
const stream = await client.messages.stream({
  model: "falin-01",
  messages: [{ role: "user", content: "Write a poem." }],
});

for await (const text of stream.textStream()) {
  process.stdout.write(text);
}

const message = stream.getFinalMessage();
```

### `client.chat.completions.create(params)`

OpenAI-style chat completion interface.

```typescript
const completion = await client.chat.completions.create({
  model: "falin-pro",
  messages: [
    { role: "system", content: "You are a coding assistant." },
    { role: "user", content: "Write a TypeScript debounce function." }
  ],
});
```

### `client.models.list()`

Returns a list of all models available on Cortiqa.

```typescript
const models = await client.models.list();
```

---

## Error Handling

```typescript
import {
  CortiqaError,
  APIError,
  AuthenticationError,    // 401
  PermissionDeniedError,  // 403
  NotFoundError,          // 404
  RateLimitError,         // 429
  InternalServerError,    // 500+
  APIConnectionError,
  APITimeoutError,
} from "@cortiqa/sdk";
```

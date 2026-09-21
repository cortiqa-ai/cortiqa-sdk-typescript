# Helpers & Advanced Usage in Cortiqa TypeScript SDK

This guide covers streaming helpers, custom fetch, edge runtime, and resilience in `@cortiqa/sdk`.

---

## 1. Streaming Helpers

### `textStream()`

Instead of extracting `chunk.choices[0].delta.content` manually, use the `.textStream()` async generator:

```typescript
const stream = await client.messages.stream({
  model: "falin-01",
  messages: [{ role: "user", content: "Tell me a joke." }],
});

for await (const text of stream.textStream()) {
  process.stdout.write(text);
}
```

### `getFinalMessage()`

Accumulates the full `ChatCompletion` message automatically:

```typescript
const finalMessage = stream.getFinalMessage();
console.log(finalMessage.content);
```

---

## 2. Using with Next.js App Router (Server Actions & Route Handlers)

```typescript
// app/api/chat/route.ts
import Cortiqa from "@cortiqa/sdk";

const client = new Cortiqa();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "falin-01",
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const text of stream.textStream()) {
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

---

## 3. Custom Fetch & Proxies

You can provide a custom `fetch` instance for corporate proxies, logging, or test mocking:

```typescript
import Cortiqa from "@cortiqa/sdk";

const client = new Cortiqa({
  fetch: async (url, init) => {
    console.log("Outgoing HTTP:", url, init?.method);
    return fetch(url, init);
  },
});
```

---

## 4. Retries & Timeouts

The SDK automatically retries on 429 and 5xx errors with exponential backoff:

```typescript
const client = new Cortiqa({
  timeout: 15_000,    // 15 seconds
  maxRetries: 4,      // Retry up to 4 times
});
```

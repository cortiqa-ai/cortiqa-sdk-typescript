import { ChatCompletion, ChatCompletionChunk } from "./types/chat.js";

/**
 * Stream wrapper implementing AsyncIterable for real-time SSE tokens.
 */
export class Stream<Item = ChatCompletionChunk> implements AsyncIterable<Item> {
  private response: Response;
  private controller: AbortController;
  private collectedTokens: string[] = [];
  private lastId = "";
  private lastModel = "falin-01";

  constructor(response: Response, controller: AbortController) {
    this.response = response;
    this.controller = controller;
  }

  /**
   * Abort the ongoing stream.
   */
  abort(): void {
    this.controller.abort();
  }

  /**
   * Async iterator yielding chunk objects.
   */
  async *[Symbol.asyncIterator](): AsyncIterator<Item> {
    if (!this.response.body) {
      throw new Error("Response body is null or streaming is unsupported in this environment.");
    }

    const reader = this.response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6).trim();
          if (data === "[DONE]") {
            return;
          }

          try {
            const parsed = JSON.parse(data) as ChatCompletionChunk;
            if (parsed.id) this.lastId = parsed.id;
            if (parsed.model) this.lastModel = parsed.model;
            if (parsed.choices?.[0]?.delta?.content) {
              this.collectedTokens.push(parsed.choices[0].delta.content);
            }
            yield parsed as unknown as Item;
          } catch {
            // Ignore non-JSON or partial line chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Yield plain text tokens directly without the chunk envelope.
   */
  async *textStream(): AsyncIterable<string> {
    for await (const chunk of this) {
      const c = chunk as unknown as ChatCompletionChunk;
      if (c.choices?.[0]?.delta?.content) {
        yield c.choices[0].delta.content;
      }
    }
  }

  /**
   * Build the complete accumulated ChatCompletion message after streaming ends.
   */
  getFinalMessage(): ChatCompletion {
    const fullContent = this.collectedTokens.join("");
    return {
      id: this.lastId || "chatcmpl-streamed",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: this.lastModel,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: fullContent,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: this.collectedTokens.length,
        total_tokens: this.collectedTokens.length,
      },
      content: fullContent,
    };
  }
}

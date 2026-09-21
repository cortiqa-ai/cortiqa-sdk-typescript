import { Cortiqa } from "../client.js";
import { Stream } from "../streaming.js";
import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from "../types/chat.js";

export class CompletionsResource {
  private client: Cortiqa;

  constructor(client: Cortiqa) {
    this.client = client;
  }

  /**
   * Create a chat completion (non-streaming).
   */
  create(params: ChatCompletionCreateParamsNonStreaming): Promise<ChatCompletion>;

  /**
   * Create a streaming chat completion returning an AsyncIterable stream.
   */
  create(params: ChatCompletionCreateParamsStreaming): Promise<Stream<ChatCompletionChunk>>;

  /**
   * Create a chat completion.
   */
  create(
    params: ChatCompletionCreateParams
  ): Promise<ChatCompletion | Stream<ChatCompletionChunk>>;

  async create(
    params: ChatCompletionCreateParams
  ): Promise<ChatCompletion | Stream<ChatCompletionChunk>> {
    if (params.stream) {
      return this.client.requestStream<ChatCompletionChunk>("/v1/chat/completions", {
        method: "POST",
        body: params,
      });
    }

    const response = await this.client.request<ChatCompletion>("/v1/chat/completions", {
      method: "POST",
      body: params,
    });

    if (response.choices?.[0]?.message?.content) {
      response.content = response.choices[0].message.content;
    }
    return response;
  }

  /**
   * Stream tokens with helper context (Anthropic style).
   */
  stream(params: Omit<ChatCompletionCreateParams, "stream">): Promise<Stream<ChatCompletionChunk>> {
    return this.create({
      ...params,
      stream: true,
    });
  }
}

export class ChatResource {
  completions: CompletionsResource;

  constructor(client: Cortiqa) {
    this.completions = new CompletionsResource(client);
  }
}

/**
 * Anthropic-style messages resource alias.
 */
export class MessagesResource {
  private completions: CompletionsResource;

  constructor(client: Cortiqa) {
    this.completions = new CompletionsResource(client);
  }

  /**
   * Create a message completion (non-streaming).
   */
  create(params: ChatCompletionCreateParamsNonStreaming): Promise<ChatCompletion>;

  /**
   * Create a streaming message completion.
   */
  create(params: ChatCompletionCreateParamsStreaming): Promise<Stream<ChatCompletionChunk>>;

  create(
    params: ChatCompletionCreateParams
  ): Promise<ChatCompletion | Stream<ChatCompletionChunk>>;

  create(
    params: ChatCompletionCreateParams
  ): Promise<ChatCompletion | Stream<ChatCompletionChunk>> {
    return this.completions.create(params as any);
  }

  /**
   * Stream message tokens.
   */
  stream(params: Omit<ChatCompletionCreateParams, "stream">): Promise<Stream<ChatCompletionChunk>> {
    return this.completions.stream(params);
  }
}

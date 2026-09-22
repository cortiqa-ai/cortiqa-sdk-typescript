import { Cortiqa } from "../client.js";
import { Stream } from "../streaming.js";
import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from "../types/chat.js";

function normalizeTools(tools?: any[]): any[] | undefined {
  if (!tools || !Array.isArray(tools)) return undefined;
  return tools.map((tool) => {
    if (tool && typeof tool === "object") {
      if (tool.type === "function" && tool.function) {
        return tool;
      }
      if (tool.function && !tool.type) {
        return { type: "function", function: tool.function };
      }
      if (tool.name && !tool.function) {
        const { name, description, parameters, ...rest } = tool;
        const func: Record<string, unknown> = { name };
        if (description !== undefined) func.description = description;
        if (parameters !== undefined) func.parameters = parameters;
        return {
          type: "function",
          function: { ...func, ...rest },
        };
      }
    }
    return tool;
  });
}

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
    const effectiveModel = params.model || this.client.defaultModel;
    const normalizedTools = normalizeTools(params.tools as any[]);

    const payload: Record<string, unknown> = {
      ...params,
      model: effectiveModel,
    };
    if (normalizedTools !== undefined) {
      payload.tools = normalizedTools;
    }

    if (params.stream) {
      return this.client.requestStream<ChatCompletionChunk>("/v1/chat/completions", {
        method: "POST",
        body: payload,
      });
    }

    const response = await this.client.request<ChatCompletion>("/v1/chat/completions", {
      method: "POST",
      body: payload,
    });

    const msg = response.choices?.[0]?.message;
    if (msg?.content) {
      response.content = msg.content;
    }
    if (msg) {
      response.reasoning = msg.reasoning || msg.reasoning_content || null;
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
    } as ChatCompletionCreateParamsStreaming);
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

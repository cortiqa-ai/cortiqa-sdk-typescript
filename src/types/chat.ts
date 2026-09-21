/**
 * Type definitions for Chat & Message Completions.
 */

export type Role = "system" | "user" | "assistant" | "tool";

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface Tool {
  type: "function";
  function: FunctionDefinition;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ToolCall {
  id?: string;
  type: "function";
  function: FunctionCall;
}

export interface ChatMessage {
  role: Role;
  content: string | null;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "tool_calls" | "length" | string;
}

export interface ChatCompletion {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: Usage;
  /** Convenience getter for first choice text content */
  content?: string;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: {
    role?: Role;
    content?: string;
    tool_calls?: ToolCall[];
  };
  finish_reason?: string | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export interface ChatCompletionCreateParamsNonStreaming {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: false;
  tools?: Tool[];
  tool_choice?: "auto" | "required" | { type: "function"; function: { name: string } };
  [key: string]: unknown;
}

export interface ChatCompletionCreateParamsStreaming {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream: true;
  tools?: Tool[];
  tool_choice?: "auto" | "required" | { type: "function"; function: { name: string } };
  [key: string]: unknown;
}

export type ChatCompletionCreateParams =
  | ChatCompletionCreateParamsNonStreaming
  | ChatCompletionCreateParamsStreaming;

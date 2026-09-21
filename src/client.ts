import {
  APIError,
  AuthenticationError,
  PermissionDeniedError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
  APIConnectionError,
  APITimeoutError,
} from "./error.js";
import { ChatResource, MessagesResource } from "./resources/chat.js";
import { ModelsResource } from "./resources/models.js";
import { Stream } from "./streaming.js";
import { VERSION } from "./version.js";

export interface ClientOptions {
  /**
   * API Key for authenticating with Cortiqa.
   * Defaults to process.env.CORTIQA_API_KEY.
   */
  apiKey?: string;

  /**
   * Base URL for the Cortiqa API.
   * Defaults to https://api.cortiqa.co.
   */
  baseURL?: string;

  /**
   * Request timeout in milliseconds.
   * Defaults to 60,000 (60 seconds).
   */
  timeout?: number;

  /**
   * Maximum number of automatic retries on 429 and 5xx errors.
   * Defaults to 2.
   */
  maxRetries?: number;

  /**
   * Custom fetch function (e.g. for testing or proxying).
   */
  fetch?: typeof fetch;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export class Cortiqa {
  readonly apiKey: string;
  readonly baseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;
  private readonly _fetch: typeof fetch;

  // Resource groups
  readonly chat: ChatResource;
  readonly messages: MessagesResource;
  readonly models: ModelsResource;

  constructor(options: ClientOptions = {}) {
    const envApiKey = typeof process !== "undefined" ? process.env?.["CORTIQA_API_KEY"] : undefined;
    const envBaseURL = typeof process !== "undefined" ? process.env?.["CORTIQA_BASE_URL"] : undefined;

    this.apiKey = options.apiKey || envApiKey || "";
    if (!this.apiKey) {
      throw new AuthenticationError(
        401,
        null,
        "No API key provided. Pass `apiKey` to the constructor or set the `CORTIQA_API_KEY` environment variable."
      );
    }

    this.baseURL = (options.baseURL || envBaseURL || "https://api.cortiqa.co").replace(/\/+$/, "");
    this.timeout = options.timeout ?? 60_000;
    this.maxRetries = options.maxRetries ?? 2;
    this._fetch = options.fetch || globalThis.fetch;

    if (!this._fetch) {
      throw new Error(
        "No global fetch found. If you are using Node < 18, please provide a fetch implementation."
      );
    }

    // Initialize resources
    this.chat = new ChatResource(this);
    this.messages = new MessagesResource(this);
    this.models = new ModelsResource(this);
  }

  /**
   * Internal request dispatcher with auto-retry and typed error handling.
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const method = options.method || "GET";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": `@cortiqa/sdk-ts/${VERSION}`,
      ...options.headers,
    };

    let attempt = 0;
    const bodyStr = options.body ? JSON.stringify(options.body) : undefined;

    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? this.timeout);

      try {
        const response = await this._fetch(url, {
          method,
          headers,
          body: bodyStr,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          let bodyText: string;
          let errorData: any;

          try {
            bodyText = await response.text();
            errorData = JSON.parse(bodyText);
          } catch {
            errorData = bodyText!;
          }

          // Retry on 429 or 5xx if attempts remain
          if ((status === 429 || status >= 500) && attempt < this.maxRetries) {
            attempt++;
            const backoffMs = Math.pow(2, attempt) * 500;
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }

          this.handleErrorResponse(status, errorData);
        }

        return (await response.json()) as T;
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error instanceof APIError) {
          throw error;
        }

        if (error.name === "AbortError") {
          throw new APITimeoutError(`Request to ${url} timed out after ${this.timeout}ms.`);
        }

        if (attempt < this.maxRetries) {
          attempt++;
          const backoffMs = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        throw new APIConnectionError(`Failed to connect to Cortiqa API: ${error.message}`, error);
      }
    }
  }

  /**
   * Internal streaming request dispatcher.
   */
  async requestStream<Item>(path: string, options: RequestOptions = {}): Promise<Stream<Item>> {
    const url = `${this.baseURL}${path}`;
    const method = options.method || "POST";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": `@cortiqa/sdk-ts/${VERSION}`,
      ...options.headers,
    };

    const controller = new AbortController();
    const bodyStr = options.body ? JSON.stringify(options.body) : undefined;

    try {
      const response = await this._fetch(url, {
        method,
        headers,
        body: bodyStr,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorData: any;
        try {
          const text = await response.text();
          errorData = JSON.parse(text);
        } catch (e: any) {
          errorData = e.message;
        }
        this.handleErrorResponse(response.status, errorData);
      }

      return new Stream<Item>(response, controller);
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIConnectionError(`Failed to establish stream to ${url}: ${error.message}`, error);
    }
  }

  private handleErrorResponse(status: number, errorData: any): never {
    const message =
      (typeof errorData === "object" && errorData !== null
        ? errorData.error?.message || errorData.error || errorData.message
        : String(errorData)) || `HTTP ${status} error`;

    switch (status) {
      case 401:
        throw new AuthenticationError(status, errorData, message);
      case 403:
        throw new PermissionDeniedError(status, errorData, message);
      case 404:
        throw new NotFoundError(status, errorData, message);
      case 429:
        throw new RateLimitError(status, errorData, message);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new InternalServerError(status, errorData, message);
      default:
        throw new APIError(status, errorData, message);
    }
  }
}

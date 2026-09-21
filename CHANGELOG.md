# Changelog

All notable changes to `@cortiqa/sdk` will be documented in this file.

---

## [0.1.0] - 2026-09-21

### Added
- Initial release of the official Cortiqa TypeScript & JavaScript SDK.
- Support for Node.js 18+, Bun, Deno, Cloudflare Workers, and Browser.
- Dual API interface:
  - Anthropic-style: `client.messages.create` and `client.messages.stream`.
  - OpenAI-style: `client.chat.completions.create`.
- Falin model support (`falin-01`, `falin-pro`, `falin-vision`, `falin-ultra`).
- Structured Tool Calling (Function Calling).
- Real-time SSE streaming with `AsyncIterable` and `textStream()` generator.
- Automatic exponential backoff retries on 429 and 5xx errors.
- Typed error classes (`AuthenticationError`, `RateLimitError`, `NotFoundError`, etc.).

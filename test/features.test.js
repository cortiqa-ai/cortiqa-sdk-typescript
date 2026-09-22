import test from "node:test";
import assert from "node:assert/strict";
import { Cortiqa, BadRequestError, UnprocessableEntityError } from "../dist/index.js";

test("Default model and client override", () => {
  const client = new Cortiqa({ apiKey: "sk-test" });
  assert.equal(client.defaultModel, "openai/gpt-oss-120b");

  const customClient = new Cortiqa({ apiKey: "sk-test", defaultModel: "custom/model" });
  assert.equal(customClient.defaultModel, "custom/model");
});

test("client.prompt() one-liner helper and default model", async () => {
  let capturedBody = null;
  const mockFetch = async (url, init) => {
    capturedBody = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "chatcmpl-test",
        object: "chat.completion",
        created: 12345,
        model: capturedBody.model,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Paris" },
            finish_reason: "stop",
          },
        ],
      }),
    };
  };

  const client = new Cortiqa({ apiKey: "sk-test", fetch: mockFetch });
  const answer = await client.prompt("Capital of France?");
  assert.equal(answer, "Paris");
  assert.equal(capturedBody.model, "openai/gpt-oss-120b");
  assert.deepEqual(capturedBody.messages, [{ role: "user", content: "Capital of France?" }]);
});

test("Tool normalization and reasoning extraction", async () => {
  let capturedBody = null;
  const mockFetch = async (url, init) => {
    capturedBody = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "chatcmpl-test-tool",
        object: "chat.completion",
        created: 12345,
        model: "openai/gpt-oss-120b",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Done",
              reasoning: "Thinking about weather...",
            },
            finish_reason: "stop",
          },
        ],
      }),
    };
  };

  const client = new Cortiqa({ apiKey: "sk-test", fetch: mockFetch });
  const res = await client.chat.completions.create({
    messages: [{ role: "user", content: "Check weather" }],
    tools: [
      {
        name: "get_weather",
        description: "Fetch weather",
        parameters: { type: "object" },
      },
    ],
  });

  // Tools should be normalized to OpenAI schema: { type: 'function', function: { ... } }
  assert.equal(capturedBody.tools.length, 1);
  assert.equal(capturedBody.tools[0].type, "function");
  assert.equal(capturedBody.tools[0].function.name, "get_weather");

  // Reasoning should be captured on completion
  assert.equal(res.content, "Done");
  assert.equal(res.reasoning, "Thinking about weather...");
});

test("Granular error details parsing (param, BadRequestError, UnprocessableEntityError)", async () => {
  // 400 Bad Request
  const badRequestFetch = async () => ({
    ok: false,
    status: 400,
    text: async () =>
      JSON.stringify({
        error: {
          message: "Invalid max_tokens",
          param: "max_tokens",
          code: "invalid_parameter",
          type: "invalid_request_error",
        },
      }),
  });

  const client = new Cortiqa({ apiKey: "sk-test", fetch: badRequestFetch, maxRetries: 0 });

  await assert.rejects(
    async () => {
      await client.chat.completions.create({
        messages: [{ role: "user", content: "Hi" }],
      });
    },
    (err) => {
      assert(err instanceof BadRequestError);
      assert.equal(err.status, 400);
      assert.equal(err.param, "max_tokens");
      assert.equal(err.code, "invalid_parameter");
      assert(err.message.includes("max_tokens"));
      return true;
    }
  );

  // 422 FastAPI validation error
  const unprocessableFetch = async () => ({
    ok: false,
    status: 422,
    text: async () =>
      JSON.stringify({
        detail: [
          {
            loc: ["body", "temperature"],
            msg: "ensure this value is less than or equal to 2.0",
            type: "value_error.number.not_le",
          },
        ],
      }),
  });

  const client2 = new Cortiqa({ apiKey: "sk-test", fetch: unprocessableFetch, maxRetries: 0 });

  await assert.rejects(
    async () => {
      await client2.chat.completions.create({
        messages: [{ role: "user", content: "Hi" }],
      });
    },
    (err) => {
      assert(err instanceof UnprocessableEntityError);
      assert.equal(err.status, 422);
      assert.equal(err.param, "temperature");
      assert(err.message.includes("temperature"));
      return true;
    }
  );
});

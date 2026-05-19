import { describe, it, expect } from "vitest";
import { createServer, TOOL_COUNT, SERVER_NAME, SERVER_VERSION } from "../src/server.js";
import { withErrorHandling } from "../src/with-error-handling.js";

describe("createServer", () => {
  it("instantiates without throwing", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it("declares the documented tool count + identity", () => {
    expect(TOOL_COUNT).toBe(9);
    expect(SERVER_NAME).toBe("ifood-mcp");
    expect(SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("withErrorHandling", () => {
  it("passes through successful handler results", async () => {
    const wrapped = withErrorHandling<{ x: number }>(async ({ x }) => ({
      content: [{ type: "text", text: String(x * 2) }],
    }));
    const result = await wrapped({ x: 21 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0]!.text).toBe("42");
  });

  it("captures thrown errors into MCP-spec isError result", async () => {
    const wrapped = withErrorHandling<unknown>(async () => {
      throw new Error("boom");
    });
    const result = await wrapped({});
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("Error: boom");
  });

  it("stringifies non-Error throws", async () => {
    const wrapped = withErrorHandling<unknown>(async () => {
      throw "plain string";
    });
    const result = await wrapped({});
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe("plain string");
  });
});

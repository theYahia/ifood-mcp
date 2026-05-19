import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IfoodClient } from "../src/client.js";

/**
 * Auth flow tests — covers OAuth client_credentials token fetch + caching.
 * We mock `fetch` globally; first call must be to the token endpoint, second
 * is the actual API call. The third assertion verifies that a subsequent
 * request reuses the cached token (no extra token request).
 */
describe("IfoodClient auth", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env["IFOOD_CLIENT_ID"] = "test-id";
    process.env["IFOOD_CLIENT_SECRET"] = "test-secret";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("requests a fresh token on first call and reuses it on the second", async () => {
    const fetchMock = vi
      .fn()
      // Token response
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "tk-abc", expires_in: 3600 }),
        headers: new Map([["content-type", "application/json"]]),
        text: async () => "",
      })
      // First API response
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ pong: 1 }),
        headers: new Map([["content-type", "application/json"]]),
        text: async () => "",
      })
      // Second API response — should NOT trigger another token fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ pong: 2 }),
        headers: new Map([["content-type", "application/json"]]),
        text: async () => "",
      });
    vi.stubGlobal("fetch", fetchMock);

    const client = new IfoodClient();
    await client.request("GET", "/ping");
    await client.request("GET", "/ping");

    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 token + 2 API
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0]!;
    expect(tokenUrl).toContain("/authentication/v1.0/oauth/token");
    expect(tokenInit.method).toBe("POST");
    // Verify the API calls carried the Bearer header
    const [, apiInit] = fetchMock.mock.calls[1]!;
    expect(apiInit.headers.Authorization).toBe("Bearer tk-abc");
  });

  it("throws a helpful error when credentials are missing", async () => {
    delete process.env["IFOOD_CLIENT_ID"];
    delete process.env["IFOOD_CLIENT_SECRET"];
    const client = new IfoodClient();
    await expect(client.request("GET", "/ping")).rejects.toThrow(
      /IFOOD_CLIENT_ID and IFOOD_CLIENT_SECRET/,
    );
  });

  it("surfaces HTTP errors with status + body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "tk-x", expires_in: 3600 }),
        headers: new Map([["content-type", "application/json"]]),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
        headers: new Map(),
        text: async () => "order not found",
      });
    vi.stubGlobal("fetch", fetchMock);

    const client = new IfoodClient();
    await expect(client.request("GET", "/order/v1.0/orders/missing")).rejects.toThrow(
      /iFood HTTP 404.*order not found/,
    );
  });

  it("surfaces token endpoint errors", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
      headers: new Map(),
      text: async () => "invalid_client",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new IfoodClient();
    await expect(client.request("GET", "/ping")).rejects.toThrow(
      /iFood token error.*401.*invalid_client/,
    );
  });
});

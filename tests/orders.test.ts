import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Each test resets module cache + re-imports the tool, so the module-level
 * `new IfoodClient()` is recreated with empty token state. Without this the
 * first test's token would be cached across subsequent tests, breaking the
 * "expect 2 fetch calls" assertion.
 */

/**
 * Tool-level smoke tests. Each test mocks two fetch calls: the OAuth token
 * exchange + the actual API call. We assert (a) the tool returns expected
 * JSON, (b) the right URL/method was used.
 *
 * NOTE on test-quality limitation: we cannot test against the real iFood
 * sandbox without partner credentials, so response shapes are illustrative.
 * Real Partner API responses include richer nested payloads; the tools
 * forward them verbatim (re-JSON-stringify) so the LLM gets the truth.
 */

function mockOk(data: unknown): Record<string, unknown> {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Map([["content-type", "application/json"]]),
  };
}

function mockToken(): Record<string, unknown> {
  return mockOk({ access_token: "tk-test", expires_in: 3600 });
}

describe("ifood-mcp tool handlers", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env["IFOOD_CLIENT_ID"] = "test-id";
    process.env["IFOOD_CLIENT_SECRET"] = "test-secret";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("list_orders polls /order/v1.0/events:polling", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk([{ id: "evt-1", code: "PLC", orderId: "ord-1" }]));
    vi.stubGlobal("fetch", fetchMock);

    const { handleListOrders } = await import("../src/tools/list-orders.js");
    const result = JSON.parse(await handleListOrders({}));
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("PLC");
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toContain("/order/v1.0/events:polling");
    expect(init.method).toBe("GET");
  });

  it("list_orders forwards types + groups filters", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk([]));
    vi.stubGlobal("fetch", fetchMock);

    const { handleListOrders } = await import("../src/tools/list-orders.js");
    await handleListOrders({ types: ["PLC", "CFM"], groups: ["ORDER_STATUS"] });
    const url = fetchMock.mock.calls[1]![0] as string;
    expect(url).toContain("types=PLC%2CCFM");
    expect(url).toContain("groups=ORDER_STATUS");
  });

  it("get_order GETs /order/v1.0/orders/:id", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk({ id: "ord-1", total: { orderAmount: 5000 } }));
    vi.stubGlobal("fetch", fetchMock);

    const { handleGetOrder } = await import("../src/tools/get-order.js");
    const result = JSON.parse(await handleGetOrder({ order_id: "ord-1" }));
    expect(result.id).toBe("ord-1");
    expect(fetchMock.mock.calls[1]![0]).toContain("/order/v1.0/orders/ord-1");
  });

  it("confirm_order POSTs to /confirm", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk(null));
    vi.stubGlobal("fetch", fetchMock);

    const { handleConfirmOrder } = await import("../src/tools/confirm-order.js");
    const result = JSON.parse(await handleConfirmOrder({ order_id: "ord-1" }));
    expect(result.status).toBe("CONFIRMED");
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toContain("/order/v1.0/orders/ord-1/confirm");
    expect(init.method).toBe("POST");
  });

  it("dispatch_order POSTs to /dispatch", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk(null));
    vi.stubGlobal("fetch", fetchMock);

    const { handleDispatchOrder } = await import("../src/tools/dispatch-order.js");
    const result = JSON.parse(await handleDispatchOrder({ order_id: "ord-1" }));
    expect(result.status).toBe("DISPATCHED");
    expect(fetchMock.mock.calls[1]![0]).toContain("/order/v1.0/orders/ord-1/dispatch");
  });

  it("cancel_order POSTs reason + code", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk(null));
    vi.stubGlobal("fetch", fetchMock);

    const { handleCancelOrder } = await import("../src/tools/cancel-order.js");
    await handleCancelOrder({ order_id: "ord-1", reason: "Sem estoque", cancellationCode: "507" });
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toContain("/order/v1.0/orders/ord-1/requestCancellation");
    const body = JSON.parse((init as { body: string }).body);
    expect(body.reason).toBe("Sem estoque");
    expect(body.cancellationCode).toBe("507");
  });

  it("list_merchants GETs /merchant/v1.0/merchants", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk([{ id: "m-1", name: "Pizzaria Roma" }]));
    vi.stubGlobal("fetch", fetchMock);

    const { handleListMerchants } = await import("../src/tools/list-merchants.js");
    const result = JSON.parse(await handleListMerchants({}));
    expect(result[0].name).toBe("Pizzaria Roma");
    expect(fetchMock.mock.calls[1]![0]).toContain("/merchant/v1.0/merchants");
  });

  it("get_merchant_status GETs status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk({ state: "AVAILABLE" }));
    vi.stubGlobal("fetch", fetchMock);

    const { handleGetMerchantStatus } = await import("../src/tools/get-merchant-status.js");
    const result = JSON.parse(await handleGetMerchantStatus({ merchant_id: "m-1" }));
    expect(result.state).toBe("AVAILABLE");
    expect(fetchMock.mock.calls[1]![0]).toContain("/merchant/v1.0/merchants/m-1/status");
  });

  it("update_item_availability PATCHes with AVAILABLE/UNAVAILABLE", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk(null));
    vi.stubGlobal("fetch", fetchMock);

    const { handleUpdateItemAvailability } = await import("../src/tools/update-item-availability.js");
    await handleUpdateItemAvailability({ merchant_id: "m-1", item_id: "i-1", available: false });
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toContain("/catalog/v2.0/merchants/m-1/items/i-1/status");
    expect(init.method).toBe("PATCH");
    const body = JSON.parse((init as { body: string }).body);
    expect(body.status).toBe("UNAVAILABLE");
  });

  it("register_webhook POSTs subscription", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockToken())
      .mockResolvedValueOnce(mockOk({ subscriptionId: "sub-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const { handleRegisterWebhook } = await import("../src/tools/register-webhook.js");
    const result = JSON.parse(
      await handleRegisterWebhook({
        merchant_id: "m-1",
        url: "https://example.com/ifood/webhook",
        events: ["PLC", "CFM"],
      }),
    );
    expect(result.subscriptionId).toBe("sub-1");
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toContain("/events/v1.0/merchants/m-1/subscriptions");
    expect(init.method).toBe("POST");
    const body = JSON.parse((init as { body: string }).body);
    expect(body.url).toBe("https://example.com/ifood/webhook");
    expect(body.events).toEqual(["PLC", "CFM"]);
  });
});

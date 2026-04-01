import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

process.env.IFOOD_CLIENT_ID = "test-id";
process.env.IFOOD_CLIENT_SECRET = "test-secret";

describe("ifood-mcp tools", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.resetModules(); });

  it("list_orders works", async () => {
    mockFetch.mockResolvedValueOnce({

      ok: true,

      json: async () => ({ access_token: "test-token-123", expires_in: 3600 }),

    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ id: "ord-1", code: "PLACED" }]),
      headers: new Map([["content-type", "application/json"]]),
    });
    const { handleListOrders } = await import("../list-orders.js");
    const result = await handleListOrders({});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
  });

  it("get_order works", async () => {
    mockFetch.mockResolvedValueOnce({

      ok: true,

      json: async () => ({ access_token: "test-token-123", expires_in: 3600 }),

    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "ord-1", total: { orderAmount: 5000 } }),
      headers: new Map([["content-type", "application/json"]]),
    });
    const { handleGetOrder } = await import("../get-order.js");
    const result = await handleGetOrder({ order_id: "ord-1" });
    const parsed = JSON.parse(result);
    expect(parsed.id).toBe("ord-1");
  });

  it("confirm_order works", async () => {
    mockFetch.mockResolvedValueOnce({

      ok: true,

      json: async () => ({ access_token: "test-token-123", expires_in: 3600 }),

    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "confirmed" }),
      headers: new Map([["content-type", "application/json"]]),
    });
    const { handleConfirmOrder } = await import("../confirm-order.js");
    const result = await handleConfirmOrder({ order_id: "ord-1" });
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe("confirmed");
  });

  it("dispatch_order works", async () => {
    mockFetch.mockResolvedValueOnce({

      ok: true,

      json: async () => ({ access_token: "test-token-123", expires_in: 3600 }),

    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "dispatched" }),
      headers: new Map([["content-type", "application/json"]]),
    });
    const { handleDispatchOrder } = await import("../dispatch-order.js");
    const result = await handleDispatchOrder({ order_id: "ord-1" });
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe("dispatched");
  });

  it("cancel_order works", async () => {
    mockFetch.mockResolvedValueOnce({

      ok: true,

      json: async () => ({ access_token: "test-token-123", expires_in: 3600 }),

    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "cancelled" }),
      headers: new Map([["content-type", "application/json"]]),
    });
    const { handleCancelOrder } = await import("../cancel-order.js");
    const result = await handleCancelOrder({ order_id: "ord-1", reason: "Out of stock", code: "501" });
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe("cancelled");
  });

  it("list_merchants works", async () => {
    mockFetch.mockResolvedValueOnce({

      ok: true,

      json: async () => ({ access_token: "test-token-123", expires_in: 3600 }),

    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ id: "m-1", name: "My Restaurant" }]),
      headers: new Map([["content-type", "application/json"]]),
    });
    const { handleListMerchants } = await import("../list-merchants.js");
    const result = await handleListMerchants({});
    const parsed = JSON.parse(result);
    expect(parsed[0].name).toBe("My Restaurant");
  });

  it("get_merchant_status works", async () => {
    mockFetch.mockResolvedValueOnce({

      ok: true,

      json: async () => ({ access_token: "test-token-123", expires_in: 3600 }),

    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: "OPEN" }),
      headers: new Map([["content-type", "application/json"]]),
    });
    const { handleGetMerchantStatus } = await import("../get-merchant-status.js");
    const result = await handleGetMerchantStatus({ merchant_id: "m-1" });
    const parsed = JSON.parse(result);
    expect(parsed.state).toBe("OPEN");
  });

  it("update_item_availability works", async () => {
    mockFetch.mockResolvedValueOnce({

      ok: true,

      json: async () => ({ access_token: "test-token-123", expires_in: 3600 }),

    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "updated" }),
      headers: new Map([["content-type", "application/json"]]),
    });
    const { handleUpdateItemAvailability } = await import("../update-item-availability.js");
    const result = await handleUpdateItemAvailability({ merchant_id: "m-1", item_id: "item-1", available: true });
    const parsed = JSON.parse(result);
    expect(parsed.status).toBe("updated");
  });

  it("handles HTTP errors", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => "Unauthorized" });
    const { handleListOrders } = await import("../list-orders.js");
    await expect(handleListOrders({})).rejects.toThrow("token error");
  });
});

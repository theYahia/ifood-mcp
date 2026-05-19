import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

/**
 * iFood cancellation codes (subset — see docs for full list).
 *  - 501 — DUPLICATED_ORDER
 *  - 502 — SYSTEM_ISSUE
 *  - 503 — INVALID_ADDRESS
 *  - 504 — OUT_OF_DELIVERY_AREA
 *  - 505 — RESTAURANT_CLOSED
 *  - 506 — ITEM_UNAVAILABLE
 *  - 507 — OUT_OF_STOCK
 *  - 508 — UNREACHABLE_CUSTOMER
 */
export const cancelOrderSchema = z.object({
  order_id: z.string().min(1).describe("iFood order UUID to request cancellation for."),
  reason: z
    .string()
    .min(3)
    .max(140)
    .describe("Human-readable cancellation reason in Portuguese (shown to the customer)."),
  cancellationCode: z
    .string()
    .default("507")
    .describe(
      "iFood cancellation code. Common values: 501 (duplicate), 506 (item unavailable), 507 (out of stock), 503 (invalid address).",
    ),
});

/**
 * Request cancellation of an order. iFood reviews the request; the order
 * transitions to CANCELLED if the reason is accepted.
 *
 * Endpoint: POST /order/v1.0/orders/{order_id}/requestCancellation
 */
export async function handleCancelOrder(
  params: z.infer<typeof cancelOrderSchema>,
): Promise<string> {
  const result = await client.request(
    "POST",
    `/order/v1.0/orders/${encodeURIComponent(params.order_id)}/requestCancellation`,
    {
      reason: params.reason,
      cancellationCode: params.cancellationCode,
    },
  );
  return JSON.stringify(
    result ?? { ok: true, order_id: params.order_id, status: "CANCELLATION_REQUESTED" },
    null,
    2,
  );
}

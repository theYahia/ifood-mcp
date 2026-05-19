import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const dispatchOrderSchema = z.object({
  order_id: z.string().min(1).describe("iFood order UUID to mark as dispatched."),
});

/**
 * Move an order to DISPATCHED — the courier has picked it up and is en route.
 *
 * Endpoint: POST /order/v1.0/orders/{order_id}/dispatch
 */
export async function handleDispatchOrder(
  params: z.infer<typeof dispatchOrderSchema>,
): Promise<string> {
  const result = await client.request(
    "POST",
    `/order/v1.0/orders/${encodeURIComponent(params.order_id)}/dispatch`,
  );
  return JSON.stringify(result ?? { ok: true, order_id: params.order_id, status: "DISPATCHED" }, null, 2);
}

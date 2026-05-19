import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const confirmOrderSchema = z.object({
  order_id: z.string().min(1).describe("iFood order UUID to confirm."),
});

/**
 * Accept (confirm) a placed order so it enters the kitchen.
 * Must be called within the SLA window or the order is auto-cancelled by iFood.
 *
 * Endpoint: POST /order/v1.0/orders/{order_id}/confirm
 */
export async function handleConfirmOrder(
  params: z.infer<typeof confirmOrderSchema>,
): Promise<string> {
  const result = await client.request(
    "POST",
    `/order/v1.0/orders/${encodeURIComponent(params.order_id)}/confirm`,
  );
  return JSON.stringify(result ?? { ok: true, order_id: params.order_id, status: "CONFIRMED" }, null, 2);
}

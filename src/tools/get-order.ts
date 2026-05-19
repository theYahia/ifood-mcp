import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const getOrderSchema = z.object({
  order_id: z.string().min(1).describe("iFood order UUID (returned by list_orders / events polling)."),
});

/**
 * Fetch the full virtual bag of an order: items, customer, totals, delivery,
 * payment, schedule. Use this after a PLC (placed) event to render the order.
 *
 * Endpoint: GET /order/v1.0/orders/{order_id}
 */
export async function handleGetOrder(
  params: z.infer<typeof getOrderSchema>,
): Promise<string> {
  const result = await client.request(
    "GET",
    `/order/v1.0/orders/${encodeURIComponent(params.order_id)}`,
  );
  return JSON.stringify(result, null, 2);
}

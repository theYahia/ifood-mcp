import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const cancel_orderSchema = z.object({
  order_id: z.string().describe("Order ID"),
  reason: z.string().describe("Cancellation reason"),
  code: z.string().default("501").describe("Cancellation code"),
});

export async function handleCancelOrder(params: z.infer<typeof cancel_orderSchema>): Promise<string> {
  const result = await client.request("POST", `/order/v1.0/orders/${params.order_id}/requestCancellation`, { reason: params.reason, cancellationCode: params.code });
  return JSON.stringify(result, null, 2);
}

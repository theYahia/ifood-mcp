import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const dispatch_orderSchema = z.object({
  order_id: z.string().describe("Order ID"),
});

export async function handleDispatchOrder(params: z.infer<typeof dispatch_orderSchema>): Promise<string> {
  const result = await client.request("POST", `/order/v1.0/orders/${params.order_id}/dispatch`);
  return JSON.stringify(result, null, 2);
}

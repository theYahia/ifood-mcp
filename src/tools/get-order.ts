import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const get_orderSchema = z.object({
  order_id: z.string().describe("Order ID"),
});

export async function handleGetOrder(params: z.infer<typeof get_orderSchema>): Promise<string> {
  const result = await client.request("GET", `/order/v1.0/orders/${params.order_id}`);
  return JSON.stringify(result, null, 2);
}

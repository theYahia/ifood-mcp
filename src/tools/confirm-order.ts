import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const confirm_orderSchema = z.object({
  order_id: z.string().describe("Order ID"),
});

export async function handleConfirmOrder(params: z.infer<typeof confirm_orderSchema>): Promise<string> {
  const result = await client.request("POST", `/order/v1.0/orders/${params.order_id}/confirm`);
  return JSON.stringify(result, null, 2);
}

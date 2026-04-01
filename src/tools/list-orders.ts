import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const list_ordersSchema = z.object({

});

export async function handleListOrders(params: z.infer<typeof list_ordersSchema>): Promise<string> {
  const result = await client.request("GET", "/order/v1.0/events:polling");
  return JSON.stringify(result, null, 2);
}

import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const update_item_availabilitySchema = z.object({
  merchant_id: z.string().describe("Merchant ID"),
  item_id: z.string().describe("Item ID"),
  available: z.boolean().describe("Availability"),
});

export async function handleUpdateItemAvailability(params: z.infer<typeof update_item_availabilitySchema>): Promise<string> {
  const result = await client.request("PUT", `/catalog/v2.0/merchants/${params.merchant_id}/items/${params.item_id}/availability`, { available: params.available });
  return JSON.stringify(result, null, 2);
}

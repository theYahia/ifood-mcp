import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const get_merchant_statusSchema = z.object({
  merchant_id: z.string().describe("Merchant ID"),
});

export async function handleGetMerchantStatus(params: z.infer<typeof get_merchant_statusSchema>): Promise<string> {
  const result = await client.request("GET", `/merchant/v1.0/merchants/${params.merchant_id}/status`);
  return JSON.stringify(result, null, 2);
}

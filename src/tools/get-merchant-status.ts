import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const getMerchantStatusSchema = z.object({
  merchant_id: z.string().min(1).describe("iFood merchant UUID (returned by list_merchants)."),
});

/**
 * Get the operational status of a merchant — whether iFood considers it
 * AVAILABLE, UNAVAILABLE (issue with menu/printer/etc.), or CLOSED (outside
 * operating hours). Useful as a pre-flight check before reopening or
 * before quoting customer ETAs.
 *
 * Endpoint: GET /merchant/v1.0/merchants/{merchant_id}/status
 */
export async function handleGetMerchantStatus(
  params: z.infer<typeof getMerchantStatusSchema>,
): Promise<string> {
  const result = await client.request(
    "GET",
    `/merchant/v1.0/merchants/${encodeURIComponent(params.merchant_id)}/status`,
  );
  return JSON.stringify(result, null, 2);
}

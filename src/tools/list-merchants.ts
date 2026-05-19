import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const listMerchantsSchema = z.object({});

/**
 * List every merchant the authenticated app has access to. Operator-level
 * accounts (with multiple restaurants) get a flat array; single-merchant
 * accounts get a one-element array.
 *
 * Endpoint: GET /merchant/v1.0/merchants
 */
export async function handleListMerchants(
  _params: z.infer<typeof listMerchantsSchema>,
): Promise<string> {
  const result = await client.request("GET", "/merchant/v1.0/merchants");
  return JSON.stringify(result ?? [], null, 2);
}

import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const updateItemAvailabilitySchema = z.object({
  merchant_id: z.string().min(1).describe("iFood merchant UUID."),
  item_id: z.string().min(1).describe("Catalog item UUID."),
  available: z.boolean().describe("true = item visible on the menu, false = hide it (e.g. out of stock)."),
});

/**
 * Flip a single menu item's availability. Use for fast "out of stock" toggles
 * from the kitchen without a full menu edit.
 *
 * Endpoint: PATCH /catalog/v2.0/merchants/{merchant_id}/items/{item_id}/status
 */
export async function handleUpdateItemAvailability(
  params: z.infer<typeof updateItemAvailabilitySchema>,
): Promise<string> {
  const status = params.available ? "AVAILABLE" : "UNAVAILABLE";
  const result = await client.request(
    "PATCH",
    `/catalog/v2.0/merchants/${encodeURIComponent(params.merchant_id)}/items/${encodeURIComponent(params.item_id)}/status`,
    { status },
  );
  return JSON.stringify(
    result ?? { ok: true, merchant_id: params.merchant_id, item_id: params.item_id, status },
    null,
    2,
  );
}

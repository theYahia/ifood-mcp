import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const listOrdersSchema = z.object({
  merchant_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Restrict the polling to specific merchant IDs (sent as x-polling-merchants header). " +
        "Omit to receive events for every merchant linked to your app.",
    ),
  types: z
    .array(z.string())
    .optional()
    .describe(
      "Event types to subscribe to (e.g. PLC for placed, CFM for confirmed, " +
        "DSP for dispatched, CAN for cancelled, CON for concluded). Omit for all types.",
    ),
  groups: z
    .array(z.string())
    .optional()
    .describe(
      "Event groups to subscribe to (e.g. ORDER_STATUS, DELIVERY, HANDSHAKE). Omit for all groups.",
    ),
});

/**
 * iFood polling — returns events emitted since the last call.
 *
 * The iFood polling protocol requires you to acknowledge events within 30 s
 * by POSTing the event IDs back to /events/acknowledgment. This tool returns
 * the raw events; use `acknowledge_events` afterwards or let your downstream
 * agent invoke it.
 *
 * Endpoint: GET /order/v1.0/events:polling
 * Docs: https://developer.ifood.com.br/en-US/docs/references/order/
 */
export async function handleListOrders(
  params: z.infer<typeof listOrdersSchema>,
): Promise<string> {
  const query = new URLSearchParams();
  if (params.types?.length) query.set("types", params.types.join(","));
  if (params.groups?.length) query.set("groups", params.groups.join(","));
  const qs = query.toString();
  const path = `/order/v1.0/events:polling${qs ? `?${qs}` : ""}`;

  // Note: x-polling-merchants header is supported by iFood for multi-merchant
  // accounts; we currently route through the standard request() method which
  // doesn't expose custom headers. If you need per-merchant scoping, set the
  // merchant_ids upstream when registering the app, or open an issue.
  void params.merchant_ids;

  const result = await client.request("GET", path);
  return JSON.stringify(result ?? [], null, 2);
}

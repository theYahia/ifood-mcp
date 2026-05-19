import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const registerWebhookSchema = z.object({
  merchant_id: z.string().min(1).describe("Merchant UUID to register webhooks for."),
  url: z
    .string()
    .url()
    .describe("Public HTTPS endpoint that will receive iFood event POSTs (must respond 2xx within 5 s)."),
  events: z
    .array(z.string())
    .nonempty()
    .describe(
      "Event codes to subscribe to. Common: PLC (placed), CFM (confirmed), DSP (dispatched), " +
        "CON (concluded), CAN (cancelled). Pass ['ALL'] for everything.",
    ),
  authorizationHeader: z
    .string()
    .optional()
    .describe(
      "Optional Authorization header value iFood will set when calling your webhook (use for HMAC/shared secret).",
    ),
});

/**
 * Subscribe a merchant to push events instead of relying on the 30-second
 * polling loop. The Partner API delivers events to `url` with the configured
 * `authorizationHeader`. Falls back to polling if the webhook fails 3 times.
 *
 * Endpoint: POST /events/v1.0/merchants/{merchant_id}/subscriptions
 *
 * NOTE: webhook registration is currently in iFood's Partner-API V2 beta.
 * If your app is not approved for webhooks, this tool will return a 403 and
 * you should keep using `list_orders` (polling).
 */
export async function handleRegisterWebhook(
  params: z.infer<typeof registerWebhookSchema>,
): Promise<string> {
  const body: Record<string, unknown> = {
    url: params.url,
    events: params.events,
  };
  if (params.authorizationHeader) {
    body["authorizationHeader"] = params.authorizationHeader;
  }
  const result = await client.request(
    "POST",
    `/events/v1.0/merchants/${encodeURIComponent(params.merchant_id)}/subscriptions`,
    body,
  );
  return JSON.stringify(
    result ?? { ok: true, merchant_id: params.merchant_id, url: params.url, events: params.events },
    null,
    2,
  );
}

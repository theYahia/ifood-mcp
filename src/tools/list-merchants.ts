import { z } from "zod";
import { IfoodClient } from "../client.js";

const client = new IfoodClient();

export const list_merchantsSchema = z.object({

});

export async function handleListMerchants(params: z.infer<typeof list_merchantsSchema>): Promise<string> {
  const result = await client.request("GET", "/merchant/v1.0/merchants");
  return JSON.stringify(result, null, 2);
}

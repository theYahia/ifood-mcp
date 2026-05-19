/**
 * Types for iFood Partner / Merchant API responses.
 *
 * The Merchant API returns rich nested payloads; we surface only the fields
 * tools actually inspect. Tools always re-serialize to JSON for the LLM, so
 * these types exist for compile-time safety, not runtime narrowing.
 */

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "DISPATCHED"
  | "READY_TO_PICKUP"
  | "PICKED_UP"
  | "CONCLUDED"
  | "CANCELLED";

export type MerchantState = "AVAILABLE" | "UNAVAILABLE" | "CLOSED";

export interface IfoodOrder {
  id: string;
  /** Short human code, e.g. "5K2A" */
  displayId?: string;
  /** Lifecycle status (PLACED, CONFIRMED, DISPATCHED, ...) */
  status?: OrderStatus;
  createdAt?: string;
  total?: {
    orderAmount: number;
    subTotal?: number;
    deliveryFee?: number;
  };
  merchant?: { id: string; name?: string };
  items?: Array<{
    id?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }>;
}

export interface IfoodMerchant {
  id: string;
  name: string;
  corporateName?: string;
  /** Brazil state code, e.g. "SP", "RJ" */
  state?: string;
  city?: string;
}

export interface IfoodMerchantStatus {
  state: MerchantState;
  available?: boolean;
  operation?: string;
  message?: string;
}

/**
 * iFood polling event — one entry per state change.
 * Returned by GET /events:polling.
 */
export interface IfoodEvent {
  id: string;
  code: string;
  fullCode: string;
  orderId: string;
  merchantId?: string;
  createdAt: string;
}

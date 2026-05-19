# @theyahia/ifood-mcp

> 📦 Part of [WWmcp — Emerging Markets MCP](https://github.com/theYahia/WWmcp)

MCP server for the **iFood Partner / Merchant API** (Brazil) — restaurant orders,
merchant status, catalog availability, and event webhooks. Built for the
production iFood Partner API (OAuth 2.0 Client Credentials).

[![npm](https://img.shields.io/npm/v/@theyahia/ifood-mcp)](https://www.npmjs.com/package/@theyahia/ifood-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Tools (9)

| Tool | Description |
|---|---|
| `list_orders` | Poll for new iFood order events since the last call (PLC/CFM/DSP/CAN/CON). Optional `types`/`groups` filters. |
| `get_order` | Get the full virtual bag of an order — items, customer, totals, delivery, payment. |
| `confirm_order` | Accept a placed order so it enters the kitchen flow. |
| `dispatch_order` | Mark an order as DISPATCHED once the courier picks it up. |
| `cancel_order` | Request cancellation with a Portuguese reason + iFood code (501 / 506 / 507 / 503 / …). |
| `list_merchants` | List every merchant the authenticated Partner app has access to. |
| `get_merchant_status` | Get operational status (AVAILABLE / UNAVAILABLE / CLOSED). |
| `update_item_availability` | Flip a single catalog item on/off (e.g. when it runs out). |
| `register_webhook` | Subscribe a merchant to push events at a public HTTPS URL (Partner-API V2 beta). |

---

## Quick Start

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ifood": {
      "command": "npx",
      "args": ["-y", "@theyahia/ifood-mcp"],
      "env": {
        "IFOOD_CLIENT_ID": "<your_client_id>",
        "IFOOD_CLIENT_SECRET": "<your_client_secret>"
      }
    }
  }
}
```

### Cursor / Windsurf / VS Code

Same block under `mcpServers` (or `servers` for VS Code Copilot).

### Then ask Claude:

> *"Pull yesterday's iFood orders for merchant `abc-123` and charge them via Asaas Pix."*

> *"Confirm iFood order `5K2A`, mark it dispatched once the courier arrives, then update my menu to flag the dessert as out of stock."*

> *"Subscribe my restaurant's PLC and CFM events to `https://my-app.com/webhooks/ifood`."*

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `IFOOD_CLIENT_ID` | yes | OAuth client ID from [developer.ifood.com.br](https://developer.ifood.com.br). |
| `IFOOD_CLIENT_SECRET` | yes | OAuth client secret. |

---

## Authentication

iFood Partner API uses **OAuth 2.0 Client Credentials**:

1. Register an app at [developer.ifood.com.br](https://developer.ifood.com.br).
2. Get your `clientId` + `clientSecret` from the app dashboard.
3. Set them as env vars above.

The MCP server exchanges them for an access token on every cold start and
caches the token in-memory until 60 s before `expires_in`.

iFood docs (login required): https://developer.ifood.com.br/docs/

---

## 🤖 Pairs well with

For Brazilian merchant automation pipelines:

- **[@theyahia/asaas-mcp](https://www.npmjs.com/package/@theyahia/asaas-mcp)** —
  Pix, boleto, credit-card charges via Asaas (Brazil's most popular SMB
  payment gateway). Drop-in pair with iFood orders → automatic charging.
- **[@theyahia/nfeio-mcp](https://www.npmjs.com/package/@theyahia/nfeio-mcp)** —
  NFe / NFCe electronic invoice issuance for every order you confirm.
- **[@theyahia/mercadopago-mcp](https://www.npmjs.com/package/@theyahia/mercadopago-mcp)** —
  Mercado Pago payments (alternative to Asaas, broader Latin America).

---

## Development

```bash
npm install
npm run build
npm test
npm run dev     # tsx watch mode
```

Project layout:

```
ifood-mcp/
├── src/
│   ├── index.ts                — bin entry, mounts stdio transport
│   ├── server.ts               — createServer() factory, tool registration
│   ├── client.ts               — IfoodClient (OAuth + cached token + retry-safe fetch)
│   ├── types.ts                — TypeScript types (Order, Merchant, Event, OrderStatus)
│   ├── with-error-handling.ts  — wraps tool handlers in MCP-spec isError result
│   └── tools/
│       ├── list-orders.ts
│       ├── get-order.ts
│       ├── confirm-order.ts
│       ├── dispatch-order.ts
│       ├── cancel-order.ts
│       ├── list-merchants.ts
│       ├── get-merchant-status.ts
│       ├── update-item-availability.ts
│       └── register-webhook.ts
└── tests/
    ├── auth.test.ts            — OAuth token fetch, caching, error surfacing
    ├── orders.test.ts          — every tool handler (mocked fetch)
    └── server.test.ts          — createServer() + withErrorHandling()
```

---

## ⭐ Star if you build for Brazilian e-commerce

This server is part of [WWmcp](https://github.com/theYahia/WWmcp) — an
open-source initiative to bring MCP coverage to emerging-market APIs that
Composio / official MCP marketplaces don't reach. Star the umbrella repo
to follow upcoming servers for Brazil's payment & logistics stack.

---

## License

MIT — see [LICENSE](./LICENSE).

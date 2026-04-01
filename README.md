# ifood-mcp

MCP server for iFood merchant integration (Brazil).

## Tools (8)

| Tool | Description |
|---|---|
| `list_orders` | List recent orders |
| `get_order` | Get order details |
| `confirm_order` | Confirm/accept an order |
| `dispatch_order` | Mark order as dispatched |
| `cancel_order` | Cancel an order |
| `list_merchants` | List merchant details |
| `get_merchant_status` | Get merchant availability status |
| `update_item_availability` | Update menu item availability |

## Quick Start

```json
{
  "mcpServers": {
    "ifood": {
      "command": "npx",
      "args": ["-y", "@theyahia/ifood-mcp"],
      "env": {
        "IFOOD_CLIENT_ID": "<YOUR_IFOOD_CLIENT_ID>",
        "IFOOD_CLIENT_SECRET": "<YOUR_IFOOD_CLIENT_SECRET>"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `IFOOD_CLIENT_ID` | Yes | OAuth client ID |
| `IFOOD_CLIENT_SECRET` | Yes | OAuth client secret |

## License

MIT

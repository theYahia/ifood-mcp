# Changelog

All notable changes to `@theyahia/ifood-mcp` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-05-19

### Added
- New `register_webhook` tool — subscribe a merchant to push events at a public HTTPS URL
  (Partner-API V2 beta; falls back to polling if iFood rejects).
- `list_orders` now accepts `types` and `groups` filters (e.g. `["PLC","CFM"]`, `["ORDER_STATUS"]`)
  and forwards them as query params to `/order/v1.0/events:polling`.
- `cancel_order` now accepts a documented set of iFood `cancellationCode`s (501 / 503 / 506 / 507 / …)
  with sensible default (507 — out of stock).
- `with-error-handling.ts` — every tool now returns `{ isError: true, content: [...] }` on
  failure (MCP spec), instead of throwing protocol-level faults.
- Comprehensive vitest suite (`tests/auth.test.ts`, `tests/orders.test.ts`, `tests/server.test.ts`)
  — 19 tests covering OAuth token caching, every tool handler, and error surfacing.
- TypeScript types for `OrderStatus`, `MerchantState`, `IfoodOrder`, `IfoodMerchant`, `IfoodEvent`.
- Server factory pattern (`createServer()` in `src/server.ts`) — separates wiring from
  the stdio entry point so tests can mount the server without spawning a transport.
- `typecheck` npm script (`tsc --noEmit`).
- README "Pairs well with" section + WWmcp banner.

### Changed
- `update_item_availability` switched to `PATCH /catalog/v2.0/merchants/{id}/items/{id}/status`
  with `AVAILABLE` / `UNAVAILABLE` enum values (matches current Partner-API V2 shape).
- `IfoodClient` is now lazy — `new IfoodClient()` no longer throws if env vars are missing;
  the check fires on first `.request()`. This unblocks module-level `new IfoodClient()` in tests.
- Token caching: concurrent requests share a single in-flight token promise (no thundering herd).
- Token refresh window: refreshes 60 s before `expires_in` (was 60 s, but now also guarded by
  a deduplicated promise).
- HTTP error messages include status + path + body excerpt for easier debugging.

### Fixed
- Token endpoint body now uses the iFood-V2-camelCase form (`grantType` / `clientId` /
  `clientSecret`) instead of the deprecated snake_case form.

## [1.0.1] — 2026-04-01

Initial public release on npm. 8 tools, raw stub implementations.

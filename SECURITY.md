# Security testing

Sentinel's safety properties are enforced by deterministic backend code and verified by automated tests (`cd server && npm test`, 31 tests) and live sandbox checks.

## Automated tests (31 passing)

| Threat | Verified by |
|---|---|
| Agreement above the buyer's budget (even if the buyer AI accepted it) | policy engine tests |
| Delivery too slow, non-integer or malformed values | policy engine tests |
| Wrong currency, quantity, product or missing seller | policy engine tests |
| Seller text trying to change the buyer's rules | negotiator test: seller text cannot change the buyer rules |
| Seller offering below its own floor, or raising prices | negotiator tests |
| Buyer offer above the human budget | negotiator test: offers are capped at the human budget |
| Changed order amount, currency or merchant at capture time | Integrity Shield tests |
| Order for a different agreement | Integrity Shield tests |
| Expired or reused authorization | Integrity Shield tests |
| Terms or snapshot edited after approval | Integrity Shield and snapshot hash tests |
| PayPal errors turned into fake success | PayPal client tests (mocked fetch) |

## Live sandbox checks

| Check | Result |
|---|---|
| Real PayPal Sandbox order, buyer approval and capture | Captured, status COMPLETED |
| Second capture of the same payment | Refused (HTTP 409), no second charge |
| Seller tampering after approval (demo tool) | Capture blocked by the Integrity Shield and logged as DRIFT_BLOCKED |

## Design notes

- An AI response can never trigger payment capture. Capture only runs from an authenticated user request after human approval.
- The authorization is a backend-managed, single-use, time-limited token (15 minutes), consumed atomically before capture. It is not a PayPal-issued token.
- The server re-fetches the live PayPal order and compares it to the approved snapshot before capturing.
- The seller's minimum price is never returned by the API.
- API secrets exist only in backend environment variables.
- The demo tamper tool is gated by `ENABLE_DEMO_TOOLS=true` and only works on approved, uncaptured deals.
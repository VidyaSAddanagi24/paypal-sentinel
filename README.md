# PayPal Sentinel

**Two AI agents negotiate. Humans authorize. PayPal executes.**

PayPal Sentinel is a trust and authorization layer for AI-negotiated commerce. A buyer agent and a simulated seller agent (both Gemini) negotiate a purchase over several rounds. A deterministic backend policy engine checks the result against the buyer's original limits, the human approves the exact deal, and only then does the backend create and capture a real PayPal Sandbox payment. If anything changes after approval, the payment is blocked.

- Live demo: <https://paypal-sentinel.vercel.app>
- Demo video: <YOUTUBE_URL>

> The seller is **simulated** in this MVP (an AI agent with its own profile). No real merchants are involved. Payments use the **PayPal Sandbox** only; no real money moves.

## The problem

Autonomous commerce is risky: an agent can agree to a price above the budget, a seller can change terms after the negotiation, the amount paid can differ from what was approved, or an agent can be manipulated by malicious text. Sentinel adds financial authority boundaries and integrity checks so AI-negotiated deals are secure, explainable and user-controlled.

## How it works

1. **Instructions.** The buyer states what they need and their limits (product, quantity, max budget, currency, max delivery days). Gemini can interpret natural language into editable structured rules.
2. **Negotiation.** Two independent Gemini agents (buyer and seller) negotiate over multiple rounds and produce structured offers.
3. **Policy engine.** Deterministic backend code validates the final agreement (budget, currency, delivery, quantity, seller identity). The AI cannot override it.
4. **Human approval.** The buyer reviews the exact terms and approves. This freezes an immutable snapshot (SHA-256 hash) and creates a single-use, time-limited, backend-managed authorization (15 minutes).
5. **PayPal order.** The backend creates a PayPal order from the approved snapshot. The buyer pays in PayPal Sandbox.
6. **Integrity Shield.** Before capture, the backend fetches the live PayPal order and re-checks 11 conditions (snapshot intact, terms unchanged, authorization active, unused and unexpired, order amount, currency, merchant and agreement id). Any drift blocks the payment.
7. **Capture and audit.** The backend captures the order (idempotent, one time only) and records every step in an audit trail.

## Technologies and how they are used

| Technology | Use |
|---|---|
| **PayPal Checkout REST API (Orders v2), Sandbox** | OAuth token, create order, fetch order for verification, capture. Real sandbox orders and captures; no simulated success. |
| **Google Gemini API** | Buyer agent, seller agent, and natural-language rule parsing. Structured JSON output validated with Zod; model fallback and retries. |
| React, Vite, Tailwind CSS | Frontend |
| Node.js, Express | Backend API |
| MongoDB Atlas, Mongoose | Data and append-only audit log |
| JWT, bcrypt | Authentication |
| Vercel, Render | Hosting |

## Security design

- Spending limits are enforced by deterministic backend code, never by an AI.
- Seller text is treated as untrusted: wrapped in tagged blocks, never able to change buyer rules; offers are clamped by the server.
- The seller's minimum price is never sent to the client; a server-side scrub stops the seller agent from stating it.
- Approved terms are frozen as a hashed snapshot; the authorization is single-use and expires.
- The server re-fetches the PayPal order and compares merchant, amount, currency and agreement id before capture.
- Capture is idempotent and an AI response can never trigger it.
- Secrets live only in backend environment variables. Helmet, input validation, ownership checks and an append-only audit log are in place.

## Honest limitations

- The seller is simulated; there is no real merchant integration.
- PayPal Sandbox is used; standard Checkout is not escrow and does not provide conditional release.
- The authorization is a **backend-managed** single-use token, not a PayPal-issued one.
- PayPal Sandbox may not accept every currency; the demo runs in **USD**.
- The free hosting tier sleeps when idle, so the first request can take up to about a minute.

## Run locally

Requirements: Node.js 20+, a MongoDB Atlas database, a Gemini API key, and a PayPal Developer Sandbox app (Merchant) with a Sandbox Business and Personal account.

```bash
git clone https://github.com/VidyaSAddanagi24/paypal-sentinel.git
cd paypal-sentinel

# backend
cd server
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
# fill in the values in .env
npm run dev                  # http://localhost:5000

# frontend (second terminal)
cd client
npm install
npm run dev                  # http://localhost:5173
```

Environment variables are listed in `server/.env.example`. Use `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com`.

Tests: `cd server && npm test` (policy engine, snapshot, Integrity Shield, PayPal client with mocked fetch, negotiator).

## Try it (about 5 minutes)

1. Register an account.
2. New Negotiation: `business laptop`, quantity `10`, max budget `4000`, currency **USD**, max delivery `7` days.
3. Start the negotiation and watch the agents counter each other.
4. Review the policy checks and approve the exact deal. The 15-minute authorization starts.
5. Create the PayPal order and pay with a **Sandbox Personal (buyer)** account.
6. Capture the payment and open the Audit Trail.
7. Integrity Shield demo: before capturing, open "Demo tools" on the checkout page, click "Simulate seller tampering", then capture. The payment is blocked and logged.

Sandbox buyer credentials for judges are provided in the Devpost submission notes.

## License

MIT, see [LICENSE](LICENSE).
# BarakahPay — Backend

Node.js orchestration API for BarakahPay. Manages transaction lifecycle, fiat integration webhooks, institution KYB, and notification delivery.

**The backend does not custody funds.** All money movement happens through smart contracts (Soroban) or licensed fiat rails (MoneyGram, Bridge). The backend orchestrates and monitors — nothing more.

---

## Responsibilities

- User authentication and session management
- Transaction lifecycle tracking (deposit → escrow → claim → release)
- Webhook processing (MoneyGram, Bridge)
- Contract invocation on user behalf
- Institution onboarding + KYB workflow
- Notification delivery (email, push)
- Internal analytics and monitoring

---

## Stack

- **Runtime:** Node.js `20+`
- **Language:** TypeScript (strict mode)
- **Framework:** Fastify
- **ORM:** Drizzle
- **Database:** PostgreSQL (via Supabase in production)
- **Cache:** Redis (via Upstash)
- **Queue:** BullMQ
- **Stellar SDK:** `@stellar/stellar-sdk`
- **Testing:** Vitest
- **Deployment:** Railway

---

## Requirements

- Node.js `20+`
- pnpm `8+`
- PostgreSQL `15+`
- Redis `7+`
- Docker (for local Postgres + Redis)

---

## Getting Started

```bash
# From the backend/ directory
pnpm install

# Start local Postgres + Redis via Docker
docker compose up -d

# Copy env template
cp .env.example .env.local

# Run migrations
pnpm db:migrate

# Start dev server
pnpm dev
```

API will be available at http://localhost:4000

### Environment variables

Required for local development:

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://barakah:barakah@localhost:5432/barakah
REDIS_URL=redis://localhost:6379
STELLAR_NETWORK=testnet
STELLAR_ADMIN_SECRET=...
ESCROW_CONTRACT_ID=...
REGISTRY_CONTRACT_ID=...
MONEYGRAM_API_KEY=...
BRIDGE_API_KEY=...
JWT_SECRET=...
```

Full env docs: `backend/docs/environment.md` *(coming with skeleton)*

---

## Scripts

```bash
pnpm dev            # Start dev server (hot reload)
pnpm build          # Compile TypeScript
pnpm start          # Serve production build
pnpm lint           # Lint code
pnpm typecheck      # TypeScript check
pnpm test           # Unit tests
pnpm test:integration  # Integration tests
pnpm db:generate    # Generate migration from schema changes
pnpm db:migrate     # Apply migrations
pnpm db:studio      # Drizzle Studio (GUI)
```

---

## Directory Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   │   ├── auth/
│   │   ├── transaction/
│   │   ├── institution/
│   │   ├── integration/
│   │   └── notification/
│   ├── db/              # Drizzle schema + migrations
│   ├── stellar/         # Stellar SDK helpers
│   ├── queues/          # BullMQ workers
│   ├── middleware/      # Auth, rate limiting, etc.
│   └── utils/
├── tests/               # Unit + integration tests
├── docker-compose.yml   # Local dev services
└── openapi.yaml         # API specification
```

---

## API Documentation

- REST + JSON API
- Full spec: `backend/openapi.yaml`
- Interactive docs (dev): http://localhost:4000/docs
- Postman collection: `backend/docs/postman.json`

---

## Webhooks

The backend exposes webhooks for external partners:

| Endpoint | Source | Purpose |
|----------|--------|---------|
| `POST /webhooks/moneygram/deposit` | MoneyGram | Sender deposit confirmed |
| `POST /webhooks/moneygram/settlement` | MoneyGram | Institution settlement confirmed |
| `POST /webhooks/bridge/tx` | Bridge | USDC transaction event |

All webhooks are HMAC-signed and idempotent.

---

## Security

- All secrets via environment variables (never committed)
- API key rotation policy: quarterly
- Rate limiting on all public endpoints
- JWT with short expiry + refresh tokens
- Rate-limited login attempts
- CSRF protection on state-changing routes
- SQL injection prevention (parameterized queries)
- Signed webhook verification
- Regular dependency scanning (Dependabot)

Report vulnerabilities per [SECURITY.md](../SECURITY.md)

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) in the repo root.

---

## License

MIT — see [LICENSE](../LICENSE)

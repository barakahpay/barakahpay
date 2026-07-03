# BarakahPay — Architecture

**Version:** 0.1 (Living document)
**Last updated:** 2026-07-03

---

## 1. System Overview

BarakahPay is a **purpose-bound remittance layer** built on Stellar and Soroban. The system does not touch fiat directly — it orchestrates smart contract escrow on top of licensed fiat rails (MoneyGram, Bridge, Anchor Platform).

### Design principles

1. **Compliance-first** — no direct fiat handling; all money movement flows through licensed partners
2. **Institution-first** — payments settle to verified institutional bank accounts, not consumer wallets
3. **Purpose-first** — every transaction is bound to a specific verifiable purpose
4. **Composability-first** — leverage existing Stellar ecosystem partners rather than reinvent
5. **Open source first** — all smart contracts under MIT license

---

## 2. High-Level Architecture

```
+-----------------------------------------------------------+
|                    Sender Web App (PWA)                   |
|              (Next.js 14 + Stellar Wallets Kit)           |
+---------------------------+-------------------------------+
                            |
                            | Deposit USD
                            v
+-----------------------------------------------------------+
|            Fiat On-Ramp Layer (Regulated Partners)        |
|                                                           |
|   MoneyGram Access  |  Bridge  |  Anchor Platform         |
+---------------------------+-------------------------------+
                            |
                            | USD -> USDC on Stellar
                            v
+-----------------------------------------------------------+
|              BarakahPay Backend Orchestrator              |
|                    (Node.js + Fastify)                    |
|                                                           |
|   - Transaction lifecycle management                      |
|   - Integration webhooks (MoneyGram, Bridge)              |
|   - Notification service (email, push)                    |
|   - Analytics + monitoring                                |
+---------------------------+-------------------------------+
                            |
                            | Contract invocations
                            v
+-----------------------------------------------------------+
|              Soroban Smart Contract Layer                 |
|                                                           |
|   +---------------------+   +---------------------------+ |
|   |  Escrow Contract    |   |  Institution Registry     | |
|   |                     |   |                           | |
|   |  - Purpose lock     |   |  - Verified schools       | |
|   |  - Amount escrow    |   |  - KYB status             | |
|   |  - Release logic    |   |  - Category mapping       | |
|   |  - Refund timeout   |   |  - Revocation             | |
|   +---------------------+   +---------------------------+ |
+---------------------------+-------------------------------+
                            |
                            | Release trigger
                            v
+-----------------------------------------------------------+
|         Institution Portal + Fiat Off-Ramp                |
|                                                           |
|   Institution submits claim  ->  Backend validates        |
|   Contract releases funds    ->  MoneyGram off-ramp       |
|   Funds land in institution's business bank account       |
+-----------------------------------------------------------+
                            |
                            | Confirmation
                            v
+-----------------------------------------------------------+
|              Sender Notification Layer                    |
|                                                           |
|   Email + push + on-chain receipt link                    |
+-----------------------------------------------------------+
```

---

## 3. Smart Contract Layer

### 3.1 Escrow Contract

**Path:** `contracts/escrow/`

**Purpose:** Lock funds to a specific purpose and release them only when a verified institution submits a valid claim.

**Key state:**

```
struct EscrowState {
    sender: Address,
    institution_id: BytesN<32>,
    purpose: Purpose,             // enum: SchoolFees | Medical | Utility | Grocery
    amount: i128,
    student_ref: Symbol,          // student/patient/account reference
    created_at: u64,
    timeout_at: u64,              // auto-refund threshold
    status: EscrowStatus,         // Pending | Claimed | Released | Refunded | Disputed
}
```

**Key functions:**

```
initialize(env, sender, institution_id, purpose, amount, student_ref, timeout)
deposit(env) -> transfers USDC into contract custody
claim(env, institution_id, proof_hash) -> institution submits claim
release(env, claim_id) -> validates claim, transfers to institution
refund(env) -> sender-triggered refund after timeout
```

### 3.2 Institution Registry Contract

**Path:** `contracts/registry/`

**Purpose:** Maintain the verified institution list — only registered institutions can claim escrows.

**Key state:**

```
struct Institution {
    id: BytesN<32>,
    name: Symbol,
    category: Category,           // enum: School | Hospital | Utility | Grocery
    kyb_status: KybStatus,        // Pending | Verified | Suspended | Revoked
    bank_account_hash: BytesN<32>,
    registered_at: u64,
}
```

**Key functions:**

```
register(env, institution_data) -> admin function, creates entry
verify(env, id) -> admin function, marks KYB verified
list_by_category(env, category) -> read-only lookup
revoke(env, id, reason) -> admin function, blocks future claims
```

### 3.3 Contract-level invariants

- Funds can only leave escrow via `release` or `refund` — no direct transfers
- Only institutions with `KybStatus::Verified` can call `claim`
- Refund is only callable after `timeout_at`
- All state changes emit events for indexer consumption
- No admin-controlled fund withdrawal (protects against key compromise)

---

## 4. Backend Layer

### 4.1 Responsibilities

The backend does **not** custody funds. It orchestrates:

- User authentication and session management
- Transaction lifecycle tracking
- Webhook processing (MoneyGram, Bridge)
- Contract invocation on behalf of users
- Institution onboarding + KYB workflow
- Notification delivery
- Analytics and monitoring

### 4.2 Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify (fast, low overhead)
- **Language:** TypeScript
- **ORM:** Drizzle (lightweight, type-safe)
- **Database:** PostgreSQL (via Supabase)
- **Cache:** Redis
- **Queue:** BullMQ (for async webhook processing)
- **Stellar SDK:** `@stellar/stellar-sdk` for transaction orchestration

### 4.3 Key services

- `AuthService` — session, email verification, MFA
- `TransactionService` — sender-facing transaction lifecycle
- `InstitutionService` — school onboarding, KYB, claim validation
- `IntegrationService` — MoneyGram, Bridge webhook processing
- `NotificationService` — email + push notifications
- `AnalyticsService` — internal event tracking

### 4.4 API surface

- REST + JSON (sender-facing)
- Webhooks (institution-facing, MoneyGram, Bridge)
- Detailed OpenAPI spec: `backend/openapi.yaml` (coming with backend skeleton)

---

## 5. Frontend Layer

### 5.1 Applications

**Sender web app**
- Wallet-agnostic (Stellar Wallets Kit for connection)
- Deposit flow with purpose selection
- Transaction history + on-chain receipts
- Recurring payments (post-MVP)

**Institution portal**
- KYB onboarding
- Pending claims dashboard
- Claim submission with student/service verification
- Settlement history

**Public marketing site**
- Landing page (English + Urdu)
- Waitlist capture
- Blog + docs
- SEO-optimized

### 5.2 Stack

- Next.js 14 (App Router)
- TypeScript strict mode
- TailwindCSS + shadcn/ui components
- Stellar Wallets Kit for wallet UX
- i18next for internationalization (Urdu, Bengali, Tagalog planned)
- Playwright for E2E testing

---

## 6. Fiat Rails Integration

### 6.1 On-ramp (sender side)

**MoneyGram Access API** (primary)
- Sender initiates deposit in local fiat
- MoneyGram converts to USDC on Stellar
- USDC flows into BarakahPay escrow contract
- Full KYC handled by MoneyGram (out of scope for BarakahPay)

**Bridge (bridge.xyz)** (backup)
- Direct USD-to-USDC conversion
- Used when MoneyGram unavailable in sender's country

### 6.2 Off-ramp (institution side)

**MoneyGram Access API** (primary for Pakistan)
- Contract release event triggers backend orchestration
- Backend calls MoneyGram to convert USDC to PKR
- MoneyGram deposits PKR into institution's business bank account
- Institution receives standard fiat — no crypto held by institution

**Anchor Platform** (phase 2)
- Protocol-native fiat rails
- Regional anchors as they come online
- Fallback when MoneyGram unavailable

### 6.3 Why not direct crypto to institutions?

- Regulatory clarity (institution bank accounts are legal PKR)
- Institution simplicity (no wallet management)
- User trust (institution just sees standard fiat receipt)
- SBP compliance (no consumer crypto in Pakistan)

---

## 7. Data Flow — End-to-End Transaction

### 7.1 Happy path

1. **Sender lands on web app**, connects wallet (Freighter)
2. **Selects school** from verified registry (via backend API)
3. **Enters student reference + amount**
4. **Initiates deposit** — backend generates MoneyGram deposit intent
5. **Sender completes USD deposit** at MoneyGram or via card
6. **MoneyGram sends USDC** to BarakahPay's deposit wallet on Stellar
7. **Backend detects deposit**, calls `escrow.initialize()` + `escrow.deposit()`
8. **Escrow contract locks funds** with purpose + school ID
9. **School receives notification** on institution portal
10. **School verifies student enrollment**, submits `claim()` via portal
11. **Backend validates claim** against school's KYB status + student ref
12. **Backend calls `escrow.release()`** — funds move to backend's settlement wallet
13. **Backend calls MoneyGram** to off-ramp USDC to school's PKR bank account
14. **MoneyGram confirms settlement**, backend updates transaction state
15. **Sender notified** with on-chain receipt link
16. **Transaction closes** — full audit trail on-chain

### 7.2 Refund path

If school does not claim within timeout (30 days default):

1. Sender opens transaction in web app
2. Sees "Refund available" option
3. Clicks refund
4. Backend calls `escrow.refund()`
5. Funds return to backend's deposit wallet
6. Backend triggers MoneyGram reverse settlement to sender
7. Sender receives fiat refund via original payment method

### 7.3 Dispute path (post-MVP)

- Sender or institution can escalate
- Arbitrator (initially BarakahPay team, later delegated) reviews
- Manual resolution triggers appropriate contract call

---

## 8. Security Considerations

### 8.1 Contract security

- All state mutations go through auth checks
- No admin fund withdrawal (protects against key compromise)
- Overflow-safe arithmetic (Soroban's i128 with checked operations)
- Comprehensive test suite (85%+ coverage target)
- External audit before mainnet (via SCF Audit Bank)
- Emergency pause mechanism (admin-only, time-limited)

### 8.2 Backend security

- All secrets in environment variables (never in code)
- Rotated API keys (MoneyGram, Bridge)
- Rate limiting on public endpoints
- CSRF protection on state-changing routes
- SQL injection prevention (parameterized queries via Drizzle)

### 8.3 Frontend security

- CSP headers (strict)
- No inline scripts
- Sanitized user input display
- HTTPS-only cookies
- Wallet signature verification for sensitive actions

### 8.4 Operational security

- Multi-factor auth for all team accounts
- Signed commits (GPG) on `main` branch
- Branch protection with required reviews
- Dependency scanning (Dependabot)
- Secret scanning enabled on GitHub

---

## 9. Technology Choices — Rationale

### Why Soroban over Ethereum L2?

- **Sub-second finality** (vs. seconds on L2)
- **Sub-cent fees** (vs. cents on L2)
- **Native USDC** on Stellar (no bridging)
- **MoneyGram integration** (unique to Stellar)
- **Rust safety guarantees** for contract security

### Why Next.js over pure React?

- Server-side rendering for SEO on marketing site
- API routes for backend-for-frontend patterns
- Image optimization for landing page performance
- PWA support for mobile-first users

### Why Fastify over Express?

- Lower overhead per request
- Better TypeScript support
- Built-in schema validation
- Modern plugin ecosystem

### Why PostgreSQL over MongoDB?

- Transactional integrity (financial data)
- Complex relational queries (institutions, transactions, users)
- Mature ecosystem for financial applications
- Supabase managed offering reduces ops burden

---

## 10. Future Architecture Evolution

### Post-MVP additions

- **Multi-purpose contracts** — extend beyond school fees
- **Recurring payment contracts** — monthly subscriptions
- **Multi-signature institutional accounts** — larger institutions
- **Cross-corridor bridging** — sender in UK, institution in Bangladesh
- **Zakat/charity module** — verified religious giving with proof-of-delivery
- **Dispute resolution DAO** — delegated arbitration

### Scalability path

- **Read scaling:** GraphQL layer + Redis caching
- **Write scaling:** Async webhook processing via queues
- **Multi-region:** CDN for static assets, backend on Fly.io regions
- **Chain scaling:** Multiple Soroban contract shards if needed

---

## 11. Decision Records

Significant architectural decisions are documented as ADRs (Architecture Decision Records) in `docs/decisions/`.

Each ADR follows the format:

- **Title** — short noun phrase
- **Status** — Proposed | Accepted | Deprecated | Superseded
- **Context** — the situation prompting the decision
- **Decision** — what we chose
- **Consequences** — trade-offs and implications

---

## 12. References

- [Stellar Documentation](https://developers.stellar.org)
- [Soroban Documentation](https://soroban.stellar.org)
- [SEP-24 (Deposit and Withdrawal API)](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md)
- [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit)
- [MoneyGram Access](https://stellar.org/moneygram)

---

*This is a living document. As the system evolves, this file will be updated with each significant architectural change.*

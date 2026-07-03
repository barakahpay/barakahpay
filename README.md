<div align="center">

# BarakahPay

**Purpose-bound remittance rails on Stellar & Soroban**

*Send money for what matters. Verify it got there.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-000000.svg)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Smart%20Contracts-Soroban-purple.svg)](https://soroban.stellar.org)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange.svg)](./docs/roadmap.md)

</div>

---

## What is BarakahPay?

BarakahPay is a **purpose-bound remittance infrastructure** built on Stellar and Soroban. It enables diaspora senders to transfer money to families in emerging markets with a critical difference from existing rails: **funds are cryptographically locked to a specific purpose** (initially school fees) and only release when consumed at a verified institution — with on-chain proof-of-use returned to the sender.

**Launch corridor:** Pakistan diaspora → school fees. Then Bangladesh, Philippines, Nigeria, Mexico.

**We are not:**
- A consumer crypto wallet
- A stablecoin or token launch
- A replacement for MoneyGram or Wise
- A P2P transfer app

**We are:**
- A smart-contract escrow layer on top of licensed remittance rails
- Purpose-locked money movement with on-chain audit trail
- Institution-first infrastructure (schools first, hospitals + utilities later)

---

## How it works

```
Sender (UK / US / Gulf)
    |
    |  Deposits USD via MoneyGram Access
    v
+---------------------------------------------+
|      Soroban Smart Contract Layer           |
|                                             |
|  Escrow Contract  <->  School Registry      |
|  (purpose lock)        (verified institutions)|
+---------------------------------------------+
    |
    |  On school claim -> automatic release
    v
School's business bank account (PKR via MoneyGram off-ramp)
    |
    |  On-chain receipt returned
    v
Sender sees proof-of-use
```

---

## Why Stellar

BarakahPay is only viable on Stellar because:

- **Sub-second finality** — remittances demand instant confirmation
- **Sub-cent fees** — retail remittance economics require ultra-low costs
- **Native USDC** — no bridging overhead
- **MoneyGram integration** — regulated fiat rails already exist
- **Soroban Rust contracts** — safe, auditable escrow logic
- **SEP standards + Anchor Platform** — compliance-first infrastructure

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Smart Contracts | Rust · Soroban SDK · Stellar |
| Frontend | Next.js 14 · TypeScript · TailwindCSS · shadcn/ui |
| Backend | Node.js · TypeScript · Fastify · PostgreSQL |
| Wallet Integration | Stellar Wallets Kit · Freighter |
| Infrastructure | Vercel · Railway · Supabase · Cloudflare |
| Fiat Rails | MoneyGram Access · Bridge · Anchor Platform |

---

## Project Structure

```
barakahpay/
├── contracts/          # Soroban Rust smart contracts
│   ├── escrow/         # Purpose-bound escrow contract
│   └── registry/       # Verified institution registry
├── web/                # Next.js frontend (sender + institution portals)
├── backend/            # Node.js API + integration orchestration
├── docs/               # Architecture, roadmap, decision records
├── .github/            # PR templates, issue templates, workflows
├── BUSINESS_PLAN.md    # Full business plan
├── TEAM_ROLES.md       # Founder profile + execution strategy
├── CONTRIBUTING.md     # Contribution guidelines
├── SECURITY.md         # Security policy
└── README.md           # This file
```

---

## Getting Started

> **Status:** Development environment setup in progress. Full quick-start guide coming with the first contract release.

### Prerequisites

- Rust `1.75+` and Cargo
- Soroban CLI (`stellar-cli` `21.0+`)
- Node.js `20+` and pnpm `8+`
- Git
- A Stellar testnet account (friendbot-funded)

### Coming soon

- [ ] `contracts/` — Escrow + registry contract skeletons
- [ ] `web/` — Sender + institution portal boilerplate
- [ ] `backend/` — API + integration layer
- [ ] Docker compose for local dev

---

## Documentation

- [Business Plan](./BUSINESS_PLAN.md) — full market, product, and financial plan
- [Founder Profile & Execution Strategy](./TEAM_ROLES.md)
- [Architecture](./docs/architecture.md) — technical deep dive
- [Roadmap](./docs/roadmap.md) — public roadmap
- [Contributing](./CONTRIBUTING.md) — how to help
- [Security](./SECURITY.md) — vulnerability reporting

---

## Roadmap Highlights

| Milestone | Target |
|-----------|--------|
| Escrow + registry contracts on testnet | Q3 2026 |
| Landing page + waitlist | Q3 2026 |
| MoneyGram sandbox integration | Q3 2026 |
| Working end-to-end testnet demo | Q3 2026 |
| SCF Build Award submission | Q3 2026 |
| Mainnet deployment | Q4 2026 |
| Pakistan corridor soft launch | Q4 2026 |
| First 100 real transactions | Q4 2026 |

See [`docs/roadmap.md`](./docs/roadmap.md) for the full roadmap.

---

## Ecosystem

BarakahPay is being built as part of the [Stellar Community Fund](https://communityfund.stellar.org/) Build track application. We contribute back to and build on top of:

- [Stellar](https://stellar.org) and [Soroban](https://soroban.stellar.org)
- [MoneyGram Access](https://stellar.org/moneygram)
- [Bridge](https://bridge.xyz)
- [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit)
- [Stellar Anchor Platform](https://github.com/stellar/java-stellar-anchor-sdk)

---

## Contact

- **Website:** [barakahpay.io](https://barakahpay.io) *(coming soon)*
- **Twitter/X:** [@barakahpay](https://x.com/barakahpay) *(coming soon)*
- **Email:** hello@barakahpay.io *(coming soon)*
- **GitHub:** [@barakahpay](https://github.com/barakahpay)

---

## License

BarakahPay is [MIT licensed](./LICENSE). Smart contracts are open source and free to use, modify, and integrate.

---

<div align="center">
<em>Built with intention for underserved corridors.</em>
</div>

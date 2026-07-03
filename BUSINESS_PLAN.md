# BarakahPay — Business Plan

**Purpose-Bound Remittance Infrastructure on Stellar & Soroban**

*Solo Founder, AI-Augmented Development*

---

## 1. Executive Summary

**BarakahPay** is a purpose-bound remittance infrastructure built on Stellar and Soroban. It enables diaspora senders to transfer money to families in emerging markets with a critical difference from existing rails: funds are cryptographically locked to a specific purpose (initially school fees) and only release when consumed at a verified institution — with on-chain proof-of-use returned to the sender.

**Launch focus:** Pakistan diaspora → school fees corridor. This is a **narrow, deep MVP** targeting a specific real pain: overseas Pakistanis want to sponsor children's education directly, not send cash that gets misdirected.

Once product-market fit is proven in this focused corridor, the model expands to other purposes (medical, utilities, groceries) and other corridors (Bangladesh, Philippines, Nigeria, Mexico).

**Ask:** SCF Build Award — **$45,000 USD (in XLM)**, delivered across 3 tranches over 6 months.

**Founder:** Solo technical founder with Soroban Rust experience and full-stack development capability. AI-augmented development workflow enables single-operator execution of a focused MVP scope. Team hiring planned post-award once traction is proven.

---

## 2. Problem Statement

### 2.1 The Trust Gap in Remittances

Overseas Pakistanis send **$30B+ annually** to families back home. A significant portion is intended for children's education — but ends up misdirected, borrowed by relatives, or spent on non-essentials.

Traditional rails (Western Union, MoneyGram, wire transfers) simply move money from Point A to Point B. **They cannot enforce or verify purpose.**

### 2.2 Real user pain (informally validated)

- *"I send money for my brother's school fees — I'm not sure if it actually goes there."* — UK-based Pakistani sender
- *"I want to sponsor a student's education directly — not give cash to family."* — US-based Pakistani sender
- *"My tuition doesn't come on time because uncle uses the money for other things first."* — Karachi-based student

### 2.3 Why now

- Stellar's Soroban platform (launched Feb 2024) makes programmable, purpose-bound money possible on a global payments network.
- MoneyGram's Stellar integration provides regulated fiat rails in 200+ countries — including Pakistan.
- Diaspora communities are increasingly digital-native and demand transparency.
- Solo founders using AI-augmented workflows can now ship products that previously required teams — a small operator can deliver a focused MVP in 6 months.

---

## 3. Solution — Product Overview

### 3.1 Core primitive: Purpose-Bound Escrow

BarakahPay is a **smart contract layer on top of licensed remittance rails**. We do not replace MoneyGram or banks — we add programmability, verification, and transparency to money that flows through them.

### 3.2 MVP scope (v1.0 — Pakistan schools only)

```
Step 1: Sender (UK/US/Gulf)
        Opens BarakahPay web app
        Picks a verified Pakistani school
        Enters student ID/name and amount

Step 2: Sender deposits USD
        Via MoneyGram / Bridge on-ramp
        Funds converted to USDC on Stellar

Step 3: Soroban Escrow Contract
        Funds locked with school ID + student reference
        Registry cross-checks school is verified

Step 4: School Claim
        School receives notification (portal + email)
        Verifies student is enrolled
        Submits claim with confirmation

Step 5: Automatic Release
        Contract validates claim
        Funds release to school's business bank account via MoneyGram/Bridge settlement
        On-chain receipt generated

Step 6: Sender Notification
        Sender receives push + email confirmation
        On-chain receipt viewable on stellar.expert
        Transaction history stored in sender portal
```

### 3.3 Key differentiators (vs traditional rails)

| Feature | Traditional Rails | BarakahPay MVP |
|---------|-------------------|----------------|
| Fast transfer | Yes | Yes |
| Low cost | No | Yes |
| Purpose lock (school only) | No | **Yes** |
| Proof-of-payment to sender | Receipt only | **On-chain proof** |
| Direct school payment | Rare | **Default** |
| Sender chooses institution | No | **Yes** |

### 3.4 What we are NOT (MVP scope discipline)

- Not a consumer crypto wallet — no individual in Pakistan holds crypto
- Not a stablecoin or token launch — no BarakahPay token
- Not a replacement for MoneyGram — we sit on top of them
- Not a P2P transfer app — we are institution-first (schools first, hospitals/utilities later)
- **Not launching multi-corridor at once** — Pakistan only in MVP
- **Not launching multi-purpose at once** — school fees only in MVP

Scope discipline is our biggest asset as a solo founder.

---

## 4. Technical Architecture

### 4.1 MVP architecture (simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                    Sender Web App (PWA)                     │
│                 (Next.js + Stellar Wallets Kit)             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Deposit USD
                   ▼
┌─────────────────────────────────────────────────────────────┐
│               Fiat On-Ramp (MoneyGram Access)               │
│                    (Regulated Partner)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ USD → USDC on Stellar
                   ▼
┌─────────────────────────────────────────────────────────────┐
│               Soroban Smart Contract Layer                  │
│                                                             │
│  ┌───────────────────┐  ┌────────────────────────────┐     │
│  │  Escrow Contract  │  │  School Registry Contract  │     │
│  │  - School ID lock │  │  - Verified schools list   │     │
│  │  - Amount lock    │  │  - KYB status tracking     │     │
│  │  - Release logic  │  │  - Category = schools MVP  │     │
│  │  - Refund timeout │  │                            │     │
│  └───────────────────┘  └────────────────────────────┘     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Release trigger
                   ▼
┌─────────────────────────────────────────────────────────────┐
│         School Claim Portal + Fiat Off-Ramp                 │
│  School submits claim → MoneyGram → School bank account     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 MVP tech stack

**Smart Contracts:**
- Language: Rust
- Framework: Soroban SDK
- Chain: Stellar (testnet → mainnet)
- Contracts: 2 (escrow + registry)

**Backend:**
- Node.js + TypeScript
- Fastify (API framework)
- PostgreSQL via Supabase (managed)
- Stellar SDK (JavaScript) for tx orchestration

**Frontend:**
- Next.js 14 (App Router)
- TailwindCSS + shadcn/ui
- Stellar Wallets Kit (Freighter primary)
- i18n: English + Urdu (RTL support)

**Infrastructure:**
- Vercel (frontend deployment)
- Railway (backend)
- Supabase (managed Postgres)
- Cloudflare (CDN, security)

**MVP integrations (per SCF Integration Track priorities):**
- **MoneyGram Access API** — fiat on-ramp (US, UK, Gulf) and off-ramp (Pakistan school accounts)
- **Stellar Wallets Kit** — sender wallet UX
- **Anchor Platform** — planned for phase 2 (post-MVP)

### 4.3 Smart contract design (MVP scope)

**`escrow` contract:**
- `initialize(sender, school_id, student_ref, amount, timeout)`
- `lock_funds()` — sender deposits USDC
- `claim(school_id, proof_hash)` — school submits claim
- `release(claim_id)` — automatic release on valid claim
- `refund()` — sender-triggered refund after 30-day timeout

**`school_registry` contract:**
- `register_school(kyb_data)` — admin function
- `verify_school(id)` — check status
- `list_verified()` — sender-facing lookup
- `revoke(id, reason)` — remove bad actors

**Both contracts open-sourced under MIT license (SCF requirement).**

Post-MVP (phase 2, not in this SCF scope):
- Dispute resolution contract
- Multi-purpose escrow (medical, utilities, groceries)
- Multi-corridor support
- Recurring payments contract

### 4.4 Why Stellar specifically

Stellar is the **only viable chain** for BarakahPay because:

1. **Sub-second finality** — remittances need immediate confirmation
2. **Sub-cent fees** — retail remittance economics require ultra-low costs
3. **Built-in stablecoin support** (USDC native on Stellar)
4. **Regulated fiat rails already exist** — MoneyGram integration is unique to Stellar
5. **Soroban's Rust contracts** — safe, auditable, well-suited to escrow logic
6. **Compliance-friendly** — SEP standards, KYB workflow support

This is not a project that could exist on Ethereum, Solana, or any other chain without significant compromises.

---

## 5. Market Analysis

### 5.1 Global remittance market

- **Total addressable market (TAM):** $831B in 2024 (World Bank)
- **South Asia:** $189B (Pakistan, India, Bangladesh combined)
- **Southeast Asia:** $140B (Philippines, Vietnam, Indonesia)

### 5.2 Serviceable addressable market (SAM)

Focus corridors (long-term, Muslim-majority + underserved):

| Corridor | Annual Inflows | Phase |
|----------|----------------|-------|
| Pakistan | $30B | MVP (this SCF) |
| Bangladesh | $22B | Phase 2 |
| Philippines | $40B | Phase 3 |
| Nigeria | $20B | Phase 3 |

**Total SAM:** ~$110B annually

### 5.3 Beachhead — Pakistan school fees corridor

Narrow segment for MVP:

- Pakistani private school segment: **~35,000 mid-tier private schools**
- Average tuition: **PKR 8,000–20,000/month** ($30–$75)
- Estimated overseas-funded students: **~2M** (rough estimate based on diaspora surveys)
- Estimated annual school-fee remittance flow: **$1.5–2B**

If we capture 0.5% of this narrow segment in Year 1 → **~$7.5M annual volume**.

### 5.4 Serviceable obtainable market (SOM)

Realistic 3-year capture:

- Year 1 (MVP corridor only): $500k volume
- Year 2 (Pakistan + Bangladesh, all purposes): $8M volume
- Year 3 (multi-corridor, multi-purpose): $50M+ volume

Revenue at 1.5% transaction fee = ~$750k annual revenue by Year 3.

### 5.5 Target sender segment (Year 1)

**Primary sender:**
- Overseas Pakistani professionals (30-45 years old)
- Located in UK, US, UAE, Saudi Arabia, Canada
- Sends $50-$150/month for children's education
- Digitally literate, uses apps like Wise or Remitly today
- Motivated by transparency, family accountability, faith-aligned giving

**Primary institution:**
- Private schools serving lower-middle-class Pakistani families
- Tuition range: $30-$100/month
- Located in urban centers (Karachi, Lahore, Islamabad, Faisalabad, Rawalpindi)
- Have business bank accounts
- Willing to receive digital payment confirmations

---

## 6. Competitive Landscape

### 6.1 Direct competitors

**None.** No product globally offers purpose-bound, on-chain-verified remittances at scale.

### 6.2 Indirect competitors

**Traditional remittance rails:**
- Western Union, MoneyGram — high fees, no purpose lock
- Wise (formerly TransferWise) — cheap, but purely money movement
- Remitly, WorldRemit — competitive prices, no verification

**Digital-first Pakistan services:**
- ACE Money Transfer — traditional model
- Alpha Exchange — traditional model
- Payoneer — B2B focused

**School-fee-specific services:**
- Some banks offer direct-to-school transfers (limited coverage, no diaspora-friendly UX)
- Existing solutions are institution-siloed, not aggregator platforms

### 6.3 Defensibility

**Moats built during MVP:**
1. **Verified school network** — first-mover advantage with 25+ verified Pakistani schools
2. **Institutional relationships** — schools that trust us won't easily switch
3. **Brand trust** in target community (diaspora Pakistani parents)
4. **Ecosystem partnership signals** — being on Stellar with MoneyGram integration is defensible

---

## 7. Business Model

### 7.1 Revenue streams

**MVP (Year 1):**
- **Transaction fee:** 1.5% of transferred amount, taken from sender side
- Comparable to Wise (0.5-1%), significantly lower than Western Union (5-10%)

**Post-MVP (Year 2+):**
- **School SaaS:** $10-$20/month per school for portal, reporting, receipt aggregation
- **Premium sender features:** Recurring payments, family group accounts, receipt PDFs ($3-$5/month)

**Long-term (Year 3+):**
- **Purpose expansion:** medical, utilities, groceries — same model, more categories
- **Data & insights:** Anonymized payment data for development orgs
- **Zakat/charity infrastructure:** Verified religious giving with proof-of-delivery

### 7.2 Unit economics (MVP)

Per $100 average school-fee transaction:
- Revenue: $1.50 (1.5% fee)
- MoneyGram/Bridge cost: $0.50 (~0.5%)
- Stellar network fee: $0.001
- Support/ops allocation: $0.30
- **Gross margin per txn: ~$0.70 (47%)**

At 500 transactions/month = **$350 gross monthly revenue** in MVP
At 5,000 transactions/month = **$3,500 gross monthly revenue** (year 2 target)

This is not a get-rich-quick — it's a foundation. Ecosystem funding buys runway to prove PMF.

---

## 8. Go-to-Market Strategy

### 8.1 Phase 1: Pre-launch (Weeks 1-7, SCF prep phase)

**Sender-side:**
- Landing page live with waitlist (English + Urdu)
- Reddit posts: r/pakistan, r/AskPakistan, r/dubai, r/saudiarabia
- Facebook diaspora groups (5-7 targeted groups)
- Twitter/X presence tagging @stellarorg
- **Target: 200+ waitlist signups pre-submission**

**Institution-side:**
- Direct outreach to 10-15 schools
- LOI (Letter of Intent) collection — simple email confirmation
- **Target: 3-5 signed LOIs pre-submission**

### 8.2 Phase 2: Testnet beta (Months 1-3, post-award)

- Onboard 15 verified schools to portal
- Invite 30 waitlist users to closed testnet beta
- Simulated transactions with test funds
- Weekly user feedback calls
- Iterate rapidly

### 8.3 Phase 3: Mainnet soft launch (Months 4-6)

- Open Pakistan corridor with 25 schools live
- MoneyGram integration active
- Cap transactions at $200 initially (risk management)
- **Target: 20+ real transactions, $2,500+ volume in first month post-launch**

### 8.4 Phase 4: Scale (Months 7-12, post-SCF)

- Grow to 100 schools
- Remove transaction caps
- Add recurring payments
- Introduce sender referral program
- **Target: $50k monthly volume by month 12**

### 8.5 Acquisition channels (solo founder, low-budget)

| Channel | Cost | Priority |
|---------|------|----------|
| Community/diaspora groups | Free | Highest |
| Reddit organic posts | Free | Highest |
| Twitter/X content | Free | High |
| Referral program | 10% first month | High |
| School direct outreach | Time only | Highest |
| SEO content | Low | Medium |
| Paid ads | Excluded from SCF budget | Post-Year-1 |

---

## 9. Regulatory Strategy

### 9.1 Core principle

**BarakahPay is a smart contract layer, not a money transmitter.** All fiat movement goes through licensed rails (MoneyGram, Bridge). We do not touch fiat directly.

### 9.2 Jurisdictional structure

- **Entity:** Dubai IFZA Free Zone (LLC) — crypto-friendly, low tax, remote setup possible (~$3,500 one-time)
- **Bank account:** WIO Bank or Emirates NBD (Dubai)
- **Founder location:** Pakistan (founder resides here; entity in Dubai)
- **User contracts:** Governed by UAE law with international arbitration

### 9.3 Pakistan compliance

- **Do NOT operate as a consumer crypto wallet** in Pakistan
- **Schools receive payments in PKR via MoneyGram's licensed rail** — legally identical to any existing remittance
- **No individual in Pakistan holds crypto** through our platform
- **Marketing framing:** "Trusted school-fee remittances" — not "crypto remittance app"

### 9.4 Sender-side compliance

- KYC through MoneyGram partner (they handle sender identity)
- BarakahPay collects minimal PII (email, name, phone)
- AML monitoring for transaction patterns
- Sanctions screening (OFAC, EU, UN lists)

### 9.5 School KYB

- Business registration documents
- Physical address verification
- School license verification (Sindh/Punjab/KP education board)
- Bank account ownership proof
- Ongoing monitoring

### 9.6 Data protection

- GDPR compliance for UK/EU senders
- PDPL compliance for UAE users
- Encrypted PII at rest and in transit

---

## 10. Founder Profile

### 10.1 Founder — [Your Name]

**Role:** Founder & Sole Operator (MVP phase)

**Background:**
- Full-stack developer (Node.js, React, Next.js, TypeScript)
- Rust and Soroban smart contract experience
- Prior blockchain development experience
- Pakistan-based, culturally embedded in target market
- AI-augmented development workflow

**Why solo works for this MVP:**
- Scope is narrow (2 contracts, 2 portals, 1 corridor, 1 purpose)
- AI tooling (Cursor, Claude Code, Copilot) multiplies solo productivity 3-5x
- No coordination overhead → faster iteration
- Learnings inform correct hires post-award

*(See `TEAM_ROLES.md` for detailed execution strategy, time allocation, and hiring plan.)*

### 10.2 Advisors (targeted during prep phase)

Actively pursuing:
- 1 Stellar ecosystem advisor (SCF alum or SDF community)
- 1 Pakistan fintech advisor (banking/remittance background)
- 1 Islamic finance advisor (for future Zakat use case)

### 10.3 Post-award hiring plan

Once MVP is live and traction proven (Month 6+), planned hires:

1. **Junior Rust engineer** — expand contract functionality (Month 7-8)
2. **BD/Community lead** — institution partnerships (Month 8-9)
3. **Frontend developer** — mobile app + polish (Month 10-12)

Series A raise targeted at Month 12-15 to fund team expansion.

---

## 11. Roadmap

### 11.1 Pre-SCF submission (Weeks 1-7)

| Week | Milestone |
|------|-----------|
| 1 | GitHub org, dev env, escrow contract v0.1 |
| 2 | Escrow + registry contracts on testnet, GitHub public |
| 3 | Landing page live, waitlist launched, first 50 signups |
| 4 | School outreach begins, 200+ waitlist target |
| 5 | 3-5 school LOIs collected |
| 6 | Working MVP demo (end-to-end testnet flow, video) |
| 7 | Submission document finalized, interest form submitted |

### 11.2 SCF-funded roadmap (Months 1-6)

**Tranche 1 — MVP on Testnet ($9k, Month 1-2)**
- Core Soroban contracts audited internally
- School registry with 15+ verified schools onboarded
- Sender web portal (Next.js) with wallet integration
- School claim portal
- Testnet end-to-end flow demonstrated
- Public GitHub with docs, deployment scripts

**Tranche 2 — MoneyGram Integration ($13.5k, Month 3-4)**
- MoneyGram Access API integration (sandbox → prod)
- KYB workflow for schools (10 more onboarded, 25 total)
- Refund timeout mechanism
- Mobile-first PWA optimization
- Multi-language support (English + Urdu, RTL)
- Comprehensive testnet demo video

**Tranche 3 — Mainnet Launch ($18k, Month 5-6)**
- Mainnet deployment with contract verification
- Public SDK for third-party integrators
- Documentation site (Docusaurus)
- Monitoring dashboard and analytics
- Pakistan corridor soft launch
- First 20+ real-world transactions
- **Success metric: $2,500+ real volume**

*(10% Tranche #0 = $4.5k on award acceptance for entity setup, tooling)*

**Total ask: $45,000 over 6 months.**

### 11.3 Post-SCF roadmap (Months 7-24)

- Grow to 100 schools (Month 7-9)
- Add recurring payments (Month 8)
- First hire — Junior Rust engineer (Month 7-8)
- Bangladesh corridor exploration (Month 10-12)
- Second SCF Build round application (larger scope, Month 12)
- Series A prep (Month 15-18)

---

## 12. Budget Breakdown ($45k)

### 12.1 By tranche

| Tranche | Amount | Purpose |
|---------|--------|---------|
| #0 (Acceptance) | $4,500 (10%) | Entity setup (Dubai IFZA), initial infra, tooling licenses |
| #1 (MVP) | $9,000 (20%) | Contract dev + core UI |
| #2 (Integration) | $13,500 (30%) | MoneyGram integration + KYB workflow |
| #3 (Mainnet) | $18,000 (40%) | Audit prep, deployment, launch, real transactions |
| **Total** | **$45,000** | |

### 12.2 By category (across full 6 months)

| Category | Amount | % |
|----------|--------|---|
| Founder compensation (6 months living cost, Pakistan-based) | $22,500 | 50% |
| Infrastructure (hosting, tooling, APIs, SaaS) | $5,000 | 11% |
| Integration & compliance costs | $5,000 | 11% |
| Design assets (Figma Pro, icons, brand) | $1,000 | 2% |
| Testing & QA infrastructure | $2,000 | 4% |
| Documentation tools | $500 | 1% |
| Legal & entity setup (Dubai IFZA) | $4,000 | 9% |
| AI development tools (subscriptions) | $1,500 | 3% |
| Contingency (10%) | $3,500 | 8% |
| **Total** | **$45,000** | **100%** |

### 12.3 Explicitly excluded (per SCF rules)

- No audit costs (SCF Audit Bank covers separately)
- No marketing spend
- No token or bounty giveaways
- No reimbursement for past work
- No paid user acquisition

---

## 13. Success Metrics

### 13.1 SCF milestone metrics

| Tranche | Metric |
|---------|--------|
| #1 | 15+ schools verified, testnet flow live, GitHub commits consistent |
| #2 | MoneyGram integration live, 25 schools onboarded, PWA mobile-ready |
| #3 | Mainnet live, 20+ real transactions, $2,500+ real volume |

### 13.2 Business KPIs (Year 1)

| KPI | Month 3 | Month 6 | Month 12 |
|-----|---------|---------|----------|
| Waitlist signups | 300 | 800 | 3,000 |
| Verified schools | 15 | 25 | 75 |
| Monthly active senders | 0 | 30 | 300 |
| Monthly transactions | 0 | 50 | 800 |
| Monthly volume (USD) | 0 | $2,500 | $50,000 |
| Gross monthly revenue | 0 | $37 | $750 |

### 13.3 Long-term north star

- 500+ verified schools across Pakistan by Year 2
- Expansion to medical, utilities, groceries by Year 3
- Bangladesh/Philippines corridors by Year 3
- $10M+ annual transaction volume by Year 3

---

## 14. Risks & Mitigation

### 14.1 Solo founder risk

**Risk:** Founder illness, burnout, or life event stalls project.
**Mitigation:**
- Open-source repo from day one — code and docs survive
- Monthly public updates on GitHub → community can validate progress
- Recruit 1-2 advisors who can step in if needed
- Advisor board is contract-based safety net
- Explicit hiring plan post-Tranche 3

### 14.2 Regulatory risk

**Risk:** SBP or Pakistan Crypto Council tightens crypto rules.
**Mitigation:** Entity outside Pakistan, no consumer crypto touch, licensed rails only. Product survives even if crypto is banned for individuals in Pakistan.

### 14.3 Integration partner risk

**Risk:** MoneyGram or Bridge changes API terms.
**Mitigation:** Anchor Platform (protocol-native) as backup path; multiple partner conversations initiated pre-MVP.

### 14.4 School adoption risk

**Risk:** Schools don't sign up.
**Mitigation:** Direct outreach from Week 4 of prep; LOIs collected pre-submission; free onboarding + first-year fee waiver; personal visits to Karachi/Lahore schools where founder is located.

### 14.5 Sender trust risk

**Risk:** Diaspora users don't trust a new app.
**Mitigation:** Small-cap transactions ($50-$200) initially; heavy social proof; community-led launch via trusted diaspora nodes; MoneyGram brand association front-and-center.

### 14.6 Technical risk

**Risk:** Soroban contract bugs on mainnet.
**Mitigation:** Multiple internal review passes; leverage SCF Audit Bank (separate from award budget); gradual rollout with strict transaction caps; comprehensive test coverage; testnet iteration for 2+ months before mainnet.

### 14.7 Competitive risk

**Risk:** Wise or a bank launches similar feature.
**Mitigation:** Speed to market with narrow focus; deep school relationships create switching cost; if incumbent enters, offer integration/acquisition path.

### 14.8 Solo velocity risk

**Risk:** MVP takes longer than 6 months solo.
**Mitigation:** Scope discipline is core strategy — MVP intentionally narrow (2 contracts, 2 portals, 1 corridor, 1 purpose). AI-augmented development (Claude Code, Cursor, Copilot) provides 3-5x productivity multiplier. Weekly public commit cadence keeps momentum.

---

## 15. Why SCF Should Fund BarakahPay

**1. Fits SCF's core thesis**
Financial inclusion for the underserved. $30B Pakistan corridor is the largest emerging-market remittance opportunity Stellar hasn't yet cracked.

**2. Meaningful Soroban integration**
Purpose-bound payments cannot exist without programmable smart contracts. Stellar's Soroban is uniquely suited.

**3. Composability-first**
MoneyGram integration is central — showcases the ecosystem's plug-and-play vision.

**4. Novel primitive**
Purpose-bound money is a first-of-its-kind primitive. Success here unlocks adjacent use cases (medical, utilities, charity, humanitarian aid).

**5. Real market pull**
Waitlist and school LOIs (validated pre-submission) demonstrate real demand.

**6. Realistic solo execution**
Narrow MVP scope + AI-augmented workflow + focused corridor = achievable by solo founder in 6 months. No over-promising.

**7. Regulatory maturity**
Compliance-first design, licensed rails, Dubai entity structure — mature strategy.

**8. Scalability post-MVP**
Pakistan is beachhead. Global $110B SAM ensures long-term expansion path. Success here demonstrates replicable playbook.

**9. Founder capability**
Full-stack + Soroban Rust experience is rare. Cultural fit with target market (Pakistan diaspora). Willing to relocate to institution locations for BD.

**10. Right-sized ask**
$45k is calibrated to solo delivery capacity. No inflated budgets. Clear tranche milestones tied to observable outcomes.

---

## 16. Appendix

### 16.1 Key partners referenced

- **MoneyGram Access** — Global remittance leader, Stellar's largest institutional partner
- **Bridge** — USDC settlement infrastructure
- **Stellar Anchor Platform** — Regulated fiat gateway framework (phase 2)
- **Stellar Wallets Kit** — Multi-wallet connection library

### 16.2 Reference materials

- SCF Handbook: https://stellar.gitbook.io/scf-handbook
- Community Fund: https://communityfund.stellar.org/
- Stellar Docs: https://developers.stellar.org/
- Soroban Docs: https://developers.stellar.org/docs/build/smart-contracts

### 16.3 Contact

- Email: [to be set — hello@barakahpay.io]
- Twitter/X: [to be created — @barakahpay]
- GitHub: [to be created — github.com/barakahpay]
- Website: [to be built — barakahpay.io]

---

*Document Version: 2.0 (Solo Founder revision)*
*Last Updated: 2026-07-03*
*Status: Draft for SCF Build Award submission preparation*

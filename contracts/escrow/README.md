# BarakahPay Escrow Contract

Purpose-bound escrow smart contract for BarakahPay remittances on Stellar / Soroban.

**Status:** v0.1 — MVP for school-fees remittances (Pakistan corridor).

---

## Live Deployment

**Network:** Stellar Testnet

**Contract ID:** `CBE7HHQI3F7NGPKRILKFQNZYDSSZBN27BSJSOE3EVYKLJ6YXXPYZQPGA`

**Explorer:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBE7HHQI3F7NGPKRILKFQNZYDSSZBN27BSJSOE3EVYKLJ6YXXPYZQPGA)

**Lab (interactive):** [View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CBE7HHQI3F7NGPKRILKFQNZYDSSZBN27BSJSOE3EVYKLJ6YXXPYZQPGA)

**Deployment transactions:**
- Upload WASM: [`6387205803658314e94714bd03e14a9831c425f0776a34c3b7de7f747414decd`](https://stellar.expert/explorer/testnet/tx/6387205803658314e94714bd03e14a9831c425f0776a34c3b7de7f747414decd)
- Deploy instance: [`92142e14b963c3ab7a28adb93eeff4439f32b52995c41f4c6b932ae55b7bfb68`](https://stellar.expert/explorer/testnet/tx/92142e14b963c3ab7a28adb93eeff4439f32b52995c41f4c6b932ae55b7bfb68)
- Initialize: [`ba80e1d72fc9afdb369018aa6dce618b84a8cb095907b9af21f750d23308ecb4`](https://stellar.expert/explorer/testnet/tx/ba80e1d72fc9afdb369018aa6dce618b84a8cb095907b9af21f750d23308ecb4)

**WASM size:** 7.8 KB (optimized via `wasm32v1-none` target)

**Deployed:** 2026-07-03

---

## Overview

The escrow contract locks tokens sent by a **sender** for a specific **institution** and **purpose**. Funds are released only when the institution submits proof of service. If the institution does not claim within the timeout window, the sender can refund.

### Lifecycle

```
                   +-----------+
  create_escrow -->|  Pending  |
                   +-----+-----+
                         |
             +-----------+-----------+
             |                       |
   release (institution)      refund (sender)
   with proof of service      after timeout
             |                       |
             v                       v
      +-----------+            +-----------+
      | Released  |            | Refunded  |
      +-----------+            +-----------+
```

### Guarantees

- **No admin withdrawal.** The admin cannot move funds from active escrows.
- **Only the specified institution** can release funds from a given escrow.
- **Only the original sender** can refund, and only after `timeout_at`.
- **Every state transition emits an event** for indexer consumption.
- **Amounts are overflow-safe** (Rust `i128` with checked semantics).

---

## Contract Interface

### `initialize(admin: Address) -> Result<(), Error>`

One-time setup. Sets the admin address. Admin exists for future governance (upgrade authorization, emergency pause) and cannot withdraw funds.

### `get_admin() -> Result<Address, Error>`

Returns the admin address. Fails if not initialized.

### `create_escrow(escrow_id, sender, institution, token, amount, purpose, reference, timeout_seconds) -> Result<(), Error>`

Sender locks `amount` of `token` for `institution`. Tokens are transferred into the contract at call time.

- `escrow_id: BytesN<32>` — unique identifier supplied by the caller (backend generates a UUID/hash)
- `sender: Address` — signs the transaction
- `institution: Address` — will be able to `release`
- `token: Address` — SEP-41 token contract (e.g., USDC)
- `amount: i128` — must be > 0
- `purpose: Purpose` — `SchoolFees` in v0.1
- `reference: Symbol` — student ID or service reference (max 32 bytes)
- `timeout_seconds: u64` — between 1 hour and 90 days

### `release(escrow_id: BytesN<32>, proof: BytesN<32>) -> Result<(), Error>`

Institution submits a proof hash and receives the escrowed funds.

- Institution must sign
- Escrow must be `Pending`
- Must be called before `timeout_at`

### `refund(escrow_id: BytesN<32>) -> Result<(), Error>`

Sender reclaims the escrowed funds after timeout has passed.

- Sender must sign
- Escrow must be `Pending`
- Must be called after `timeout_at`

### `get_escrow(escrow_id: BytesN<32>) -> Result<Escrow, Error>`

Returns the full `Escrow` record.

---

## Errors

| Code | Name | Meaning |
|------|------|---------|
| 1 | `NotInitialized` | Contract has not been initialized |
| 2 | `AlreadyInitialized` | Initialize was already called |
| 3 | `InvalidAmount` | Amount is <= 0 |
| 4 | `InvalidTimeout` | Timeout is < 1 hour or > 90 days |
| 5 | `EscrowNotFound` | No escrow with this id |
| 6 | `EscrowAlreadyExists` | An escrow with this id already exists |
| 7 | `NotPending` | Escrow is not in Pending state |
| 8 | `NotTimedOut` | Refund attempted before timeout |
| 9 | `TimedOut` | Release attempted after timeout |

---

## Events

All state transitions emit events. Topic conventions:

- `("init",)` — data: `admin_address`
- `("create", sender, institution)` — data: `(escrow_id, amount, purpose)`
- `("release", sender, institution)` — data: `(escrow_id, proof, amount)`
- `("refund", sender)` — data: `(escrow_id, amount)`

Indexers can subscribe to these to build off-chain views.

---

## Storage TTL

| Entry | TTL bump | TTL threshold |
|-------|----------|---------------|
| Admin (instance) | 7 days | 3 days |
| Escrow (persistent) | 30 days | 25 days |

Every state-changing operation on an escrow extends its TTL, so active escrows never expire mid-flight.

---

## Build

From the workspace root (`contracts/`):

```bash
# Build all contracts
cargo build --target wasm32-unknown-unknown --release

# Or via stellar-cli
stellar contract build
```

The compiled wasm will be at `contracts/target/wasm32-unknown-unknown/release/barakahpay_escrow.wasm`.

---

## Test

```bash
# Run all tests (native, fast)
cargo test

# Verbose output
cargo test -- --nocapture
```

Coverage target: **85%+**. Run coverage locally with `cargo llvm-cov` once installed.

---

## Deploy to Testnet

```bash
# Build wasm
stellar contract build

# Deploy
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/barakahpay_escrow.wasm \
  --source barakah-testnet \
  --network testnet

# Note the returned contract id
export ESCROW_CONTRACT_ID=<returned-id>

# Initialize
stellar contract invoke \
  --id $ESCROW_CONTRACT_ID \
  --source barakah-testnet \
  --network testnet \
  -- \
  initialize \
  --admin $(stellar keys address barakah-testnet)
```

Full deployment guide: [`docs/deployment.md`](../../docs/deployment.md) *(coming with backend integration)*

---

## Design Rationale

### Why is `escrow_id` supplied by the caller?

Because the backend orchestrator needs to correlate on-chain and off-chain state deterministically. Generating a UUID off-chain and passing it in avoids the complexity of contract-side counters, hash of nonce+state, or event-based reconstruction. It also lets the backend pre-compute the ID before submitting the transaction.

### Why not allow admin to withdraw?

To eliminate a class of attacks. If the admin key is compromised, no user funds are at risk. The admin role is intentionally minimal — future governance features will be added via separate contracts if needed.

### Why the `NotPending` check on both `release` and `refund`?

Idempotency guard. Prevents double-spends where a race condition or replay could try to release-then-refund or vice versa.

### Why not multi-purpose in v0.1?

Scope discipline. Shipping a single purpose that fully works > multiple half-baked purposes. `Purpose` is defined as an enum with reserved discriminants for future variants — no breaking storage changes needed to expand.

### Why is `reference` a `Symbol`?

`Symbol` is cheap on-chain (32 bytes max, alphanumeric). Perfect for student IDs, service refs, invoice numbers. For longer opaque references, we could switch to `String` in v0.2 at slightly higher gas cost.

---

## Security

- Report vulnerabilities per [`../../SECURITY.md`](../../SECURITY.md)
- External audit planned via SCF Audit Bank before mainnet
- Emergency pause mechanism is being designed for v0.2

---

## License

MIT — see [`../../LICENSE`](../../LICENSE)

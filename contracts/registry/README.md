# BarakahPay Institution Registry Contract

On-chain KYB-gated registry of institutions eligible to receive BarakahPay payments.

**Status:** v0.1 — MVP for Pakistani schools.

---

## Overview

The registry maintains a public list of institutions that have completed KYB verification. Every escrow payment created via the BarakahPay escrow contract is targeted at a specific institution address. Backend orchestrators call this registry to confirm the target is currently `Verified` before allowing the escrow to be created.

The registry does **not** custody funds. It only tracks eligibility state.

### KYB Lifecycle

```
    register (admin)  ->  Pending
        Pending    + verify (admin)     ->  Verified
        Verified   + suspend (admin)    ->  Suspended
        Suspended  + reinstate (admin)  ->  Verified
        any        + revoke (admin)     ->  Revoked (terminal)
```

Once an institution is Revoked, its state is final — the id and its bound address can never be re-used.

---

## Contract Interface

### `initialize(admin: Address) -> Result<(), Error>`

One-time setup. Sets the admin address that controls KYB decisions.

### `get_admin() -> Result<Address, Error>`

Returns the admin. Fails if not initialized.

### `transfer_admin(new_admin: Address) -> Result<(), Error>`

Transfer admin control. Requires both current and new admin signatures.

### `register(id, name, category, address, bank_account_hash, location) -> Result<(), Error>`

Admin registers a new institution in `Pending` state. The `id` and `address` must both be unique.

- `id: BytesN<32>` — client-supplied unique id
- `name: Symbol` — short institution name (max 32 chars)
- `category: Category` — `School` in v0.1
- `address: Address` — the Stellar address that will receive funds
- `bank_account_hash: BytesN<32>` — hash of bank account details (privacy)
- `location: Symbol` — city or region

### `verify(id) -> Result<(), Error>`

Admin marks a `Pending` institution as `Verified`. Sets `verified_at`.

### `suspend(id, reason: Symbol) -> Result<(), Error>`

Admin temporarily suspends a `Verified` institution.

### `reinstate(id) -> Result<(), Error>`

Admin brings a `Suspended` institution back to `Verified`.

### `revoke(id, reason: Symbol) -> Result<(), Error>`

Admin permanently revokes an institution. **Terminal — irreversible.**

### `get_institution(id) -> Result<Institution, Error>`

Read-only: fetch the full institution record.

### `get_institution_by_address(address) -> Result<Institution, Error>`

Read-only: reverse lookup by Stellar address.

### `is_verified(id) -> bool`

Read-only helper: quick eligibility check. Returns `true` only when `kyb_status == Verified`. Backend orchestrators call this before letting a sender create an escrow.

---

## Errors

| Code | Name | Meaning |
|------|------|---------|
| 1 | `NotInitialized` | Contract has not been initialized |
| 2 | `AlreadyInitialized` | Initialize was already called |
| 3 | `InstitutionNotFound` | No institution with this id/address |
| 4 | `InstitutionAlreadyExists` | An institution with this id already exists |
| 5 | `AddressAlreadyRegistered` | This Stellar address is already bound to another institution |
| 6 | `InvalidStatusTransition` | State machine violation (e.g. verify already-Verified) |
| 7 | `RevokedIsFinal` | Cannot transition out of Revoked |

---

## Events

- `("init",)` — data: `admin_address`
- `("register", admin, address)` — data: `(id, name, category)`
- `("verify", admin)` — data: `(id, address)`
- `("suspend", admin)` — data: `(id, address, reason)`
- `("reinstate", admin)` — data: `(id, address)`
- `("revoke", admin)` — data: `(id, address, reason)`
- `("adminxfer", old_admin)` — data: `new_admin`

Indexers subscribe to these to build off-chain views of institution state changes.

---

## Storage TTL

| Entry | TTL bump | TTL threshold |
|-------|----------|---------------|
| Admin (instance) | 7 days | 3 days |
| Institution (persistent) | 60 days | 50 days |
| Address index (persistent) | 60 days | 50 days |

Every read and write extends the institution's TTL — active institutions never expire.

---

## Design Rationale

### Why store bank account details as a hash?

Privacy. The plaintext account number lives in the off-chain backend. The on-chain hash lets us cryptographically prove a match without exposing the account. If bank details need to change, the admin can update the record with a new hash.

### Why is address unique?

To prevent the same Stellar address being bound to multiple institutions — a source of confusion for senders and a potential audit vector. Each address maps to exactly one institution record.

### Why is Revoked terminal?

Preserves audit history. If an institution commits fraud and is revoked, we don't want to erase that fact — nor do we want the id or address to be silently re-used. New institutions must be registered with fresh ids and fresh addresses.

### Why not check `is_verified` inside the escrow contract itself?

Coupling. Cross-contract calls add complexity and gas. In v0.1 the backend orchestrator is responsible for enforcing that only verified institutions can be the target of an escrow. A future v0.2 can wire the check directly into escrow if it proves valuable.

### Why is `name` a `Symbol`?

`Symbol` is cheap on-chain (32 bytes, alphanumeric). Perfect for short institution names. Full legal names can live off-chain in the backend keyed by the on-chain id.

---

## Build

From the workspace root (`contracts/`):

```bash
cargo build --target wasm32v1-none --release
```

Or via stellar-cli:

```bash
cd registry
stellar contract build
```

Wasm output: `contracts/target/wasm32v1-none/release/barakahpay_registry.wasm`

---

## Test

```bash
cd contracts
cargo test -p barakahpay-registry
```

Coverage target: **85%+**.

---

## Deploy to Testnet

```bash
cd contracts/registry
stellar contract build

stellar contract deploy \
  --wasm ../target/wasm32v1-none/release/barakahpay_registry.wasm \
  --source barakah-testnet \
  --network testnet

export REGISTRY_ID=<returned-id>

stellar contract invoke \
  --id $REGISTRY_ID \
  --source barakah-testnet \
  --network testnet \
  -- \
  initialize \
  --admin $(stellar keys address barakah-testnet)
```

Deployment details are recorded in `DEPLOYMENT.md` after each deploy.

---

## Security

- Report vulnerabilities per [`../../SECURITY.md`](../../SECURITY.md)
- External audit planned before mainnet
- Admin key compromise: admin can only manage KYB status — cannot withdraw funds anywhere (funds live in the escrow contract)

---

## License

MIT — see [`../../LICENSE`](../../LICENSE)

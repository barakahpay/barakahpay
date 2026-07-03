# Registry Contract — Deployment Record

**Contract:** `barakahpay-registry`
**Version:** 0.1.0

---

## Testnet (Live)

| Field | Value |
|-------|-------|
| **Network** | `Test SDF Network ; September 2015` |
| **Contract ID** | `CAAH5I3TKPRGJ74ONQVDG2V7XKA5R5KW352UU4SHTXFYCBOYY34PMASJ` |
| **Admin Address** | `GB6Q2YBYROB3F3IGIQZ3XZ4ZR5F2CWNAXCG37QR454Y65FS7KGP4FOZX` |
| **Deployed at** | 2026-07-03 |
| **WASM size** | 8.42 KB |
| **WASM hash** | `8ee0fa3c1dfd7db448c43603c6651095419464d6dc931eae66a9e698149eda59` |
| **Target** | `wasm32v1-none` |
| **SDK** | `soroban-sdk = 22.0.11` |

### Deployment transactions

1. **Upload WASM**
   - TX: `17ca6146ed96e7491f751172a07a4026423457cf3f6197d3429c8b4dc084816b`
   - [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/17ca6146ed96e7491f751172a07a4026423457cf3f6197d3429c8b4dc084816b)

2. **Deploy instance**
   - TX: `c040358a05f51da307417a34d3a338385e04de4de8a82d1ed718bd33626969b4`
   - [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/c040358a05f51da307417a34d3a338385e04de4de8a82d1ed718bd33626969b4)

3. **Initialize (set admin)**
   - TX: `c0aa6a31973d66f266303d1e7e7fec78dee162e7e134d45a159de272767243b0`
   - Event: `init` = admin address
   - [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/c0aa6a31973d66f266303d1e7e7fec78dee162e7e134d45a159de272767243b0)

### Explorers

- **Stellar Expert:** https://stellar.expert/explorer/testnet/contract/CAAH5I3TKPRGJ74ONQVDG2V7XKA5R5KW352UU4SHTXFYCBOYY34PMASJ
- **Stellar Lab (interactive):** https://lab.stellar.org/r/testnet/contract/CAAH5I3TKPRGJ74ONQVDG2V7XKA5R5KW352UU4SHTXFYCBOYY34PMASJ

### Interacting via CLI

```bash
# Read admin
stellar contract invoke \
  --id CAAH5I3TKPRGJ74ONQVDG2V7XKA5R5KW352UU4SHTXFYCBOYY34PMASJ \
  --source barakah-testnet \
  --network testnet \
  -- get_admin

# Check if institution is verified
stellar contract invoke \
  --id CAAH5I3TKPRGJ74ONQVDG2V7XKA5R5KW352UU4SHTXFYCBOYY34PMASJ \
  --source barakah-testnet \
  --network testnet \
  -- is_verified \
  --id 0000000000000000000000000000000000000000000000000000000000000001
```

### Known limitation: CLI enum encoding

`stellar-cli` v27.0.0 has a known limitation with UDT enum arguments — attempting
to pass `Category` (an enum) through `register` from the CLI panics with
"not yet implemented for UdtEnumV0". Institution registration will be performed
via the TypeScript SDK from the backend orchestrator once it lands. Contract
correctness is proven by the unit test suite; the CLI issue is purely a
tooling limitation on the caller side and will be resolved when the backend
is implemented in a subsequent phase.

---

## Companion Contracts

- **Escrow:** `CBE7HHQI3F7NGPKRILKFQNZYDSSZBN27BSJSOE3EVYKLJ6YXXPYZQPGA`

Together, escrow + registry form the on-chain layer of BarakahPay v0.1.

---

## Mainnet

**Status:** Not yet deployed. Planned for Q4 2026 alongside escrow mainnet launch.

---

## Deployment Playbook

```bash
# 1. Build
cd contracts/registry
stellar contract build

# 2. Deploy
stellar contract deploy \
  --wasm ../target/wasm32v1-none/release/barakahpay_registry.wasm \
  --source <deployer> \
  --network <network>

# 3. Initialize
stellar contract invoke \
  --id <returned-id> \
  --source <deployer> \
  --network <network> \
  -- \
  initialize \
  --admin <admin-address>
```

### Post-deployment checklist

- [ ] Update this file with new contract ID and TX hashes
- [ ] Update `.deployed-registry-testnet.txt`
- [ ] Update badges in root `README.md`
- [ ] Update `docs/architecture.md` if interface changed
- [ ] Tag release: `git tag registry-v0.1.0 && git push --tags`

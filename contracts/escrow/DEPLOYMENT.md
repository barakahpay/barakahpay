# Escrow Contract — Deployment Record

**Contract:** `barakahpay-escrow`
**Version:** 0.1.0

---

## Testnet (Live)

| Field | Value |
|-------|-------|
| **Network** | `Test SDF Network ; September 2015` |
| **Contract ID** | `CBE7HHQI3F7NGPKRILKFQNZYDSSZBN27BSJSOE3EVYKLJ6YXXPYZQPGA` |
| **Admin Address** | `GB6Q2YBYROB3F3IGIQZ3XZ4ZR5F2CWNAXCG37QR454Y65FS7KGP4FOZX` |
| **Deployed at** | 2026-07-03 |
| **WASM size** | 7.8 KB |
| **WASM hash** | `37bf93c60e2ed537740b74eed557894b025757d9d7535285715842edf24d0fa7` |
| **Compiler** | Rust 1.96.1 (stable-x86_64-pc-windows-gnu) |
| **Target** | `wasm32v1-none` |
| **SDK** | `soroban-sdk = 22.0.11` |

### Deployment transactions

1. **Upload WASM**
   - TX: `6387205803658314e94714bd03e14a9831c425f0776a34c3b7de7f747414decd`
   - [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/6387205803658314e94714bd03e14a9831c425f0776a34c3b7de7f747414decd)

2. **Deploy instance**
   - TX: `92142e14b963c3ab7a28adb93eeff4439f32b52995c41f4c6b932ae55b7bfb68`
   - [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/92142e14b963c3ab7a28adb93eeff4439f32b52995c41f4c6b932ae55b7bfb68)

3. **Initialize (set admin)**
   - TX: `ba80e1d72fc9afdb369018aa6dce618b84a8cb095907b9af21f750d23308ecb4`
   - Event: `init` = `GB6Q2YBYROB3F3IGIQZ3XZ4ZR5F2CWNAXCG37QR454Y65FS7KGP4FOZX`
   - [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/ba80e1d72fc9afdb369018aa6dce618b84a8cb095907b9af21f750d23308ecb4)

### Explorers

- **Stellar Expert:** https://stellar.expert/explorer/testnet/contract/CBE7HHQI3F7NGPKRILKFQNZYDSSZBN27BSJSOE3EVYKLJ6YXXPYZQPGA
- **Stellar Lab (interactive):** https://lab.stellar.org/r/testnet/contract/CBE7HHQI3F7NGPKRILKFQNZYDSSZBN27BSJSOE3EVYKLJ6YXXPYZQPGA

### Interacting via CLI

```bash
# Read admin
stellar contract invoke \
  --id CBE7HHQI3F7NGPKRILKFQNZYDSSZBN27BSJSOE3EVYKLJ6YXXPYZQPGA \
  --source barakah-testnet \
  --network testnet \
  -- get_admin

# View exported functions
stellar contract inspect \
  --wasm target/wasm32v1-none/release/barakahpay_escrow.wasm
```

---

## Mainnet

**Status:** Not yet deployed. Planned for Q4 2026 following:

1. External security audit (via SCF Audit Bank)
2. Registry contract completion + integration tests
3. Backend + MoneyGram integration ready
4. Sufficient testnet transaction volume as production readiness signal

---

## Deployment Playbook

For future deployments (new versions, redeployment):

### Prerequisites

- Rust with `wasm32v1-none` target installed
- Stellar CLI 27.0+
- Testnet or mainnet account with funds

### Steps

```bash
# 1. Build
cd contracts/escrow
stellar contract build

# 2. Verify wasm
ls -la ../target/wasm32v1-none/release/barakahpay_escrow.wasm

# 3. Deploy
stellar contract deploy \
  --wasm ../target/wasm32v1-none/release/barakahpay_escrow.wasm \
  --source <deployer-key> \
  --network <testnet|mainnet>

# 4. Note the returned contract ID
export ESCROW_ID=<returned-id>

# 5. Initialize
stellar contract invoke \
  --id $ESCROW_ID \
  --source <deployer-key> \
  --network <testnet|mainnet> \
  -- \
  initialize \
  --admin <admin-address>

# 6. Verify admin
stellar contract invoke \
  --id $ESCROW_ID \
  --source <deployer-key> \
  --network <testnet|mainnet> \
  -- get_admin
```

### Post-deployment checklist

- [ ] Update this file with new contract ID and TX hashes
- [ ] Update `contracts/.deployed-escrow-testnet.txt` (or mainnet variant)
- [ ] Update badges in root `README.md`
- [ ] Announce in Discord + Twitter
- [ ] Tag release in Git: `git tag escrow-v0.1.0 && git push --tags`

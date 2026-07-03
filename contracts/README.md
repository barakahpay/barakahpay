# BarakahPay — Smart Contracts

Soroban Rust contracts powering purpose-bound remittances on Stellar.

---

## Contracts

| Contract | Purpose | Testnet |
|----------|---------|---------|
| [`escrow/`](./escrow/) | Purpose-locked fund escrow with claim + release logic | [`CBE7...QPGA`](https://stellar.expert/explorer/testnet/contract/CBE7HHQI3F7NGPKRILKFQNZYDSSZBN27BSJSOE3EVYKLJ6YXXPYZQPGA) |
| [`registry/`](./registry/) | Verified institution registry (schools, hospitals, utilities) | [`CAAH...ASJ`](https://stellar.expert/explorer/testnet/contract/CAAH5I3TKPRGJ74ONQVDG2V7XKA5R5KW352UU4SHTXFYCBOYY34PMASJ) |

---

## Requirements

- Rust `1.75+`
- Cargo
- Soroban CLI (`stellar-cli` `21.0+`)
- A Stellar testnet account

Install Soroban CLI:

```bash
cargo install --locked stellar-cli --features opt
```

Verify installation:

```bash
stellar --version
```

---

## Getting Started

### 1. Set up testnet account

```bash
stellar keys generate --global barakah-testnet --network testnet
stellar keys fund barakah-testnet --network testnet
```

### 2. Build contracts

```bash
# From the contracts/ directory
cargo build --target wasm32-unknown-unknown --release
```

### 3. Run tests

```bash
cargo test
```

### 4. Deploy to testnet

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow.wasm \
  --source barakah-testnet \
  --network testnet
```

Deployment scripts are provided in each contract's `scripts/` directory.

---

## Development Workflow

1. Create feature branch: `git checkout -b feat/contracts-<description>`
2. Write code + tests
3. Run `cargo fmt` and `cargo clippy`
4. Run `cargo test` — must pass
5. Update relevant documentation
6. Open PR against `main`

See [CONTRIBUTING.md](../CONTRIBUTING.md) for full contribution guidelines.

---

## Contract Design Principles

- **No admin fund withdrawal** — funds only leave via `release` or `refund`
- **Overflow-safe arithmetic** — always use checked operations
- **Explicit state transitions** — no implicit state changes
- **Event emission on every state change** — for indexer consumption
- **Test coverage target: 85%+**

---

## Security

- Report vulnerabilities privately per [SECURITY.md](../SECURITY.md)
- External audit planned before mainnet via SCF Audit Bank
- Emergency pause mechanism for critical incidents

---

## Documentation

- [Architecture](../docs/architecture.md) — full system architecture
- [Escrow contract spec](./escrow/README.md) *(coming with skeleton)*
- [Registry contract spec](./registry/README.md) *(coming with skeleton)*

---

## License

MIT — see [LICENSE](../LICENSE)

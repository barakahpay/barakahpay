# Contributing to BarakahPay

Thank you for your interest in BarakahPay. We are building purpose-bound remittance infrastructure on Stellar and Soroban, and welcome contributions from developers, designers, researchers, and community members.

---

## Ways to Contribute

- **Code:** Smart contracts (Rust/Soroban), backend (Node.js), frontend (Next.js)
- **Documentation:** Guides, tutorials, translations
- **Design:** UX/UI improvements, brand assets, accessibility
- **Research:** Market data, corridor-specific insights, competitor analysis
- **Testing:** Bug reports, edge-case reproduction, security review
- **Community:** Answering questions, spreading the word, connecting with institutions

---

## Ground Rules

- Be respectful and constructive
- Assume good intent
- No hate speech, harassment, or discrimination
- No spam, self-promotion, or off-topic posts
- Follow our [Code of Conduct](./CODE_OF_CONDUCT.md)

---

## Reporting Issues

### Bugs

Please open a [bug report](https://github.com/barakahpay/barakahpay/issues/new?template=bug_report.md) with:

- Clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, browser, wallet, testnet/mainnet)
- Screenshots or logs if applicable

### Feature requests

Please open a [feature request](https://github.com/barakahpay/barakahpay/issues/new?template=feature_request.md) with:

- The problem you are trying to solve
- Your proposed solution
- Alternatives you considered
- Who benefits from this feature

### Security vulnerabilities

**Do not open a public issue for security bugs.** Please read [SECURITY.md](./SECURITY.md) and email us directly.

---

## Development Setup

> Setup is being finalized as the project scaffolds. This section will be updated when contract and web skeletons land.

### Prerequisites

- Rust `1.75+` and Cargo
- Soroban CLI (`stellar-cli` `21.0+`)
- Node.js `20+` and pnpm `8+`
- Git

### Local development

```bash
# Clone
git clone git@github.com:barakahpay/barakahpay.git
cd barakahpay

# Contracts
cd contracts && cargo build

# Frontend
cd ../web && pnpm install && pnpm dev

# Backend
cd ../backend && pnpm install && pnpm dev
```

Full development guide: see individual `README.md` files in each subdirectory.

---

## Pull Request Process

1. **Fork the repository** and create a feature branch from `main`
2. **Follow the branch naming convention:**
   - `feat/<short-description>` for new features
   - `fix/<short-description>` for bug fixes
   - `docs/<short-description>` for documentation
   - `chore/<short-description>` for maintenance
3. **Make focused commits** — one logical change per commit
4. **Follow the commit convention** (see below)
5. **Update tests** if you change behavior
6. **Update docs** if you change interfaces
7. **Open a PR** against `main` with a clear description
8. **Respond to review feedback** promptly

PRs are merged via squash-merge to keep history clean.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `chore` — build, deps, tooling
- `refactor` — code change, no behavior change
- `test` — test-only changes
- `perf` — performance improvement
- `style` — formatting, whitespace

**Scopes:**
- `contracts` — Soroban contracts
- `web` — frontend
- `backend` — API
- `docs` — documentation
- `ci` — GitHub Actions
- `deps` — dependencies

**Examples:**

```
feat(contracts): add purpose enum to escrow contract
fix(web): resolve wallet connection timeout on Freighter
docs(architecture): document fiat off-ramp flow
chore(deps): upgrade soroban-sdk to 22.0
```

---

## Code Style

### Rust (contracts)

- Follow `rustfmt` defaults
- Run `cargo clippy` before opening a PR
- Public functions must have doc comments
- Use `#[cfg(test)]` for tests

### TypeScript (web + backend)

- Follow the project's ESLint + Prettier config
- Prefer functional patterns
- Explicit types over `any`
- Use `pnpm typecheck` before opening a PR

---

## Testing Expectations

- **Contracts:** 85%+ coverage target
- **Backend:** Integration tests for all endpoints
- **Frontend:** Component tests for user-facing flows, E2E tests for critical paths (deposit, claim, release)

Run tests locally:

```bash
# Contracts
cd contracts && cargo test

# Frontend
cd web && pnpm test

# Backend
cd backend && pnpm test
```

---

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Recognition

All contributors are listed in the [Contributors](https://github.com/barakahpay/barakahpay/graphs/contributors) page. Significant contributors may be invited to the Contributor circle for early feature previews and roadmap input.

---

## Questions

- Open a [GitHub Discussion](https://github.com/barakahpay/barakahpay/discussions)
- Email us: hello@barakahpay.io
- Twitter/X: [@barakahpay](https://x.com/barakahpay)

Thank you for helping build financial infrastructure for underserved corridors.

# Security Policy

BarakahPay handles remittance flows for real families. Security is a first-class concern from day one.

---

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security bugs.**

If you believe you have found a vulnerability in BarakahPay smart contracts, backend, frontend, or infrastructure, please report it privately by emailing:

**security@barakahpay.io** *(coming soon — until then, use hello@barakahpay.io with subject line "SECURITY")*

### What to include

- A clear description of the vulnerability
- Steps to reproduce
- Impact assessment (what an attacker could achieve)
- Suggested fix, if known
- Whether you would like to be credited publicly

### Response time

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 7 days
- **Fix + disclosure timeline:** communicated after triage

We appreciate responsible disclosure and will publicly credit reporters who wish to be named.

---

## Scope

The following are in scope for security reports:

### Smart contracts (Soroban)
- `contracts/escrow/` — funds handling, purpose lock, release logic
- `contracts/registry/` — verified institution registry, KYB status

### Backend
- API authentication and authorization
- Session management
- Fiat integration orchestration
- Data validation and sanitization

### Frontend
- Wallet integration security
- XSS, CSRF, and injection vulnerabilities
- Sensitive data exposure

### Infrastructure
- CI/CD pipeline
- Secret management
- Environment configuration

---

## Out of Scope

The following are generally not in scope:

- Vulnerabilities in third-party dependencies (please report upstream)
- Social engineering of team members
- Physical security
- DoS/DDoS attacks
- Vulnerabilities requiring physical device access
- Reports based on outdated software versions

---

## Bug Bounty

A formal bug bounty program is planned for post-mainnet launch (Q4 2026). Until then, we will credit reporters publicly and offer non-monetary recognition (Contributor status, project credits, ecosystem introductions).

---

## Security Practices

We commit to:

- **Open source contracts** — every smart contract is public and auditable
- **External audit before mainnet** — leveraging SCF Audit Bank
- **Gradual mainnet rollout** — transaction caps during initial launch
- **Emergency pause mechanism** — admin-only, documented and time-limited
- **Regular dependency updates** — Dependabot enabled
- **Signed commits** — GPG-verified commits from all contributors (when applicable)
- **Multi-review policy** — critical changes require multiple approvals

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` (unreleased) | ✅ |
| Future stable releases | ✅ (per release notes) |

We will provide security fixes for the latest stable release. Older versions are not supported unless explicitly noted.

---

## Public Vulnerability Disclosure

Once a fix is deployed and users have had a reasonable window to update, we will publicly disclose the vulnerability in:

- A GitHub Security Advisory
- The `CHANGELOG.md` of the affected release
- A post-mortem in `docs/incidents/` when appropriate

Transparency after fixing is essential to ecosystem trust.

---

Thank you for helping keep BarakahPay safe for the families we serve.

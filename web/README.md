# BarakahPay — Web Frontend

Next.js applications for BarakahPay: sender portal, institution portal, and marketing site.

---

## Applications

The `web/` directory hosts three surfaces:

| App | Purpose | Users |
|-----|---------|-------|
| **Sender Portal** | Deposit flow, transaction history, receipts | Diaspora senders (UK, US, Gulf) |
| **Institution Portal** | KYB onboarding, claim submission, settlement history | Schools, hospitals, utilities |
| **Marketing Site** | Landing page, waitlist, blog, docs | Public visitors, waitlist prospects |

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS + shadcn/ui
- **Wallet:** Stellar Wallets Kit (Freighter as primary)
- **State:** Zustand for local, React Query for server
- **i18n:** i18next (English + Urdu at launch)
- **Testing:** Vitest + React Testing Library + Playwright (E2E)
- **Analytics:** Plausible (privacy-first) or PostHog
- **Deployment:** Vercel

---

## Requirements

- Node.js `20+`
- pnpm `8+`

---

## Getting Started

```bash
# From the web/ directory
pnpm install
pnpm dev
```

Open http://localhost:3000

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ESCROW_CONTRACT_ID=...
NEXT_PUBLIC_REGISTRY_CONTRACT_ID=...
```

Full env docs: `web/docs/environment.md` *(coming with skeleton)*

---

## Scripts

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm start      # Serve production build
pnpm lint       # Lint code
pnpm typecheck  # TypeScript check
pnpm test       # Unit tests
pnpm test:e2e   # Playwright E2E tests
```

---

## Directory Structure

```
web/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public marketing site
│   ├── (sender)/           # Sender portal (authenticated)
│   ├── (institution)/      # Institution portal (authenticated)
│   └── api/                # API routes (BFF pattern)
├── components/
│   ├── ui/                 # shadcn primitives
│   └── features/           # Feature components
├── lib/
│   ├── stellar/            # Stellar SDK helpers
│   ├── wallets/            # Wallet integration
│   └── api/                # API client
├── locales/                # i18n translations
│   ├── en/
│   └── ur/
├── public/                 # Static assets
└── tests/                  # Test files
```

---

## Design System

BarakahPay uses shadcn/ui as its component foundation, with a custom theme reflecting trust, warmth, and clarity. Full design tokens are documented in `web/design-system.md` *(coming with skeleton)*.

---

## Accessibility

Target: WCAG 2.1 AA compliance
- Semantic HTML throughout
- Keyboard navigation for all interactive elements
- Screen reader tested (NVDA + VoiceOver)
- Color contrast minimum 4.5:1 for text

---

## Internationalization

Launch languages:
- English (default)
- Urdu (RTL support, primary sender+recipient language)

Planned:
- Bengali (Bangladesh corridor)
- Tagalog (Philippines corridor)
- Arabic (Gulf sender base)

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) in the repo root.

---

## License

MIT — see [LICENSE](../LICENSE)

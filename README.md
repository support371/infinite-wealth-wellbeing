# Infinite Wealth & Well-being

Standalone, tenant-isolated SaaS for integrated wealth planning, wellbeing support, collaboration and organization operations.

## What is included

- Public IWW website plus a protected `/app` workspace
- Dedicated Supabase Auth, profiles, organizations and seven IWW roles
- Versioned Supabase schema with RLS, member/care-team/delegate scope and append-only audit history
- Functional wealth, wellbeing, Crypto Services, programme, appointment, task, messaging, document, resource, community, reporting, billing and governance modules
- KYC-gated Crypto Services intake, owner/operations review and separately authenticated Crypto Signal Service launch
- Server-authoritative Express/Vercel API boundary
- Responsive desktop/mobile shell, command search and deliberate empty/error/denied states

## Important security note

No secrets, API keys, tokens or private credentials are committed. Configure secrets only through protected hosting environment variables.

## Local validation

```bash
npm ci
npm run check
npm run security:secrets
```

Copy `.env.example` to `.env.local` and configure only the dedicated IWW project. Browser code accepts `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; privileged server operations use `SUPABASE_SECRET_KEY` without the `VITE_` prefix.

Apply the versioned migrations in `supabase/migrations/` in filename order and only to Supabase project `fepfnzrpftxpxlgyujev`.

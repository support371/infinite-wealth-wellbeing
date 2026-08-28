# Infinite World of Well-Being — Production Build Handoff

## Mission
Build **Infinite World of Well-Being (IWW)** as a complete, standalone SaaS platform that follows the operational quality and dashboard conventions of the GEM Command Center while remaining fully isolated from GEM data, users, authentication sessions, and deployment configuration.

## Non-negotiable boundaries
- Repository: `support371/infinite-wealth-wellbeing`
- Dedicated Supabase project: `fepfnzrpftxpxlgyujev` (`infinite-world-of-wellbeing`, US East 1)
- Dedicated Vercel project/deployment; do not deploy to `support371-gem-enterprise`.
- Use IWW-specific Supabase Auth, database schema, RLS policies, storage, API keys, and environment variables.
- Do not copy GEM customer data, user records, memberships, secrets, or database tables.
- Never commit service-role keys, access tokens, passwords, or production secrets.
- Browser code may use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Privileged server operations must use server-side secrets only.

## Current repository baseline
- Vite/JavaScript frontend.
- Existing UI is largely concentrated in `src/App.jsx` with `src/styles.css`.
- Existing backend foundation is in `services/api/src/` (`auth.js`, `rbac.js`, `audit.js`, `controllers.js`, `repositories.js`, `validation.js`, `workflows.js`).
- Existing Prisma model is in `prisma/schema.prisma`. Review and migrate deliberately; do not create competing data sources.

## Phase 1 — Discovery and stabilization
- [ ] Review `README.md`, `package.json`, `vercel.json`, `.env.example`, `prisma/schema.prisma`, and all files under `services/api/src`.
- [ ] Run the existing install, lint, test, and build commands; document failures and repair baseline issues before feature work.
- [ ] Inventory current routes/screens and distinguish functional code from mocked/static UI.
- [ ] Split the oversized `src/App.jsx` only where it improves maintainability; preserve working UI behavior while extracting features, layouts, hooks, and shared components.

## Phase 2 — Separate auth and authorization
- [ ] Configure IWW-only Supabase client variables in `.env.example`; do not include real secrets.
- [ ] Implement Supabase Auth sign-in, sign-out, password reset, session restoration, and protected-route handling.
- [ ] Implement profile onboarding and organization/member association after first sign-in.
- [ ] Define and enforce roles: `owner`, `admin`, `operations_manager`, `advisor`, `practitioner`, `member`, `family_delegate`.
- [ ] Enforce authorization twice: server/API-side for every protected mutation/query, and UI-side for navigation/action visibility.
- [ ] Ensure GEM administrators, staff, and client sessions cannot authenticate into or query IWW by implication.

## Phase 3 — Database and RLS
- [ ] Create versioned Supabase migrations in the repository before applying production DDL.
- [ ] Create core tables: profiles, organizations, memberships, invitations, user_preferences, activity_events, audit_events, consents, policy_acknowledgements, notifications.
- [ ] Create wellbeing tables: wellbeing_plans, wellbeing_checkins, goals, habits, habit_logs, programmes, programme_enrolments, coaching_sessions, appointments, assessments.
- [ ] Create wealth tables: wealth_plans, wealth_goals, assets, liabilities, cashflow_targets, financial_documents, adviser_tasks, wealth_reviews.
- [ ] Create collaboration tables: documents, document_access, conversations, messages, tasks, task_assignments, resources, community_posts, comments.
- [ ] Create commercial and operations tables: subscriptions, billing_records, reports, report_runs, integration_connections, workflow_approvals.
- [ ] Add `organization_id`, creator/audit fields, foreign keys, check constraints, unique constraints, indexes, and timestamp triggers where appropriate.
- [ ] Enable RLS on every exposed application table.
- [ ] Add restrictive membership-based policies: users can access only data belonging to their active IWW organization and allowed role.
- [ ] Maintain append-only audit events; client/member roles must never be able to alter historical audit data.
- [ ] Use a server-side service role only in trusted API functions—not in Vite/browser code.
- [ ] Run Supabase security advisor after each schema iteration and resolve all critical notices.

## Phase 4 — IWW SaaS application
- [ ] Build a responsive application shell inspired by GEM operational UX but branded for IWW.
- [ ] Provide accessible desktop sidebar, mobile navigation, header, global search/command entry, notifications, account menu, and workspace context.
- [ ] Implement role-specific dashboards: Owner, Admin/Operations, Advisor/Practitioner, Member, Family Delegate.
- [ ] Implement real loading, empty, validation, error, permission-denied, and offline-retry states for every data screen.
- [ ] Build Member Directory and member profile views with explicit consent and role-safe private data sections.
- [ ] Build Programmes/Cohorts, enrolments, milestones, learning/resources, and progress tracking.
- [ ] Build Wellbeing: plans, goals, habits, check-ins, assessments, coaching notes, and session scheduling.
- [ ] Build Wealth: planning goals, assets/liabilities, cash-flow targets, reviews, documents, adviser tasks, and educational resources. Do not present regulated advice, execute trades, or initiate money movement.
- [ ] Build Calendar/Appointments with availability, booking status, reminders, and optional GCal integration behind explicit user consent.
- [ ] Build secure Documents and sharing permissions.
- [ ] Build Messages/Conversations with participant authorization.
- [ ] Build Tasks, approvals, operational reporting, and governance/audit views.
- [ ] Build Billing/Subscriptions as secure Stripe-backed references; do not expose Stripe secrets client-side.
- [ ] Build notifications and user-controlled communication preferences.
- [ ] Add an IWW assistant only for navigation, reflection, resource discovery, summaries, and drafting. It must not make medical diagnoses, crisis determinations, regulated investment decisions, or autonomous financial transactions.

## Phase 5 — Integrations and privacy
- [ ] Make integration connections opt-in and revocable.
- [ ] Keep HubSpot, Stripe, calendar, email, and future connectors behind server-side endpoints and tenant/role authorization.
- [ ] Add consent capture, policy acknowledgement, privacy notice links, access/audit views, and retention/deletion workflow placeholders.
- [ ] Do not claim HIPAA, financial-regulatory, or other compliance certification without an external legal/compliance review.

## Phase 6 — Design and quality
- [ ] Reuse GEM-level information hierarchy and interaction quality, but create distinct IWW copy, palette, identity, and content.
- [ ] Keep UI accessible: semantic landmarks, keyboard support, visible focus, labels, useful errors, WCAG AA contrast, responsive 375px+ layouts.
- [ ] Provide light and dark modes if the existing IWW design system supports them; avoid regressions.
- [ ] Add unit/integration tests for RBAC, protected routes, tenant isolation, sensitive-record access, major workflows, and API validation.
- [ ] Run lint, tests, type/build checks, and production build before every deploy.
- [ ] Scan any proposed commit for secrets before push.

## Phase 7 — Deployment
- [ ] Keep `support371/infinite-wealth-wellbeing` as the sole source repository.
- [ ] Link/reuse the separate Vercel project for this repository only.
- [ ] Configure Production/Preview/Development environment variables separately.
- [ ] Configure IWW Auth redirect URLs only after the final deployment URL is known.
- [ ] Deploy a preview first, inspect build and runtime logs, then promote/deploy production only after passing checks.
- [ ] Verify auth, role-routing, RLS-protected queries, dashboard data, mobile UI, error states, and a production smoke test.

## Acceptance checklist
- [ ] IWW deploys independently from GEM.
- [ ] IWW has separate users/auth/data/secrets/database.
- [ ] Every production screen is driven by real IWW persistence or has a deliberate, useful empty state—not hardcoded demo arrays.
- [ ] Roles and RLS reliably prevent cross-organization and cross-role data access.
- [ ] All sensitive secrets are server-side and absent from source control.
- [ ] Build, tests, and deployment are green.
- [ ] Deployment URL, environment-variable names (not values), database migration IDs, and unresolved caveats are documented in the final handoff.

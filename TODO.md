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
- [x] Review `README.md`, `package.json`, `vercel.json`, `.env.example`, `prisma/schema.prisma`, and all files under `services/api/src`.
- [x] Run the existing install, lint, test, and build commands; document failures and repair baseline issues before feature work.
- [x] Inventory current routes/screens and distinguish functional code from mocked/static UI.
- [x] Split the oversized `src/App.jsx` only where it improves maintainability; preserve working UI behavior while extracting features, layouts, hooks, and shared components.

## Phase 2 — Separate auth and authorization
- [x] Configure IWW-only Supabase client variables in `.env.example`; do not include real secrets.
- [x] Implement Supabase Auth sign-in, sign-out, password reset, session restoration, and protected-route handling.
- [x] Implement profile onboarding and organization/member association after first sign-in.
- [x] Define and enforce roles: `owner`, `admin`, `operations_manager`, `advisor`, `practitioner`, `member`, `family_delegate`.
- [x] Enforce authorization twice: server/API-side for every protected mutation/query, and UI-side for navigation/action visibility.
- [x] Ensure GEM administrators, staff, and client sessions cannot authenticate into or query IWW by implication.

## Phase 3 — Database and RLS
- [x] Create versioned Supabase migrations in the repository before applying production DDL.
- [x] Create core tables: profiles, organizations, memberships, invitations, user_preferences, activity_events, audit_events, consents, policy_acknowledgements, notifications.
- [x] Create wellbeing tables: wellbeing_plans, wellbeing_checkins, goals, habits, habit_logs, programmes, programme_enrolments, coaching_sessions, appointments, assessments.
- [x] Create wealth tables: wealth_plans, wealth_goals, assets, liabilities, cashflow_targets, financial_documents, adviser_tasks, wealth_reviews.
- [x] Create collaboration tables: documents, document_access, conversations, messages, tasks, task_assignments, resources, community_posts, comments.
- [x] Create commercial and operations tables: subscriptions, billing_records, reports, report_runs, integration_connections, workflow_approvals.
- [x] Add `organization_id`, creator/audit fields, foreign keys, check constraints, unique constraints, indexes, and timestamp triggers where appropriate.
- [x] Enable RLS on every exposed application table.
- [x] Add restrictive membership-based policies: users can access only data belonging to their active IWW organization and allowed role.
- [x] Maintain append-only audit events; client/member roles must never be able to alter historical audit data.
- [x] Use a server-side service role only in trusted API functions—not in Vite/browser code.
- [x] Run Supabase security advisor after each schema iteration and resolve all critical notices.

## Phase 4 — IWW SaaS application
- [x] Build a responsive application shell inspired by GEM operational UX but branded for IWW.
- [x] Provide accessible desktop sidebar, mobile navigation, header, global search/command entry, notifications, account menu, and workspace context.
- [x] Implement role-specific dashboards: Owner, Admin/Operations, Advisor/Practitioner, Member, Family Delegate.
- [x] Implement real loading, empty, validation, error, permission-denied, and offline-retry states for every data screen.
- [x] Build Member Directory and member profile views with explicit consent and role-safe private data sections.
- [x] Build Programmes/Cohorts, enrolments, milestones, learning/resources, and progress tracking.
- [x] Build Wellbeing: plans, goals, habits, check-ins, assessments, coaching notes, and session scheduling.
- [x] Build Wealth: planning goals, assets/liabilities, cash-flow targets, reviews, documents, adviser tasks, and educational resources. Do not present regulated advice, execute trades, or initiate money movement.
- [ ] Build Calendar/Appointments with availability, booking status, reminders, and optional GCal integration behind explicit user consent.
- [x] Add organization-validated appointment participants, role-safe status transitions, audit capture, calendar connection visibility, and appointment request management. Availability rules, reminder delivery and external calendar event synchronization remain deferred.
- [x] Build secure Documents and sharing permissions.
- [x] Build Messages/Conversations with participant authorization.
- [x] Build Tasks, approvals, operational reporting, and governance/audit views.
- [x] Build Billing/Subscriptions as secure Stripe-backed references; do not expose Stripe secrets client-side.
- [x] Build notifications and user-controlled communication preferences.
- [x] Add an IWW assistant only for navigation, reflection, resource discovery, summaries, and drafting. It must not make medical diagnoses, crisis determinations, regulated investment decisions, or autonomous financial transactions.
- [x] Present IWW as a managed product workspace reached from GEM Workspace OS while retaining its separate repository, authentication, tenant data, and deployment.
- [x] Capture existing-project, new-project, or organization-management intake atomically when an owner creates an IWW organization.
- [x] Add email-bound organization invitations that authenticated recipients can discover and accept during onboarding.

## Phase 5 — Integrations and privacy
- [x] Make integration connections opt-in and revocable.
- [x] Keep the 300+ application directory in the central GEM Workspace OS and show only organization-authorized connected services inside IWW.
- [ ] Keep HubSpot, Stripe, calendar, email, and future connectors behind server-side endpoints and tenant/role authorization.
- [x] Add consent capture, policy acknowledgement, privacy notice links, access/audit views, and retention/deletion workflow placeholders.
- [x] Do not claim HIPAA, financial-regulatory, or other compliance certification without an external legal/compliance review.

## Phase 6 — Design and quality
- [x] Reuse GEM-level information hierarchy and interaction quality, but create distinct IWW copy, palette, identity, and content.
- [x] Keep UI accessible: semantic landmarks, keyboard support, visible focus, labels, useful errors, WCAG AA contrast, responsive 375px+ layouts.
- [ ] Provide light and dark modes if the existing IWW design system supports them; avoid regressions.
- [x] Add unit/integration tests for RBAC, protected routes, tenant isolation, sensitive-record access, major workflows, and API validation.
- [x] Run lint, tests, type/build checks, and production build before every deploy.
- [x] Scan any proposed commit for secrets before push.

## Phase 7 — Deployment
- [x] Keep `support371/infinite-wealth-wellbeing` as the sole source repository.
- [x] Link/reuse the separate Vercel project for this repository only.
- [x] Configure Production/Preview/Development environment variables separately.
- [ ] Configure IWW Auth redirect URLs only after the final deployment URL is known.
- [x] Deploy a preview first, inspect build and runtime logs, then promote/deploy production only after passing checks.
- [ ] Verify auth, role-routing, RLS-protected queries, dashboard data, mobile UI, error states, and a production smoke test. Public routes and `/api/health` pass; authenticated end-to-end smoke still requires a real IWW user.
- [x] Apply `20260828220039_managed_organization_intake` and `20260828220219_index_managed_intake_submitter` to the dedicated IWW Supabase project; verify forced RLS, policies, invoker/definer separation, and covered foreign keys.
- [x] Apply `20260829135714_workspace_participant_directory`; verify authenticated invoker boundaries, internal definer authorization, appointment integrity triggers and audit capture.

## Acceptance checklist
- [x] IWW deploys independently from GEM.
- [x] IWW has separate users/auth/data/secrets/database.
- [x] Every production screen is driven by real IWW persistence or has a deliberate, useful empty state—not hardcoded demo arrays.
- [x] Roles and RLS reliably prevent cross-organization and cross-role data access.
- [x] All sensitive secrets are server-side and absent from source control.
- [x] Build, tests, and deployment are green.
- [x] Deployment URL, environment-variable names (not values), database migration IDs, and unresolved caveats are documented in the final handoff.

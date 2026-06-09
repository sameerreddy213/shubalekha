# Shubalekha

> Create Beautiful Invitations That Guests Never Forget.

A premium, mobile-first digital invitation platform for the Indian market. Browse
admin-authored templates, customise editable fields, and publish a live invitation
website on your own subdomain — collect RSVPs and track analytics. Free.

Built with **Next.js 15 (App Router) · TypeScript · MongoDB/Mongoose · Auth.js (NextAuth v5)
· TailwindCSS + shadcn · Framer Motion · Upstash Redis · Resend**.

## Status

Built phase-by-phase (see [`docs/`](docs/)). **Phases 1–7 complete:**

1. ✅ PRD · 2. ✅ System Architecture · 3. ✅ Database Design · 4. ✅ Folder Structure
· 5. ✅ API Contracts · 6. ✅ UI/UX Design System · 7. ✅ **Authentication (this scaffold)**

Next: 8. Core Features · 9. Templates · 10. Admin · 11. Analytics · 12. Deployment.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your keys (see below)
npm run dev                  # http://localhost:3000
```

The app **boots without any keys** — the marketing site renders and the login page
shows a "not configured" notice. Add credentials to unlock auth/db features.

### Environment

All variables are documented in [`.env.example`](.env.example) and validated at boot
by [`src/lib/env.ts`](src/lib/env.ts). Service credentials are optional so the app runs
before they're added; code that needs a key fails with a clear message at the point of use.

Required to enable sign-in:

- **MongoDB Atlas** — `MONGODB_URI` (Mongoose + the Auth.js adapter share this connection)
- **Auth** — `AUTH_SECRET` (`npx auth secret`), plus either **Google** (`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`)
  or **Resend** (`RESEND_API_KEY`) for magic-link email.

### Local subdomains

Published invitations resolve at `slug.localhost:3000` (works in Chrome/Firefox). The
apex (`localhost:3000`) serves the marketing site, dashboard, and admin.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm run create-admin -- you@example.com` | Promote a signed-in user to admin |
| `npm run ensure-indexes` | Build/verify MongoDB indexes |
| `npm run seed-templates` | Seed launch templates (Phase 9) |

## Project structure

```
src/
  app/          Next.js routes — (marketing) (auth) (app) (admin) (public)/sites/[slug]
  features/     Feature modules (auth, invites, templates, rsvp, analytics, …)
  components/   ui (shadcn) · motion · shared · providers
  lib/          env · db · redis · auth · email · security · utils
  models/       Mongoose schemas
  config/       site, reserved-slugs, categories
  middleware.ts Host/subdomain routing + security headers
docs/           Phase documents (PRD → Deployment)
```

See [`docs/04-Folder-Structure.md`](docs/04-Folder-Structure.md) for the full map.

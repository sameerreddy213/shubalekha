# Shubalekha — Folder Structure

**Version:** 1.0
**Status:** Phase 4 — awaiting approval
**Last updated:** 2026-06-09
**Depends on:** [02-System-Architecture.md](02-System-Architecture.md), [03-Database-Design.md](03-Database-Design.md)

---

## 1. Principles

- **Feature-based, not type-based.** Code for a capability (templates, rsvp, analytics) lives
  together under `src/features/<feature>/` (server actions, services, schemas, components, hooks).
- **Route groups by surface** mirror Phase 2: `(marketing) (app) (admin) (public)` — one Next.js
  app, four surfaces split by host in middleware.
- **`lib/` = cross-cutting infrastructure** (db, redis, auth, storage, og, ratelimit, env) — no
  business logic, no React.
- **`components/ui` = design-system primitives** (shadcn) shared everywhere; feature components
  stay in their feature.
- **Server-first.** Default to Server Components; client islands marked `"use client"` and colocated.
- **Host-agnostic glue isolated** under `lib/storage`, `lib/og`, `lib/cron` so Phase 12 swaps are local.

---

## 2. Top-level layout

```
shubalekha/
├─ docs/                      # phase docs (this folder)
├─ public/                    # static assets, favicons, manifest.webmanifest, fonts fallback
├─ scripts/                   # seed templates, create-admin, backfill, db indexes
├─ src/
│  ├─ app/                    # Next.js App Router (routing only; thin)
│  ├─ features/               # feature modules (business logic + feature UI)
│  ├─ components/             # shared UI: design system + shared composite components
│  ├─ lib/                    # infrastructure (db, redis, auth, storage, og, env, utils)
│  ├─ models/                 # Mongoose schemas/models (Phase 3)
│  ├─ config/                 # constants: reserved slugs, categories, nav, site metadata
│  ├─ hooks/                  # shared React hooks
│  ├─ stores/                 # Zustand stores (editor, ui)
│  ├─ styles/                 # globals.css, tailwind layers, theme tokens
│  ├─ emails/                 # React Email templates (Resend)
│  ├─ types/                  # shared TS types
│  └─ middleware.ts           # host/subdomain routing, auth gate, security headers
├─ .env.example
├─ next.config.ts
├─ tailwind.config.ts
├─ tsconfig.json  (paths: "@/*" → "src/*")
├─ components.json            # shadcn config
├─ package.json
└─ README.md
```

---

## 3. `src/app/` — routing (thin; delegates to features)

```
src/app/
├─ layout.tsx                       # root: fonts (next/font), <html>, providers, Sentry
├─ globals.css
├─ not-found.tsx                    # generic 404
├─ error.tsx                        # root error boundary
│
├─ (marketing)/                     # host: shubalekha.com
│  ├─ layout.tsx                    # marketing shell (header/footer)
│  ├─ page.tsx                      # landing (hero → features → comparison → FAQ → CTA)
│  ├─ templates/
│  │  ├─ page.tsx                   # gallery (filter by category)
│  │  └─ [slug]/page.tsx            # template detail + live preview + "Use this template"
│  ├─ about/page.tsx
│  ├─ contact/page.tsx
│  ├─ privacy/page.tsx
│  ├─ terms/page.tsx
│  ├─ refund/page.tsx
│  └─ sitemap.ts  robots.ts         # SEO
│
├─ (auth)/                          # login flows (host: app.shubalekha.com)
│  ├─ login/page.tsx                # Google + magic-link
│  └─ verify/page.tsx               # magic-link sent / verify state
│
├─ (app)/                           # host: app.shubalekha.com — requires session
│  ├─ layout.tsx                    # dashboard shell (sidebar/nav, auth guard)
│  ├─ dashboard/
│  │  ├─ page.tsx                   # invites overview (draft/published/expired tabs)
│  │  └─ profile/page.tsx           # profile settings
│  ├─ invites/
│  │  ├─ new/page.tsx               # pick template → create draft
│  │  └─ [inviteId]/
│  │     ├─ edit/page.tsx           # schema-driven editor + live preview
│  │     ├─ rsvps/page.tsx          # RSVP management + export
│  │     ├─ guests/page.tsx         # GuestLink generation/management
│  │     ├─ guestbook/page.tsx      # moderate wishes
│  │     ├─ analytics/page.tsx      # charts
│  │     └─ share/page.tsx          # QR, share links, downloads
│  └─ settings/page.tsx
│
├─ (admin)/                         # host: app.shubalekha.com/admin — role:admin
│  └─ admin/
│     ├─ layout.tsx                 # admin shell (role guard)
│     ├─ page.tsx                   # platform KPIs
│     ├─ users/page.tsx
│     ├─ invites/page.tsx
│     ├─ templates/
│     │  ├─ page.tsx                # list
│     │  ├─ new/page.tsx            # template builder (sections + fields + theme + variants)
│     │  └─ [id]/edit/page.tsx
│     ├─ analytics/page.tsx
│     └─ settings/page.tsx          # platform settings / kill-switches
│
├─ (public)/                        # host: *.shubalekha.com (rewritten by middleware)
│  └─ _sites/
│     └─ [slug]/
│        ├─ page.tsx                # the invitation (RSC, ISR) — composes sections
│        ├─ opengraph-image.tsx     # dynamic OG (or via /api/og)
│        ├─ layout.tsx              # per-invite theme injection, fonts, music shell
│        └─ rsvp/[token]/page.tsx   # edit-existing-RSVP via signed token
│
└─ api/                             # Route Handlers (REST-ish; Zod-validated) — Phase 5
   ├─ auth/[...nextauth]/route.ts
   ├─ invites/route.ts              # POST create, GET list
   ├─ invites/[id]/route.ts         # GET/PATCH/DELETE
   ├─ invites/[id]/publish/route.ts
   ├─ invites/[id]/duplicate/route.ts
   ├─ slugs/check/route.ts          # real-time availability
   ├─ rsvps/route.ts                # POST submit (public, rate-limited)
   ├─ rsvps/[token]/route.ts        # GET/PATCH edit via token
   ├─ guestlinks/route.ts           # generate/list
   ├─ guestbook/route.ts            # POST submit / GET list
   ├─ analytics/collect/route.ts    # view beacon (edge)
   ├─ uploads/sign/route.ts         # presigned upload URL
   ├─ og/route.ts                   # dynamic OG image
   ├─ exports/[id]/route.ts         # PDF / image export
   ├─ admin/.../route.ts            # admin endpoints (role-gated)
   └─ cron/lifecycle/route.ts       # secret-protected scheduled job
```

> Route-group folders `( )` don't affect URLs — they let one app serve all surfaces while
> middleware routes by host. `_sites/[slug]` is an internal rewrite target, never user-visible.

---

## 4. `src/features/` — feature modules

Each feature is self-contained: server actions, service (DB access), Zod schemas, and its own
components/hooks. Pages in `app/` stay thin and import from here.

```
src/features/
├─ templates/
│  ├─ components/        # TemplateCard, TemplateGallery, CategoryFilter, TemplatePreview
│  ├─ schema-engine/     # SectionRenderer, FieldRenderer, section components per SectionType
│  │  ├─ sections/       # Hero, Blessings, EventDetails, Timeline, Countdown, Gallery,
│  │  │                  #   OurStory, Wishes, VenueMap, ThingsToKnow, ContactCards,
│  │  │                  #   Rsvp, Music, LiveStream, Gift, Closing, ...
│  │  ├─ SectionRenderer.tsx
│  │  └─ field-types.ts
│  ├─ services/          # template.service.ts (CRUD, gallery queries)
│  ├─ schemas/           # template Zod + section/field defs
│  └─ index.ts
│
├─ invites/
│  ├─ components/        # InviteListItem, StatusBadge, LifecycleBanner, ExpiredState
│  ├─ editor/            # the dashboard editor (client): EditorForm, FieldInputs, LivePreview,
│  │                     #   SlugPicker (real-time check), ThemeCustomizer, MusicUpload, Publish
│  ├─ renderer/          # InvitePage composition (server) from content + template schema
│  ├─ services/          # invite.service.ts (create/publish/lifecycle/duplicate)
│  ├─ actions.ts         # server actions for editor mutations
│  ├─ schemas/           # invite content/publish Zod (derived from template schema)
│  └─ lifecycle.ts       # compute-on-read state helpers
│
├─ rsvp/
│  ├─ components/        # RsvpForm, RsvpList, RsvpExportButton, PerEventRsvp
│  ├─ services/          # rsvp.service.ts (dedupe, counters, edit-token)
│  └─ schemas/
│
├─ guests/               # GuestLink generation, bulk links, per-guest tracking
│  ├─ components/        # GuestLinkTable, BulkGenerate, ShareSheet
│  └─ services/
│
├─ guestbook/
│  ├─ components/        # GuestbookWall, WishForm, ModerationList
│  └─ services/
│
├─ analytics/
│  ├─ components/        # charts: ViewsChart, SourceBreakdown, DeviceChart, RsvpFunnel, GeoMap
│  ├─ services/          # aggregate read + rollup write
│  └─ collect.ts         # beacon + Redis buffer logic
│
├─ sharing/              # QR, calendar (ics/google/outlook), social share, downloads/export
│  ├─ components/
│  └─ services/          # qr.ts, calendar.ts, og helpers, pdf/image export
│
├─ auth/                 # session helpers, guards (requireUser/requireOwner/requireRole)
│  ├─ guards.ts
│  └─ components/        # LoginForm, UserMenu
│
├─ dashboard/            # overview widgets, profile settings UI
├─ admin/                # admin tables, template builder, KPI widgets, user/invite management
└─ marketing/            # landing sections: Hero, Features, Comparison, Testimonials, FAQ, CTA
```

---

## 5. `src/lib/` — infrastructure

```
src/lib/
├─ env.ts                # Zod-validated environment (fails fast at boot)
├─ db/
│  ├─ connect.ts         # cached Mongoose connection (serverless-safe singleton)
│  └─ index.ts
├─ redis/
│  ├─ client.ts          # Upstash REST client
│  └─ ratelimit.ts       # @upstash/ratelimit configs per route class
├─ auth/
│  ├─ options.ts         # NextAuth config (Google + Email/Resend, MongoDB adapter, DB sessions)
│  └─ session.ts         # getServerSession helpers
├─ storage/
│  ├─ provider.ts        # StorageProvider interface (host-agnostic)
│  ├─ r2.ts              # default impl (Cloudflare R2 / S3-compatible)
│  └─ presign.ts         # presigned upload URL generation + validation
├─ og/
│  └─ render.tsx         # Satori-based OG card (host-agnostic)
├─ email/
│  └─ resend.ts          # Resend client + send helpers
├─ cron/
│  └─ guard.ts           # cron secret verification
├─ security/
│  ├─ headers.ts         # CSP/HSTS/etc.
│  ├─ sanitize.ts        # input sanitization
│  └─ tokens.ts          # signed token (edit-token), opaque-id generation
├─ seo/
│  └─ metadata.ts        # generateMetadata helpers, JSON-LD
├─ analytics/
│  └─ ua.ts geo.ts source.ts   # UA parse, geo from headers, referral classification
└─ utils/
   ├─ slug.ts            # slug validation, reserved-word check, normalization
   ├─ dates.ts           # tz-aware lifecycle math (expiresAt, slugReleaseAt)
   ├─ cn.ts              # className merge
   └─ format.ts
```

---

## 6. `src/components/` — shared UI

```
src/components/
├─ ui/                   # shadcn primitives: button, input, dialog, sheet, tabs, toast,
│                        #   form, select, dropdown, card, badge, skeleton, ...
├─ motion/               # Framer Motion wrappers: Reveal, Parallax, FadeIn, Stagger,
│                        #   reduced-motion-aware primitives (perf-budgeted)
├─ shared/               # Logo, SiteHeader, SiteFooter, EmptyState, ConfirmDialog,
│                        #   ImageUploader, CopyButton, ShareButton, QrCode
└─ providers/            # ThemeProvider, ToastProvider, SessionProvider, QueryProvider(if used)
```

---

## 7. `src/models/`, `src/config/`, `src/stores/`, `src/emails/`

```
src/models/        # one file per collection (Phase 3): User, Template, Invite, RSVP,
                   #   GuestLink, Guestbook, InviteView, AnalyticsDaily, Settings, AuditLog
                   # + index.ts (register models once; avoids serverless re-compile errors)

src/config/
├─ site.ts          # name, tagline, urls, ROOT_DOMAIN usage
├─ reserved-slugs.ts # the reserved-word constant (admin,api,dashboard,login,...)
├─ categories.ts    # template categories
├─ sections.ts      # SectionType catalog metadata (labels, icons, defaults)
└─ nav.ts           # dashboard/admin nav config

src/stores/
├─ editor.store.ts  # invite editor state (content draft, dirty, preview device)
└─ ui.store.ts      # ephemeral UI (sheets, music mute pref)

src/emails/
├─ MagicLink.tsx
├─ RsvpConfirmation.tsx
├─ RsvpReminder.tsx
└─ PublishConfirmation.tsx
```

---

## 8. `scripts/` (operational)

```
scripts/
├─ seed-templates.ts   # insert the 20+ launch templates (Phase 9)
├─ create-admin.ts     # promote a user to admin
├─ ensure-indexes.ts   # build/verify indexes (Phase 3)
└─ backfill-*.ts
```

---

## 9. Path aliases & conventions

- `@/` → `src/` (tsconfig paths). Imports like `@/features/rsvp/...`, `@/lib/db`, `@/components/ui/button`.
- One server-only boundary: `lib/db`, `models`, `services`, `actions.ts` are server-only
  (`import "server-only"`); client components never import them directly — they call server actions
  or route handlers.
- Section components live under `features/templates/schema-engine/sections` and are the **single
  source of truth** rendered by both the live editor preview and the public invite page.

---

## 10. Feeds into next phases
- **Phase 5 (API contracts):** the `app/api/**` handlers + feature `actions.ts`/`services`.
- **Phase 6 (Design system):** `components/ui`, `components/motion`, `styles/`, theme tokens.
- **Phase 7 (Auth):** `lib/auth`, `(auth)/`, guards, middleware integration.
- **Phase 8+ :** features filled in; **Phase 9** seeds templates via `schema-engine` + `scripts`.
```

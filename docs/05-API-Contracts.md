# Shubalekha — API Contracts

**Version:** 1.0
**Status:** Phase 5 — awaiting approval
**Last updated:** 2026-06-09
**Depends on:** [03-Database-Design.md](03-Database-Design.md), [04-Folder-Structure.md](04-Folder-Structure.md)

---

## 1. Conventions

- **Two mutation styles:**
  - **Route Handlers** (`app/api/**`) for: public endpoints (RSVP, guestbook, analytics beacon,
    OG), webhooks/cron, presigned uploads, slug-check, and anything called from non-React clients.
  - **Server Actions** (`features/*/actions.ts`) for: authenticated dashboard mutations driven by
    forms (create/edit/publish invite, generate guest links, moderation). Same validation + guards.
- **Validation:** every input parsed with **Zod** at the boundary. Invalid → `400` with
  `{ error: { code:"VALIDATION", fields:{...} } }`. Mongoose schema is defense-in-depth.
- **Auth helpers:** `requireUser()`, `requireOwner(inviteId)`, `requireRole("admin")`,
  `requireCron()` (secret), token verification for RSVP-edit. Failures → `401`/`403`.
- **Rate limiting:** `@upstash/ratelimit` per route class (key = ip / userId / token). Exceed → `429`
  with `Retry-After`.
- **Response envelope:** success → `{ data, meta? }`; error → `{ error: { code, message, fields? } }`.
- **Status codes:** `200` ok, `201` created, `204` no content, `400` validation, `401` unauth,
  `403` forbidden, `404` not found, `409` conflict (e.g. slug taken), `410` gone (expired),
  `429` rate-limited, `500` server.
- **Idempotency:** publish/duplicate are safe to retry; RSVP submit dedupes server-side.
- **Ownership:** all `/invites/:id/*` verify `invite.ownerId === session.user.id` (or admin).
- **Pagination:** list endpoints accept `?page&limit` (default 1/20, max 100) → `meta:{page,limit,total}`.

### Shared Zod primitives
```ts
const slugSchema = z.string().min(3).max(63).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const objectId  = z.string().regex(/^[a-f\d]{24}$/i);
const emailOpt  = z.string().email().optional().nullable();
const phoneOpt  = z.string().regex(/^[0-9+\-\s()]{6,20}$/).optional().nullable();
const rsvpStatus= z.enum(["attending","not_attending","maybe"]);
const page      = z.coerce.number().int().min(1).default(1);
const limit     = z.coerce.number().int().min(1).max(100).default(20);
```

---

## 2. Endpoint index

| # | Method · Path / Action | Auth | Rate class | Purpose |
|---|---|---|---|---|
| Auth |||||
| 1 | `* /api/auth/[...nextauth]` | — | auth | NextAuth (Google + magic-link) |
| Slugs |||||
| 2 | `GET /api/slugs/check?slug=` | user | check (20/min) | real-time availability |
| Invites (dashboard) |||||
| 3 | `POST /api/invites` / `createInvite` | user | write | create draft from template |
| 4 | `GET /api/invites?status&page&limit` | user | read | list my invites |
| 5 | `GET /api/invites/:id` | owner | read | fetch one (editor) |
| 6 | `PATCH /api/invites/:id` / `saveInvite` | owner | write | save content/theme/sections/music |
| 7 | `POST /api/invites/:id/publish` / `publishInvite` | owner | write | validate + go live |
| 8 | `POST /api/invites/:id/unpublish` | owner | write | revert to draft |
| 9 | `POST /api/invites/:id/duplicate` | owner | write | clone draft |
| 10 | `POST /api/invites/:id/archive` | owner | write | archive |
| 11 | `DELETE /api/invites/:id` | owner | write | soft-delete |
| RSVP |||||
| 12 | `POST /api/rsvps` | public | rsvp (5/min/ip) | submit RSVP (dedupe) |
| 13 | `GET /api/rsvps/:token` | token | read | fetch own RSVP (edit page) |
| 14 | `PATCH /api/rsvps/:token` | token | rsvp | edit own RSVP |
| 15 | `GET /api/invites/:id/rsvps?…` | owner | read | host RSVP list |
| 16 | `GET /api/invites/:id/rsvps/export` | owner | export (3/min) | CSV/Excel download |
| 17 | `POST /api/invites/:id/rsvps/remind` | owner | export | email non-responders |
| Guest links |||||
| 18 | `POST /api/invites/:id/guestlinks` | owner | write | generate (single/bulk) |
| 19 | `GET /api/invites/:id/guestlinks` | owner | read | list + per-guest stats |
| 20 | `DELETE /api/guestlinks/:id` | owner | write | remove |
| Guestbook |||||
| 21 | `POST /api/invites/:id/guestbook` | public | guestbook (3/min/ip) | leave a wish |
| 22 | `GET /api/invites/:id/guestbook` | public/owner | read | list (public: visible only) |
| 23 | `PATCH /api/guestbook/:id` | owner | write | hide/unhide |
| 24 | `DELETE /api/guestbook/:id` | owner | write | delete |
| Analytics |||||
| 25 | `POST /api/analytics/collect` | public | beacon (60/min/ip) | view beacon → Redis |
| 26 | `GET /api/invites/:id/analytics?range` | owner | read | aggregated charts |
| Media / sharing |||||
| 27 | `POST /api/uploads/sign` | user | upload (30/min) | presigned upload URL |
| 28 | `GET /api/og?slug=&v=` | public | cached | dynamic OG image |
| 29 | `GET /api/invites/:id/export?type=pdf\|story\|qr` | owner | export | downloads |
| 30 | `GET /api/invites/:id/calendar?provider=&event=` | public | read | .ics / google / outlook |
| Templates (public read) |||||
| 31 | `GET /api/templates?category&page` | public | read | gallery |
| 32 | `GET /api/templates/:slug` | public | read | detail + schema for preview |
| Admin |||||
| 33 | `GET /api/admin/stats` | admin | read | platform KPIs |
| 34 | `GET/PATCH /api/admin/users[/:id]` | admin | write | list / enable / disable |
| 35 | `GET/PATCH/DELETE /api/admin/invites[/:id]` | admin | write | moderate / disable / delete |
| 36 | `POST/PATCH/DELETE /api/admin/templates[/:id]` | admin | write | CRUD + feature/publish |
| 37 | `GET/PATCH /api/admin/settings` | admin | write | platform flags |
| Cron / system |||||
| 38 | `POST /api/cron/lifecycle` | cron secret | — | expire, release slugs, rollup, reminders |
| 39 | `GET /api/health` | — | — | health check |

---

## 3. Detailed contracts (key endpoints)

### 2 · `GET /api/slugs/check`
```
Query:    { slug: slugSchema }
Auth:     requireUser ; Rate: check
200:      { data: { slug, available: boolean, reason?: "reserved"|"taken"|"invalid" } }
```
Checks reserved list → format → partial-unique index (active/reserved) → Redis soft-lock.

### 3 · `POST /api/invites`  /  `createInvite(input)`
```
Body:     { templateId: objectId, variantKey?: string }
Auth:     requireUser ; Rate: write
Effect:   pins templateVersion, seeds content with field defaults, status="draft".
          Enforces Settings.maxInvitesPerUser.
201:      { data: { inviteId } }
409:      { error: { code:"LIMIT_REACHED" } }
```

### 6 · `PATCH /api/invites/:id`  /  `saveInvite(id, patch)`
```
Body:     { content?: Record<string,unknown>, sectionOverrides?, themeOverrides?,
            music?, seo?, eventDate?, timezone?, settings flags? }   // all partial
Auth:     requireOwner ; Rate: write
Validate: `content` validated against the pinned Template.sections[version]
          (per-field type/required/maxLength). Images must be URLs from our storage host.
200:      { data: { invite } }    // autosave-friendly; supports debounced partial saves
```

### 7 · `POST /api/invites/:id/publish`  /  `publishInvite(id, { slug })`
```
Body:     { slug: slugSchema }
Auth:     requireOwner ; Rate: write
Steps:    1) validate slug (reserved/format/unique/redis-lock)
          2) validate ALL required fields for enabled sections (full content validation)
          3) require eventDate
          4) set slug, status="published", publishedAt, expiresAt=eventDate+10d,
             slugReleaseAt=expiresAt+30d, bump ogVersion
          5) revalidateTag(`invite:${id}`) + OG + sitemap ; send PublishConfirmation email
200:      { data: { url: "https://<slug>.<root>" } }
409:      { error:{ code:"SLUG_TAKEN" } }
422:      { error:{ code:"INCOMPLETE", fields:{...} } }   // missing required content
```

### 12 · `POST /api/rsvps`  (public)
```
Body:     { inviteId: objectId, name: z.string().min(1).max(120),
            email?: emailOpt, phone?: phoneOpt, status: rsvpStatus,
            partySize?: z.number().int().min(1).max(50).default(1),
            meal?: z.enum([...]).default("none"), message?: z.string().max(500),
            events?: [{eventKey, status}],            // when perEventRsvp
            guestToken?: string,                       // from ?to=
            source?: string }
Auth:     none ; Rate: rsvp (5/min/ip) + invite must be published & not expired
Effect:   compute dedupeKey=hash(inviteId|email|phone|normName);
          upsert on {inviteId,dedupeKey}; generate signed editToken;
          $inc invite.stats.rsvp*; link guestLink.rsvpId if guestToken;
          email RsvpConfirmation (+ edit link) if email provided.
201:      { data: { rsvpId, editUrl } }
409:      { error:{ code:"DUPLICATE", data:{ editUrl } } }   // already responded → offer edit
410:      { error:{ code:"EXPIRED" } }
```

### 13/14 · `GET|PATCH /api/rsvps/:token`
```
Auth:     verify signed editToken (no session) ; Rate: rsvp
GET 200:  { data: { rsvp } }
PATCH:    same body as submit (minus inviteId) → update + reconcile counters
404/410:  invalid token / invite gone
```

### 18 · `POST /api/invites/:id/guestlinks`  (single + bulk)
```
Body:     { guests: [{ name: z.string().min(1).max(120), group?: string,
            maxPartySize?: number }] }    // 1..500 per call
Auth:     requireOwner ; Rate: write
Effect:   create opaque tokens; return links `<inviteUrl>?to=<token>`.
201:      { data: { created: [{ id, guestName, url }] } }
```

### 21 · `POST /api/invites/:id/guestbook`  (public)
```
Body:     { name: z.string().min(1).max(120), message: z.string().min(1).max(600),
            guestToken?: string }
Auth:     none ; Rate: guestbook (3/min/ip) ; invite.guestbookEnabled required
Effect:   store with ipHash; sanitize; profanity/size caps; hidden=false.
201:      { data: { id } }
```

### 25 · `POST /api/analytics/collect`  (beacon, edge)
```
Body:     { inviteId: objectId, guestToken?: string, source?: string, ref?: string }
Headers:  reads geo (country/city) + UA from edge.
Auth:     none ; Rate: beacon (60/min/ip)
Effect:   classify source (whatsapp/instagram/facebook/google/direct/other);
          visitorHash=hash(ip+ua+day) [ip discarded]; push to Redis buffer;
          if guestToken → increment GuestLink opens.
204:      (no body — fire-and-forget)
```

### 27 · `POST /api/uploads/sign`
```
Body:     { kind: z.enum(["image","audio"]), contentType: string, sizeBytes: number,
            scope: z.enum(["hero","gallery","family","music","avatar"]) }
Auth:     requireUser ; Rate: upload
Validate: allowed MIME per kind; size caps (image ≤ 8MB, audio ≤ 12MB);
Effect:   return presigned PUT URL + final public URL (StorageProvider).
200:      { data: { uploadUrl, fileUrl, headers } }
```

### 28 · `GET /api/og`
```
Query:    { slug: slugSchema, v: z.coerce.number() }   // v = invite.ogVersion (cache key)
Auth:     none ; CDN-cached per (slug,v)
200:      image/png 1200x630 (couple names, date, hero). Falls back to branded default.
```

### 26 · `GET /api/invites/:id/analytics`
```
Query:    { range?: z.enum(["7d","30d","90d","all"]).default("30d") }
Auth:     requireOwner ; Rate: read
200:      { data: { totals:{views,unique,rsvpRate,rsvp:{yes,no,maybe}},
                     series:[{day,views,unique}],
                     bySource:{}, byDevice:{}, byCountry:{}, byCity:{},
                     topGuests:[{guestName,opens}] } }
```
Reads `AnalyticsDaily` only (never raw events).

### 38 · `POST /api/cron/lifecycle`
```
Auth:     requireCron (header secret, constant-time compare) ; not publicly callable
Tasks:    (a) published & expiresAt<now → status="expired" + revalidate
          (b) slugReleaseAt<now → clear slug (frees it)
          (c) flush Redis view buffer → upsert AnalyticsDaily ; reconcile invite.stats
          (d) send due RsvpReminder emails
200:      { data: { expired, slugsReleased, aggregated, remindersSent } }
```

### 33 · `GET /api/admin/stats`
```
Auth:     requireRole("admin")
200:      { data: { users, invites:{total,published,expired}, views, rsvps, signupsToday } }
```

### 34/35/36/37 · Admin write endpoints
```
Auth:     requireRole("admin") ; every action → AuditLog entry
users   PATCH { status:"active"|"disabled", reason? }
invites PATCH { status:"archived"|"disabled" } | DELETE (hard)
templates POST/PATCH { name, category, sections, variants, theme, status, featured, order }
settings PATCH { signupsEnabled?, maintenanceMode?, maxInvitesPerUser?, reservedSlugs?, announcement? }
```

---

## 4. Error codes (canonical)
`VALIDATION` · `UNAUTHENTICATED` · `FORBIDDEN` · `NOT_FOUND` · `SLUG_TAKEN` · `SLUG_RESERVED`
· `DUPLICATE` · `EXPIRED` · `INCOMPLETE` · `LIMIT_REACHED` · `RATE_LIMITED` · `DISABLED` · `SERVER`.

## 5. Rate-limit classes (Upstash)
| class | limit | key |
|---|---|---|
| auth | 10 / 10 min | ip |
| check | 20 / min | userId |
| read | 120 / min | userId/ip |
| write | 60 / min | userId |
| rsvp | 5 / min | ip (+invite) |
| guestbook | 3 / min | ip |
| beacon | 60 / min | ip |
| upload | 30 / min | userId |
| export | 3 / min | userId |

## 6. Feeds into next phases
- **Phase 6:** form components bind to these request schemas (RHF + Zod resolver).
- **Phase 7:** `requireUser/Owner/Role/Cron` + NextAuth route implemented first.
- **Phase 8:** services implement the effects; transactions for RSVP+counter consistency.
```

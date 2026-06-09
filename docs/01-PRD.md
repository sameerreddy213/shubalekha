# Shubalekha — Product Requirements Document (PRD)

**Version:** 1.0
**Status:** Phase 1 — awaiting approval
**Last updated:** 2026-06-09
**Tagline:** _Create Beautiful Invitations That Guests Never Forget._

---

## 1. Overview

Shubalekha is a premium, mobile-first digital invitation platform for the Indian
market. Users browse professionally designed, admin-authored templates, customize
a fixed set of editable fields, and publish a live invitation website on their own
unique subdomain (`name-weds-name.shubalekha.com`). Guests open the link, experience
a luxurious animated invitation, and RSVP. Hosts track views and RSVPs from a
dashboard.

### 1.1 Product vision

The best-looking, fastest digital invitation product in India — invitation pages
that feel like an Apple/Stripe/Linear-grade experience while loading instantly on a
mid-range Android phone over 4G.

### 1.2 v1 scope decisions (locked)

| Decision | Choice |
|---|---|
| Monetization | **Free in v1.** No billing. Schemas designed so plans/limits/billing can be bolted on later without migration. |
| Hosting | **Host-agnostic.** Wildcard-subdomain routing, OG generation, and middleware written portably; final host (Vercel+Cloudflare vs self-hosted) decided in Phase 12. |
| Localization | **English app UI.** Invitation _content_ fields are free-text and must render any Indian language/script (Devanagari, Telugu, Tamil, Kannada, Malayalam, Gurmukhi, Arabic/Urdu). No full UI i18n in v1. |
| Deliverable | **Full runnable codebase**, delivered phase by phase. |

---

## 2. Goals & non-goals

### 2.1 Goals
- G1 — Let a non-technical user create and publish a beautiful invitation in **under 5 minutes**.
- G2 — Public invite pages score **Lighthouse 95+** and hit **excellent Core Web Vitals** on mobile.
- G3 — Shared links render rich, correct previews on **WhatsApp** (primary), Instagram, FB, Twitter.
- G4 — Reliable RSVP collection with duplicate prevention and host-side management.
- G5 — Actionable analytics (views, unique visitors, RSVP rate, device, geo, referral source).
- G6 — Secure by default: RBAC, ownership checks, validation, rate limiting on every mutating API.
- G7 — Scale to **100k+ users** and **millions of invite page views** without redesign.

### 2.2 Non-goals (v1)
- Payments/billing, coupons, invoicing.
- User-created templates (templates are admin-only, schema-driven).
- Native mobile apps (PWA-friendly web only).
- Full multi-language UI translation.
- Realtime guest chat / live streaming / gift registry / e-commerce.
- WhatsApp Business API auto-sending (we generate share links, we do not send messages).

---

## 3. Personas

| Persona | Description | Primary needs |
|---|---|---|
| **Host (Aarti, 28)** | Bride-to-be, mobile-only, non-technical. | Pick a gorgeous template, fill names/date/venue, publish, share on WhatsApp, see who's coming. |
| **Guest (Ramesh, 55)** | Receives a WhatsApp link. | Open instantly, read details, get directions, add to calendar, RSVP in 2 taps. |
| **Admin (internal)** | Shubalekha staff/designer. | Author templates, moderate content, manage users/invites, see platform metrics. |

---

## 4. Core user journeys

### 4.1 Host — create & publish
1. Lands on marketing site → **Browse templates** (no login).
2. Opens a template → **live preview** with sample data.
3. Clicks **Use this template** → **login required** (Google or Magic Link).
4. Lands in the **editor**: schema-driven form on left/bottom, live preview updating.
5. Fills required fields; uploads photos; sets venue + Google Maps link.
6. Chooses a **slug** → real-time availability check + reserved-word block.
7. **Publish** → invite goes live at `slug.shubalekha.com`; QR + share sheet shown.

### 4.2 Guest — view & RSVP
1. Opens `slug.shubalekha.com` from WhatsApp.
2. Sees animated hero (names, date, photo), scrolls through sections.
3. Taps **Get Directions** / **Add to Calendar**.
4. Fills **RSVP** (name required; status Attending/Not/Maybe; optional contact, party size, meal).
5. Receives an **RSVP edit link** (by email if provided) to change response later.

### 4.3 Host — manage
1. `/dashboard` → see invites grouped by status (Draft / Published / Expired).
2. Open an invite → **RSVP list** + **analytics charts**.
3. Edit / Unpublish / Duplicate / Archive / Delete.

### 4.4 Admin
1. `/admin` (role-gated) → platform KPIs.
2. Author/edit templates (field schema + sections + theme).
3. Manage users (enable/disable), moderate/disable/delete invites, feature templates.

---

## 5. Functional requirements

### 5.1 Templates
- Admin-authored only. **Schema-driven**: each template declares its sections, editable
  fields (type, label, validation, default), theme tokens, and animation preset.
- 20+ launch templates across the categories in the brief, each with a **unique** layout,
  typography, palette, and animation set.
- Users edit only whitelisted fields; structure/design is fixed.
- Templates can be `draft`/`published`, `featured`, and assigned a `category`.

### 5.2 Invitation lifecycle
`Draft → Published → (event date passes) → Completed → Expired (10 days after event)`.
- Expired page shows **"This invitation has expired"** + **Return Home** button.
- Slug **reserved 30 days** after expiry, then **released** for reuse.
- Lifecycle transitions run via scheduled job (cron) + computed-on-read guards.

### 5.3 Slug system
- User-chosen slug → `slug.shubalekha.com`.
- Real-time availability check (debounced API). Rules: lowercase, `a-z 0-9 -`, 3–63 chars,
  no leading/trailing/double hyphen, not a reserved word, globally unique among active+reserved.
- Reserved words: `admin, api, dashboard, login, signup, templates, support, about, contact`
  (+ www, mail, static, cdn, assets, and others — full list in DB design).

### 5.4 Invitation sections (per-template, optional)
Each template composes from a catalog of section types; the field schema declares which
appear, in what order, and which fields are editable. Catalog:

- **Hero** — couple/event names, "weds"/event word, hero image, and a **cultural invocation**
  sub-field (script-aware: Sanskrit `ॐ श्री गणेशाय नमः`, Gurmukhi, Bismillah, cross, etc.).
- **Blessings / Family invocation** — parents, grandparents, "son/daughter of" lines.
- **Invitation text** — formal invitation copy.
- **Welcome message** — personal note from the host/couple.
- **Event Details** — date/time/venue per event (supports multiple events, e.g. Nikah + Walima).
- **Timeline / Schedule** — ordered events with time + label.
- **Countdown** — to primary event datetime.
- **Family Members** — named cards (role + optional photo).
- **Venue + Google Maps** — address, embedded map, Get-Directions button.
- **Things to Know** — repeatable info cards: hashtag, weather, dress code, accommodation,
  parking, travel. _(Derived from reference templates; first-class structured block.)_
- **RSVP** — guest response form (see §5.5).
- **QR Code** — auto-generated, downloadable.
- **Social Sharing** — native share + per-channel links; optional Instagram handle.
- **Add-to-Calendar** — Google / Apple (.ics) / Outlook.
- **Closing message** — final family sentiment.

#### 5.4.2 Background music (per invite, optional)
Hosts may attach **background music** (upload an MP3, size/length capped, or pick a curated
royalty-free track). Player rules: **never auto-play with sound** (browser-compliant + courteous);
show a tasteful floating play/pause control; respect `prefers-reduced-motion`/muted; remember
user mute choice. Audio is lazy-loaded so it never blocks LCP.

#### 5.4.1 Design references
Aesthetic benchmark: Missing Piece Invites demos (meenaya, laavan, beach, city-2, whimsical).
Common language to match/exceed: editorial serif display names + refined sans body, generous
whitespace, soft culturally-tuned palettes, photography-forward heroes, scroll-reveal section
animations, mobile-first single-column flow. Templates must feel premium and distinct, never generic.

### 5.5 RSVP
- Required: Guest Name. Optional: Email, Phone, Party size, Meal preference.
- Status: Attending / Not Attending / Maybe.
- Duplicate prevention (per invite, by email/phone fingerprint). Email + phone validation.
- Edit-response link (signed token).

### 5.6 Analytics
- Total views, unique visitors, RSVP rate, device type, browser, country, city, referral source
  (WhatsApp/Instagram/Facebook/Google/Direct). Dashboard charts. Privacy-respecting (no PII beyond coarse geo).

### 5.7 QR & sharing
- Auto-generated QR pointing to invite URL; downloadable PNG. Native share sheet + per-channel links.

### 5.8 Calendar
- One-click add to Google / Apple (.ics) / Outlook.

### 5.9 SEO & social
- Per-invite dynamic metadata, **dynamic OG image**, Twitter card, JSON-LD `Event` structured data,
  canonical URL, sitemap. Optimized for WhatsApp unfurl (correct title/desc/image, right dimensions).

### 5.10 Dashboard & Admin
- As enumerated in §4.3 / §4.4. All actions ownership- and role-checked.

### 5.11 Guest & host enhancement features (v1)

These elevate Shubalekha beyond a static invite. All free.

**Guest-facing (invite page):**
- **Personalized guest links** — `slug.shubalekha.com/?to=<token>` greets the guest by name,
  pre-fills their RSVP, and records **per-guest** opens. Tokens are opaque (no PII in URL);
  host generates a link per guest/family from the dashboard.
- **"Tap to open" envelope intro** — optional animated open on first visit (skippable,
  reduced-motion aware, never blocks content for crawlers/SEO).
- **Photo gallery** — pre-wedding shoot gallery with lightbox; lazy-loaded, optimized images.
- **Our Story timeline** — "how we met" scroll narrative (ordered milestone entries).
- **Wishes / Guestbook** — guests leave blessings; moderated (host can hide/delete);
  rate-limited + spam-protected; shown live on the page.
- **Family contact cards** — one-tap Call / WhatsApp the family coordinator(s).
- **Live-stream link** — optional block linking to a stream for remote guests.
- **Gift / Shagun link** — optional UPI or registry link, **off by default**.

**Host-facing (dashboard):**
- **Color & font theming** — swap palette/font within each template's curated guardrail set.
- **Download / export** — invite as printable PDF + WhatsApp story/DP image formats; QR PNG.
- **RSVP export** — download RSVP list as CSV/Excel.
- **RSVP reminders** — one-click email to invited guests who haven't responded (Resend).
- **Per-event RSVP** — guests respond per function (Haldi / Wedding / Reception separately).
- **Save the Date** — lightweight standalone invite format.

**Platform:**
- **Installable PWA** — add-to-home-screen, offline-friendly invite shell.

> **Deferred to v2 (locked):** Co-host & shared access — the owner invites other accounts to
> co-edit an invitation and/or view its RSVP dashboard ("how many are coming") with scoped roles.
> Data model in Phase 3 will leave room for this (ownership is modeled to extend to a collaborators
> list later) but no sharing/permissions code ships in v1.

### 5.12 Marketing site (public, no login)
Conversion-focused landing experience. Sections, in order: **Hero** (tagline + "Choose ·
Customise · Share" CTA) → **Featured / New templates** → **Features** (RSVP, maps, music,
multi-event, instant edits, elder-friendly) → **How it works** (3-step, "in minutes") →
**Comparison** (Printed card vs WhatsApp video vs Shubalekha) → **Testimonials** → **FAQ** →
**Final CTA**. Plus: Templates gallery (filterable by category), About, Contact, Privacy,
Terms. Positioning vs. reference products: same premium experience, **free**, on our own
`*.shubalekha.com` domain.

---

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Lighthouse 95+ on public invite pages (mobile); LCP < 2.0s on 4G mid-range Android; 60fps animations. |
| Availability | Public invite pages must stay up under viral load (CDN-cached, RSC, ISR/revalidate). |
| Security | RBAC, ownership verification, Zod validation on all input, XSS/CSRF/NoSQL-injection protection, secure cookies, rate limiting (Upstash) on auth + mutations + public RSVP. |
| Accessibility | WCAG 2.1 AA targets: contrast, focus, touch targets ≥44px, semantic structure, reduced-motion support. |
| Observability | Sentry for errors; structured logs; audit log for admin/security-sensitive actions. |
| Scalability | Stateless app, MongoDB Atlas with proper indexes, Redis for rate-limit/cache, CDN for static + OG. |
| Privacy | Minimal analytics PII; IP used transiently for geo then discarded/hashed; clear data ownership by host. |

---

## 7. Success metrics
- **Activation:** % of logged-in users who publish ≥1 invite (target > 60%).
- **Time-to-publish:** median < 5 min.
- **Invite performance:** p75 LCP < 2.0s mobile; Lighthouse ≥ 95.
- **Guest engagement:** RSVP rate (RSVPs / unique visitors) per invite.
- **Reliability:** public-page error rate < 0.1%.

---

## 8. Key risks & mitigations
| Risk | Mitigation |
|---|---|
| Wildcard subdomain + TLS complexity differs per host | Host-agnostic routing via middleware on `Host` header; finalize in Phase 12. |
| Heavy animations hurt CWV | Framer Motion with GPU-friendly transforms, `prefers-reduced-motion`, lazy/section-reveal, no layout thrash; budget per template. |
| Indian-script font weight/CLS | Subset + `next/font` with `display: swap`, per-template font loading, preconnect. |
| Slug squatting / abuse | Reserved list, validation, rate limit, 30-day reservation, admin disable. |
| Spam RSVPs | Rate limit + duplicate prevention + optional captcha hook. |
| Scope creep (free v1) | Plan/limit fields stubbed in schema but unused; no billing code. |

---

## 9. Roadmap for later (post-v1)
- **v2 (planned):** Co-host & shared access — owner invites collaborators to co-edit and/or
  view the RSVP dashboard with scoped roles (data model leaves room for this in v1).
- **Later:** Billing/plans · template marketplace · WhatsApp Business sending · guest photo-upload
  wall · AI text/photo helpers · multi-language content toggle · seating charts · A/B template
  testing · white-label custom domains.

---

## 10. Phase plan (delivery)
1. **PRD** ← (this doc) 2. System Architecture 3. Database Design 4. Folder Structure
5. API Contracts 6. UI/UX Design System 7. Authentication 8. Core Features
9. Templates 10. Admin Panel 11. Analytics 12. Deployment.
Approval gate after each phase.

# Shubalekha — UI/UX Design System

**Version:** 1.0
**Status:** Phase 6 — awaiting approval
**Last updated:** 2026-06-09
**Depends on:** [04-Folder-Structure.md](04-Folder-Structure.md)
**Tooling:** TailwindCSS + shadcn/ui (Radix) + Framer Motion + `next/font`.

---

## 1. Two design languages, one system

Shubalekha has **two visual worlds** that share primitives but differ in intent:

1. **The Product** (marketing, dashboard, admin) — calm, precise, fast. Benchmark: **Apple ·
   Stripe · Linear · Framer**. Neutral palette, one brand accent, generous whitespace, crisp type,
   restrained motion. This must feel like premium software.
2. **The Invitations** (public template pages) — luxurious, emotional, varied. Each template owns
   its palette/typography/motion (driven by `Template.theme` tokens, Phase 3). The system supplies
   the *grammar* (tokens, motion primitives, section components); each template supplies the *voice*.

Rule of thumb: **product = one restrained system; invitations = many expressive themes** built from
the same token contract.

---

## 2. Design tokens (product)

Defined as CSS variables in `styles/globals.css`, consumed via Tailwind theme extension. Tokens are
semantic (not raw colors) so theming/dark-mode is a variable swap.

### 2.1 Color — product palette
```css
:root {
  /* base neutrals (warm-tinted, not pure gray — feels premium) */
  --background: 36 33% 99%;     /* near-white, warm  */
  --foreground: 240 10% 12%;    /* near-black ink     */
  --muted:      240 5% 96%;
  --muted-foreground: 240 4% 46%;
  --border:     240 6% 90%;
  --card:       0 0% 100%;

  /* brand — deep rosewood/maroon (auspicious, Indian-celebration coded, premium) */
  --primary:        345 62% 34%;   /* #8E2741-ish */
  --primary-foreground: 0 0% 100%;
  /* accent — warm gold (luxury) */
  --accent:         38 64% 52%;    /* #D6A23E-ish */
  --accent-foreground: 240 10% 12%;

  --success: 152 45% 38%;
  --warning: 32 85% 48%;
  --destructive: 0 65% 48%;
  --ring: var(--primary);

  --radius: 0.75rem;             /* base radius; pill for CTAs */
}
.dark { /* dashboard supports dark mode: invert neutrals, keep brand */
  --background: 240 10% 8%;  --foreground: 36 20% 96%;  --card: 240 8% 11%;
  --muted: 240 6% 16%; --muted-foreground: 240 5% 64%; --border: 240 6% 20%;
}
```
- **Brand rationale:** rosewood + gold reads as *Indian celebration + luxury* without being garish —
  distinct from the generic SaaS blue, aligned with the wedding-invite domain.
- Contrast: all text/background pairs target **WCAG AA** (≥4.5:1 body, ≥3:1 large/UI). Verified in Phase 6 a11y.

### 2.2 Typography
```
Display / headings : "Fraunces" (variable serif — editorial, warm) via next/font
Body / UI          : "Geist" or "Inter" (variable sans — crisp, neutral)
Mono (codes/slug)  : "Geist Mono"
Indian scripts     : "Noto Sans Devanagari/Telugu/Tamil/Kannada/Malayalam/Gurmukhi",
                     "Noto Naskh Arabic" — loaded per-need (content rendering)
```
- `next/font` with `display: swap`, subset + preload for the two product faces; **script fonts
  lazy-loaded only on invite pages that use them** (avoid shipping all scripts to everyone).
- **Type scale** (fluid, `clamp()`), mobile-first:

| token | size (mobile→desktop) | use |
|---|---|---|
| display-xl | 2.5→4rem | hero invite names |
| display | 2→3rem | section heroes |
| h1 | 1.75→2.25rem | page titles |
| h2 | 1.375→1.75rem | section titles |
| h3 | 1.125→1.375rem | card titles |
| body | 1rem (16px min) | default — never below 16px (elder-friendly, no zoom) |
| sm | 0.875rem | meta |
| caption | 0.75rem | labels |

Line-height: 1.5 body / 1.15 display. Measure: 60–72ch max for reading blocks.

### 2.3 Spacing, radii, shadows, layout
- **Spacing scale:** 4px base → `0,1,2,3,4,6,8,12,16,24,32` (Tailwind default + extensions).
- **Container:** content max-width 1200px (product); **invite pages single-column, max 520–600px**
  (mobile-first reading column) centered, full-bleed media allowed.
- **Radii:** `sm .5rem`, `md .75rem`, `lg 1rem`, `xl 1.5rem`, `pill 9999px` (primary CTAs are pill).
- **Shadows:** soft, layered, low-opacity (premium feel) — `sm/md/lg/xl`; never harsh black.
- **Touch targets:** min **44×44px** (accessibility + mobile-first, 90% mobile traffic).
- **Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280`. Design mobile-first; enhance up.

---

## 3. Motion system (Framer Motion)

Two motion personalities, both **60fps and reduced-motion aware**.

### 3.1 Product motion (restrained)
- Durations 150–250ms, `ease-out`/spring; used for: hover, press, sheet/dialog enter, tab/route
  transitions, toast, optimistic UI. Subtle, never decorative.
- Tokens: `--motion-fast 150ms · --motion 200ms · --motion-slow 300ms`.

### 3.2 Invite motion (expressive, per-template)
Reusable primitives in `components/motion/` — templates compose them via a `animationPreset`:
- `Reveal` — section fade+rise on scroll (IntersectionObserver, once).
- `Stagger` — children cascade (family cards, gallery).
- `Parallax` — soft background-image parallax (transform-only, GPU).
- `FadeIn`, `ScaleIn`, `FloatLoop` (gentle floating petals/diyas), `CountUp` (countdown).
- `EnvelopeOpen` — the "tap to open" intro (Phase 1 §5.11).

### 3.3 Performance & accessibility rules (non-negotiable)
- Animate **only `transform` and `opacity`** (no layout/paint thrash). No animating width/top/left.
- `will-change` used sparingly; cleanup after.
- **`prefers-reduced-motion: reduce`** → disable parallax/float/stagger, keep instant fades; envelope
  intro auto-skips.
- Lazy-mount heavy sections; animations trigger on viewport entry, run **once**.
- Music never autoplays with sound; floating mute control respects saved preference.

---

## 4. Component inventory

### 4.1 Primitives (`components/ui/` — shadcn/Radix)
Button (variants: primary/secondary/ghost/outline/destructive; sizes incl. icon; pill for CTA),
Input, Textarea, Label, Form (RHF + Zod resolver), Select, Combobox, Checkbox, Switch, RadioGroup,
Slider, Tabs, Dialog, Sheet (mobile drawer), Popover, DropdownMenu, Tooltip, Toast/Sonner, Badge,
Card, Avatar, Skeleton, Progress, Separator, ScrollArea, Accordion, Calendar/DatePicker, Pagination,
Table, Alert, EmptyState.

### 4.2 Shared composites (`components/shared/`)
Logo, SiteHeader, SiteFooter, MobileNav, UserMenu, ImageUploader (presigned), AudioUploader,
ColorPaletteEditor, FontPicker, SlugInput (live availability + status icon), CopyButton, ShareSheet,
QrCode, ConfirmDialog, StatCard, ChartCard, DeviceFramePreview (phone/desktop toggle), EmptyState,
LoadingState, ErrorState.

### 4.3 Feature components
Per Phase 4 `features/*/components` — editor, RSVP, analytics charts, guest links, guestbook,
marketing sections, admin tables, and the **invite section components** (the schema-engine).

### 4.4 Invite section components (`features/templates/schema-engine/sections/`)
One component per `SectionType` (Phase 3): Hero, Blessings, InvitationText, WelcomeMessage,
EventDetails, Timeline, Countdown, FamilyMembers, VenueMap, ThingsToKnow, OurStory, Gallery, Wishes,
Rsvp, ContactCards, QrCode, SocialShare, AddToCalendar, Music, LiveStream, Gift, Closing.
Each: theme-token driven, motion-wrapped, fully responsive, used by **both** editor preview and live page.

---

## 5. Key UX patterns

### 5.1 The editor (most important screen)
- **Mobile:** bottom-sheet form + full-width live preview; sticky "Save"/"Publish" bar; section
  accordion. **Desktop:** split — form left (scroll), live preview right (sticky, device-frame toggle).
- **Live preview is the real section components** (not a fake) → WYSIWYG, zero drift.
- **Autosave** (debounced PATCH) with subtle "Saved" indicator; explicit Publish gate.
- **SlugInput**: debounced availability, inline status (checking/available/taken/reserved), suggestions.
- **Publish dialog**: shows missing-required-fields checklist (maps to `422 INCOMPLETE`).

### 5.2 Dashboard
- Status tabs (Draft/Published/Expired/Archived); invite cards with thumbnail, stats, quick actions
  (Edit/Share/Duplicate/Analytics/…); empty states that guide to "Create from a template".

### 5.3 Public invite
- Single-column, immersive, scroll-driven; optional envelope intro; sticky mini-RSVP/“I'm coming”
  CTA; bottom share bar; elder-friendly (≥16px, high contrast, big targets).

### 5.4 Guest RSVP
- 2-tap path: status chips (Coming / Can't / Maybe) → minimal fields → confirm. Prefilled name when
  arriving via `?to=`. Confirmation + "add to calendar" + edit link.

### 5.5 Feedback & states
Every async surface defines **loading (skeleton) / empty / error / success** states. Optimistic UI
for RSVP and editor saves. Toasts for confirmations; inline errors for forms.

---

## 6. Accessibility standard (WCAG 2.1 AA)
- Color contrast AA (auto-checked for product tokens; template palettes validated in Phase 9).
- Full keyboard nav; visible focus rings (`--ring`); logical tab order; skip-to-content.
- Radix primitives → correct roles/ARIA/focus-trap out of the box.
- Forms: label-for, `aria-describedby` errors, `aria-invalid`.
- Touch targets ≥44px; text ≥16px; supports 200% zoom & dynamic type.
- `prefers-reduced-motion` honored everywhere; no info conveyed by color alone.
- Images require alt text (host prompted on upload); decorative marked `aria-hidden`.
- Screen-reader pass on editor + invite + RSVP before launch.

---

## 7. Theming contract (how templates plug in)
A template provides `ThemeTokens` (Phase 3): `palette{bg,surface,primary,accent,text,muted}`,
`fonts{display,body,script?}`, `animationPreset`. At render, the invite layout maps these to the
same CSS variables the section components consume → **one component set, infinite themes**.
Host customization (Phase 1 §5.11) edits only the `customizable` subset, clamped to accessible ranges.

---

## 8. Iconography & imagery
- Icons: **lucide-react** (consistent, tree-shakeable). Cultural/decorative motifs (diya, mandala,
  florals, crescent, cross, khanda) as optimized SVGs per template, `aria-hidden`.
- Imagery: `next/image` everywhere; AVIF/WebP; blur placeholders; responsive `sizes`; LCP hero
  preloaded; gallery lazy.

---

## 9. Content & tone (UX copy)
Warm, encouraging, simple ("Choose · Customise · Share"). Elder-friendly clarity; no jargon. Error
copy is human and actionable. (Detailed microcopy via the `ux-copy` discipline in build phases.)

---

## 10. Deliverables when implemented (Phase 7+)
- `styles/globals.css` (tokens + base), `tailwind.config.ts` (semantic mapping), `components.json`
  (shadcn), `components/ui/*`, `components/motion/*`, `next/font` setup in root layout,
  ThemeProvider (light/dark for product), and the section-component theming bridge.

## 11. Feeds into next phases
- **Phase 7:** auth screens + app shell use these tokens/components.
- **Phase 8:** editor, RSVP, dashboard built on this system.
- **Phase 9:** 20+ templates each define `ThemeTokens` + pick motion preset against this contract.
```

## What we're building

A public, mobile-friendly landing page at `/` that explains what MamaHealth is and drives visitors to sign in or continue as a guest. Design follows the selected direction (Editorial Split Hero) with a soft wave transition between sections.

## Visual direction (locked)

- **Palette** (added as semantic tokens in `src/styles.css`):
  - Canvas cream `#FAF7F2`, card white `#FFFFFF`
  - Deep forest primary `#2D4A3E` (buttons, headings)
  - Warm terracotta accent `#D97757` (badges, highlights)
  - Muted stone text `#78716C`, soft blush `#E8D3C3` for imagery blocks
- **Type**: Instrument Serif (headings, italic) + Work Sans (body, buttons, labels), loaded via `<link>` in `src/routes/__root.tsx` head
- **Motion**: quiet fade / slide-up on section reveal, gentle hover-lift on cards, no bounce
- **Signature**: an SVG wave-path clip softens the transition between hero and the sections below

## Page structure

1. **Slim nav bar** — MamaHealth logo mark + "Sign in" link (auth-aware: shows "Dashboard" if signed in).
2. **Hero (split-screen, rounded card)**
   - Left (mobile: below): eyebrow badge, headline "Your journey, guided by care." (mixed italic + roman), one-line subhead, primary CTA "Sign in", secondary CTA "Continue as guest", two-column mini value props (Private / Accessible).
   - Right (mobile: above): warm maternity image panel with a frosted overlay card highlighting the WHO Danger-Signs Checker.
   - Stacks cleanly on mobile with correct source order (image first, content below).
3. **Wave divider** — full-width SVG wave in canvas cream.
4. **What MamaHealth does** — three-card feature row: Pregnancy tracker (LMP → gestational week + EDD), WHO danger-signs checker, Nearest clinic finder. Each card: icon, title, one-line description.
5. **Why it's different** — compact 4-item strip: Works on low bandwidth, Private by design, Evidence-based (WHO), Multilingual (FR · EN · PCM · FF).
6. **Closing CTA band** — headline + primary/secondary CTAs repeated.
7. **Footer** — one line: "Your data stays private. MamaHealth is guidance, not a substitute for medical care." + copyright.

## Files to change

- `src/routes/index.tsx` — replace current placeholder landing with the new sectioned page. Keep the existing `signedIn` check so returning users see a "Go to dashboard" CTA instead of "Sign in".
- `src/routes/__root.tsx` — add Google Fonts `<link>` entries (preconnect + Instrument Serif + Work Sans) to `head().links`. Update site title/description copy to match the new positioning. Do not add `og:image` on root.
- `src/styles.css` — add the palette tokens under `@theme inline` (mapped from `:root` CSS variables) so utilities like `bg-primary`, `text-accent`, `bg-canvas` work. Register `--font-serif` and `--font-sans` in `@theme`. No remote `@import`.
- `src/assets/hero-mother.jpg` — generated hero image (warm, soft-focus editorial portrait of an expectant mother, earthy tones). Imported as an ES6 asset.

## Technical details

- Route stays a top-level public route (`src/routes/index.tsx`) — no auth gate. Loader-free; the existing `useEffect` + `supabase.auth.getUser()` check remains for the auth-aware CTA.
- Head metadata: real title ("MamaHealth — A private companion for your pregnancy journey"), matching description, `og:title`, `og:description`, `og:type=website`, `twitter:card=summary_large_image`. `og:image` deferred until we have a proper social card.
- Responsive rules per the responsive-layout guidance: hero grid uses `grid-cols-1 lg:grid-cols-2`; nav uses `grid-cols-[minmax(0,1fr)_auto]` with `min-w-0` on the title container and `shrink-0` on the logo mark; feature row is `grid-cols-1 md:grid-cols-3`.
- All colors go through semantic tokens — no hardcoded hex in JSX. Wave divider is an inline SVG using `currentColor` set to the canvas token.
- Motion via lightweight Tailwind transitions + one `IntersectionObserver`-driven `data-inview` utility class defined with `@utility` in `styles.css` (fade + translate-y). No new deps.
- No changes to routes, auth, database, or the pregnancy tracker.

## Out of scope

- No new server functions, migrations, or backend work.
- No changes to `/auth`, `/dashboard`, or `/pregnancy`.
- No dark mode variant this pass (tokens are structured so it can be added later).

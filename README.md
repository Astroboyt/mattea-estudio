# Mattea Estudio — landing page

One-page site for Matt & Tea, built from the Figma file (`Mattea`, node 90-213).

**Stack:** Vite · Tailwind v4 · GSAP 3.13 (ScrollTrigger, ScrollSmoother, SplitText — all free since the Webflow acquisition)

## Run it

```bash
npm install
npm run assets    # ⚠️ do this first — see below
npm run dev
```

## ⚠️ Photos expire

The 10 photos are currently hotlinked from Figma's asset CDN, and those URLs
die ~7 days after export. `npm run assets` downloads them into
`public/assets/` and rewrites `index.html` to local paths. Run it once on a
machine with normal internet access, then commit the images.

All vector assets (logotype, icons, arrows) were exported from Figma as
outlined SVG and are inlined in the HTML — they never expire, and the
MostraNuova logo font doesn't need licensing because the logo is paths, not
live text.

## Interactions

- ScrollSmoother (1.2s) for the whole page
- Hero headline: SplitText line-mask reveal; script headings reveal word by word
- Section rules draw themselves in (scaleX); icons settle in with a small rotation
- Photos: clip-path wipe from bottom + gentle scroll parallax
- "Where Stories Meet Walls": pinned horizontal-scroll gallery on desktop,
  native swipe with scroll-snap under 1024px
- FAQ accordion, animated height
- `prefers-reduced-motion` disables all of it; the site is fully readable with JS off

## Form

Front-end only for now. On submit it validates, then swaps to a thank-you
message. To wire it up later: point the `<form>` at Formspree/Basin, or add a
`fetch()` in the submit handler in `src/main.js`.

## Things that need review (not in the Figma file)

1. **Header top-right box** — the Figma has an empty 195×37 black-bordered box
   with no content. Kept as-is on desktop, hidden on mobile. Ask the client
   what goes there (language switch? shop link?).
2. **Two project buttons** — the bordered buttons under Barcelona High School
   and Dionysus Vineyard are empty in the Figma. I labeled them
   **"View the project"**. They currently link to the gallery.
3. **Form labels + submit** — the Figma shows three underlines and one box,
   no labels and no submit button. I added: Name / Email / Where's the wall? /
   message, and a **"Send it over"** button in the house button style.
4. **FAQ answers** — the Figma only has the five questions. All answers are
   placeholder copy written to sound plausible. **The client must review
   these** (especially travel scope and timelines).
5. **Copy quirks kept from Figma** — "We're Matt &Tea" (missing space) was
   kept verbatim; "Dionysus Vineyard ,Croatia" and "Questions , Answers" had
   the stray comma spacing normalized. Flag if the spacing was intentional.

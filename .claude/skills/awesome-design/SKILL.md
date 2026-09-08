---
name: awesome-design
description: >
  A library of 74 DESIGN.md reference files, each a machine-readable design-token
  spec (colors, type scale, component styling, spacing, elevation, do's/don'ts)
  reverse-engineered from a real product's public site — Stripe, Apple, Linear,
  Notion, Expo, and more. Use this when the user wants UI generated or restyled
  to match a specific named brand or product's visual language ("make this look
  like Stripe", "give it a Linear-style dark UI", "match Notion's warm minimal
  look"), or asks what design references are available. Not for generic HIG/UX
  best-practice review — use apple-design for that instead.
---

# Awesome DESIGN.md

This is a static reference library, not a review process — there's no audit to
run. Each subdirectory under `design-md/<site>/` holds one `DESIGN.md`: a plain
text design-system spec (YAML-flavored) with sections for colors, typography,
component stylings, layout/spacing, elevation, responsive behavior, and
do's/don'ts, plus `preview.html` / `preview-dark.html` visual catalogs of the
same tokens.

## How to use it

1. **Find out which brand's look the user wants.** If they haven't named one,
   ask, or offer a short list of options relevant to the surface they're
   building (see the catalog below).
2. **Read that one `DESIGN.md`** — e.g. `design-md/stripe/DESIGN.md` — don't
   load others; each is self-contained and can run 200+ lines of tokens.
3. **Translate its tokens into the project's actual styling system** (this
   project's `src/constants/theme.ts` + `Fonts`/inline `StyleSheet` values, or
   whatever the target project uses) rather than inventing new hex values —
   the whole point of the file is that the palette, type scale, and component
   rules are already extracted and named.
4. **Respect the do's/don'ts section** — it calls out anti-patterns for that
   brand's language specifically (e.g. "never mix the accent with X", "buttons
   are always tight-radius pills, never rounded-full").
5. If a `preview.html`/`preview-dark.html` exists alongside the `DESIGN.md`,
   it's a fast visual sanity check of the same tokens rendered as swatches,
   type scale, and sample components — open it if you want to see the palette
   before applying it, not just read the numbers.

This is a one-brand-at-a-time tool: pick one `DESIGN.md` per restyle rather
than blending several, since their type scales, spacing units, and radii
philosophies aren't designed to mix.

## Catalog

Directory names under `design-md/` (one `DESIGN.md` each):

**AI/LLM**: claude, cohere, elevenlabs, minimax, mistral.ai, ollama, opencode.ai, replicate, runwayml, together.ai, voltagent, x.ai
**Dev tools/IDEs**: cursor, expo, lovable, raycast, superhuman, vercel, warp
**Backend/DevOps**: clickhouse, composio, hashicorp, mongodb, posthog, sanity, sentry, supabase
**Productivity/SaaS**: cal, intercom, linear.app, mintlify, notion, resend, slack, zapier
**Design/creative tools**: airtable, clay, figma, framer, miro, webflow
**Fintech/crypto**: binance, coinbase, kraken, mastercard, revolut, stripe, wise
**E-commerce/retail**: airbnb, meta, nike, shopify, starbucks
**Media/consumer tech**: apple, hp, ibm, nvidia, pinterest, playstation, spacex, spotify, theverge, uber, vodafone, wired
**Automotive**: bmw, bmw-m, bugatti, ferrari, lamborghini, renault, tesla
**Retro web**: dell-1996, nintendo-2001

## Attribution

MIT-licensed collection from github.com/VoltAgent/awesome-design-md. Tokens
are extracted from each brand's publicly visible CSS/design — not an
endorsement or official design-system release from those companies.

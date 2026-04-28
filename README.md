# Web Design Pipeline

Describe a page in YAML. Get production HTML with award-quality animations — validated for accessibility, performance-budgeted, and screenshot-verified before it ships. No Figma, no Webpack, no design handoff.

This is an AI-native design generation pipeline built on Claude Code. You write a design brief — aesthetic keywords, section layout, motion preferences — and the generator produces semantic HTML, CSS with design tokens, and animation JS (GSAP + Lenis + ScrollTrigger). A validation loop catches HTML errors, WCAG violations, and performance regressions automatically, iterating up to 6 rounds until everything passes.

The same "describe it, validate it, iterate until it's right" pattern from the [3d-printing](../3d-printing/) project — applied to web design instead of OpenSCAD.

## What It Does

- **Brief-driven generation** — YAML design briefs at three complexity tiers (10-line sketch to 150-line spec). A vocabulary system resolves aesthetic keywords like `dark-luxury` or `editorial` into concrete design decisions.
- **Design token pipeline** — briefs produce W3C DTCG tokens that compile to CSS custom properties. Typography scales, color palettes, spacing, motion curves — all derived from the brief, all on `:root`.
- **Automated validation** — every generation pass runs HTML validation (0 errors), axe-core accessibility (WCAG AA), file size budget (<100KB), DOM depth check (<15), and `prefers-reduced-motion` verification
- **Screenshot-driven iteration** — Playwright captures desktop, tablet, and mobile viewports. The generator sees its own output and fixes what's broken — up to 6 rounds.
- **Single-file deployment** — CSS and JS inline for zero-dependency output. Ships to GitHub Pages, Cloudflare, or anywhere that serves static files.

## Designs

| Design | Description | Status |
|:-------|:------------|:-------|
| [claude-portfolio](designs/claude-portfolio/) | Dark-luxury editorial portfolio — Playfair Display, OKLCH palette, scroll-triggered text reveals, cursor spotlight, grain effect | Passing |

## Quick Start

```bash
npm install
npx playwright install chromium

# Validate an existing design
node bin/validate.js designs/claude-portfolio

# Start the dev server
node lib/server.js designs/claude-portfolio

# Run tests
npm test
```

## How It Works

Three specialized agents split the work. The brief-writer translates intent into structured YAML. The generator produces HTML/CSS/JS and iterates against the validation pipeline. The shipper inlines, deploys, and pushes.

```
Brief (YAML)
  → brief-writer reads vocabulary, resolves aesthetic keywords
  → outputs brief.yaml + requirements.md

Generation
  → generator reads brief + patterns + vocabulary
  → produces tokens.json, index.html, style.css, script.js
  → runs validation pipeline (HTML, a11y, perf, screenshots)
  → if FAIL: reads report, fixes, re-validates (max 6 rounds)
  → outputs generation-report.json

Shipping
  → shipper checks generation-report for PASS
  → inlines CSS/JS for single-file output
  → deploys to target (GitHub Pages, Cloudflare)
  → commits and pushes
```

### Vocabulary System

The generator doesn't guess what `dark-luxury` means — it looks it up. Three vocabulary files map keywords to concrete design implications:

- **aesthetics.yaml** — 10+ style keywords (dark-luxury, editorial, brutalist, cyberpunk, swiss...) with color palettes, font pairings, motion profiles, and easing curves
- **motion.yaml** — 20+ animation patterns with complexity tiers (L/M/H), GPU cost ratings, and dependency lists
- **patterns.yaml** — component variant catalog (hero styles, navigation types, scroll behaviors, background effects)

### Validation Budget

| Check | Threshold |
|:------|:----------|
| HTML errors | 0 |
| WCAG AA violations | 0 |
| DOM depth | < 15 |
| Total bundle size | < 100 KB |
| `prefers-reduced-motion` | Required in CSS and JS |

## Project Structure

```
briefs/              Design specifications (YAML)
vocabulary/          Aesthetic, motion, and pattern keyword definitions
patterns/            Detailed pattern docs (hero, nav, scroll, effects)
templates/           Brief and review templates
lib/                 Pipeline tooling (validate, screenshot, tokens, deploy)
bin/                 CLI entry points
designs/             Generated designs (self-contained directories)
.claude/agents/      Agent definitions (brief-writer, generator, shipper)
research/            Project inception research and landscape analysis
tests/               Unit tests + visual regression baselines
```

## Tech Stack

Node.js 20+ (ESM) · GSAP + Lenis + ScrollTrigger · Three.js (optional) · Playwright + axe-core · html-validate · Stylelint · Lighthouse CI

No runtime dependencies — output is vanilla HTML/CSS/JS. The pipeline tooling is dev-only.

## License

MIT


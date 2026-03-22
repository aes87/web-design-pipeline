@../../CLAUDE.md

# Web Design Pipeline

## Overview

Claude Code-native pipeline for generating award-quality web pages from structured design briefs. Claude reads YAML briefs, generates production HTML/CSS/JS with advanced animations, validates via Playwright screenshots + axe-core, and iterates until convergence.

## Tech Stack
- Language: JavaScript (ESM), HTML, CSS, GLSL
- Runtime: Node.js 20+
- Animation: GSAP (free) + Lenis + ScrollTrigger
- 3D/WebGL: Three.js (when needed)
- Validation: Playwright, axe-core, html-validate, pixelmatch
- Package manager: npm

## Commands
```bash
# Install dependencies
npm install

# Validate a design (screenshots + a11y + perf)
node bin/validate.js designs/<name>

# Start dev server for a design
node lib/server.js designs/<name>

# Run visual regression tests
npx playwright test
```

## Core Workflow

### The Generation Loop
1. User provides a **design brief** (YAML) in `briefs/`
2. Claude reads brief + vocabulary + pattern docs
3. Claude generates `index.html`, `style.css`, `script.js` in `designs/<name>/`
4. Validation pipeline runs: HTML, a11y, perf, screenshots
5. Claude reads report + views screenshots, makes surgical edits
6. Repeat (max 6 rounds) until all checks pass

### Design Brief Tiers
- **Tier 1** (Quick, 10-20 lines): Style keywords + content. Claude infers the rest.
- **Tier 2** (Standard, 50-100 lines): Palette, typography, layout, motion specified.
- **Tier 3** (Full, 150+ lines): Every token explicit. No inference.
- Templates in `templates/brief-*.yaml`

### Design Tokens Flow
```
Brief (YAML) → W3C DTCG Tokens (JSON) → CSS Custom Properties (:root)
```

## Project Structure
```
web-design-pipeline/
├── briefs/             # User's design specifications (YAML)
├── vocabulary/         # Aesthetic keywords, pattern catalog, motion catalog
├── patterns/           # Detailed pattern descriptions (markdown)
│   └── effects/        # Background, typography, image, cursor effects
├── templates/          # Brief + review templates
├── lib/                # Pipeline tooling (server, screenshot, validate, tokens)
├── bin/                # CLI entry points
├── .claude/agents/     # Agent definitions (brief-writer, generator, shipper)
├── designs/            # Generated designs (each self-contained)
│   └── <name>/
│       ├── brief.yaml, tokens.json
│       ├── index.html, style.css, script.js
│       ├── assets/
│       └── output/ (screenshots, reports, iterations)
├── examples/           # Reference implementations
├── research/           # Research reports from project inception
└── tests/              # Visual regression baselines
```

## Conventions

### Generated Code
- Semantic HTML5, ARIA attributes, proper heading hierarchy
- CSS: BEM naming (`block__element--modifier`), design tokens as custom properties on `:root`
- JS: Progressive enhancement only — page must be readable with JS disabled
- Every animation respects `prefers-reduced-motion: reduce`
- Performance budget: HTML+CSS+JS < 100KB (excluding CDN libs)

### Animation Stack
- **GSAP** (core + ScrollTrigger + SplitText + MorphSVG) for complex timelines
- **Lenis** for smooth scrolling
- **CSS-native** (`@starting-style`, `animation-timeline`, View Transitions) for progressive enhancement
- **Three.js + GLSL** for shader backgrounds and 3D when specified in brief
- Load from CDN: `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js` (and plugins)

### Validation Rules
- 0 HTML validation errors
- 0 critical/serious WCAG AA violations (axe-core)
- DOM depth < 15 levels
- Average animation FPS > 55 over 2 seconds
- All screenshots captured at: desktop (1280x800), tablet (768x1024), mobile (375x667)

### Pattern Library
- Patterns live in `patterns/*.md` as prose descriptions, NOT code templates
- Each pattern documents: CSS property contract, HTML skeleton, animation choreography, a11y requirements, complexity tier, performance cost
- Claude composes fresh implementations for each brief — no copy-paste from templates

### Design Iteration
- Structured review feedback in YAML (see `templates/review.yaml`)
- Section-level feedback → edit that section
- Global adjustments → modify `:root` tokens
- Token overrides → update specific CSS custom property values
- Target convergence in 2-4 iterations

## Agent Definitions
- `brief-writer` (sonnet): Natural language → structured YAML brief
- `generator` (opus): Core agent — reads brief + patterns, generates code, iterates against validation
- `shipper` (sonnet): Deploy, commit, push

## When Working Here
1. Read this CLAUDE.md and `PROPOSAL.md` for full context
2. Check `vocabulary/` for available aesthetic keywords and patterns
3. Check `patterns/` for implementation guidance on specific components
4. Run `node bin/validate.js designs/<name>` after generating or modifying a design
5. Always respect `prefers-reduced-motion` in generated CSS/JS
6. Keep generated code in separate files (HTML, CSS, JS) for diff-friendly editing

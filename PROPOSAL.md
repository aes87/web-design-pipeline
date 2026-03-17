# Web Design Pipeline — Project Proposal

A Claude Code-native pipeline for generating award-quality web pages from structured design briefs. Claude is both the designer and the developer — it reads specs, writes production HTML/CSS/JS, validates output, and iterates against automated feedback.

---

## 1. Vision

Most AI-assisted web design tools generate mediocre templates. This pipeline targets a different tier: **Awwwards-level output** — scroll-driven narratives, kinetic typography, shader backgrounds, choreographed animations — generated and refined entirely within Claude Code.

The core loop is borrowed from the proven `3d-printing` project: **generate → validate → screenshot → fix → repeat** (the "Ralph Wiggum loop"). Instead of OpenSCAD → STL, it's design brief → HTML/CSS/JS. Instead of mesh analysis, it's Playwright screenshots + axe-core + Lighthouse.

### What This Is

- A structured workflow for Claude Code to produce production web pages
- A design intake system (YAML briefs → design tokens → generated code)
- A validation pipeline (accessibility, performance, visual regression)
- A pattern library Claude reads as context (not a runtime component library)

### What This Is Not

- Not an AI image generator — Claude writes code, browsers render it
- Not a screenshot-to-code converter — Claude reads structured specs, not pixels
- Not a CMS or site builder — output is standalone HTML/CSS/JS
- Not a component framework — patterns are descriptions, not importable modules

---

## 2. Recommended Tech Stack

### Core Output (What Gets Generated)

| Layer | Tool | Rationale |
|-------|------|-----------|
| **Markup** | Semantic HTML5 | No framework runtime. Accessible, portable, fast. |
| **Styling** | Vanilla CSS + custom properties | Maximum animation control. Design tokens as `--var`. |
| **Animation** | GSAP (core + ScrollTrigger + SplitText + MorphSVG) | Industry standard, now 100% free (Webflow acquisition). ~33KB gzip. |
| **Smooth scroll** | Lenis | 3KB. Doesn't break `position: sticky`. Dominant in award-winning sites. |
| **3D/WebGL** | Three.js + GLSL shaders | When needed. Shader backgrounds, particle systems, 3D integration. |
| **Page transitions** | View Transitions API | Native browser spec, cross-browser in 2026. Barba.js as fallback. |
| **CSS enhancement** | `@starting-style`, `animation-timeline`, `@property` | Progressive enhancement — CSS-native where possible, GSAP for complex. |

### Pipeline Tooling (What Powers the Workflow)

| Tool | Purpose | Notes |
|------|---------|-------|
| **Playwright** | Screenshots + visual regression + a11y | Multi-viewport captures. Reuse `web-auto` infra. |
| **axe-core** | Accessibility validation | WCAG 2.1 AA via `@axe-core/playwright`. |
| **html-validate** | HTML validation | Already globally installed in devcontainer. |
| **pixelmatch** | Visual regression | Compare iterations pixel-by-pixel. |
| **Node HTTP server** | Dev preview | ~30-line static server. No framework needed. |
| **SVGO** | SVG optimization | Build-time cleanup of generated SVGs. |
| **sharp** | Image optimization | Resize, format conversion (WebP/AVIF). |

### Why Not [Framework X]?

**Astro/Vite**: Considered as primary framework. Deferred to Phase 2 — the core pipeline generates standalone HTML/CSS/JS that deploys anywhere with zero build step. This matches the proven workspace pattern (page-template.html, strain-guide.html). Astro becomes valuable when scaling to multi-page sites with shared components, and can be layered on later without rearchitecting.

**Tailwind CSS**: The design token system uses CSS custom properties directly. For single-file output, Tailwind adds a build dependency for marginal benefit. Tokens are authored as `:root` vars, which is what Tailwind v4's `@theme` compiles to anyway.

**React/Next.js**: Eliminated. Largest dependency footprint, most complex mental model for Claude, and the output doesn't need a runtime framework. GSAP's imperative API is a better fit than React's declarative model for animation-heavy pages.

---

## 3. Design Intake System

### Three-Tier Design Briefs (YAML)

Users describe design intent in YAML briefs at whatever detail level they want:

**Tier 1 — Quick Brief** (10-20 lines): Style keywords + content outline. Claude infers everything else.
```yaml
aesthetic:
  style: [dark-luxury, editorial]
  mood: [sophisticated, high-contrast]
color:
  approach: generate        # Claude derives palette from aesthetic
motion:
  level: full
  patterns: [scroll-reveal, text-reveal, parallax-layers]
pages:
  - id: home
    sections:
      - type: hero
        variant: animated-text-reveal
        content:
          headline: "Design is how it works."
constraints:
  output: single-file-html
```

**Tier 2 — Standard** (50-100 lines): Specifies palette, typography, layout, motion. Claude fills gaps.

**Tier 3 — Full Specification** (150+ lines): Every token explicit. Claude generates exactly what's specified.

### Aesthetic Vocabulary

Each keyword expands into default design decisions:

| Keyword | Colors | Motion | Layout | Type |
|---------|--------|--------|--------|------|
| `dark-luxury` | Deep blacks, gold/cream accents | Smooth, slow, dramatic | Generous whitespace | Elegant serif or geometric sans |
| `brutalist` | High contrast, monochrome | Minimal, abrupt | Asymmetric, overlapping | Mono or heavy sans, extreme sizes |
| `glassmorphism` | Translucent layers, blur | Smooth, layered parallax | Overlapping cards, depth | Clean sans-serif |
| `editorial` | Limited palette, b&w + accent | Scroll-driven reveals | Magazine grid | Strong serif/sans pairing |
| `cyberpunk` | Neon on dark, RGB splits | Glitch, scan-lines, fast | Dense, info-heavy | Mono, condensed sans |
| `organic` | Earth tones, muted | Gentle, flowing | Curved containers | Humanist or rounded |
| `japanese-minimalism` | Muted, natural, white | Subtle, zen-like | Extreme whitespace | Thin, delicate |

Full vocabulary: 15+ keywords in `vocabulary/aesthetics.yaml`.

### Design Tokens

Briefs generate W3C DTCG-format tokens (JSON), which Claude emits as CSS custom properties:

```
Brief (YAML) → Tokens (JSON) → CSS Custom Properties (:root)
```

Token tiers: **Primitive** (raw values) → **Semantic** (intent mapping) → **Component** (usage). Theme swaps only require changing the semantic layer.

### Reference Analysis

Users can point to URLs or screenshots. Claude fetches live sites and extracts color, typography, layout, and motion patterns. Screenshots get analyzed via Claude's vision capabilities. Both feed into a structured analysis that augments the brief.

```yaml
references:
  - url: "https://stripe.com/press"
    note: "Like the typography hierarchy and whitespace"
  - screenshot: "./refs/hero-example.png"
    note: "This color palette direction, but darker"
```

---

## 4. Component Pattern Library

Patterns are markdown descriptions Claude reads as context — not code templates. This avoids staleness and lets Claude compose fresh implementations for each brief.

### Pattern Categories

**Hero Sections** (8 variants)
`static-centered` · `animated-text-reveal` · `video-background` · `parallax-layers` · `3d-scene` · `split-screen` · `interactive-canvas` · `gradient-morph`

**Navigation** (6 variants)
`sticky-minimal` · `morphing-header` · `hamburger-fullscreen` · `sidebar-persistent` · `bottom-bar-mobile` · `command-palette`

**Content Sections** (13 variants)
`bento-grid` · `bento-asymmetric` · `scroll-reveal-cards` · `timeline-vertical` · `timeline-horizontal` · `split-image-text` · `masonry` · `accordion-faq` · `tabbed-content` · `stats-counter` · `testimonial-carousel` · `feature-comparison` · `pricing-table`

**Micro-Interactions** (10 patterns)
`hover-lift` · `hover-glow` · `magnetic-button` · `cursor-spotlight` · `text-gradient-hover` · `underline-draw` · `button-ripple` · `focus-ring` · `image-reveal` · `counter-tick`

**Scroll Sections** (8 patterns)
`pin-and-reveal` · `horizontal-scroll` · `sticky-stack` · `parallax-layers` · `zoom-tunnel` · `chapter-snap` · `progress-driven` · `batch-reveal`

**Page Transitions** (6 patterns)
`crossfade` · `slide-directional` · `curtain-wipe` · `zoom-morph` · `shared-element` · `webgl-dissolve`

**Background Effects** (6 patterns)
`grain-noise` · `gradient-mesh` · `shader-noise` · `particle-field` · `fluid-simulation` · `aurora`

Each pattern file documents: CSS custom property contract, HTML structure, animation choreography, accessibility requirements, complexity tier (CSS-only / CSS+GSAP / WebGL), and performance cost (1-5 scale).

---

## 5. Generation Pipeline

### The Loop

```
User provides design brief (YAML)
        │
        ▼
  ┌─────────────────────────────┐
  │  Claude reads brief +       │
  │  tokens + pattern docs      │
  │  Generates HTML/CSS/JS      │
  └─────────┬───────────────────┘
            │
            ▼
  ┌─────────────────────────────┐
  │  Start dev server           │
  │  Playwright captures        │
  │  3 viewports (screenshots)  │
  └─────────┬───────────────────┘
            │
            ▼
  ┌─────────────────────────────┐
  │  Validation pipeline        │
  │  • HTML validation          │
  │  • CSS validation           │
  │  • axe-core accessibility   │
  │  • Performance budget       │
  │  • Visual regression        │
  │  • Animation FPS check      │
  └─────────┬───────────────────┘
            │
            ▼
  ┌─────────────────────────────┐
  │  Claude reads report +      │
  │  views screenshots (PNG)    │
  │  Makes surgical edits       │
  └─────────┬───────────────────┘
            │
            ▼
       Pass? ───No──→ Loop (max 6 rounds)
        │
       Yes
        │
        ▼
  Output: production HTML/CSS/JS
```

### Validation Checks

| Check | Tool | Pass Criteria |
|-------|------|---------------|
| HTML | html-validate | 0 errors |
| Accessibility | axe-core | 0 critical/serious WCAG AA violations |
| Performance budget | Custom | HTML+CSS+JS < 100KB (excl. libs) |
| DOM depth | Custom | < 15 levels |
| Screenshot capture | Playwright | Desktop (1280), tablet (768), mobile (375) |
| Visual regression | pixelmatch | < 1% delta between iterations |
| Animation FPS | Performance API | Average > 55fps over 2s |

### Diff-Friendly Architecture

Code is separated into distinct files so Claude's Edit tool can make targeted changes:

```
designs/<name>/
├── brief.yaml              # Input: design specification
├── tokens.json             # Generated: W3C DTCG tokens
├── index.html              # Generated: semantic HTML structure
├── style.css               # Generated: all styles + animations
├── script.js               # Generated: progressive enhancement JS
├── assets/                 # SVGs, shaders, images
└── output/
    ├── screenshots/        # Playwright captures per viewport
    ├── report.json         # Validation results
    └── iterations/         # Round-by-round snapshots
```

---

## 6. Iteration & Review Workflow

### Structured Review Format

Users provide feedback in a structured YAML format that maps directly to code changes:

```yaml
review:
  overall_impression: 7/10
  sections:
    - id: hero
      status: needs-revision     # approved | needs-revision | rethink
      feedback:
        - area: animation
          issue: "Text reveal is too fast"
          suggestion: "Slow stagger to 100ms, duration to 1.5s"
  global:
    - category: motion
      change: "Increase all durations by 30%"
  token_overrides:
    "motion.duration.base": "400ms"
    "semantic.accent.primary": "oklch(0.75 0.11 55)"
```

### Convergence Heuristics

- **Iteration 1**: Structure, layout, typography
- **Iteration 2**: Color, spacing, motion timing
- **Iteration 3**: Polish micro-interactions, responsive edge cases
- **Target**: Converge in 2-4 iterations. If 5+ needed, rewrite the brief.

---

## 7. Agent Architecture

Modeled on the 3d-printing project's agent system:

| Agent | Model | Role |
|-------|-------|------|
| **brief-writer** | sonnet | Translate user's natural language into structured YAML brief |
| **generator** | opus | Core agent: reads brief + patterns, writes HTML/CSS/JS, iterates against validation |
| **validator** | (script) | Not an LLM — Node.js script that runs all checks, captures screenshots |
| **shipper** | sonnet | Copy to deployment dir, commit + push |

Communication is file-based: agents read/write to the design directory. The orchestrator (main Claude conversation) manages user dialogue and dispatches agents.

---

## 8. Project Structure

```
projects/web-design-pipeline/
├── CLAUDE.md                           # Pipeline instructions
├── package.json                        # ESM, dependencies
├── README.md
│
├── briefs/                             # User's design specifications
│   └── _template.yaml                  # Brief template (Tier 2)
│
├── vocabulary/                         # Design vocabulary reference
│   ├── aesthetics.yaml                 # Style keywords + default mappings
│   ├── patterns.yaml                   # Component pattern catalog (summary)
│   └── motion.yaml                     # Motion pattern catalog
│
├── patterns/                           # Detailed pattern descriptions
│   ├── hero.md
│   ├── navigation.md
│   ├── content-sections.md
│   ├── micro-interactions.md
│   ├── scroll-sections.md
│   ├── page-transitions.md
│   └── effects/
│       ├── backgrounds.md
│       ├── typography-animation.md
│       ├── image-reveals.md
│       └── cursors.md
│
├── templates/                          # Review + brief templates
│   ├── brief-quick.yaml               # Tier 1 (10-20 lines)
│   ├── brief-standard.yaml            # Tier 2 (50-100 lines)
│   ├── brief-full.yaml                # Tier 3 (150+ lines)
│   └── review.yaml                    # Structured review template
│
├── lib/                                # Pipeline tooling (Node.js ESM)
│   ├── server.js                       # Static dev server (~30 lines)
│   ├── screenshot.js                   # Playwright multi-viewport capture
│   ├── validate.js                     # Single-pass validation runner
│   └── tokens.js                       # Brief YAML → CSS custom properties
│
├── bin/                                # CLI entry points
│   └── validate.js                     # `node bin/validate.js designs/<name>`
│
├── .claude/
│   └── agents/                         # Claude Code agent definitions
│       ├── brief-writer.md             # Translates natural language → YAML
│       ├── generator.md                # Core generation + iteration agent
│       └── shipper.md                  # Deploy + commit
│
├── designs/                            # Generated designs (each is self-contained)
│   └── <name>/
│       ├── brief.yaml
│       ├── tokens.json
│       ├── index.html
│       ├── style.css
│       ├── script.js
│       ├── assets/
│       └── output/
│
├── examples/                           # Reference implementations
│   ├── dark-luxury-portfolio/
│   └── glassmorphism-landing/
│
├── research/                           # Research reports (move existing)
│   ├── animation-frameworks.md
│   ├── design-intake.md
│   ├── build-toolchain.md
│   ├── award-winning-patterns.md
│   └── claude-native-codegen.md
│
└── tests/
    ├── visual/                         # Visual regression baselines
    └── playwright.config.js
```

---

## 9. Build Phases

### Phase 1 — Foundation (Core Pipeline)
1. Project scaffold: `CLAUDE.md`, `package.json`, directory structure
2. `lib/server.js` — static dev server
3. `lib/screenshot.js` — Playwright multi-viewport capture
4. `lib/validate.js` — HTML, a11y, performance budget checks
5. `bin/validate.js` — CLI entry point
6. Brief template (`_template.yaml`) and review template
7. Vocabulary files: `aesthetics.yaml`, `patterns.yaml`, `motion.yaml`
8. First 5 pattern docs: hero, navigation, content-sections, micro-interactions, effects/backgrounds

### Phase 2 — Agent System
9. `.claude/agents/brief-writer.md`
10. `.claude/agents/generator.md` (the core generation agent with iteration loop)
11. `.claude/agents/shipper.md`
12. `lib/tokens.js` — brief YAML → CSS custom property generation

### Phase 3 — Advanced Validation
13. Visual regression via pixelmatch
14. Animation FPS profiling
15. Lighthouse-lite checks (DOM depth, render-blocking resources)

### Phase 4 — Pattern Expansion
16. Remaining pattern docs (scroll-sections, page-transitions, cursors, etc.)
17. Effect patterns (shader backgrounds, gradient mesh, particle fields)
18. WebGL/Three.js patterns for advanced backgrounds
19. Example designs (dark-luxury-portfolio, glassmorphism-landing)

### Phase 5 — Multi-Page (Optional)
20. Astro 6 integration for multi-page sites
21. Tailwind v4 for design token distribution
22. Shared layout/component system
23. Gallery pages as living documentation

---

## 10. Dependencies

```json
{
  "type": "module",
  "dependencies": {},
  "devDependencies": {
    "playwright": "^1.58",
    "@axe-core/playwright": "^4.10",
    "pixelmatch": "^6.0",
    "pngjs": "^7.0",
    "svgo": "^4.0"
  }
}
```

Total: 5 dev dependencies. No runtime deps — the generated code is vanilla HTML/CSS/JS that loads GSAP/Lenis from CDN (or bundled for offline). Pipeline tooling is dev-only.

---

## 11. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | None (vanilla) | Maximum portability. Zero build step. Deploy anywhere. |
| Animation engine | GSAP | Free, dominant in award winners, imperative API ideal for Claude code-gen. |
| Smooth scroll | Lenis | 3KB, doesn't break sticky, universal in creative dev. |
| CSS approach | Custom properties | No build dependency. Tokens are native CSS. |
| Pattern storage | Markdown docs | Claude reads them as context. Avoids stale templates. |
| Validation loop | 3d-printing model | Proven generate → validate → fix pattern. Max 6 rounds. |
| Design briefs | YAML (3 tiers) | Human-readable, supports comments, graduated complexity. |
| Token format | W3C DTCG JSON | Industry standard, tool interoperable. |
| Output format | Standalone HTML/CSS/JS | Single-file or multi-file. No runtime dependencies. |
| Accessibility | WCAG AA minimum | Every design respects `prefers-reduced-motion`. |

---

## 12. What "Extremely Evolved" Means Here

This pipeline doesn't just make pretty pages. It systematizes the techniques that win Awwwards:

1. **Animation choreography** — precise timing, sequencing, and easing from structured motion tokens
2. **Scroll as narrative** — Lenis + ScrollTrigger for intentional content pacing
3. **Typography as hero** — SplitText reveals, kinetic type, variable font animation
4. **Cohesive motion language** — every animation uses the brief's easing curves and duration scale
5. **Shader backgrounds** — GLSL noise, gradient mesh, particle fields when the brief calls for it
6. **Performance under complexity** — validation enforces 60fps, CWV budgets, progressive enhancement
7. **Restraint** — `prefers-reduced-motion` is not optional, and the pattern library knows when NOT to animate

The pipeline makes this repeatable. Each brief feeds the same machine: structured intent → validated production code → iteration until convergence.

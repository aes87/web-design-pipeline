# AI-Driven Web Design Pipeline: Intake & Specification System

Research report on structuring a design intake system where a user provides structured design intent to Claude, which then generates production-quality web pages with advanced animations.

---

## Table of Contents

1. [Design Intent Specification Format](#1-design-intent-specification-format)
2. [Design Token System](#2-design-token-system)
3. [Component Pattern Library](#3-component-pattern-library)
4. [Reference Analysis](#4-reference-analysis)
5. [Iteration Workflow](#5-iteration-workflow)
6. [Implementation Roadmap](#6-implementation-roadmap)

---

## 1. Design Intent Specification Format

The design brief is the primary input artifact. It captures the user's aesthetic vision, functional requirements, and constraints in a machine-readable format that Claude can consume directly.

### 1.1 Format Choice: YAML

YAML wins over JSON for the brief itself because it supports comments (the user can annotate their reasoning), is more readable for non-developers, and has less syntactic noise. The generated design tokens downstream are JSON (W3C DTCG standard), but the human-authored brief is YAML.

### 1.2 Complete Design Brief Schema

```yaml
# ============================================================
# WEB DESIGN BRIEF
# ============================================================
# This file defines the complete design intent for a web page
# or site. Claude consumes this to generate production HTML/CSS/JS.
# ============================================================

meta:
  project: "Portfolio Site Redesign"
  version: 1
  date: 2026-03-16
  author: "User Name"
  target_url: "https://example.com"  # optional: where this will be deployed

# ----------------------------------------------------------
# AESTHETIC DIRECTION
# ----------------------------------------------------------
aesthetic:
  # Primary style keyword(s) — sets the overall tone.
  # Pick 1-3 from the vocabulary below, or define your own.
  #
  # Vocabulary:
  #   brutalist, minimalist, maximalist, organic, geometric,
  #   glassmorphism, neumorphism, dark-luxury, editorial,
  #   retro-futurism, swiss, japanese-minimalism, cyberpunk,
  #   bauhaus, art-deco, vaporwave, corporate-clean,
  #   handcrafted, magazine, dashboard, immersive
  #
  style:
    - dark-luxury
    - editorial

  # Mood descriptors — adjectives that guide the "feel."
  mood:
    - sophisticated
    - quiet confidence
    - high contrast
    - deliberate whitespace

  # Anti-patterns — what this should NOT feel like.
  avoid:
    - cluttered
    - playful / whimsical
    - stock-photo corporate
    - rounded-everything friendly SaaS

  # Optional: reference URLs or screenshots (paths relative to brief).
  references:
    - url: "https://stripe.com/press"
      note: "Like the typography hierarchy and whitespace"
    - url: "https://linear.app"
      note: "Navigation feel and motion quality"
    - screenshot: "./refs/competitor-hero.png"
      note: "This color palette direction, but darker"

# ----------------------------------------------------------
# COLOR PALETTE
# ----------------------------------------------------------
color:
  # Approach: "specify" (user provides exact values) or
  #           "generate" (Claude derives from mood/references) or
  #           "extract" (pull from reference URLs/screenshots)
  approach: specify

  # Color mode: which color space to author in.
  # Options: hex, hsl, oklch, p3
  # oklch recommended for perceptual uniformity.
  mode: oklch

  palette:
    # Semantic color roles
    background:
      base: "oklch(0.13 0.01 260)"       # Near-black with blue undertone
      surface: "oklch(0.18 0.01 260)"     # Elevated surface
      elevated: "oklch(0.23 0.015 260)"   # Cards, modals
    foreground:
      base: "oklch(0.95 0.01 90)"         # Off-white text
      muted: "oklch(0.65 0.02 260)"       # Secondary text
      subtle: "oklch(0.45 0.015 260)"     # Tertiary text
    accent:
      primary: "oklch(0.75 0.15 55)"      # Warm gold
      secondary: "oklch(0.65 0.10 280)"   # Muted violet
      interactive: "oklch(0.80 0.12 55)"  # Hover state of primary
    semantic:
      success: "oklch(0.72 0.15 155)"
      warning: "oklch(0.80 0.15 80)"
      error: "oklch(0.65 0.20 25)"
    border:
      subtle: "oklch(0.25 0.01 260)"
      default: "oklch(0.35 0.015 260)"

# ----------------------------------------------------------
# TYPOGRAPHY
# ----------------------------------------------------------
typography:
  # Font loading strategy: "google-fonts", "local", "system-stack", "variable"
  loading: google-fonts

  fonts:
    heading:
      family: "PP Neue Montreal"
      fallback: "'Helvetica Neue', Helvetica, Arial, sans-serif"
      weight_range: [500, 700]            # available weights
    body:
      family: "Inter"
      fallback: "system-ui, -apple-system, sans-serif"
      weight_range: [400, 500, 600]
    mono:
      family: "JetBrains Mono"
      fallback: "'SF Mono', 'Fira Code', monospace"
      weight_range: [400, 500]

  # Type scale — ratio-based or explicit sizes.
  scale:
    method: ratio                          # "ratio" or "explicit"
    base_size: "1rem"                      # 16px default
    ratio: 1.25                            # Major third
    line_height:
      tight: 1.1                           # Headings
      base: 1.5                            # Body
      relaxed: 1.75                        # Long-form reading

  # Named type styles (used in component specs)
  styles:
    display:
      size_step: 6                         # 6 steps up from base = ~3.8rem
      weight: 700
      tracking: "-0.03em"
      line_height: tight
    h1:
      size_step: 5
      weight: 700
      tracking: "-0.025em"
      line_height: tight
    h2:
      size_step: 4
      weight: 600
      tracking: "-0.02em"
      line_height: tight
    h3:
      size_step: 3
      weight: 600
      tracking: "-0.01em"
      line_height: tight
    body:
      size_step: 0
      weight: 400
      tracking: "0"
      line_height: base
    body_large:
      size_step: 1
      weight: 400
      tracking: "0"
      line_height: base
    caption:
      size_step: -1
      weight: 400
      tracking: "0.01em"
      line_height: base
    overline:
      size_step: -1
      weight: 600
      tracking: "0.08em"
      text_transform: uppercase
      line_height: tight

# ----------------------------------------------------------
# LAYOUT
# ----------------------------------------------------------
layout:
  # Philosophy: "grid", "asymmetric", "magazine", "full-bleed",
  #             "single-column", "bento", "dashboard"
  philosophy: magazine

  grid:
    columns: 12
    gutter: "1.5rem"
    max_width: "1400px"
    margin: "clamp(1rem, 5vw, 4rem)"      # Responsive margin

  breakpoints:
    sm: "640px"
    md: "768px"
    lg: "1024px"
    xl: "1280px"
    xxl: "1536px"

  spacing_scale:
    method: ratio                          # "ratio" or "explicit"
    base: "0.5rem"                         # 8px
    ratio: 2                               # Doubling: 8, 16, 32, 64, 128
    # Generates: 3xs=0.125rem, 2xs=0.25rem, xs=0.5rem, sm=1rem,
    #            md=2rem, lg=4rem, xl=8rem, 2xl=16rem

  # Vertical rhythm
  section_spacing: "lg"                    # Space between page sections
  component_spacing: "md"                  # Space between components within a section

# ----------------------------------------------------------
# MOTION & ANIMATION
# ----------------------------------------------------------
motion:
  # Overall motion preference
  # "full" = rich animations, "reduced" = subtle/functional only,
  # "none" = no animation (prefers-reduced-motion always respected)
  level: full

  # Easing curves (cubic-bezier P1x, P1y, P2x, P2y)
  easing:
    # Standard — most UI transitions
    standard: [0.2, 0, 0, 1]
    # Entrance — elements appearing
    entrance: [0, 0, 0.2, 1]
    # Exit — elements leaving
    exit: [0.4, 0, 1, 1]
    # Dramatic — hero animations, reveals
    dramatic: [0.7, 0, 0.2, 1]
    # Spring-like — playful micro-interactions
    spring: [0.34, 1.56, 0.64, 1]

  # Duration scale
  duration:
    instant: "100ms"
    fast: "200ms"
    base: "300ms"
    slow: "500ms"
    slower: "800ms"
    dramatic: "1200ms"

  # Choreography rules
  choreography:
    # Stagger delay between sequenced child elements
    stagger_delay: "60ms"
    # Maximum total stagger time (prevents long waits)
    max_stagger: "600ms"
    # Scroll-triggered animation threshold (% visible before triggering)
    scroll_trigger_threshold: 0.15
    # Page-level entrance: "cascade" (top-down), "center-out", "random"
    page_entrance: cascade

  # Specific animation patterns to include
  patterns:
    - scroll-reveal           # Elements animate in on scroll
    - parallax-layers         # Depth-shifted scroll speeds
    - text-reveal             # Character/word/line animation on headlines
    - hover-lift              # Cards lift on hover with shadow
    - magnetic-cursor         # Buttons/links attract toward cursor
    - smooth-scroll           # Smooth anchor scrolling
    - page-transition         # View transitions between pages (if multi-page)

# ----------------------------------------------------------
# EFFECTS & DETAILS
# ----------------------------------------------------------
effects:
  shadows:
    # Shadow style: "sharp", "soft", "layered", "none"
    style: layered
    # Each level is an array of shadow values (for layered realism)
    levels:
      sm:
        - "0 1px 2px oklch(0 0 0 / 0.15)"
        - "0 1px 3px oklch(0 0 0 / 0.10)"
      md:
        - "0 2px 4px oklch(0 0 0 / 0.15)"
        - "0 4px 12px oklch(0 0 0 / 0.10)"
        - "0 1px 2px oklch(0 0 0 / 0.08)"
      lg:
        - "0 8px 24px oklch(0 0 0 / 0.15)"
        - "0 16px 48px oklch(0 0 0 / 0.10)"
        - "0 2px 4px oklch(0 0 0 / 0.08)"

  borders:
    radius:
      none: "0"
      sm: "0.25rem"
      md: "0.5rem"
      lg: "1rem"
      xl: "1.5rem"
      full: "9999px"
    default_radius: "sm"                   # What most elements get

  blur:
    backdrop_sm: "8px"
    backdrop_md: "16px"
    backdrop_lg: "40px"

  gradients:
    # Named gradients used across the design
    hero_fade: "linear-gradient(to bottom, transparent, var(--color-bg-base))"
    accent_glow: "radial-gradient(ellipse at center, oklch(0.75 0.15 55 / 0.15), transparent 70%)"

# ----------------------------------------------------------
# PAGE STRUCTURE
# ----------------------------------------------------------
pages:
  - id: home
    sections:
      - type: hero
        variant: "animated-text-reveal"    # See Component Pattern Library
        content:
          headline: "Design is how it works."
          subheadline: "Strategic design for products that matter."
          cta:
            primary: { text: "View Work", href: "#work" }
            secondary: { text: "About", href: "#about" }

      - type: work-grid
        variant: "bento-asymmetric"
        content:
          items: 6                          # Number of portfolio items
          layout: "2-col-featured"          # First item is large

      - type: about
        variant: "split-image-text"
        content:
          body: |
            Body text goes here. Supports markdown.

      - type: contact
        variant: "minimal-form"
        fields: [name, email, message]

# ----------------------------------------------------------
# TECHNICAL CONSTRAINTS
# ----------------------------------------------------------
constraints:
  # Output format
  output: "single-file-html"               # or "multi-file", "astro", "next"
  # Target: what this must run on
  target: "github-pages"                   # static hosting, no server
  # Performance budget
  performance:
    largest_contentful_paint: "2.5s"
    cumulative_layout_shift: 0.1
    total_bundle_size: "150kb"             # CSS + JS combined
  # Browser support
  browsers: "last 2 versions"
  # Accessibility
  accessibility:
    level: "WCAG-AA"
    prefers_reduced_motion: required        # Must respect this media query
    prefers_color_scheme: optional          # Dark-only is fine
  # Assets: can Claude generate placeholder SVGs, or are real assets provided?
  assets: "generate-placeholders"           # or "provided" with path
```

### 1.3 Brief Complexity Tiers

Not every project needs a 200-line YAML file. The system supports three tiers:

**Tier 1 -- Quick Brief** (10-20 lines): Style keywords, color direction, page type, content outline. Claude infers everything else from the aesthetic vocabulary.

```yaml
aesthetic:
  style: [glassmorphism, dark-luxury]
  mood: [ethereal, premium]
color:
  approach: generate
motion:
  level: full
  patterns: [scroll-reveal, text-reveal, parallax-layers]
pages:
  - id: home
    sections:
      - type: hero
        variant: animated-text-reveal
        content:
          headline: "The future is translucent."
constraints:
  output: single-file-html
```

**Tier 2 -- Standard Brief** (50-100 lines): Specifies palette, typography, key layout choices, and motion preferences. Claude fills gaps.

**Tier 3 -- Full Specification** (150+ lines): The complete schema above. Every token is explicit. Claude generates exactly what is specified with no inference.

### 1.4 Aesthetic Vocabulary Reference

A controlled vocabulary ensures consistent interpretation. Each keyword maps to a set of implied design decisions:

| Keyword | Implied Colors | Implied Motion | Implied Layout | Implied Typography |
|---------|---------------|---------------|---------------|-------------------|
| `brutalist` | High contrast, monochrome, raw | Minimal, abrupt | Asymmetric, overlapping | Mono or heavy sans, extreme sizes |
| `dark-luxury` | Deep blacks, gold/cream accents | Smooth, slow, dramatic | Generous whitespace | Elegant serif or geometric sans |
| `glassmorphism` | Translucent layers, blur | Smooth, layered parallax | Overlapping cards, depth | Clean sans-serif |
| `organic` | Earth tones, muted | Gentle, flowing | Curved containers, fluid | Humanist or rounded |
| `editorial` | Limited palette, b&w + accent | Scroll-driven reveals | Magazine grid, asymmetric | Strong serif/sans pairing |
| `cyberpunk` | Neon on dark, RGB splits | Glitch, scan-lines, fast | Dense, information-heavy | Mono, condensed sans |
| `swiss` | Clean, systematic | Functional, subtle | Strict grid, aligned | Helvetica-like, systematic |
| `retro-futurism` | Warm darks, chrome, gradient | Smooth with retro easing | Centered, symmetrical | Geometric, wide |
| `japanese-minimalism` | Muted, natural, lots of white | Subtle, zen-like | Extreme whitespace, asymmetric | Thin, delicate |
| `maximalist` | Saturated, many colors | Energetic, layered | Dense, overlapping, collage | Mixed, decorative |

Each keyword functions as a macro that expands into default token values -- which the user can then override selectively.

---

## 2. Design Token System

### 2.1 Standard: W3C DTCG Format (2025.10)

The design token system follows the W3C Design Tokens Community Group specification, which reached its first stable release in October 2025. This format is vendor-neutral, has broad tooling support (Style Dictionary, Tokens Studio, Terrazzo), and uses JSON with `$`-prefixed properties.

### 2.2 Token Architecture

Tokens are organized in three tiers:

```
TIER 1: Primitive Tokens     (raw values — "blue-500 is oklch(0.65 0.15 250)")
    ↓
TIER 2: Semantic Tokens      (intent — "color-accent-primary references blue-500")
    ↓
TIER 3: Component Tokens     (usage — "button-bg references color-accent-primary")
```

This layering means swapping a theme only requires changing Tier 2 mappings.

### 2.3 Complete Token File Example (W3C DTCG Format)

```json
{
  "$schema": "https://www.designtokens.org/schemas/2025.10/format.json",

  "color": {
    "$description": "Color primitives — raw palette values",
    "black": {
      "$type": "color",
      "$value": {
        "colorSpace": "oklch",
        "components": [0.13, 0.01, 260],
        "alpha": 1
      }
    },
    "gold": {
      "500": {
        "$type": "color",
        "$value": {
          "colorSpace": "oklch",
          "components": [0.75, 0.15, 55],
          "alpha": 1
        }
      },
      "400": {
        "$type": "color",
        "$value": {
          "colorSpace": "oklch",
          "components": [0.80, 0.12, 55],
          "alpha": 1
        }
      }
    },
    "neutral": {
      "50":  { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.95, 0.01, 260], "alpha": 1 } },
      "100": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.90, 0.01, 260], "alpha": 1 } },
      "200": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.80, 0.01, 260], "alpha": 1 } },
      "300": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.65, 0.02, 260], "alpha": 1 } },
      "400": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.45, 0.015, 260], "alpha": 1 } },
      "500": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.35, 0.015, 260], "alpha": 1 } },
      "600": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.25, 0.01, 260], "alpha": 1 } },
      "700": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.23, 0.015, 260], "alpha": 1 } },
      "800": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.18, 0.01, 260], "alpha": 1 } },
      "900": { "$type": "color", "$value": { "colorSpace": "oklch", "components": [0.13, 0.01, 260], "alpha": 1 } }
    }
  },

  "semantic": {
    "$description": "Semantic layer — maps intent to primitives",
    "bg": {
      "base":     { "$type": "color", "$value": "{color.neutral.900}" },
      "surface":  { "$type": "color", "$value": "{color.neutral.800}" },
      "elevated": { "$type": "color", "$value": "{color.neutral.700}" }
    },
    "fg": {
      "base":   { "$type": "color", "$value": "{color.neutral.50}" },
      "muted":  { "$type": "color", "$value": "{color.neutral.300}" },
      "subtle": { "$type": "color", "$value": "{color.neutral.400}" }
    },
    "accent": {
      "primary":     { "$type": "color", "$value": "{color.gold.500}" },
      "interactive": { "$type": "color", "$value": "{color.gold.400}" }
    },
    "border": {
      "subtle":  { "$type": "color", "$value": "{color.neutral.600}" },
      "default": { "$type": "color", "$value": "{color.neutral.500}" }
    }
  },

  "dimension": {
    "$description": "Spacing scale",
    "space": {
      "3xs": { "$type": "dimension", "$value": { "value": 0.125, "unit": "rem" } },
      "2xs": { "$type": "dimension", "$value": { "value": 0.25,  "unit": "rem" } },
      "xs":  { "$type": "dimension", "$value": { "value": 0.5,   "unit": "rem" } },
      "sm":  { "$type": "dimension", "$value": { "value": 1,     "unit": "rem" } },
      "md":  { "$type": "dimension", "$value": { "value": 2,     "unit": "rem" } },
      "lg":  { "$type": "dimension", "$value": { "value": 4,     "unit": "rem" } },
      "xl":  { "$type": "dimension", "$value": { "value": 8,     "unit": "rem" } },
      "2xl": { "$type": "dimension", "$value": { "value": 16,    "unit": "rem" } }
    },
    "radius": {
      "none": { "$type": "dimension", "$value": { "value": 0,    "unit": "rem" } },
      "sm":   { "$type": "dimension", "$value": { "value": 0.25, "unit": "rem" } },
      "md":   { "$type": "dimension", "$value": { "value": 0.5,  "unit": "rem" } },
      "lg":   { "$type": "dimension", "$value": { "value": 1,    "unit": "rem" } },
      "full": { "$type": "dimension", "$value": { "value": 9999, "unit": "px"  } }
    },
    "grid": {
      "max-width": { "$type": "dimension", "$value": { "value": 1400, "unit": "px" } },
      "gutter":    { "$type": "dimension", "$value": { "value": 1.5,  "unit": "rem" } },
      "columns":   { "$type": "number",    "$value": 12 }
    }
  },

  "typography": {
    "$description": "Type styles",
    "display": {
      "$type": "typography",
      "$value": {
        "fontFamily": "PP Neue Montreal, Helvetica Neue, Helvetica, Arial, sans-serif",
        "fontSize": { "value": 3.815, "unit": "rem" },
        "fontWeight": 700,
        "letterSpacing": "-0.03em",
        "lineHeight": 1.1
      }
    },
    "h1": {
      "$type": "typography",
      "$value": {
        "fontFamily": "PP Neue Montreal, Helvetica Neue, Helvetica, Arial, sans-serif",
        "fontSize": { "value": 3.052, "unit": "rem" },
        "fontWeight": 700,
        "letterSpacing": "-0.025em",
        "lineHeight": 1.1
      }
    },
    "h2": {
      "$type": "typography",
      "$value": {
        "fontFamily": "PP Neue Montreal, Helvetica Neue, Helvetica, Arial, sans-serif",
        "fontSize": { "value": 2.441, "unit": "rem" },
        "fontWeight": 600,
        "letterSpacing": "-0.02em",
        "lineHeight": 1.1
      }
    },
    "body": {
      "$type": "typography",
      "$value": {
        "fontFamily": "Inter, system-ui, -apple-system, sans-serif",
        "fontSize": { "value": 1, "unit": "rem" },
        "fontWeight": 400,
        "letterSpacing": "0",
        "lineHeight": 1.5
      }
    },
    "overline": {
      "$type": "typography",
      "$value": {
        "fontFamily": "Inter, system-ui, -apple-system, sans-serif",
        "fontSize": { "value": 0.8, "unit": "rem" },
        "fontWeight": 600,
        "letterSpacing": "0.08em",
        "lineHeight": 1.1
      },
      "$extensions": {
        "textTransform": "uppercase"
      }
    }
  },

  "motion": {
    "$description": "Animation timing and easing",
    "easing": {
      "standard":  { "$type": "cubicBezier", "$value": [0.2, 0, 0, 1] },
      "entrance":  { "$type": "cubicBezier", "$value": [0, 0, 0.2, 1] },
      "exit":      { "$type": "cubicBezier", "$value": [0.4, 0, 1, 1] },
      "dramatic":  { "$type": "cubicBezier", "$value": [0.7, 0, 0.2, 1] },
      "spring":    { "$type": "cubicBezier", "$value": [0.34, 1.56, 0.64, 1] }
    },
    "duration": {
      "instant":   { "$type": "duration", "$value": { "value": 100, "unit": "ms" } },
      "fast":      { "$type": "duration", "$value": { "value": 200, "unit": "ms" } },
      "base":      { "$type": "duration", "$value": { "value": 300, "unit": "ms" } },
      "slow":      { "$type": "duration", "$value": { "value": 500, "unit": "ms" } },
      "slower":    { "$type": "duration", "$value": { "value": 800, "unit": "ms" } },
      "dramatic":  { "$type": "duration", "$value": { "value": 1200, "unit": "ms" } }
    }
  },

  "shadow": {
    "$description": "Elevation shadows — layered for realism",
    "sm": {
      "$type": "shadow",
      "$value": [
        { "color": "#00000026", "offsetX": "0", "offsetY": "1px", "blur": "2px", "spread": "0" },
        { "color": "#0000001a", "offsetX": "0", "offsetY": "1px", "blur": "3px", "spread": "0" }
      ]
    },
    "md": {
      "$type": "shadow",
      "$value": [
        { "color": "#00000026", "offsetX": "0", "offsetY": "2px",  "blur": "4px",  "spread": "0" },
        { "color": "#0000001a", "offsetX": "0", "offsetY": "4px",  "blur": "12px", "spread": "0" },
        { "color": "#00000014", "offsetX": "0", "offsetY": "1px",  "blur": "2px",  "spread": "0" }
      ]
    },
    "lg": {
      "$type": "shadow",
      "$value": [
        { "color": "#00000026", "offsetX": "0", "offsetY": "8px",  "blur": "24px", "spread": "0" },
        { "color": "#0000001a", "offsetX": "0", "offsetY": "16px", "blur": "48px", "spread": "0" },
        { "color": "#00000014", "offsetX": "0", "offsetY": "2px",  "blur": "4px",  "spread": "0" }
      ]
    }
  },

  "breakpoint": {
    "$description": "Responsive breakpoints",
    "sm":  { "$type": "dimension", "$value": { "value": 640,  "unit": "px" } },
    "md":  { "$type": "dimension", "$value": { "value": 768,  "unit": "px" } },
    "lg":  { "$type": "dimension", "$value": { "value": 1024, "unit": "px" } },
    "xl":  { "$type": "dimension", "$value": { "value": 1280, "unit": "px" } },
    "xxl": { "$type": "dimension", "$value": { "value": 1536, "unit": "px" } }
  }
}
```

### 2.4 Token-to-CSS Pipeline

The tokens file above transforms into CSS custom properties. In a Claude-generated single-file HTML context, this transformation happens at generation time -- Claude reads the tokens and emits the `:root` block directly:

```css
:root {
  /* Colors — semantic */
  --color-bg-base: oklch(0.13 0.01 260);
  --color-bg-surface: oklch(0.18 0.01 260);
  --color-bg-elevated: oklch(0.23 0.015 260);
  --color-fg-base: oklch(0.95 0.01 90);
  --color-fg-muted: oklch(0.65 0.02 260);
  --color-accent-primary: oklch(0.75 0.15 55);
  --color-accent-interactive: oklch(0.80 0.12 55);
  --color-border-subtle: oklch(0.25 0.01 260);
  --color-border-default: oklch(0.35 0.015 260);

  /* Typography */
  --font-heading: 'PP Neue Montreal', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  --text-display: 700 3.815rem/1.1 var(--font-heading);
  --text-h1: 700 3.052rem/1.1 var(--font-heading);
  --text-body: 400 1rem/1.5 var(--font-body);

  /* Spacing */
  --space-3xs: 0.125rem;
  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 2rem;
  --space-lg: 4rem;
  --space-xl: 8rem;

  /* Motion */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-entrance: cubic-bezier(0, 0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --ease-dramatic: cubic-bezier(0.7, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 800ms;
  --duration-dramatic: 1200ms;

  /* Shadows */
  --shadow-sm: 0 1px 2px #00000026, 0 1px 3px #0000001a;
  --shadow-md: 0 2px 4px #00000026, 0 4px 12px #0000001a, 0 1px 2px #00000014;
  --shadow-lg: 0 8px 24px #00000026, 0 16px 48px #0000001a, 0 2px 4px #00000014;

  /* Borders */
  --radius-none: 0;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;

  /* Layout */
  --grid-max-width: 1400px;
  --grid-gutter: 1.5rem;
  --grid-columns: 12;
  --grid-margin: clamp(1rem, 5vw, 4rem);
}
```

For projects that use a build step, the JSON tokens feed into Style Dictionary which transforms them automatically into CSS, SCSS, JS, iOS, or Android platform outputs.

---

## 3. Component Pattern Library

### 3.1 Taxonomy

The pattern library is organized by page function, not by atomic-design level. Each pattern has a `type` and one or more `variant` options. The brief references these by name.

#### Hero Sections

| Variant | Description | Key Techniques |
|---------|-------------|----------------|
| `static-centered` | Simple centered text + CTA | Clean typography, no animation |
| `animated-text-reveal` | Headline characters/words animate in | `clip-path`, split-text JS, staggered entrance |
| `video-background` | Full-bleed video with overlay | `<video>` with `object-fit`, gradient overlay |
| `parallax-layers` | Multiple depth planes shift on scroll | CSS `scroll-timeline` or `transform: translateZ()` |
| `3d-scene` | Three.js/CSS 3D transformed elements | WebGL canvas or CSS perspective |
| `split-screen` | Image one side, text the other | CSS Grid 50/50, responsive stack |
| `interactive-canvas` | Particle field, generative art, or WebGL behind text | Canvas API or Three.js, pointer tracking |
| `gradient-morph` | Animated gradient background with mesh-gradient feel | CSS `@property` animated gradients, hue-rotate |

#### Navigation

| Variant | Description | Key Techniques |
|---------|-------------|----------------|
| `sticky-minimal` | Slim bar, logo + links, sticks on scroll | `position: sticky`, blur backdrop on scroll |
| `morphing-header` | Large hero nav that shrinks on scroll | `scroll-timeline`, height/padding animation |
| `hamburger-fullscreen` | Mobile menu expands to fullscreen overlay | Transform-based reveal, staggered link entrance |
| `sidebar-persistent` | Fixed sidebar nav (dashboard/docs) | CSS Grid with fixed column |
| `bottom-bar-mobile` | iOS-style bottom navigation on mobile | `position: fixed`, `safe-area-inset-bottom` |
| `command-palette` | Keyboard-triggered search/nav overlay (Cmd+K) | Dialog element, fuzzy search, keyboard nav |

#### Content Sections

| Variant | Description | Key Techniques |
|---------|-------------|----------------|
| `bento-grid` | Asymmetric card grid (Apple-style) | CSS Grid with `span` rules, variable card sizes |
| `bento-asymmetric` | Bento with one featured large card | Grid template areas |
| `scroll-reveal-cards` | Cards animate in as you scroll | IntersectionObserver or scroll-timeline |
| `timeline-vertical` | Chronological content with line connector | Pseudo-element line, alternating sides |
| `timeline-horizontal` | Horizontal scrolling timeline | `overflow-x: auto`, scroll-snap |
| `split-image-text` | Alternating image/text rows | CSS Grid, flip order with `direction` or `order` |
| `masonry` | Pinterest-style variable-height grid | CSS `columns` or Grid `masonry` (experimental) |
| `accordion-faq` | Expandable Q&A sections | `<details>` element or animated height |
| `tabbed-content` | Tab-switched content panels | ARIA tabs, crossfade transition |
| `stats-counter` | Animated number counters | `IntersectionObserver` + counting animation |
| `testimonial-carousel` | Rotating quotes/reviews | CSS scroll-snap carousel or JS swiper |
| `feature-comparison` | Side-by-side feature table | Responsive table with sticky headers |
| `pricing-table` | Pricing tiers with feature lists | Grid cards with highlighted "popular" tier |

#### Micro-Interactions

| Pattern | Description | CSS/JS Technique |
|---------|-------------|-----------------|
| `hover-lift` | Card rises with enhanced shadow on hover | `transform: translateY(-4px)`, shadow transition |
| `hover-glow` | Subtle glow effect on hover | `box-shadow` with accent color at low opacity |
| `magnetic-button` | Button subtly moves toward cursor | JS pointer tracking, `transform: translate()` |
| `cursor-spotlight` | Radial gradient follows cursor | JS `mousemove`, CSS `radial-gradient` position |
| `text-gradient-hover` | Text fills with gradient on hover | `background-clip: text`, `background-position` transition |
| `underline-draw` | Link underline draws in from left | Pseudo-element `scaleX(0)` to `scaleX(1)` |
| `button-ripple` | Material-style click ripple | Pseudo-element scale animation from click point |
| `focus-ring` | Animated focus indicator | `outline-offset` transition, accent color |
| `image-reveal` | Image reveals with sliding mask | `clip-path: inset()` animation |
| `counter-tick` | Number ticks up/down on change | CSS `@property` animated number or JS |

#### Page Transitions

| Pattern | Description | Technique |
|---------|-------------|-----------|
| `crossfade` | Simple opacity fade between pages | View Transitions API |
| `slide-horizontal` | Pages slide left/right | View Transitions API with `view-transition-name` |
| `morph-element` | Shared element morphs between pages | View Transitions API with matched elements |
| `curtain-reveal` | Overlay slides away to reveal new page | Pseudo-element with `clip-path` or transform |

#### Loading States

| Pattern | Description | Technique |
|---------|-------------|-----------|
| `skeleton-pulse` | Gray shapes pulsing in layout positions | CSS `animation: pulse`, layout-matched shapes |
| `progressive-blur` | Content loads blurred, sharpens | CSS `filter: blur()` transition |
| `logo-loader` | Animated logo/icon during load | SVG stroke animation or CSS keyframes |
| `progress-bar` | Top-of-page loading bar | CSS width animation, `scaleX` transform |

### 3.2 Pattern Specification Format

Each pattern in the brief's `sections` array follows this structure:

```yaml
sections:
  - type: hero                           # Pattern category
    variant: animated-text-reveal        # Specific variant
    # Optional overrides to default behavior
    config:
      animation_trigger: "on-load"       # "on-load", "on-scroll", "on-hover"
      text_split: "word"                 # "character", "word", "line"
      stagger: "80ms"                    # Override default stagger
      entrance_direction: "bottom"       # "bottom", "top", "left", "right", "fade"
    content:
      overline: "Portfolio"
      headline: "Design is how it works."
      subheadline: "Strategic design for products that matter."
      cta:
        primary: { text: "View Work", href: "#work" }
    # Optional: section-level style overrides
    style:
      background: "var(--color-bg-base)"
      min_height: "100vh"
      padding: "var(--space-xl) 0"
```

---

## 4. Reference Analysis

### 4.1 The Problem

Users often communicate design intent through examples: "I want something like this site" or "here's a screenshot of what I'm going for." The system needs to extract actionable design decisions from these references.

### 4.2 Approaches for Reference Analysis

#### Approach A: URL Analysis (Live Sites)

For live URLs, there are several extraction paths:

**Automated tools:**
- **Chromata** -- extracts colors and typography from any URL, exports to Tailwind/CSS/JSON
- **Brandfetch** -- extracts complete design systems (colors, typography, spacing, component styles) as JSON or Markdown
- **Dembrandt** (Node CLI) -- scans CSS/HTML and outputs design tokens as JSON

**Claude-native approach (recommended for this pipeline):**
The user provides the URL. Claude uses web fetch to retrieve the page, then analyzes the HTML/CSS directly to extract:
- Color values from CSS custom properties and computed styles
- Font families, sizes, and weights from the stylesheet
- Spacing patterns from layout rules
- Animation/transition declarations
- Layout structure from the grid/flex usage

This keeps the entire pipeline within Claude's context without external tool dependencies.

**Practical extraction prompt template:**

```yaml
references:
  - url: "https://example.com"
    extract:
      - colors          # Pull the color palette
      - typography      # Font families, scale, weights
      - layout          # Grid structure, spacing patterns
      - motion          # Any CSS transitions/animations found
    note: "Focus on the hero section and navigation only"
```

#### Approach B: Screenshot Analysis

For screenshots (where the source CSS is not available), Claude's vision capabilities analyze the image directly:

1. **Color extraction**: Identify dominant colors, accent colors, background tones, and text colors from the image. Estimate OKLCH/hex values.
2. **Typography identification**: Recognize font categories (serif, sans-serif, mono, display), estimate size hierarchy, weight contrast, and spacing.
3. **Layout structure**: Identify grid patterns, column counts, alignment, whitespace ratios, and content density.
4. **Motion inference**: Static screenshots cannot show animation, but the user can annotate: "this element slides in from the left" or provide a screen recording.

**Screenshot brief syntax:**

```yaml
references:
  - screenshot: "./refs/hero-example.png"
    extract: [colors, typography, layout]
    note: "Like this layout but with more whitespace"
  - screenshot: "./refs/animation-recording.mp4"
    extract: [motion]
    note: "This scroll-reveal timing is what I want"
```

#### Approach C: Hybrid (Recommended)

The most effective approach combines both:

1. User provides 1-3 reference URLs and/or screenshots
2. Claude fetches and analyzes the live sites for precise token extraction
3. Claude analyzes screenshots for visual intent that may not be captured by CSS alone
4. Claude synthesizes findings into a draft token set
5. User reviews and adjusts before generation begins

### 4.3 Reference Analysis Output Format

Claude produces a structured analysis that feeds back into the brief:

```yaml
# AUTO-GENERATED from reference analysis
# Review and adjust before using as input

reference_analysis:
  source: "https://stripe.com/press"
  extracted:
    colors:
      dominant_background: "oklch(0.99 0.005 260)"
      text_primary: "oklch(0.20 0.02 260)"
      text_secondary: "oklch(0.50 0.015 260)"
      accent: "oklch(0.58 0.18 264)"
      surface: "oklch(0.97 0.005 260)"
    typography:
      heading_family: "likely geometric sans (similar to Roobert or Graphik)"
      body_family: "system sans-serif stack"
      scale_ratio: "~1.25 (major third)"
      heading_weight: 600
      body_weight: 400
    layout:
      max_width: "~1200px"
      columns: "appears 12-column grid"
      gutter: "~24px"
      section_spacing: "~120px"
      generous_whitespace: true
    motion:
      transition_duration: "~300ms on hovers"
      easing: "ease-out family"
      scroll_animations: "subtle fade-up on section entrance"
      page_transitions: "none detected"
    overall_impression: >
      Ultra-clean editorial approach. Near-white backgrounds.
      Typography does the heavy lifting — very little decoration.
      Hierarchy comes from size contrast and whitespace, not color.
```

---

## 5. Iteration Workflow

### 5.1 Workflow Phases

The design pipeline follows a four-phase cycle, inspired by both GitHub's spec-driven development approach and Addy Osmani's recommendations for AI agent specifications.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  PHASE 1: BRIEF          User provides design intent    │
│  ─────────────────        (YAML brief + references)     │
│           │                                             │
│           ▼                                             │
│  PHASE 2: GENERATE       Claude produces HTML/CSS/JS    │
│  ─────────────────        (tokens → components → page)  │
│           │                                             │
│           ▼                                             │
│  PHASE 3: REVIEW         User evaluates the output      │
│  ─────────────────        (structured feedback format)   │
│           │                                             │
│           ▼                                             │
│  PHASE 4: REFINE         Claude applies corrections     │
│  ─────────────────        (targeted diff, not rebuild)   │
│           │                                             │
│           └──────────── loops back to PHASE 3 ──────────│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Phase 1: Brief Submission

The user creates the YAML brief (Section 1) at whatever tier matches their needs. For the first iteration, Claude can help scaffold the brief:

**Bootstrap prompt**: "I want a dark luxury portfolio site with gold accents, editorial typography, and scroll-driven animations. Help me fill out a design brief."

Claude generates a Tier 2 brief, the user reviews and adjusts, and then generation begins.

### 5.3 Phase 2: Generation

Claude's generation process follows this internal pipeline:

1. **Parse brief** -- validate YAML, resolve defaults for omitted fields using the aesthetic vocabulary
2. **Generate tokens** -- produce the W3C DTCG JSON token file from the brief's color/typography/spacing/motion sections
3. **Emit CSS foundation** -- transform tokens into CSS custom properties, base reset, typography styles, and utility classes
4. **Build sections** -- for each section in `pages[].sections[]`, generate the HTML structure and section-specific CSS using the pattern library
5. **Wire animations** -- implement the motion patterns specified in `motion.patterns[]`, using CSS scroll-timeline where supported with JS IntersectionObserver fallback
6. **Assemble** -- combine into the output format (single-file HTML, multi-file, or framework-specific)
7. **Validate** -- check accessibility (color contrast, focus states, reduced-motion), performance (no layout thrashing, GPU-friendly animations), and semantic HTML

### 5.4 Phase 3: Review (Structured Feedback Format)

Unstructured feedback ("make it better" or "I don't like it") is hard for any system to act on. The review format channels feedback into actionable categories:

```yaml
# ============================================================
# DESIGN REVIEW — Iteration 2
# ============================================================

review:
  overall_impression: 7/10          # Quick vibes check
  general_notes: >
    The direction is right. Typography hierarchy is strong.
    Motion feels too fast globally — needs to breathe more.
    Color is close but the gold accent is too saturated.

  # Specific feedback by section
  sections:
    - id: hero
      status: needs-revision           # "approved", "needs-revision", "rethink"
      feedback:
        - area: typography
          issue: "Headline is too large on mobile"
          suggestion: "Cap at 2.5rem below 768px"
        - area: animation
          issue: "Text reveal is too fast"
          suggestion: "Slow stagger to 100ms, overall duration to 1.5s"
        - area: layout
          issue: "CTA buttons are too close together"
          suggestion: "Add var(--space-sm) gap"

    - id: work-grid
      status: approved
      feedback:
        - area: general
          note: "This section is perfect, don't change it"

    - id: about
      status: needs-revision
      feedback:
        - area: color
          issue: "Text contrast is too low on the muted text"
          suggestion: "Bump foreground.muted lightness from 0.65 to 0.72"

  # Global adjustments (apply everywhere)
  global:
    - category: motion
      change: "Increase all durations by 30%"
    - category: color
      change: "Desaturate accent.primary — reduce chroma from 0.15 to 0.11"
    - category: spacing
      change: "Section spacing feels tight — bump from lg to xl"

  # Token-level overrides (most precise)
  token_overrides:
    "motion.duration.base": "400ms"
    "motion.duration.slow": "650ms"
    "motion.duration.dramatic": "1600ms"
    "semantic.accent.primary": "oklch(0.75 0.11 55)"
    "dimension.space.section": "8rem"
```

### 5.5 Phase 4: Refinement

Claude applies changes as targeted diffs rather than regenerating the entire page. The feedback format above maps directly to code changes:

- **Section-level feedback** -> edit that section's HTML/CSS
- **Global adjustments** -> modify the `:root` token block or shared utility classes
- **Token overrides** -> update specific CSS custom property values

This preserves approved sections and minimizes regression risk.

### 5.6 Iteration Heuristics

Guidelines for efficient convergence:

1. **Iteration 1**: Get the structure, layout, and typography right. Motion and micro-interactions are secondary.
2. **Iteration 2**: Tune color, spacing, and motion timing. These are the "feel" adjustments.
3. **Iteration 3**: Polish micro-interactions, responsive behavior, and edge cases.
4. **Ideally converge in 2-4 iterations.** If iteration 5+ is needed, the brief likely needs to be rewritten rather than patching further.

### 5.7 Version Tracking

Each iteration produces a versioned output:

```
web-design-pipeline/
├── briefs/
│   └── portfolio-v1.yaml             # Original brief
├── reviews/
│   ├── portfolio-review-1.yaml       # First review
│   └── portfolio-review-2.yaml       # Second review
├── tokens/
│   └── portfolio.tokens.json         # Generated token file (W3C DTCG)
├── output/
│   ├── portfolio-v1.html             # First generation
│   ├── portfolio-v2.html             # After first review
│   └── portfolio-v3.html             # After second review (final)
└── refs/
    ├── competitor-hero.png           # Reference screenshots
    └── animation-ref.mp4            # Reference recordings
```

---

## 6. Implementation Roadmap

### 6.1 What to Build

This is not a SaaS platform. It is a structured workflow within Claude Code, consisting of:

1. **YAML schema** for design briefs (with validation)
2. **Token generation logic** (brief YAML -> W3C DTCG JSON -> CSS custom properties)
3. **Pattern library** as documented reference (Claude's knowledge, not a runtime component library)
4. **Review template** (YAML format for structured feedback)
5. **CLAUDE.md instructions** that encode the generation pipeline so Claude follows it consistently

### 6.2 Recommended File Structure

```
web-design-pipeline/
├── CLAUDE.md                          # Pipeline instructions for Claude
├── README.md                          # Project overview
├── schema/
│   ├── brief-schema.yaml             # JSON Schema for validating briefs
│   ├── review-schema.yaml            # JSON Schema for validating reviews
│   └── tokens-schema.json            # W3C DTCG schema reference
├── vocabulary/
│   ├── aesthetics.yaml               # Aesthetic keyword definitions + defaults
│   ├── patterns.yaml                 # Component pattern catalog
│   └── motion.yaml                   # Motion pattern catalog
├── templates/
│   ├── brief-quick.yaml              # Tier 1 brief template
│   ├── brief-standard.yaml           # Tier 2 brief template
│   ├── brief-full.yaml               # Tier 3 brief template
│   └── review.yaml                   # Review feedback template
├── examples/
│   ├── dark-luxury-portfolio/
│   │   ├── brief.yaml
│   │   ├── tokens.json
│   │   └── output.html
│   └── glassmorphism-landing/
│       ├── brief.yaml
│       ├── tokens.json
│       └── output.html
├── briefs/                            # User's active briefs
├── reviews/                           # User's review feedback
├── tokens/                            # Generated token files
├── output/                            # Generated HTML/CSS/JS
└── refs/                              # Reference images/videos
```

### 6.3 Key Design Decisions

**Single-file HTML as default output.** For GitHub Pages and quick iteration, a single HTML file with embedded CSS and JS is the most portable format. No build step, no dependencies, instant deployment. Multi-file or framework outputs are opt-in via `constraints.output`.

**W3C DTCG for tokens.** The stable 2025.10 spec provides a vendor-neutral interchange format with real tooling support. Even though Claude generates CSS directly for single-file output, having the canonical tokens in DTCG JSON means they can later feed into Style Dictionary, Figma, or any other tool.

**YAML for human-authored files, JSON for machine-generated files.** The brief and review are written by humans and benefit from YAML's readability. Tokens are generated by Claude and consumed programmatically, so JSON is appropriate.

**Progressive enhancement for animations.** CSS scroll-timeline has good support (Chrome/Edge 115+, Firefox 110+) but Safari lags. Generated code should use `@supports` checks and fall back to IntersectionObserver-based JS. `prefers-reduced-motion` is always respected.

**No runtime dependencies for single-file output.** The generated HTML should not import React, GSAP, or other libraries unless the user explicitly requests them. Vanilla CSS and JS can achieve scroll-reveal, parallax, text-split animations, magnetic cursors, and more. This keeps the output portable and fast.

---

## Sources

- [W3C Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/drafts/format/)
- [Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Style Dictionary - DTCG Integration](https://styledictionary.com/info/dtcg/)
- [Addy Osmani - How to Write a Good Spec for AI Agents](https://addyosmani.com/blog/good-spec/)
- [GitHub spec-kit - Spec-Driven Development Toolkit](https://github.com/github/spec-kit)
- [Material Design 3 - Motion Tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- [Carbon Design System - Motion](https://carbondesignsystem.com/elements/motion/overview/)
- [Animation/Motion Design Tokens (Oscar Gonzalez)](https://medium.com/@ogonzal87/animation-motion-design-tokens-8cf67ffa36e9)
- [Design Tokens for Motion: Standardize Animation (Ruixen)](https://www.ruixen.com/blog/motion-design-tokens)
- [CSS Scroll Timeline Guide 2026](https://dev.to/softheartengineer/mastering-css-scroll-timeline-a-complete-guide-to-animation-on-scroll-in-2025-3g7p)
- [CSS/JS Animation Trends 2026](https://webpeak.org/blog/css-js-animation-trends/)
- [Chromata - Website Design System Extractor](https://chromata.app)
- [Brandfetch - Design Token Extraction](https://brandfetch.dev/)
- [ColorFlowPro - Screenshot to Design Tokens](https://www.colorflowpro.com/)
- [Spec-Driven Development (Martin Fowler)](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [5 Steps for Including Motion Design in Your System](https://www.designsystems.com/5-steps-for-including-motion-design-in-your-system/)
- [Bringing Back Parallax With Scroll-Driven CSS Animations (CSS-Tricks)](https://css-tricks.com/bringing-back-parallax-with-scroll-driven-css-animations/)

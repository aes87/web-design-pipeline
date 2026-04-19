# Portfolio Shell — Spec

## What the shell is

A CSS "base layer" that every aes87 portfolio page pastes in verbatim. It defines the design system (tokens, type scale, spacing, motion curves), the reset, the a11y primitives, the ambient visual layers (grain, cursor spotlight, morphing blobs), and the shared chrome (nav, buttons, section scaffolding, `.reveal` utility).

Page-specific styling — hero layouts, bento grids, timelines, project-specific components — lives below the shell in the page's own CSS.

## What the shell guarantees

- **Consistent tokens.** Every consumer gets the same color, typography, spacing, motion, shadow, and z-index values. Pages that need a variant override the relevant `--*` custom properties in a scoped `:root` or parent selector.
- **Accessible defaults.** Skip link, `.sr-only`, reduced-motion handling, focus-visible rings on buttons, proper heading weights.
- **Mobile-safe ambient layers.** The morphing-blobs `@media (max-width: 768px)` override is inside the shell — pages cannot accidentally drop it. The `overflow-x: clip` on both `html` and `body` prevents iOS Safari from horizontally scrolling the viewport when decorative elements have negative insets.
- **Reveal-on-scroll primitive.** The `.reveal` utility hides elements at `opacity: 0; transform: translateY(24px)` and the reduced-motion block forces them visible. Pages drive the entrance with GSAP ScrollTrigger or IntersectionObserver — the shell doesn't include any JS.

## What the shell explicitly does not include

- **Layout sections.** Hero, bento, timeline, changelog, philosophy, chat, install — author per page.
- **Page-specific decoration.** Hero rabbit, concentric rings, changelog rail, etc.
- **Fonts.** The page's `<head>` still needs to load Google Fonts (Playfair Display, Inter, JetBrains Mono) — the shell references the family names but doesn't fetch them.
- **JS.** GSAP, Lenis, SplitText, ScrollTrigger — wire them per page.
- **Content.** Obviously.

## Token inventory

All tokens live in `:root` and are intentionally flat (no nesting). Grouped for readability:

| Group | Tokens |
|---|---|
| Colors | `--color-bg-base/surface/elevated`, `--color-fg-base/muted/subtle`, `--color-accent-primary/secondary/glow` |
| Typography | `--font-heading/body/mono`, `--font-weight-heading/body/medium/semibold`, `--text-sm/base/1..6`, `--font-size-hero`, `--line-height-body/heading`, `--letter-spacing-overline` |
| Spacing | `--space-xs/sm/md/lg/xl/2xl/3xl`, `--space-section` |
| Layout | `--grid-max-width`, `--grid-margin`, `--grid-gap` |
| Motion | `--ease-dramatic/entrance/standard`, `--duration-micro/hover/entrance/hero`, `--stagger-delay` |
| Shadows | `--shadow-sm/md/lg` |
| Borders | `--radius-sm/md/lg`, `--border-subtle` |
| Z-index | `--z-bg-effect/base/nav/overlay` |
| Effects | `--bg-effect-opacity`, `--cursor-spotlight-size` |

## Adoption recipe

For a new single-file HTML page:

```html
<head>
  <!-- Google Fonts — must come before the shell CSS -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">

  <style>
    /* SHELL_VERSION: 1.0.0 */
    /* ... paste portfolio-shell.css contents here ... */

    /* ---- page-specific CSS below this line ---- */
  </style>
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <div class="grain" aria-hidden="true"></div>
  <div class="cursor-spotlight" aria-hidden="true"></div>

  <div class="morphing-blobs" aria-hidden="true">
    <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
      <path class="morphing-blobs__blob--0" d="M300,150.18 C..." transform="translate(-42, -79)"/>
      <path class="morphing-blobs__blob--1" d="M300,150.5  C..." transform="translate(-77, 29)"/>
      <path class="morphing-blobs__blob--2" d="M300,87.68  C..." transform="translate(11, 75)"/>
    </svg>
  </div>

  <header class="nav">
    <nav aria-label="Main navigation">
      <a href="/" class="nav__logo"><img class="nav__rabbit" ...> aes87</a>
      <ul class="nav__links">...</ul>
    </nav>
  </header>

  <main id="main">
    <!-- page-specific sections -->
  </main>
</body>
```

The starting blob `d` attributes for the SVG are the `0%` values from each keyframe in the shell — copy them out so the SVG is valid before the animation loops. The `transform="translate(...)"` values are the canonical offsets used by both existing consumers.

## How to evolve the shell

1. **Patch `portfolio-shell.css` first.** Never patch a consumer in isolation — that's how we ended up with the mobile fix living only in `claude-portfolio-preview` until someone noticed it missing from `claudelike-bar`.
2. **Bump the version.** Semver: patch for bug fixes, minor for additive tokens/utilities, major for renames or breaking contract changes.
3. **Update the consumer table in `README.md`.**
4. **Propagate to consumers.** For inline-`<style>` consumers: replace the shell block in the `<head>`. For linked-CSS consumers: re-paste into the page's `style.css`. Update the `SHELL_VERSION` marker.
5. **Screenshot-check on mobile (375 px) and desktop (1280 px)** before committing. The mobile blob override and the `.section`/`.btn` tokens are the highest-risk surfaces.

## Known drift points to watch

- **`.section__header max-width`** — portfolio-preview omits it; claudelike-bar added `max-width: 42rem` in its copy. Shell 1.0.0 omits it; consumers add it in page-local CSS when they want it.
- **`.btn--ghost` default color** — portfolio-preview uses `--color-fg-muted`; any page with a light-surface section may want `--color-bg-base` instead, handled via page-local override.
- **Nav transparency** — `.nav` is transparent by default and only gets a backdrop when `.nav--scrolled` is toggled by JS. Pages without the scroll JS should set an unconditional background or the nav will be invisible over the blobs.

## Change log

- **1.0.0** (2026-04-18) — Initial extraction from `claude-portfolio-preview/style.css`. Includes mobile blob override (`e996db0`), `overflow-x: clip` on both `html` and `body`, `.reveal` utility, reduced-motion block covering shell pieces only.

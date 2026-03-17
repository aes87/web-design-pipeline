# Navigation

Navigation is the persistent wayfinding layer. It must be functional, accessible, and unobtrusive -- never competing with the hero or content for attention, but always findable when needed. In award-winning sites, the nav often transforms on scroll: shrinking, gaining a backdrop blur, or fading in from transparent to solid.

All navigation variants share the same foundational accessibility requirements: keyboard navigable, ARIA landmarks, skip links, visible focus indicators. The visual treatment varies.

### Shared CSS Contract

```
--color-nav-bg           Background color (often transparent at top)
--color-nav-bg-scroll    Background when scrolled (solid or blurred)
--color-nav-fg           Text/icon color
--color-nav-fg-scroll    Text color after scroll (may change for contrast)
--color-nav-accent       Active/hover state color
--font-nav               Nav typeface
--font-size-nav          Nav link size (typically 0.875rem - 1rem)
--font-weight-nav        Nav link weight
--nav-height             Height of the nav bar (e.g., 64px, 80px)
--nav-height-scroll      Height when scrolled/compact (e.g., 56px)
--nav-padding-x          Horizontal padding
--z-nav                  z-index (must be above hero, typically 100-1000)
--ease-standard          Standard transition easing
--duration-nav           Nav transition duration (200-300ms)
--backdrop-blur          Blur amount for frosted glass (8px-20px)
```

### Shared HTML Skeleton

```html
<a href="#main" class="skip-link">Skip to content</a>
<header class="nav nav--{variant}" role="banner">
  <nav aria-label="Main navigation">
    <a href="/" class="nav__logo" aria-label="Home">
      <!-- Logo SVG or text -->
    </a>
    <ul class="nav__links" role="list">
      <li><a href="#section" class="nav__link">Link</a></li>
      <!-- ... -->
    </ul>
    <div class="nav__actions">
      <!-- CTA button, theme toggle, etc. -->
    </div>
  </nav>
</header>
<main id="main">...</main>
```

### Shared Accessibility Rules

- Skip link as first focusable element: visually hidden, appears on focus
- `<nav>` with `aria-label="Main navigation"` (or "Primary navigation")
- `<header>` with `role="banner"` (implicit, but explicit is defensive)
- Active page link gets `aria-current="page"`
- Mobile menu toggle: `aria-expanded="true|false"`, `aria-controls="nav-menu"`
- Focus trap in open mobile menu (Tab cycles within menu, Escape closes)
- `z-index` must be managed intentionally -- nav above hero, modals above nav

### z-index Strategy

```
--z-base: 1        (content)
--z-hero: 1        (hero section)
--z-nav: 100       (navigation)
--z-dropdown: 200  (nav dropdowns)
--z-overlay: 500   (mobile menu overlay)
--z-modal: 1000    (modals, dialogs)
--z-toast: 1100    (notifications)
```

---

## sticky-minimal

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

Fixed-position nav bar at the top of the viewport. Starts transparent over the hero, gains a solid (or blurred) background on scroll. This is the most common navigation pattern on the modern web and the default choice for most briefs.

Use when: no specific nav style is requested, the aesthetic is `minimalist`, `corporate-clean`, `swiss`, or `dark-luxury`, or the page has straightforward top-level navigation.

### HTML Structure

Uses the shared skeleton above. No additional markup needed.

The scroll-triggered style change uses a CSS class toggle (`.nav--scrolled`) applied via IntersectionObserver or a scroll listener.

### CSS Contract

Shared tokens plus:
- Transparent state: `background: transparent; color: var(--color-nav-fg)`
- Scrolled state (`.nav--scrolled`): `background: var(--color-nav-bg-scroll); backdrop-filter: blur(var(--backdrop-blur)); box-shadow: 0 1px 0 oklch(0 0 0 / 0.1)`
- Transition: `transition: background var(--duration-nav) var(--ease-standard), box-shadow var(--duration-nav) var(--ease-standard), height var(--duration-nav) var(--ease-standard)`

`position: fixed; top: 0; left: 0; right: 0; z-index: var(--z-nav)`.

### Scroll Behavior

**Preferred approach** (IntersectionObserver, no scroll listener):
```
Create a sentinel element (1px tall div) at the top of <main>.
Observe it. When it exits the viewport (scrolled past), add .nav--scrolled.
When it re-enters, remove .nav--scrolled.
```

This avoids scroll event overhead entirely.

**Alternative** (CSS scroll-driven animation):
```css
@keyframes nav-scroll {
  from { background: transparent; backdrop-filter: blur(0); }
  to { background: var(--color-nav-bg-scroll); backdrop-filter: blur(var(--backdrop-blur)); }
}
.nav {
  animation: nav-scroll linear both;
  animation-timeline: scroll();
  animation-range: 0px 100px;
}
```

### Mobile Adaptation

At breakpoint (`768px` default):
- Nav links collapse into hamburger menu
- Hamburger button appears: `<button class="nav__toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Open menu">...</button>`
- Links list gets `id="nav-menu"` and hides/shows based on toggle state
- Open state: slide-down reveal or fade-in (duration: 300ms)

### Animation Choreography

1. **Page load**: Nav fades in from `opacity: 0` (delay: matches hero animation completion, duration: 400ms)
2. **Scroll**: Background transitions smoothly when sentinel exits viewport
3. **Mobile menu open**: Links slide down or fade in with stagger (50ms per item)
4. **Mobile menu close**: Reverse animation (200ms, faster than open)

### Accessibility

- `prefers-reduced-motion: reduce`: Scroll background change is instant (no transition). Mobile menu appears/disappears instantly.
- Focus trap in open mobile menu. Escape key closes menu and returns focus to toggle button.
- Skip link must be above the nav in DOM order.

### Implementation Notes

- Use `backdrop-filter: blur()` for the frosted-glass scrolled state. Falls back to solid `background-color` in browsers without support (effectively none in 2026, but defensive).
- The IntersectionObserver approach is better than `scroll` event listeners -- it is throttled by the browser and does not require `requestAnimationFrame` wrappers.
- Add `will-change: background, backdrop-filter` to the nav only during the transition (remove after).
- Body needs `padding-top: var(--nav-height)` to prevent content from hiding behind the fixed nav. Alternatively, the hero can be full-viewport and the nav overlays it.

---

## morphing-header

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap

### Description

The nav bar transforms as the user scrolls -- not just a background change, but a structural morph. The logo might shrink, nav links might collapse into icons, padding compresses, and the entire bar reshapes. This creates a premium feel where the navigation adapts to context.

Use when: the brief calls for `dark-luxury` or `editorial` aesthetics, the brand has a distinctive logo that deserves prominent placement at the top, or the page is long and the nav should feel intentional throughout.

### HTML Structure

```html
<a href="#main" class="skip-link">Skip to content</a>
<header class="nav nav--morphing" role="banner">
  <nav aria-label="Main navigation">
    <a href="/" class="nav__logo">
      <svg class="nav__logo-full" aria-label="Brand name">...</svg>
      <svg class="nav__logo-mark" aria-hidden="true">...</svg>
    </a>
    <ul class="nav__links" role="list">
      <li><a href="#" class="nav__link">Work</a></li>
      <li><a href="#" class="nav__link">About</a></li>
      <li><a href="#" class="nav__link">Contact</a></li>
    </ul>
    <div class="nav__actions">
      <a href="#" class="btn btn--small">Get in touch</a>
    </div>
  </nav>
</header>
```

### CSS Contract

Shared tokens plus:
- `--logo-width-full`: logo width at top (e.g., `120px`)
- `--logo-width-compact`: logo width when scrolled (e.g., `40px`)
- `--nav-padding-y`: vertical padding at top (e.g., `24px`)
- `--nav-padding-y-scroll`: vertical padding when scrolled (e.g., `12px`)

Two states with CSS custom properties that GSAP interpolates:
- **Expanded** (top of page): large logo, generous padding, transparent background
- **Compact** (scrolled): small logo-mark, tight padding, solid/blurred background

### Scroll Behavior

GSAP ScrollTrigger with `scrub`:
```
trigger: "body"
start: "top top"
end: "+=100"    (morph happens over first 100px of scroll)
scrub: true
```

Animate:
- `--nav-padding-y`: from 24px to 12px
- Logo: crossfade between `.nav__logo-full` (opacity 1->0) and `.nav__logo-mark` (opacity 0->1)
- Background opacity: 0 -> 1
- Nav height: 80px -> 56px

### Mobile Adaptation

Same as sticky-minimal. The morphing behavior is primarily a desktop enhancement. On mobile, the nav starts compact.

### Animation Choreography

1. **Page load**: Full expanded state. Nav fades in with the page.
2. **Scroll 0-100px**: Continuous morph from expanded to compact (scrubbed to scroll position)
3. **Scroll 100px+**: Nav stays in compact state
4. **Scroll back to top**: Morph reverses smoothly

### Accessibility

- `prefers-reduced-motion: reduce`: Snap to compact state immediately once scroll passes threshold (no smooth morph). Or start in compact state always.
- Both logo variants must be accessible. `nav__logo-full` has the accessible name. `nav__logo-mark` is `aria-hidden` when full logo is visible, and vice versa -- or simply keep the `<a>` with `aria-label="Home"`.
- State changes are visual only -- no ARIA state changes needed for the morph.

### Implementation Notes

- The morph is driven by ScrollTrigger `scrub`, not scroll events. This gives smooth interpolation.
- Use GSAP's `quickTo()` for any mouse-reactive elements in the nav (magnetic buttons).
- The `end: "+=100"` means the morph completes within the first 100px of scroll. Adjust based on hero height.
- Logo crossfade: position both SVGs absolutely within the logo container. Animate opacity.

---

## hamburger-fullscreen

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap

### Description

Minimal nav bar (logo + hamburger icon) that opens into a full-screen overlay menu. The overlay is a dramatic, immersive layer with large typography, animated link reveals, and optional background effects. Common on portfolio and agency sites.

Use when: the brief calls for `immersive`, `dark-luxury`, or `japanese-minimalism` aesthetics, navigation items are few (3-6 links), or the nav should be minimal to preserve the hero.

### HTML Structure

```html
<a href="#main" class="skip-link">Skip to content</a>
<header class="nav nav--hamburger" role="banner">
  <nav aria-label="Main navigation">
    <a href="/" class="nav__logo" aria-label="Home">Logo</a>
    <button
      class="nav__toggle"
      aria-expanded="false"
      aria-controls="nav-overlay"
      aria-label="Open menu"
    >
      <span class="nav__toggle-line"></span>
      <span class="nav__toggle-line"></span>
    </button>
  </nav>
</header>

<div class="nav-overlay" id="nav-overlay" aria-hidden="true" role="dialog" aria-label="Navigation menu">
  <div class="nav-overlay__bg" aria-hidden="true"></div>
  <nav class="nav-overlay__content">
    <ul class="nav-overlay__links" role="list">
      <li><a href="#" class="nav-overlay__link">Work</a></li>
      <li><a href="#" class="nav-overlay__link">About</a></li>
      <li><a href="#" class="nav-overlay__link">Process</a></li>
      <li><a href="#" class="nav-overlay__link">Contact</a></li>
    </ul>
    <div class="nav-overlay__info">
      <p>hello@studio.com</p>
      <div class="nav-overlay__social">...</div>
    </div>
  </nav>
</div>
```

### CSS Contract

Shared tokens plus:
- `--overlay-bg`: full-screen overlay background (e.g., `oklch(0.08 0 0 / 0.97)`)
- `--font-size-overlay`: large link size (e.g., `clamp(2rem, 6vw, 5rem)`)
- `--font-weight-overlay`: link weight (typically bold/black for impact)
- `--color-overlay-fg`: link color in overlay
- `--color-overlay-hover`: link hover color

Overlay: `position: fixed; inset: 0; z-index: var(--z-overlay)`.
Nav bar: always above overlay (`z-index: var(--z-nav)` where `z-nav > z-overlay`, or toggle stays above).

### Animation Choreography

**Open sequence** (triggered by toggle click):
1. Toggle icon morphs: two lines rotate to form an X (GSAP, 0.3s, ease: `power2.inOut`)
2. `aria-expanded="true"`, `aria-hidden="false"` on overlay
3. Overlay background scales in from the toggle button position or fades in (0.4s)
4. Links reveal with stagger:
   - Each link: `y: 60px; opacity: 0` -> `y: 0; opacity: 1`
   - Stagger: 80ms per link
   - Ease: `power3.out`
   - Total: ~0.8s for 4-5 links
5. Info section fades in after links (delay: 0.3s after last link)

**Close sequence** (toggle click or Escape):
1. Links fade out simultaneously (no stagger, 0.2s) -- closing is always faster than opening
2. Background fades out (0.3s)
3. Toggle icon morphs back to hamburger lines
4. `aria-expanded="false"`, `aria-hidden="true"` on overlay
5. Focus returns to toggle button

### Accessibility

- `prefers-reduced-motion: reduce`: Overlay appears/disappears instantly. No stagger, no morph. Toggle icon swaps between states without animation.
- Focus trap: when overlay is open, Tab cycles through overlay links only. First focusable is the first link; last is the last interactive element in info section.
- Escape key closes the overlay.
- Toggle button: `aria-expanded` toggles. `aria-controls` points to overlay ID.
- Overlay: `role="dialog"` with `aria-label`. When opened, focus moves to the first link.
- Body scroll is locked when overlay is open (`overflow: hidden` on `<html>`).

### Implementation Notes

- Hamburger icon: two `<span>` lines (not three). The two-line hamburger is cleaner and the morph to X is simpler. Top line rotates +45deg, bottom line rotates -45deg, both centered.
- Lock body scroll when overlay opens. Restore on close. Use `document.documentElement.style.overflow = 'hidden'` (not `body` -- Lenis may be on `html`).
- Large typography in the overlay is the primary design element. Size links aggressively (`clamp(2rem, 6vw, 5rem)`).
- Optional: add a hover effect on overlay links (underline draw, color shift, or image preview that appears alongside the link).
- The nav-overlay should be in the DOM at all times (not dynamically inserted). Hidden via CSS/aria when closed.

---

## sidebar-persistent

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

A vertical navigation bar fixed to the left (or right) side of the viewport. Contains logo at top, nav links vertically stacked, and optional social links or contact info at bottom. Content sits beside it. Common on portfolios, documentation sites, and single-page layouts.

Use when: the brief calls for `editorial`, `swiss`, or `minimalist` aesthetics, the page is a single-page scrolling layout, or navigation items are few enough to display vertically without scrolling.

### HTML Structure

```html
<a href="#main" class="skip-link">Skip to content</a>
<aside class="sidebar" role="navigation" aria-label="Main navigation">
  <a href="/" class="sidebar__logo" aria-label="Home">Logo</a>
  <nav>
    <ul class="sidebar__links" role="list">
      <li><a href="#work" class="sidebar__link sidebar__link--active" aria-current="page">Work</a></li>
      <li><a href="#about" class="sidebar__link">About</a></li>
      <li><a href="#contact" class="sidebar__link">Contact</a></li>
    </ul>
  </nav>
  <div class="sidebar__footer">
    <a href="mailto:hello@studio.com" class="sidebar__contact">Email</a>
  </div>
</aside>
<main id="main" class="main--with-sidebar">
  <!-- Page content -->
</main>
```

### CSS Contract

Shared tokens plus:
- `--sidebar-width`: width of the sidebar (e.g., `240px` for text, `80px` for icon-only)
- `--sidebar-bg`: sidebar background
- `--sidebar-border`: right/left border (e.g., `1px solid oklch(0.5 0 0 / 0.1)`)

Sidebar: `position: fixed; top: 0; bottom: 0; left: 0; width: var(--sidebar-width); z-index: var(--z-nav)`.
Main content: `margin-left: var(--sidebar-width)`.

Sidebar uses flexbox column with `justify-content: space-between` to push footer to the bottom.

### Mobile Adaptation

At breakpoint (`1024px` or `768px`):
- Sidebar hides off-screen (`transform: translateX(-100%)`)
- A hamburger toggle appears in a mobile top bar
- Sidebar slides in as an overlay with backdrop
- Same focus trap / aria pattern as hamburger-fullscreen

### Animation Choreography

1. **Page load**: Sidebar is static, visible immediately. No entrance animation needed (it is persistent chrome).
2. **Active link tracking**: As the user scrolls, the active link updates via IntersectionObserver on section targets. Active link gets an indicator (underline, dot, background highlight) with a 200ms CSS transition.
3. **Mobile open/close**: Sidebar slides in from left (`translateX(-100%)` -> `translateX(0)`, 300ms, `ease-out`). Backdrop fades in simultaneously.

### Accessibility

- `prefers-reduced-motion: reduce`: Mobile slide animation is instant. Active link indicator changes without transition.
- Active section tracking uses `aria-current="page"` (or `aria-current="true"` for sections on the same page).
- Sidebar has `role="navigation"` and `aria-label`.

### Implementation Notes

- Active link tracking: observe each section anchor with IntersectionObserver (`threshold: 0.3`). The last section to enter the viewport wins the active state.
- On very narrow viewports, the sidebar-persistent pattern should collapse to a bottom-bar or hamburger. It is not suitable for viewports under 1024px wide.
- The sidebar reduces the available content width. Compensate by slightly narrowing the content max-width or using `calc(100vw - var(--sidebar-width))`.
- Sidebar nav links can be oriented vertically with `writing-mode: vertical-lr` for an ultra-minimal icon + rotated-text treatment.

---

## bottom-bar-mobile

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

A fixed navigation bar at the bottom of the viewport, visible only on mobile/tablet viewports. Contains 3-5 icon+label items for primary navigation. This pattern mirrors native mobile apps and provides thumb-friendly navigation. On desktop, a standard top nav or sidebar replaces it.

Use when: the page targets mobile-first usage, the brief calls for an app-like feel, or there are 3-5 primary navigation destinations that benefit from persistent bottom access.

### HTML Structure

```html
<!-- Desktop nav (hidden on mobile) -->
<header class="nav nav--desktop" role="banner">...</header>

<!-- Mobile bottom bar (hidden on desktop) -->
<nav class="bottom-bar" aria-label="Main navigation">
  <ul class="bottom-bar__items" role="list">
    <li>
      <a href="#home" class="bottom-bar__item bottom-bar__item--active" aria-current="page">
        <svg class="bottom-bar__icon" aria-hidden="true">...</svg>
        <span class="bottom-bar__label">Home</span>
      </a>
    </li>
    <li>
      <a href="#work" class="bottom-bar__item">
        <svg class="bottom-bar__icon" aria-hidden="true">...</svg>
        <span class="bottom-bar__label">Work</span>
      </a>
    </li>
    <!-- 3-5 items total -->
  </ul>
</nav>
```

### CSS Contract

Shared tokens plus:
- `--bottom-bar-height`: bar height (e.g., `64px`)
- `--bottom-bar-bg`: background (solid or frosted)
- `--bottom-bar-border`: top border
- `--bottom-bar-icon-size`: icon size (e.g., `24px`)
- `--font-size-bar-label`: label text size (e.g., `0.625rem`)

Bar: `position: fixed; bottom: 0; left: 0; right: 0; z-index: var(--z-nav)`.
Safe area: `padding-bottom: env(safe-area-inset-bottom)` for devices with home indicators.
Items: flexbox row, `flex: 1` per item, centered content.

Show only below breakpoint: `display: none` above `768px`.

### Animation Choreography

1. **Page load**: Bar is static, visible immediately.
2. **Active state**: Icon and label shift color. Optionally, active icon scales up slightly (`scale: 1.1`, 200ms).
3. **Scroll behavior** (optional): Bottom bar hides on scroll-down, reveals on scroll-up. Use a simple scroll direction check with `translateY(100%)` / `translateY(0)` transition (300ms).

### Accessibility

- `prefers-reduced-motion: reduce`: Active state changes instantly. Scroll hide/show is instant.
- Each item is a link with visible label text. Icons are `aria-hidden="true"` since labels provide the accessible name.
- Active item: `aria-current="page"`.
- `env(safe-area-inset-bottom)` padding prevents the bar from being obscured by device UI.

### Implementation Notes

- Maximum 5 items. More than 5 cramps the layout and makes tap targets too small.
- Minimum tap target: `48px x 48px` per item.
- Body needs `padding-bottom: var(--bottom-bar-height)` (plus safe area) to prevent content from hiding behind the bar.
- The bottom bar and desktop nav should never both be visible. Use media queries for clean switching.
- Consider `backdrop-filter: blur(20px)` + semi-transparent background for a premium frosted look.

---

## command-palette

**Complexity**: M
**Performance cost**: 1
**Dependencies**: css + js

### Description

Navigation is accessed via a command palette (Cmd+K / Ctrl+K) -- a centered modal with a search input that filters available pages, sections, and actions. The persistent visible nav is minimal (logo + trigger hint). Common on developer tools, documentation sites, and SaaS products.

Use when: the brief calls for `cyberpunk` or developer-focused aesthetics, the site has many sections/pages to navigate, or the target audience is technical and expects keyboard shortcuts.

### HTML Structure

```html
<header class="nav nav--command" role="banner">
  <nav aria-label="Main navigation">
    <a href="/" class="nav__logo" aria-label="Home">Logo</a>
    <button class="nav__search-trigger" aria-label="Open navigation (Ctrl+K)">
      <span class="nav__search-hint">
        <kbd>Ctrl</kbd><kbd>K</kbd>
      </span>
    </button>
  </nav>
</header>

<div class="palette" id="command-palette" role="dialog" aria-label="Navigation search" aria-modal="true" hidden>
  <div class="palette__backdrop" aria-hidden="true"></div>
  <div class="palette__panel">
    <input
      class="palette__input"
      type="search"
      placeholder="Search or jump to..."
      aria-label="Search pages and sections"
      autocomplete="off"
    >
    <ul class="palette__results" role="listbox" aria-label="Navigation results">
      <li role="option" class="palette__result">
        <a href="#section">Section Name</a>
      </li>
      <!-- Dynamic results -->
    </ul>
    <div class="palette__footer">
      <kbd>Enter</kbd> to navigate &middot; <kbd>Esc</kbd> to close
    </div>
  </div>
</div>
```

### CSS Contract

Shared tokens plus:
- `--palette-width`: panel width (e.g., `min(560px, 90vw)`)
- `--palette-bg`: panel background (often slightly elevated from page bg)
- `--palette-border`: panel border
- `--palette-radius`: border-radius (e.g., `12px`)
- `--palette-shadow`: box-shadow for elevation
- `--backdrop-opacity`: backdrop dimming (e.g., `0.5`)

Panel: centered in viewport via `position: fixed; top: 20vh; left: 50%; transform: translateX(-50%)`.
Backdrop: `position: fixed; inset: 0; background: oklch(0 0 0 / var(--backdrop-opacity))`.

### Animation Choreography

**Open** (Cmd+K or button click):
1. Backdrop fades in (opacity 0->1, 200ms)
2. Panel scales and fades in (`scale: 0.95; opacity: 0` -> `scale: 1; opacity: 1`, 200ms, `ease-out`)
3. Input auto-focuses
4. Results populate immediately (all items) or based on initial query

**Close** (Escape, backdrop click, or selection):
1. Panel fades out (150ms -- closing is faster)
2. Backdrop fades out (150ms)
3. Focus returns to trigger button

**Filtering** (typing in input):
- Results filter in real-time with simple string matching
- Matching results stay; non-matching results collapse out
- Arrow keys navigate results, Enter selects

### Accessibility

- `prefers-reduced-motion: reduce`: Panel and backdrop appear/disappear instantly.
- `role="dialog"` with `aria-modal="true"` and `aria-label`.
- Input: `role` implicit from `type="search"`.
- Results list: `role="listbox"` with `role="option"` children. `aria-activedescendant` tracks keyboard-selected item.
- Focus trap within the palette when open.
- Escape closes and returns focus to trigger.
- The `hidden` attribute on the palette ensures it is not in the tab order or announced when closed.

### Implementation Notes

- Keyboard shortcut: listen for `Ctrl+K` (or `Cmd+K` on Mac). `e.preventDefault()` to avoid browser search.
- Results data: for single-page sites, scrape `<section>` IDs and headings on load. For multi-page, provide a static JSON index.
- Fuzzy matching: not required for MVP. Simple `includes()` or `startsWith()` is sufficient.
- The command palette replaces traditional nav for keyboard users but should not be the only way to navigate. Include standard links elsewhere (footer, sitemap) for users who do not discover the shortcut.
- This pattern pairs well with the `cyberpunk` and `swiss` aesthetics.

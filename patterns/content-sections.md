# Content Sections

Content sections are the body of the page -- everything between the hero and the footer. They present information, features, testimonials, pricing, timelines, and media. Each section should feel like a purposeful chapter, not filler.

In award-winning sites, content sections distinguish themselves through scroll-reveal choreography, layout variety, and responsive adaptation. Monotonous layouts (same grid repeated) read as template-driven. Alternating between layout styles (bento grid, split image/text, full-bleed) creates rhythm.

### Shared CSS Contract

```
--color-bg-section       Section background (alternates: --color-bg-alt)
--color-fg-section       Section text color
--color-accent           Accent color for highlights, icons, borders
--font-body              Body text typeface
--font-display           Heading typeface
--font-size-h2           Section heading size (clamp responsive)
--font-size-h3           Subsection heading size
--font-size-body         Body text size
--line-height-body       Body line-height (1.5-1.7)
--space-section          Vertical padding between sections
--space-gap              Grid/flex gap
--max-width-content      Max width for content (e.g., 1200px)
--ease-entrance          Entrance easing (power2.out)
--duration-entrance      Entrance duration (0.6-0.8s)
--stagger-items          Stagger between grid/list items (0.06-0.1s)
--radius-card            Card border-radius
--shadow-card            Card shadow
```

### Shared HTML Pattern

```html
<section class="section section--{variant}" aria-labelledby="section-heading-id">
  <div class="section__container">
    <header class="section__header">
      <p class="section__overline">Overline</p>
      <h2 class="section__heading" id="section-heading-id">Section Title</h2>
      <p class="section__description">Brief supporting text.</p>
    </header>
    <div class="section__body">
      <!-- Variant-specific content -->
    </div>
  </div>
</section>
```

### Shared Accessibility Rules

- Each section has `aria-labelledby` pointing to its heading
- Heading hierarchy: `<h2>` for section titles, `<h3>` for items within
- Links/buttons have descriptive text (no "Click here" or "Learn more" without context)
- Images have meaningful `alt` text (content images) or empty `alt=""` (decorative)
- Color is never the only means of conveying information

---

## bento-grid

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

A grid of cards with varying sizes, inspired by Apple's bento box marketing pages. Cards span different numbers of columns and rows, creating a visually interesting mosaic. Each card highlights a feature, stat, or media element.

Use when: presenting 4-8 features or highlights, the brief calls for `minimalist`, `corporate-clean`, or `glassmorphism` aesthetics, or the content is modular and each item stands independently.

### HTML Structure

```html
<section class="section section--bento" aria-labelledby="features-heading">
  <div class="section__container">
    <header class="section__header">
      <h2 id="features-heading">Features</h2>
    </header>
    <div class="bento">
      <article class="bento__card bento__card--wide">
        <div class="bento__icon" aria-hidden="true">...</div>
        <h3 class="bento__title">Feature name</h3>
        <p class="bento__text">Description.</p>
      </article>
      <article class="bento__card bento__card--tall">...</article>
      <article class="bento__card">...</article>
      <article class="bento__card">...</article>
      <article class="bento__card bento__card--wide">...</article>
    </div>
  </div>
</section>
```

### CSS Contract

- Grid: `display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-gap)` (desktop)
- `.bento__card--wide`: `grid-column: span 2`
- `.bento__card--tall`: `grid-row: span 2`
- `.bento__card--featured`: `grid-column: span 2; grid-row: span 2`
- Card styling: `background: var(--color-bg-card); border-radius: var(--radius-card); padding: var(--space-card)`

**Responsive breakpoints**:
- `> 1024px`: 4 columns
- `768px - 1024px`: 2 columns (wide cards still span 2)
- `< 768px`: 1 column (all cards full-width, no spanning)

### Scroll-Reveal Choreography

Cards reveal with batch stagger as they enter the viewport:
- Each card: `opacity: 0; transform: translateY(30px)` -> `opacity: 1; transform: translateY(0)`
- Stagger: `var(--stagger-items)` (60-100ms)
- Ease: `var(--ease-entrance)`
- Duration: `var(--duration-entrance)`
- Trigger: IntersectionObserver with `threshold: 0.15` or ScrollTrigger.batch

### Accessibility

- `prefers-reduced-motion: reduce`: Cards visible immediately, no translate animation.
- Each card is an `<article>` with a heading. Cards are semantic -- they contain readable content, not just visual boxes.
- If cards are links, the entire card should be clickable (use `<a>` wrapping the card content or a pseudo-element stretched over the card).

### Implementation Notes

- The bento layout is inherently variable. Define 2-3 card size classes and let the brief determine which cards get which sizes.
- Auto-placement with `grid-auto-flow: dense` helps fill gaps but can reorder visually. Use explicit placement for intentional layouts.
- Cards can contain: text, icons, mini charts, small images, gradient backgrounds, or code snippets.
- For glassmorphism aesthetic: `backdrop-filter: blur(20px); background: oklch(1 0 0 / 0.05); border: 1px solid oklch(1 0 0 / 0.1)`.

---

## bento-asymmetric

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

Similar to bento-grid but with intentionally asymmetric, overlapping, or offset card placement. Cards may overlap at edges, have different z-index depths, or break the grid at specific points. Creates a more dynamic, editorial feel.

Use when: the brief calls for `editorial`, `maximalist`, or `brutalist` aesthetics, or the bento-grid feels too structured for the intended vibe.

### HTML Structure

Same as bento-grid but cards may have additional positioning classes:
- `.bento__card--offset-up`: `margin-top: -2rem` (breaks grid alignment intentionally)
- `.bento__card--overlap`: `position: relative; z-index: 2; margin-left: -1rem`

### CSS Contract

Same as bento-grid plus:
- `--bento-offset`: intentional offset amount (e.g., `-2rem`)
- `--bento-overlap`: overlap amount between cards
- Cards may use `position: relative` with `z-index` to layer

### Scroll-Reveal Choreography

Same stagger as bento-grid, but add slight rotation to the entrance:
- Cards enter with `translateY(40px) rotate(1deg)` -> `translateY(0) rotate(0)` for a looser feel
- Stagger is slightly longer (100-120ms) to emphasize the asymmetry

### Accessibility

- Same as bento-grid. Visual asymmetry does not affect DOM order.
- Overlapping cards must maintain readability -- no text obscured by an overlapping sibling.

### Implementation Notes

- Asymmetric bento works best with 5-7 items. Fewer feels empty; more becomes chaotic.
- The "broken grid" effect is achieved with CSS negative margins or manual `grid-row`/`grid-column` placement that creates intentional gaps.
- For brutalist aesthetics: thick borders, hard shadows (offset, no blur), and high-contrast backgrounds per card.

---

## scroll-reveal-cards

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-scrolltrigger

### Description

Cards or content blocks that animate into view with scroll-driven choreography. Unlike the batch stagger on bento grids, this variant uses more expressive reveals: clip-path wipes, 3D rotations, scale-up from small, or curtain-overlay reveals. Each card's entrance is a small moment.

Use when: the content is visual (portfolio items, case studies, product showcases), the brief calls for `dark-luxury` or `immersive` aesthetics, or individual items deserve more dramatic entrances than a simple fade.

### HTML Structure

```html
<section class="section section--reveal-cards" aria-labelledby="projects-heading">
  <div class="section__container">
    <h2 id="projects-heading">Selected projects</h2>
    <div class="reveal-cards">
      <article class="reveal-card" data-reveal="clip-left">
        <div class="reveal-card__media">
          <img src="project-1.webp" alt="Project One screenshot" loading="lazy">
        </div>
        <div class="reveal-card__content">
          <h3>Project One</h3>
          <p>Brief description.</p>
        </div>
      </article>
      <!-- More cards -->
    </div>
  </div>
</section>
```

### CSS Contract

Shared tokens plus:
- `--reveal-type`: `clip-left` | `clip-bottom` | `scale-up` | `curtain` | `rotate-in`
- `--reveal-duration`: per-card reveal (0.8-1.2s)
- `--reveal-stagger`: between cards (0.15-0.25s if multiple enter simultaneously)

### Scroll-Reveal Choreography

**clip-left**: `clip-path: inset(0 100% 0 0)` -> `inset(0 0 0 0)` (wipe from left, 0.8s, `power3.inOut`)

**clip-bottom**: `clip-path: inset(100% 0 0 0)` -> `inset(0 0 0 0)` (wipe from bottom)

**scale-up**: `scale: 0.85; opacity: 0` -> `scale: 1; opacity: 1` (0.6s, `power2.out`)

**curtain**: A colored overlay div slides across the card, then slides out the other side, revealing the content underneath. Two-phase: color block enters (0.4s) -> color block exits (0.4s) with content revealed beneath.

**rotate-in**: `rotateY(-15deg); opacity: 0` -> `rotateY(0); opacity: 1` (perspective container required)

Each card gets its own ScrollTrigger: `start: "top 85%"`, `end: "top 60%"`, `toggleActions: "play none none none"`.

### Accessibility

- `prefers-reduced-motion: reduce`: All cards visible immediately with no clip-path, scale, or rotation animation.
- Cards must be readable in source order without scroll-triggered animation.
- `loading="lazy"` on images for cards below the fold.

### Implementation Notes

- Curtain reveal: the overlay div is a pseudo-element with `position: absolute; inset: 0; background: var(--color-accent)`. It enters via `translateX(-100%)` -> `0` then exits via `0` -> `translateX(100%)`.
- `perspective` must be set on the parent for `rotate-in` to work: `perspective: 1000px` on the cards container.
- For portfolio layouts, alternate reveal direction (odd cards from left, even from right) for visual rhythm.

---

## timeline-vertical

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css | gsap (optional)

### Description

A vertical timeline with alternating items on left and right sides of a central line. Each item has a date/label, a connector dot on the timeline, and content. Items reveal as the user scrolls.

Use when: presenting chronological information (history, process steps, roadmap, experience), the brief calls for `editorial` or `corporate-clean` aesthetics.

### HTML Structure

```html
<section class="section section--timeline" aria-labelledby="timeline-heading">
  <div class="section__container">
    <h2 id="timeline-heading">Our Journey</h2>
    <div class="timeline" role="list">
      <article class="timeline__item" role="listitem">
        <div class="timeline__date">2024</div>
        <div class="timeline__dot" aria-hidden="true"></div>
        <div class="timeline__content">
          <h3>Founded</h3>
          <p>Description of the event.</p>
        </div>
      </article>
      <!-- More items -->
    </div>
  </div>
</section>
```

### CSS Contract

- Timeline line: `::before` pseudo-element on `.timeline`, `position: absolute; left: 50%; width: 2px; background: var(--color-accent)`
- Items: grid or flexbox, alternating `text-align` and `order` for left/right placement
- Dot: `width: 12px; height: 12px; border-radius: 50%; background: var(--color-accent); position: absolute; left: 50%; transform: translateX(-50%)`

**Responsive**: Below `768px`, all items align to the left with the timeline line on the left edge.

### Scroll-Reveal Choreography

- Timeline line draws down as user scrolls (CSS `scaleY` from 0 to 1, tied to scroll progress via `animation-timeline: scroll()` or ScrollTrigger)
- Each item fades in and slides from its side (left items from left, right items from right): `translateX(30px)` or `translateX(-30px)` + `opacity: 0` -> resolved
- Dot pulses briefly when its item enters viewport (scale 0 -> 1.2 -> 1, 0.4s)

### Accessibility

- `prefers-reduced-motion: reduce`: All items visible, no slide animation. Timeline line visible at full length.
- `role="list"` on the timeline container and `role="listitem"` on each item for ordered content semantics.
- Date information must be text (not images or pseudo-content only) so screen readers can announce it.

### Implementation Notes

- The center-line alternating layout requires careful CSS. Approach: each item is a grid row with three columns (left content, center dot, right content). Odd items place content in column 1, even items in column 3.
- Mobile collapse: single column, all items left-aligned. The timeline line shifts to `left: 0` or `left: 16px`.
- For long timelines (10+ items), consider lazy-loading items below the fold.

---

## timeline-horizontal

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-scrolltrigger | css

### Description

A horizontal scrolling timeline, often used for process steps, project phases, or historical events. The viewport shows 2-4 items at once; the rest scroll horizontally. Can be driven by scroll (ScrollTrigger) or swipe gestures.

Use when: the timeline has many items that would make a vertical layout excessively long, the brief calls for `retro-futurism` or `swiss` aesthetics, or the content benefits from a left-to-right reading progression.

### HTML Structure

```html
<section class="section section--h-timeline" aria-labelledby="process-heading">
  <div class="section__container">
    <h2 id="process-heading">Our Process</h2>
    <div class="h-timeline">
      <div class="h-timeline__track">
        <div class="h-timeline__line" aria-hidden="true"></div>
        <article class="h-timeline__item">
          <div class="h-timeline__number" aria-hidden="true">01</div>
          <h3>Discovery</h3>
          <p>Research and define the problem.</p>
        </article>
        <!-- More items -->
      </div>
    </div>
  </div>
</section>
```

### CSS Contract

- Track: `display: flex; gap: var(--space-gap); overflow-x: auto` (CSS-only) or `overflow: hidden` (ScrollTrigger-driven)
- Items: `min-width: 300px` or `min-width: 25vw`
- Line: horizontal line connecting items, `height: 2px; background: var(--color-accent)`

### Scroll-Reveal Choreography

**CSS-only approach**: Native horizontal scroll with `scroll-snap-type: x mandatory` and `scroll-snap-align: start` on items.

**ScrollTrigger approach**: Section pins, vertical scroll drives horizontal translation of the track. Items reveal with stagger as they enter the viewport within the scrolling container.

### Accessibility

- `prefers-reduced-motion: reduce`: Show all items without scroll animation. Provide simple horizontal scroll or stack vertically.
- Ensure keyboard navigation works: arrow keys or Tab should move through items.
- `tabindex="0"` on the scrollable track for keyboard accessibility, with `role="region"` and `aria-label="Timeline, scrollable"`.

### Implementation Notes

- CSS scroll snap is the simplest approach and works well for touch devices.
- ScrollTrigger-driven horizontal scroll is more visually impressive but requires careful calculation: `end: "+=" + (trackWidth - viewportWidth)`.
- On mobile, native horizontal scroll (CSS snap) is almost always better than ScrollTrigger-driven -- it feels native and respects platform gestures.

---

## split-image-text

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css | gsap (optional)

### Description

Content alternates between image and text, split across two columns. Each row pairs a visual with descriptive content. Rows alternate which side the image is on (left/right zigzag pattern).

Use when: presenting features with supporting visuals, case studies, product details, the brief calls for `editorial`, `corporate-clean`, or `organic` aesthetics.

### HTML Structure

```html
<section class="section section--split" aria-labelledby="details-heading">
  <div class="section__container">
    <h2 id="details-heading" class="sr-only">Product Details</h2>
    <div class="split">
      <div class="split__media">
        <img src="feature-1.webp" alt="Feature demonstration" loading="lazy">
      </div>
      <div class="split__content">
        <h3>Feature name</h3>
        <p>Detailed explanation.</p>
      </div>
    </div>
    <div class="split split--reverse">
      <div class="split__media">
        <img src="feature-2.webp" alt="Second feature" loading="lazy">
      </div>
      <div class="split__content">
        <h3>Another feature</h3>
        <p>Explanation.</p>
      </div>
    </div>
  </div>
</section>
```

### CSS Contract

- Layout: `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-gap); align-items: center`
- `.split--reverse`: `direction: rtl` on the grid, `direction: ltr` on children (or use `order` property)
- Responsive: `grid-template-columns: 1fr` below `768px`, image stacks above text

### Scroll-Reveal Choreography

- Image: slides in from its side (`translateX(-30px)` or `translateX(30px)`) + `opacity: 0`
- Text: slides in from the opposite side
- Both triggered by ScrollTrigger when the split row enters the viewport
- Duration: 0.8s, ease: `power2.out`

### Accessibility

- `prefers-reduced-motion: reduce`: No slide animation. Content visible immediately.
- Images must have descriptive `alt` text (they are content, not decoration).
- The `sr-only` heading keeps the section labeled even when the visual heading is omitted.

### Implementation Notes

- The reverse layout should not change DOM order -- only visual order via CSS. This preserves reading order for screen readers.
- Images should use `aspect-ratio` for layout stability before lazy-load completes.
- For `editorial` aesthetics, make the image slightly larger than the text column (e.g., 55/45 split).

---

## masonry

**Complexity**: M
**Performance cost**: 1
**Dependencies**: css | js (for true masonry)

### Description

A masonry (Pinterest-style) layout where items have variable heights and pack tightly into columns without gaps. Used for image galleries, blog post grids, or mixed-content collections.

Use when: items have naturally different heights (images with varying aspect ratios, text of different lengths), the brief calls for `editorial`, `organic`, or `maximalist` aesthetics.

### HTML Structure

```html
<section class="section section--masonry" aria-labelledby="gallery-heading">
  <div class="section__container">
    <h2 id="gallery-heading">Gallery</h2>
    <div class="masonry" role="list">
      <article class="masonry__item" role="listitem">
        <img src="image-1.webp" alt="Description" loading="lazy">
        <div class="masonry__caption">Optional caption</div>
      </article>
      <!-- More items -->
    </div>
  </div>
</section>
```

### CSS Contract

**CSS columns approach** (simplest, no JS):
```css
.masonry {
  column-count: 3;
  column-gap: var(--space-gap);
}
.masonry__item {
  break-inside: avoid;
  margin-bottom: var(--space-gap);
}
```

**CSS Grid masonry** (spec in progress, Chrome 128+ behind flag):
```css
.masonry {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: masonry;
  gap: var(--space-gap);
}
```

**Responsive**: 3 columns > 1024px, 2 columns 768-1024px, 1 column < 768px.

### Scroll-Reveal Choreography

- Batch reveal: items stagger in as they enter the viewport
- `opacity: 0; translateY(20px)` -> resolved
- Stagger: 60ms per item
- Use ScrollTrigger.batch for efficient multi-element observation

### Accessibility

- `prefers-reduced-motion: reduce`: All items visible immediately.
- `role="list"` / `role="listitem"` for semantic structure.
- CSS columns can reorder items (they flow top-to-bottom per column). Ensure reading order makes sense in this flow, or use grid masonry which preserves row order.

### Implementation Notes

- CSS `column-count` is the most reliable cross-browser approach in 2026. It flows items top-to-bottom within columns, which may not match the desired left-to-right reading order.
- For left-to-right order with variable heights, a JS masonry layout is needed (calculate positions manually or use `grid-template-rows: masonry` when widely supported).
- Images should have explicit `width` and `height` attributes (or `aspect-ratio`) to prevent layout shift during lazy loading.

---

## accordion-faq

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

Expandable/collapsible content sections, typically used for FAQs. Uses native HTML `<details>/<summary>` for zero-JS functionality, enhanced with CSS transitions.

Use when: presenting FAQ content, feature details that benefit from progressive disclosure, or any content where showing everything at once would be overwhelming.

### HTML Structure

```html
<section class="section section--faq" aria-labelledby="faq-heading">
  <div class="section__container">
    <h2 id="faq-heading">Frequently Asked Questions</h2>
    <div class="accordion">
      <details class="accordion__item">
        <summary class="accordion__trigger">
          <h3>Question text here?</h3>
          <span class="accordion__icon" aria-hidden="true">+</span>
        </summary>
        <div class="accordion__content">
          <p>Answer text here.</p>
        </div>
      </details>
      <!-- More items -->
    </div>
  </div>
</section>
```

### CSS Contract

- Summary: `cursor: pointer; list-style: none` (remove default triangle marker)
- Content: animated height via `@starting-style` + `transition` or `grid-template-rows: 0fr -> 1fr` trick
- Icon rotation: `transform: rotate(0deg)` -> `rotate(45deg)` when open
- Border between items: `border-bottom: 1px solid var(--color-border)`

### Animation Choreography

**CSS-native approach** (no JS):
- Use `@starting-style` on the content for entry animation
- `transition: grid-template-rows 300ms var(--ease-standard), opacity 300ms`
- Content wrapper: `overflow: hidden; display: grid; grid-template-rows: 0fr` (closed) -> `grid-template-rows: 1fr` (open via `[open]` attribute)
- Icon: `transition: transform 300ms`

### Accessibility

- `prefers-reduced-motion: reduce`: Instant open/close (no height transition).
- Native `<details>/<summary>` provides built-in keyboard support (Enter/Space to toggle) and screen reader announcements.
- The `<summary>` contains the heading. Do not nest interactive elements inside `<summary>`.
- No `aria-expanded` needed -- `<details>` handles this natively.

### Implementation Notes

- `<details>/<summary>` is the semantic approach. Avoid custom div+button accordions unless you need features `<details>` does not provide.
- The `grid-template-rows: 0fr` -> `1fr` trick with `overflow: hidden` on the inner wrapper is the cleanest CSS-only height animation for details/summary.
- For exclusive accordions (only one open at a time), add the `name` attribute: `<details name="faq">`. Browser support: Chrome 120+, Firefox 130+, Safari 17.2+.

---

## tabbed-content

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css + js

### Description

Content organized into tabs. Clicking a tab shows its associated panel. Only one panel is visible at a time. Used for feature categories, plan comparisons, or grouped information.

### HTML Structure

```html
<section class="section section--tabs" aria-labelledby="tabs-heading">
  <div class="section__container">
    <h2 id="tabs-heading">Explore</h2>
    <div class="tabs">
      <div class="tabs__list" role="tablist" aria-label="Content categories">
        <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1" class="tabs__tab tabs__tab--active">Tab 1</button>
        <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2" class="tabs__tab" tabindex="-1">Tab 2</button>
        <button role="tab" aria-selected="false" aria-controls="panel-3" id="tab-3" class="tabs__tab" tabindex="-1">Tab 3</button>
      </div>
      <div role="tabpanel" id="panel-1" aria-labelledby="tab-1" class="tabs__panel tabs__panel--active">
        <p>Content for tab 1.</p>
      </div>
      <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" class="tabs__panel" hidden>
        <p>Content for tab 2.</p>
      </div>
      <div role="tabpanel" id="panel-3" aria-labelledby="tab-3" class="tabs__panel" hidden>
        <p>Content for tab 3.</p>
      </div>
    </div>
  </div>
</section>
```

### CSS Contract

- Tab list: `display: flex; gap: 0; border-bottom: 2px solid var(--color-border)`
- Active tab: `border-bottom: 2px solid var(--color-accent); color: var(--color-accent)` (indicator slides with transition)
- Panel: `padding-top: var(--space-gap)`

### Animation Choreography

- Tab switch: active indicator slides horizontally (GSAP or CSS transition on a pseudo-element that changes `left` and `width`)
- Panel transition: outgoing panel fades out (150ms), incoming panel fades in (300ms)
- Optional: content within panel staggers in on each tab switch

### Accessibility

- `prefers-reduced-motion: reduce`: Panel switches instantly. Indicator jumps.
- Full ARIA tab pattern: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`.
- Keyboard: Arrow left/right moves between tabs. Home/End jump to first/last tab. Tab key exits the tablist into the active panel.
- Non-active tabs: `tabindex="-1"`. Active tab: `tabindex="0"`.
- Hidden panels: `hidden` attribute (removes from accessibility tree).

### Implementation Notes

- The sliding indicator is a pseudo-element on the tab list that GSAP (or CSS transition) moves to match the active tab's position and width. Calculate with `getBoundingClientRect()`.
- On mobile, if tabs overflow, the tab list should scroll horizontally with `overflow-x: auto; scroll-snap-type: x mandatory`.
- Do not lazy-load content in hidden panels if SEO matters -- all content should be in the DOM for indexing. Use `hidden` attribute, not `display: none` via JavaScript timing.

---

## stats-counter

**Complexity**: L
**Performance cost**: 1
**Dependencies**: gsap | css

### Description

A row of large numbers (statistics, metrics, achievements) that count up from 0 to their final value when the section enters the viewport. Optionally includes labels and units.

### HTML Structure

```html
<section class="section section--stats" aria-labelledby="stats-heading">
  <div class="section__container">
    <h2 id="stats-heading" class="sr-only">Key Numbers</h2>
    <div class="stats">
      <div class="stats__item">
        <span class="stats__number" data-target="150" data-suffix="+">0</span>
        <span class="stats__label">Projects delivered</span>
      </div>
      <div class="stats__item">
        <span class="stats__number" data-target="98" data-suffix="%">0</span>
        <span class="stats__label">Client satisfaction</span>
      </div>
      <!-- More items -->
    </div>
  </div>
</section>
```

### CSS Contract

- Layout: `display: flex; justify-content: space-around; text-align: center` or grid
- Number: `font-family: var(--font-display); font-size: clamp(2.5rem, 5vw, 5rem); font-variant-numeric: tabular-nums`
- `font-variant-numeric: tabular-nums` is critical -- it prevents layout shift as numbers change during counting

### Animation Choreography

- Trigger: IntersectionObserver or ScrollTrigger, `start: "top 80%"`, once
- Count from 0 to `data-target` over 1.5-2.5s using GSAP `to` with `snap: { innerText: 1 }` on the element or a manual counter function
- Ease: `power2.out` (fast start, slow finish)
- Suffix (%, +, K, M) appended after number
- All counters start simultaneously (no stagger between them)

### Accessibility

- `prefers-reduced-motion: reduce`: Show final values immediately, no counting animation.
- The `sr-only` heading keeps the section labeled for screen readers.
- Numbers should be text, not images. The `data-target` value should be the final rendered text for accessibility.
- After animation completes, the displayed text must match the final number (not freeze mid-count).

### Implementation Notes

- `font-variant-numeric: tabular-nums` ensures equal-width digits, preventing the number from jumping around as digits change.
- Use `Intl.NumberFormat` for locale-appropriate number formatting (commas, periods).
- Large numbers (millions, billions): animate abbreviated forms (e.g., 1.5M) or animate the significant digits only.
- For very large numbers, `snap: { innerText: 10 }` or `snap: { innerText: 100 }` to count in larger steps.

---

## testimonial-carousel

**Complexity**: M
**Performance cost**: 1
**Dependencies**: css + js

### Description

A carousel of customer testimonials or quotes that cycles manually (arrows/dots) or auto-advances. Each slide shows a quote, attribution, and optional avatar/company logo.

### HTML Structure

```html
<section class="section section--testimonials" aria-labelledby="testimonials-heading">
  <div class="section__container">
    <h2 id="testimonials-heading">What people say</h2>
    <div class="carousel" role="region" aria-label="Testimonials" aria-roledescription="carousel">
      <div class="carousel__track" aria-live="polite">
        <blockquote class="carousel__slide carousel__slide--active" role="group" aria-roledescription="slide" aria-label="Slide 1 of 3">
          <p class="carousel__quote">"Quote text here."</p>
          <footer class="carousel__attribution">
            <cite class="carousel__name">Name</cite>
            <span class="carousel__role">Title, Company</span>
          </footer>
        </blockquote>
        <!-- More slides (hidden) -->
      </div>
      <div class="carousel__controls">
        <button class="carousel__prev" aria-label="Previous testimonial">
          <svg aria-hidden="true">...</svg>
        </button>
        <div class="carousel__dots" role="tablist" aria-label="Testimonial navigation">
          <button role="tab" aria-selected="true" aria-label="Slide 1" class="carousel__dot carousel__dot--active"></button>
          <button role="tab" aria-selected="false" aria-label="Slide 2" class="carousel__dot"></button>
          <button role="tab" aria-selected="false" aria-label="Slide 3" class="carousel__dot"></button>
        </div>
        <button class="carousel__next" aria-label="Next testimonial">
          <svg aria-hidden="true">...</svg>
        </button>
      </div>
    </div>
  </div>
</section>
```

### Animation Choreography

- Slide transition: crossfade (`opacity: 0 -> 1` on incoming, `1 -> 0` on outgoing, 400ms)
- Optional: slight translateX on transition direction (100px left for next, right for prev)
- Dots: active dot scales up or changes color (200ms transition)
- Auto-advance (optional): 5-8 second interval. Pause on hover or focus within the carousel.

### Accessibility

- `prefers-reduced-motion: reduce`: Instant slide change, no crossfade or translate.
- `aria-roledescription="carousel"` on the container.
- Each slide: `role="group"` with `aria-roledescription="slide"` and `aria-label="Slide N of M"`.
- `aria-live="polite"` on the track announces slide changes to screen readers.
- Auto-advance must pause when any element in the carousel receives focus or hover (WCAG 2.2.2).
- Arrow keys on dots should navigate between slides.

### Implementation Notes

- For 3-5 testimonials, a simple crossfade carousel is sufficient. Avoid complex 3D carousels or infinite scroll -- they add complexity without value for testimonials.
- If auto-advance is enabled, include a visible pause button.
- `<blockquote>` with `<cite>` is the semantically correct markup for testimonials.
- On mobile, consider swipe gestures via touch event listeners (simple left/right threshold detection).

---

## feature-comparison

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

A table or grid comparing features across plans, products, or options. Uses checkmarks, icons, or text values in cells. Must be responsive -- tables on mobile are notoriously difficult.

### HTML Structure

```html
<section class="section section--comparison" aria-labelledby="comparison-heading">
  <div class="section__container">
    <h2 id="comparison-heading">Compare Plans</h2>
    <div class="comparison" role="region" aria-label="Feature comparison table" tabindex="0">
      <table class="comparison__table">
        <thead>
          <tr>
            <th scope="col">Feature</th>
            <th scope="col">Basic</th>
            <th scope="col">Pro</th>
            <th scope="col">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Storage</th>
            <td>10 GB</td>
            <td>100 GB</td>
            <td>Unlimited</td>
          </tr>
          <tr>
            <th scope="row">API access</th>
            <td><span class="comparison__no" aria-label="Not included">—</span></td>
            <td><span class="comparison__yes" aria-label="Included">&#10003;</span></td>
            <td><span class="comparison__yes" aria-label="Included">&#10003;</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>
```

### CSS Contract

- Table: `width: 100%; border-collapse: collapse`
- Header cells: `background: var(--color-bg-alt); font-weight: bold; padding: var(--space-cell)`
- Alternating row stripes: `tr:nth-child(even) { background: var(--color-bg-alt) }`
- Sticky first column on mobile: `th[scope="row"] { position: sticky; left: 0; background: var(--color-bg-section); z-index: 1 }`

**Responsive**: Wrap table in a horizontally scrollable container (`overflow-x: auto`) with `tabindex="0"` and `role="region"`.

### Accessibility

- Use `<th scope="col">` for column headers and `<th scope="row">` for row headers.
- Checkmarks/crosses must have `aria-label` ("Included" / "Not included") -- visual symbols alone are insufficient.
- Scrollable container: `role="region"` with `aria-label` and `tabindex="0"` for keyboard scrolling.

### Implementation Notes

- Tables are the semantically correct choice for comparison data. Do not use divs styled as a table -- it breaks screen reader table navigation.
- For mobile, sticky first column + horizontal scroll is the most reliable approach.
- Highlight the recommended plan column with a distinct background or border.

---

## pricing-table

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

Side-by-side pricing plan cards, typically 2-4 plans. Each card shows the plan name, price, feature list, and CTA. One plan is usually highlighted as recommended.

### HTML Structure

```html
<section class="section section--pricing" aria-labelledby="pricing-heading">
  <div class="section__container">
    <h2 id="pricing-heading">Pricing</h2>
    <div class="pricing">
      <article class="pricing__card">
        <h3 class="pricing__name">Starter</h3>
        <div class="pricing__price">
          <span class="pricing__currency">$</span>
          <span class="pricing__amount">19</span>
          <span class="pricing__period">/mo</span>
        </div>
        <ul class="pricing__features" role="list">
          <li>Feature one</li>
          <li>Feature two</li>
          <li class="pricing__feature--disabled" aria-label="Not included: Feature three">
            <s>Feature three</s>
          </li>
        </ul>
        <a href="#" class="btn btn--ghost">Get started</a>
      </article>
      <article class="pricing__card pricing__card--featured">
        <div class="pricing__badge">Most popular</div>
        <h3 class="pricing__name">Pro</h3>
        <!-- Same structure, highlighted styling -->
      </article>
      <!-- More plans -->
    </div>
  </div>
</section>
```

### CSS Contract

- Layout: `display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-gap)`
- Featured card: `border: 2px solid var(--color-accent); transform: scale(1.05)` (slightly larger) or `box-shadow` elevation
- Badge: `position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--color-accent); padding: 4px 16px; border-radius: 999px; font-size: 0.75rem`

### Scroll-Reveal Choreography

- Cards stagger in from bottom: `translateY(30px); opacity: 0` -> resolved
- Featured card may have a slightly different entrance (scale from 0.95 -> 1.05, or delay 100ms)

### Accessibility

- `prefers-reduced-motion: reduce`: Cards visible immediately.
- Disabled features use `<s>` (strikethrough) with `aria-label` explaining exclusion.
- Each card is an `<article>` with its own heading for landmark navigation.
- CTA buttons are descriptive: "Get started with Pro" not just "Get started" (use `aria-label` if button text is generic).

### Implementation Notes

- Price toggle (monthly/annual) is a common enhancement. Use a toggle switch above the pricing cards that updates amounts with a smooth number transition.
- 3 plans is the standard. 2 feels sparse, 4 can be overwhelming. If 4+ plans exist, consider the feature-comparison table instead.
- Featured card scaling (`scale(1.05)`) can cause overlap on tight layouts. Use `z-index: 1` on the featured card and negative margin or padding adjustments on neighbors.

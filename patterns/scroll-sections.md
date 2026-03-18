# Scroll Sections

Scroll-driven sections are the narrative backbone of award-winning web pages. They transform the scroll from a passive content-delivery mechanism into an interactive storytelling tool. The user's scroll input becomes the timeline scrub head -- controlling when elements appear, transform, and transition.

The dominant stack for scroll sections in 2026: **Lenis** (smooth scroll, 3KB) + **GSAP ScrollTrigger** (scroll-linked animation). For simple cases, CSS-native `animation-timeline: scroll() | view()` handles it without JavaScript.

### Shared CSS Contract

```
--color-bg-section       Section background
--color-fg-section       Section text color
--ease-dramatic          Slow expressive easing (power3.out)
--ease-entrance          Standard entrance (power2.out)
--duration-entrance      Entrance duration (0.6-0.8s)
--stagger-items          Item stagger (60-100ms)
--space-section          Vertical padding
--max-width-content      Content max-width
```

### Lenis + ScrollTrigger Integration

This pattern is shared across all scroll sections that use GSAP:

```javascript
// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
  lerp: 0.1,          // 0.07-0.12 for luxury, 0.15-0.2 for responsive
  smoothWheel: true,
  syncTouch: false,    // Do not override native touch scrolling
});

// Connect Lenis to GSAP's ticker
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Lenis smooths the scroll input. ScrollTrigger reads the scroll position and drives animations. They do not conflict -- Lenis uses `scrollTo` (not transforms), so `position: sticky` and IntersectionObserver work normally.

### Shared Accessibility Rules

- `prefers-reduced-motion: reduce`: Disable Lenis smooth scroll (use native browser scroll). Kill all ScrollTrigger instances. Show all content at final state. Remove pinning.
- Scroll-pinned sections must not trap keyboard navigation. Tab key must advance past pinned content.
- All content revealed by scroll must be present in the DOM and readable without JavaScript.
- Scroll-hijacking (changing scroll direction or speed) should be clearly communicated to the user or avoided.

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  lenis.destroy();
  ScrollTrigger.getAll().forEach(st => st.kill());
  gsap.globalTimeline.progress(1); // jump all animations to end state
}
```

---

## CSS Scroll-Driven Animations (Native)

**Browser support (2026)**: Chrome 115+, Edge 115+, Safari 26+. Firefox behind flag (`layout.css.scroll-driven-animations.enabled`). Global: ~83%.

CSS scroll-driven animations run on the **compositor thread** — zero JavaScript, no event listeners, no `requestAnimationFrame`. They are the preferred choice for simple scroll-linked effects (progress bars, parallax, reveal animations). Use GSAP ScrollTrigger for complex orchestrations (pinning, snapping, multi-step timelines).

### Feature Detection

```css
@supports (animation-timeline: scroll()) {
  /* CSS scroll-driven animations supported */
}
```

```javascript
// JS feature detection
if (CSS.supports('animation-timeline', 'scroll()')) {
  // Use native CSS animations
} else {
  // Fall back to GSAP ScrollTrigger
}
```

### `scroll()` — Document/Container Scroll Progress

Ties animation progress to how far a scroll container has been scrolled (0% = top, 100% = bottom):

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-fade {
  animation: fade-in-up linear both;
  animation-timeline: scroll();        /* nearest scrollable ancestor */
  animation-range: 0% 50%;             /* animate over first half of scroll */
}
```

### `view()` — Element Visibility Progress

Ties animation progress to an element's visibility within the viewport (most useful for per-element effects):

```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.view-reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;  /* animate during entry into viewport */
}
```

### `animation-range` Values

| Range | Meaning |
|-------|---------|
| `entry 0%` | Element's leading edge touches viewport bottom |
| `entry 100%` | Element fully inside viewport |
| `exit 0%` | Element starts leaving viewport |
| `exit 100%` | Element's trailing edge leaves viewport top |
| `contain 0%` | Element just fully contained |
| `cover 0%` | Element starts covering viewport |

### Parallax with CSS Scroll-Driven Animations

```css
@keyframes parallax-slow {
  from { transform: translateY(100px); }
  to { transform: translateY(-100px); }
}

.parallax-bg {
  animation: parallax-slow linear both;
  animation-timeline: view();
  animation-range: cover 0% cover 100%;
}
```

### Polyfill Strategy

```html
<script>
  if (!CSS.supports('animation-timeline', 'scroll()')) {
    import('https://cdn.jsdelivr.net/npm/scroll-timeline-polyfill@latest/dist/scroll-timeline.js');
  }
</script>
```

### When to Use CSS vs GSAP

| Scenario | Use CSS | Use GSAP |
|----------|---------|----------|
| Progress bar fill | Yes | Fallback |
| Simple parallax | Yes | Fallback |
| Element reveal on enter | Yes | Fallback |
| SVG path drawing on scroll | Yes | Fallback |
| Pinned sections | No | Yes (pin not supported in CSS) |
| Snap points | CSS `scroll-snap` | Yes (for animated snap) |
| Multi-step timelines | No | Yes |
| Scrub with smoothing | No | Yes (`scrub: 0.5`) |
| Callbacks / JS logic | No | Yes |
| Element stagger | Limited (nth-child) | Yes (batch, dynamic) |

### Accessibility

- `prefers-reduced-motion: reduce`: CSS scroll-driven animations are disabled by the global `animation-duration: 0.01ms` rule already in the reduced-motion media query.
- Scroll-driven CSS animations cannot "trap" the user — they are purely visual and do not affect scroll behavior.

---

## pin-and-reveal

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-scrolltrigger

### Description

A section pins in the viewport while its internal content animates through a sequence. The user scrolls, but instead of the section moving, the content within it changes -- text swaps, images transition, progress bars fill, or panels slide. This is the workhorse scroll pattern for product pages, feature tours, and storytelling sections.

### HTML Structure

```html
<section class="pin-reveal" aria-label="Feature walkthrough">
  <div class="pin-reveal__container">
    <div class="pin-reveal__content">
      <div class="pin-reveal__step pin-reveal__step--active" data-step="1">
        <h2>Step one headline</h2>
        <p>Explanation of the first feature.</p>
      </div>
      <div class="pin-reveal__step" data-step="2">
        <h2>Step two headline</h2>
        <p>Explanation of the second feature.</p>
      </div>
      <div class="pin-reveal__step" data-step="3">
        <h2>Step three headline</h2>
        <p>Explanation of the third feature.</p>
      </div>
    </div>
    <div class="pin-reveal__visual" aria-hidden="true">
      <!-- Image, illustration, or device mockup that changes per step -->
      <img class="pin-reveal__image" data-step="1" src="step-1.webp" alt="">
      <img class="pin-reveal__image" data-step="2" src="step-2.webp" alt="">
      <img class="pin-reveal__image" data-step="3" src="step-3.webp" alt="">
    </div>
    <div class="pin-reveal__progress" aria-hidden="true">
      <div class="pin-reveal__progress-bar"></div>
    </div>
  </div>
</section>
```

### CSS Contract

- Section: `min-height: 300vh` (scroll distance = 3x viewport for 3 steps; adjust per step count)
- Container: `position: relative; height: 100vh` (ScrollTrigger pins this)
- Steps: `position: absolute; inset: 0; opacity: 0` (hidden), `.pin-reveal__step--active`: `opacity: 1`
- Progress bar: `transform: scaleX(0); transform-origin: left`

### GSAP ScrollTrigger Configuration

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.pin-reveal',
    start: 'top top',
    end: 'bottom bottom',    // or `end: '+=200%'` for explicit scroll distance
    pin: '.pin-reveal__container',
    scrub: 0.5,              // 0.5s catch-up smoothing
    snap: {
      snapTo: 1 / (stepCount - 1),  // snap to each step
      duration: { min: 0.2, max: 0.5 },
      ease: 'power2.inOut'
    }
  }
});

// Animate between steps
tl.to('.pin-reveal__step[data-step="1"]', { opacity: 0, duration: 0.3 })
  .fromTo('.pin-reveal__step[data-step="2"]', { opacity: 0 }, { opacity: 1, duration: 0.3 })
  .to('.pin-reveal__step[data-step="2"]', { opacity: 0, duration: 0.3 })
  .fromTo('.pin-reveal__step[data-step="3"]', { opacity: 0 }, { opacity: 1, duration: 0.3 });

// Progress bar
gsap.to('.pin-reveal__progress-bar', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: '.pin-reveal',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true
  }
});
```

### Animation Choreography

1. User scrolls into the pin-reveal section
2. Container pins at `top: 0` (fixed in viewport)
3. Scroll progress 0-33%: Step 1 visible, step 1 image shown
4. Progress 33%: Step 1 fades out, Step 2 fades in, image crossfades
5. Progress 66%: Step 2 fades out, Step 3 fades in
6. Progress 100%: Section unpins, normal scroll resumes
7. Progress bar fills linearly throughout

**Snap**: Optional but recommended. Snaps to discrete steps so the user always lands on a complete state, not between two states.

### Accessibility

- `prefers-reduced-motion: reduce`: No pinning. All steps visible in a vertical stack. Progress bar hidden.
- All step content is in the DOM at all times -- screen readers read it in order regardless of visibility.
- Keyboard: Tab must not get trapped in the pinned section. ScrollTrigger pinning does not affect tab order (it uses `position: fixed` or `translateY`, not `overflow: hidden`).

### Implementation Notes

- The section height determines scroll distance. Formula: `(stepCount) * 100vh` gives one viewport of scroll per step.
- `scrub: 0.5` provides smooth catch-up. `scrub: true` (no smoothing) feels jerkier but more direct.
- `snap` is optional. Without it, users can stop between steps. With it, the scroll snaps to the nearest step.
- Pin spacing: ScrollTrigger automatically adds padding to prevent content below from jumping. If using Lenis, ensure `pin: true` does not conflict with smooth scroll -- test this combination.
- Images: crossfade via opacity. Alternative: clip-path reveal, slide, or morph.

---

## horizontal-scroll

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-scrolltrigger

### Description

Vertical scroll input drives horizontal movement of a content track. The section pins in the viewport while the inner content slides left. Used for portfolios, image galleries, and horizontal timelines.

### HTML Structure

```html
<section class="h-scroll" aria-label="Portfolio gallery">
  <div class="h-scroll__container">
    <div class="h-scroll__track">
      <article class="h-scroll__panel">
        <img src="project-1.webp" alt="Project One">
        <h3>Project One</h3>
      </article>
      <article class="h-scroll__panel">
        <img src="project-2.webp" alt="Project Two">
        <h3>Project Two</h3>
      </article>
      <article class="h-scroll__panel">
        <img src="project-3.webp" alt="Project Three">
        <h3>Project Three</h3>
      </article>
      <article class="h-scroll__panel">
        <img src="project-4.webp" alt="Project Four">
        <h3>Project Four</h3>
      </article>
    </div>
  </div>
</section>
```

### CSS Contract

- Section: height calculated dynamically (see Implementation Notes)
- Container: `overflow: hidden; height: 100vh`
- Track: `display: flex; gap: var(--space-gap); width: max-content; will-change: transform`
- Panel: `width: 80vw` or `width: 40vw` depending on how many should be visible at once

### GSAP ScrollTrigger Configuration

```javascript
const track = document.querySelector('.h-scroll__track');
const panels = gsap.utils.toArray('.h-scroll__panel');
const totalScroll = track.scrollWidth - window.innerWidth;

gsap.to(track, {
  x: -totalScroll,
  ease: 'none',
  scrollTrigger: {
    trigger: '.h-scroll',
    start: 'top top',
    end: () => `+=${totalScroll}`,
    pin: '.h-scroll__container',
    scrub: 1,
    invalidateOnRefresh: true,  // recalculate on resize
  }
});
```

### Animation Choreography

1. User scrolls to the horizontal section
2. Container pins in the viewport
3. Vertical scroll drives the track's `translateX` from 0 to `-(trackWidth - viewportWidth)`
4. Each panel slides through the viewport as the user scrolls
5. When the track has fully scrolled, the pin releases and normal vertical scroll resumes

**Optional enhancements**:
- Panels scale up slightly as they enter the center of the viewport (focal point)
- Parallax within panels: images move at a different rate than text
- Progress indicator: dots or a line showing position within the horizontal section

### Accessibility

- `prefers-reduced-motion: reduce`: Remove pinning and horizontal scroll. Stack panels vertically in a normal flow. The section becomes a standard card grid.
- Scrollable regions need `role="region"` with `aria-label` and `tabindex="0"` for keyboard access.
- All panels must be keyboard-navigable regardless of scroll position.

### Implementation Notes

- Section height = track scroll distance + viewport height: `height: calc(${totalScroll}px + 100vh)`. ScrollTrigger handles this via `end: '+=${totalScroll}'`.
- `invalidateOnRefresh: true` is critical -- without it, resizing the browser breaks the calculation.
- `scrub: 1` provides 1 second of smoothed catch-up. Lower values (0.3-0.5) feel more responsive.
- Mobile: consider replacing with a native horizontal scroll (`overflow-x: auto; scroll-snap-type: x mandatory`) instead of the pinned ScrollTrigger approach. Native horizontal scroll feels better on touch.
- Panel width: `80vw` for one-at-a-time viewing, `40vw` for showing 2+. Add padding/gap between panels.

---

## sticky-stack

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-scrolltrigger | css

### Description

Cards stack on top of each other as the user scrolls. Each card has `position: sticky` with an incrementally larger `top` value. As the user scrolls, new cards pin at the top and previous cards peek out behind them. The visual effect is a deck of cards stacking up.

### HTML Structure

```html
<section class="sticky-stack" aria-label="Features">
  <div class="sticky-stack__container">
    <article class="sticky-stack__card" style="--index: 0">
      <h2>Card One</h2>
      <p>Content for the first card.</p>
    </article>
    <article class="sticky-stack__card" style="--index: 1">
      <h2>Card Two</h2>
      <p>Content for the second card.</p>
    </article>
    <article class="sticky-stack__card" style="--index: 2">
      <h2>Card Three</h2>
      <p>Content for the third card.</p>
    </article>
  </div>
</section>
```

### CSS Contract

```css
.sticky-stack__card {
  position: sticky;
  top: calc(var(--nav-height) + var(--index) * 20px);
  /* Each card sticks 20px lower than the previous, creating the peek effect */
  height: 80vh;
  margin-bottom: 20vh; /* scroll distance between cards */
  border-radius: var(--radius-card);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-lg);
}
```

### GSAP Enhancement (Optional)

Pure CSS `sticky` creates the stacking effect. GSAP adds:
- Scale-down on stacked cards: previous cards shrink slightly (`scale: 0.95`) as new ones cover them
- Opacity reduction on stacked cards: previous cards dim
- Border-radius increase on stacked cards for a "receding" feel

```javascript
const cards = gsap.utils.toArray('.sticky-stack__card');
cards.forEach((card, i) => {
  ScrollTrigger.create({
    trigger: card,
    start: 'top top',
    end: () => `+=${window.innerHeight * 0.8}`,
    onUpdate: (self) => {
      // Scale down as the next card scrolls over
      gsap.set(card, {
        scale: 1 - (self.progress * 0.05),
        opacity: 1 - (self.progress * 0.3),
      });
    }
  });
});
```

### Animation Choreography

1. First card scrolls up and sticks at the top (CSS `position: sticky`)
2. User continues scrolling; second card rises and sticks at `top + 20px`, overlapping first card
3. First card optionally scales down and dims
4. Process repeats for each card
5. When the last card is fully visible, section scrolls away normally

### Accessibility

- `prefers-reduced-motion: reduce`: Cards display in a normal vertical stack (remove `position: sticky`). No scale/opacity effects.
- Cards must be readable in source order. The stacking is visual only.
- Sticky positioning does not affect tab order -- keyboard navigation follows DOM order.

### Implementation Notes

- `position: sticky` works natively with Lenis (Lenis does not break sticky, unlike Locomotive Scroll).
- The `top` offset increment (20px per card) determines how much of each previous card peeks out. Adjust based on card count and desired visual.
- `margin-bottom` on each card provides the scroll distance between cards sticking. Without it, cards stack instantly.
- Card backgrounds must be opaque (not transparent) -- otherwise the stacking effect is invisible since you can see through them.
- Z-index: later cards in DOM order naturally stack above earlier cards. No explicit z-index needed for the basic effect. If using GSAP scale-down, ensure z-index still follows DOM order.

---

## parallax-layers

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-scrolltrigger + lenis

### Description

Multiple visual layers within a section move at different speeds on scroll, creating depth and dimensionality. Unlike the hero parallax variant, this applies to content sections -- decorative shapes, images, and text elements at different scroll speeds.

### HTML Structure

```html
<section class="parallax-section" aria-label="About us">
  <div class="parallax-section__layer" data-speed="0.3" aria-hidden="true">
    <div class="parallax-shape parallax-shape--circle"></div>
    <div class="parallax-shape parallax-shape--blob"></div>
  </div>
  <div class="parallax-section__layer" data-speed="0.6" aria-hidden="true">
    <img src="decorative-element.webp" alt="" class="parallax-img">
  </div>
  <div class="parallax-section__layer" data-speed="1.0">
    <div class="parallax-section__content">
      <h2>Content at normal speed</h2>
      <p>This text scrolls normally. Background elements drift behind it.</p>
    </div>
  </div>
</section>
```

### CSS Contract

- Section: `position: relative; overflow: hidden` (clip parallax elements that extend beyond bounds)
- Layers: `position: absolute; inset: 0` for decorative layers, `position: relative` for content layer
- `will-change: transform` on layers during active scroll only

### GSAP ScrollTrigger Configuration

```javascript
gsap.utils.toArray('[data-speed]').forEach(layer => {
  const speed = parseFloat(layer.dataset.speed);
  const distance = 200 * (1 - speed); // slower layers move more (counter-intuitive but correct for parallax)

  gsap.to(layer, {
    y: -distance,
    ease: 'none',
    scrollTrigger: {
      trigger: layer.closest('section'),
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.5,
    }
  });
});
```

### Animation Choreography

- Background layer (speed 0.3): moves ~140px relative to scroll (appears to lag behind)
- Midground layer (speed 0.6): moves ~80px
- Content layer (speed 1.0): moves with natural scroll (no additional transform)
- The differential creates perceived depth: slow = far away, fast = close

### Accessibility

- `prefers-reduced-motion: reduce`: All layers move at the same speed (no parallax offset). Decorative elements remain visible but static.
- Decorative layers: `aria-hidden="true"`. Content layer is the only accessible content.

### Implementation Notes

- Oversized layers: background and midground elements should be taller than the section (110-120%) to avoid showing gaps during parallax displacement.
- Performance: cap parallax sections to 3-4 per page. Each one creates additional composite layers.
- `scrub: 0.5` for smooth movement. Avoid `scrub: true` (no smoothing) as it can feel jittery with Lenis.
- Combine with scroll-reveal on the content layer for a complete section effect.

---

## zoom-tunnel

**Complexity**: H
**Performance cost**: 3
**Dependencies**: gsap + gsap-scrolltrigger | three.js

### Description

The user scrolls and the viewport zooms into the content -- elements scale up progressively, creating a "flying through a tunnel" or "diving into" effect. Can be achieved with CSS `scale` transforms or Three.js camera dolly.

### HTML Structure

**CSS approach**:
```html
<section class="zoom-tunnel" aria-label="Deep dive">
  <div class="zoom-tunnel__container">
    <div class="zoom-tunnel__frame" data-depth="1">
      <h2>Layer 1: Overview</h2>
    </div>
    <div class="zoom-tunnel__frame" data-depth="2">
      <h2>Layer 2: Details</h2>
    </div>
    <div class="zoom-tunnel__frame" data-depth="3">
      <h2>Layer 3: The core</h2>
    </div>
  </div>
</section>
```

### CSS Contract

- Section: `min-height: 400vh` (long scroll distance for zoom travel)
- Container: `position: sticky; top: 0; height: 100vh; overflow: hidden; perspective: 1000px`
- Frames: `position: absolute; inset: 0; display: grid; place-items: center`

### GSAP ScrollTrigger Configuration

```javascript
const frames = gsap.utils.toArray('.zoom-tunnel__frame');

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.zoom-tunnel',
    start: 'top top',
    end: 'bottom bottom',
    pin: '.zoom-tunnel__container',
    scrub: 1,
  }
});

frames.forEach((frame, i) => {
  const startScale = 0.5;
  const endScale = 3;
  const startOpacity = i === 0 ? 1 : 0;

  tl.fromTo(frame, {
    scale: startScale,
    opacity: startOpacity,
    z: -500 * (i + 1),
  }, {
    scale: endScale,
    opacity: 0,
    z: 500,
    ease: 'none',
  }, i * 0.3);
});
```

### Animation Choreography

1. Section pins
2. First frame is visible at normal scale
3. As user scrolls, first frame scales up and fades out (zooming past it)
4. Second frame appears small, scales up to fill viewport
5. Process repeats for each depth layer
6. Effect: user feels like they are diving deeper into content

### Accessibility

- `prefers-reduced-motion: reduce`: No zoom effect. Frames display vertically as standard sections. Remove pinning and scale transforms.
- Content must be readable at rest -- the zoom effect is a visual enhancement, not a content-gating mechanism.
- Users who cannot scroll (keyboard-only) must still access all frame content via Tab.

### Implementation Notes

- `perspective` on the container is essential for CSS 3D transforms to work.
- For the Three.js approach: camera `position.z` decreases on scroll (dolly forward), content planes are placed at different z-depths. This gives true 3D perspective rather than CSS approximation.
- Limit to 3-5 layers. More creates excessive scroll distance and user fatigue.
- Scale values: start at 0.5 (small, in the distance), end at 3+ (zoomed past, off-screen). The "sweet spot" where content is readable is narrow -- time it so content is at scale 1.0 for at least 30% of its scroll range.

---

## chapter-snap

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-scrolltrigger | css

### Description

Full-viewport "chapters" that snap into place as the user scrolls. Each chapter fills the entire viewport. Scroll snaps to the nearest chapter boundary, creating a slide-deck feel with fluid scroll between chapters.

### HTML Structure

```html
<div class="chapters">
  <section class="chapter" aria-label="Introduction">
    <h2>Chapter One</h2>
    <p>Introduction content.</p>
  </section>
  <section class="chapter" aria-label="The Problem">
    <h2>Chapter Two</h2>
    <p>Problem description.</p>
  </section>
  <section class="chapter" aria-label="The Solution">
    <h2>Chapter Three</h2>
    <p>Solution details.</p>
  </section>
</div>
```

### CSS Contract

**CSS-native approach** (no JS):
```css
.chapters {
  scroll-snap-type: y mandatory;
  overflow-y: auto;
  height: 100vh;
}

.chapter {
  scroll-snap-align: start;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-section);
}
```

**GSAP approach** (for animated transitions between chapters):
```javascript
ScrollTrigger.create({
  snap: {
    snapTo: 1 / (chapterCount - 1),
    duration: { min: 0.3, max: 0.8 },
    ease: 'power2.inOut'
  }
});
```

### Animation Choreography

**Between chapters** (GSAP approach):
- Outgoing chapter content fades out and translates up (duration: 0.3s)
- Incoming chapter content fades in and translates up from bottom (duration: 0.5s, staggered)
- Optional: background color or image crossfades between chapters

**Within chapters**:
- Content entrance uses standard stagger (heading, then body, then media)
- Animations trigger on snap-complete (chapter fully visible)

### Accessibility

- `prefers-reduced-motion: reduce`: Remove snap behavior. Chapters display as normal sections with continuous scroll.
- CSS `scroll-snap-type: y mandatory` can be disorienting for users with vestibular disorders. Use `scroll-snap-type: y proximity` as a gentler alternative.
- Each chapter is a `<section>` with `aria-label` for landmark navigation.

### Implementation Notes

- CSS snap is simpler and works without JavaScript. GSAP snap adds smoother easing and callback hooks.
- `scroll-snap-type: y mandatory` forces snapping. `proximity` only snaps when close to a boundary -- gentler but less precise.
- For Lenis + CSS snap: Lenis respects native scroll snap. No special integration needed.
- Chapter content should fit within the viewport without scrolling. If content overflows, the snap behavior becomes confusing (user cannot scroll within a chapter).
- Progress dots (fixed position on the right edge) help orient the user: which chapter am I on, how many remain.

---

## progress-driven

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css-scroll-timeline | gsap

### Description

An animation tied directly to scroll position -- a progress bar, a fill effect, a rotation, or a path-drawing that moves in proportion to how far the user has scrolled. The simplest scroll-driven pattern and the best candidate for CSS-native implementation.

### HTML Structure

```html
<div class="scroll-progress" aria-hidden="true">
  <div class="scroll-progress__bar"></div>
</div>

<section class="progress-section" aria-label="Our process">
  <div class="progress-section__content">
    <svg class="progress-section__path" viewBox="0 0 100 400">
      <path d="M 50 0 L 50 400" class="progress-section__line" pathLength="1" />
    </svg>
    <!-- Content alongside the path -->
  </div>
</section>
```

### CSS Contract

**Page-level progress bar** (CSS-native):
```css
@keyframes progress-fill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: var(--z-nav);
}

.scroll-progress__bar {
  height: 100%;
  background: var(--color-accent);
  transform-origin: left;
  animation: progress-fill linear both;
  animation-timeline: scroll();
}
```

**SVG path drawing** (CSS-native):
```css
@keyframes draw-path {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}

.progress-section__line {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw-path linear both;
  animation-timeline: view();
  animation-range: entry 0% exit 100%;
}
```

### GSAP Alternative

```javascript
gsap.to('.scroll-progress__bar', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
  }
});
```

### Animation Choreography

- Progress bar: fills from left to right as the page scrolls, proportional to scroll position
- SVG path: draws from start to end as the section scrolls through the viewport
- Other applications: rotation (element rotates 360deg over scroll range), counter (number increments with scroll), fill effect (container fills with color)

### Accessibility

- `prefers-reduced-motion: reduce`: Progress indicators may remain (they are informational, not decorative). Remove scroll-driven rotation or decorative transforms.
- Progress bar: `aria-hidden="true"` (decorative indicator, not a functional progress meter).
- If the progress bar represents actual task progress, use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.

### Implementation Notes

- CSS `animation-timeline: scroll()` runs off the main thread -- inherently performant, no JavaScript needed.
- `scroll()` ties to the nearest scrollable ancestor. `scroll(root)` ties to the document scroll.
- `view()` ties to the element's visibility in the viewport. More useful for per-section effects.
- `animation-range` controls when the animation starts and ends relative to the timeline (e.g., `entry 0% exit 100%`).
- Browser support (2026): Chrome 115+, Edge 115+, Safari 26+. Firefox in progress. Use `@supports (animation-timeline: scroll())` for feature detection.
- Fallback: GSAP ScrollTrigger with `scrub: true` and `ease: 'none'` produces identical behavior with full browser support.

---

## batch-reveal

**Complexity**: L
**Performance cost**: 1
**Dependencies**: gsap + gsap-scrolltrigger | css

### Description

Groups of elements (grid items, list items, cards) animate into view with a staggered sequence when they enter the viewport. Unlike individual ScrollTriggers per element, `ScrollTrigger.batch` efficiently handles many elements with a single observer.

### HTML Structure

```html
<section class="batch-section" aria-label="Our work">
  <div class="batch-section__container">
    <h2>Selected Work</h2>
    <div class="batch-grid">
      <article class="batch-item">...</article>
      <article class="batch-item">...</article>
      <article class="batch-item">...</article>
      <article class="batch-item">...</article>
      <article class="batch-item">...</article>
      <article class="batch-item">...</article>
    </div>
  </div>
</section>
```

### CSS Contract

Items start hidden (before JS):
```css
.batch-item {
  opacity: 0;
  transform: translateY(30px);
}
```

If JS fails (progressive enhancement):
```css
@media (scripting: none) {
  .batch-item {
    opacity: 1;
    transform: none;
  }
}
```

### GSAP ScrollTrigger.batch Configuration

```javascript
gsap.set('.batch-item', { opacity: 0, y: 30 });

ScrollTrigger.batch('.batch-item', {
  onEnter: (batch) => {
    gsap.to(batch, {
      opacity: 1,
      y: 0,
      stagger: 0.08,
      duration: 0.6,
      ease: 'power2.out',
      overwrite: true,
    });
  },
  start: 'top 85%',
  once: true,  // only trigger once per element
});
```

### CSS-Native Alternative

```css
@keyframes batch-in {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.batch-item {
  animation: batch-in 0.6s var(--ease-entrance) both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}
```

Stagger in CSS-native: not directly supported. Use `animation-delay` with `nth-child`:
```css
.batch-item:nth-child(1) { animation-delay: 0ms; }
.batch-item:nth-child(2) { animation-delay: 60ms; }
/* ... */
```

This only works when items enter as a group. For dynamic entry times, GSAP batch is better.

### Animation Choreography

- Items that enter the viewport together animate as a batch with stagger
- Items that are already past the viewport on page load appear immediately (no animation on above-fold content)
- Stagger: 60-100ms between items in the same batch
- Direction: `translateY(30px)` for upward reveal, or `translateX(30px)` / `translateX(-30px)` for horizontal
- Once: each item animates only once. Scrolling back up does not replay the animation.

### Accessibility

- `prefers-reduced-motion: reduce`: All items visible immediately. No stagger, no translate.
- The `@media (scripting: none)` fallback ensures items are visible even if JavaScript fails to load.
- Items in the DOM are always accessible to screen readers regardless of their visual opacity state.

### Implementation Notes

- `ScrollTrigger.batch` is far more efficient than creating individual ScrollTriggers for each item. It uses a single IntersectionObserver under the hood.
- `once: true` prevents re-animation on scroll-up. This is almost always the desired behavior for content reveals.
- `overwrite: true` prevents animation conflicts if items enter the batch while a previous batch is still animating.
- The batch groups items that enter the viewport within a 100ms window (configurable via `interval`). Items entering at different scroll positions get separate batches automatically.
- For grids: items stagger left-to-right, top-to-bottom (following reading order). GSAP handles this automatically based on DOM order.

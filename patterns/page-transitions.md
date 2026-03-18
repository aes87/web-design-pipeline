# Page Transitions

Page transitions animate the change between pages (or between major states on a single page). They provide continuity, reduce perceived load time, and create a polished, app-like feel. In 2026, the View Transitions API is the primary tool -- it is native, CSS-controlled, and works for both SPAs and MPAs. Barba.js remains the fallback for complex, JavaScript-orchestrated transitions.

### Shared CSS Contract

```
--transition-duration     Base transition duration (300-500ms)
--transition-ease         Transition easing (ease-out or power2.out equivalent)
--color-transition-cover  Color for curtain/wipe overlays
--z-transition            z-index for transition overlay (above everything: 10000)
```

### View Transitions API Overview

The browser captures "before" and "after" snapshots of the page, then animates between them. Elements with matching `view-transition-name` values morph smoothly between states.

**SPA (same-document)**:
```javascript
document.startViewTransition(() => {
  // Update the DOM (swap content, change route)
  updateContent();
});
```

**MPA (cross-document)**:
```css
@view-transition {
  navigation: auto;
}
```
**Same-document (SPA)**: Baseline Newly Available — Chrome 111+, Edge 111+, Safari 18+, Firefox 144+. ~90% global support.
**Cross-document (MPA)**: Chrome 126+, Edge 126+, Safari 18.2+. Firefox not yet supported.

**Auto-naming (Chrome 137+)**:
```css
/* No need to manually assign view-transition-name to every element */
.card { view-transition-name: match-element; }
/* Browser auto-generates unique names based on element identity */
```

**Nested groups (Chrome 140+)**:
Restores visual hierarchy for clipping and 3D transforms during transitions.

**Scoped transitions (Chrome 140+)**:
```javascript
// Element-level transitions — multiple simultaneous transitions
element.startViewTransition(() => {
  updateSection();
});
```

### Barba.js Fallback Pattern (Firefox MPA only)

> **Note (2026)**: Barba.js is now only needed as a fallback for cross-document (MPA) transitions in Firefox. For same-document (SPA) transitions, the native View Transitions API has ~90% global support and should be the default choice. For MPA transitions, Chrome/Edge/Safari support native cross-document transitions via `@view-transition { navigation: auto; }`.

For browsers without View Transitions or for complex choreographed transitions:

```javascript
barba.init({
  preventRunning: true,
  transitions: [{
    name: 'default',
    leave: ({ current }) => {
      return gsap.to(current.container, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      });
    },
    enter: ({ next }) => {
      return gsap.from(next.container, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out'
      });
    },
    afterEnter: () => {
      window.scrollTo(0, 0);
      // Re-initialize page-specific scripts
      initAnimations();
    }
  }],
  views: [{
    namespace: 'home',
    afterEnter: () => initHomeAnimations(),
  }]
});
```

### Shared Accessibility Rules

- `prefers-reduced-motion: reduce`: All transitions are instant (crossfade at 0ms or no animation). Content swaps immediately.
- After transition completes, focus must be managed: move focus to the `<main>` element or `<h1>` of the new page.
- Screen readers: announce the new page via `aria-live="polite"` on a status element, or rely on the browser's native page-change announcement.
- Transition overlays must not trap focus or block interaction for more than 1 second.

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0ms;
  }
}
```

---

## crossfade

**Complexity**: L
**Performance cost**: 1
**Dependencies**: view-transitions-api | barba.js

### Description

The simplest transition: the old page fades out and the new page fades in. Can be a true crossfade (both visible simultaneously with overlapping opacity) or a sequential fade (old out, then new in). This is the default View Transitions API behavior.

### CSS for View Transitions API

```css
/* Default crossfade (built-in behavior, no custom CSS needed) */

/* Custom timing override */
::view-transition-old(root) {
  animation: fade-out 300ms ease-out both;
}

::view-transition-new(root) {
  animation: fade-in 300ms ease-in both;
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Barba.js Fallback

```javascript
barba.init({
  transitions: [{
    leave: ({ current }) => gsap.to(current.container, { opacity: 0, duration: 0.3 }),
    enter: ({ next }) => gsap.from(next.container, { opacity: 0, duration: 0.4 }),
  }]
});
```

### Animation Choreography

1. User clicks a link
2. Old page fades out (opacity 1 -> 0, 300ms)
3. New page fades in (opacity 0 -> 1, 300ms)
4. With View Transitions, both snapshots exist simultaneously -- the browser handles the compositing
5. Total transition time: 300-500ms

### Element Matching

For enhanced crossfade, name specific elements to morph between pages:
```css
/* On the listing page */
.project-card:nth-child(1) img {
  view-transition-name: project-hero;
}

/* On the detail page */
.project-hero-image {
  view-transition-name: project-hero;
}
```

The image smoothly morphs position and size between the card thumbnail and the full hero image.

### Accessibility

- `prefers-reduced-motion: reduce`: Instant page swap, no opacity animation.
- This is the safest transition for accessibility -- no spatial movement, no overlay, just opacity.

### Implementation Notes

- View Transitions API crossfade is the built-in default. You get it for free by wrapping DOM updates in `startViewTransition()` (SPA) or adding `@view-transition { navigation: auto; }` (MPA).
- For MPA, ensure both pages have matching `view-transition-name` values on elements that should morph.
- The browser captures the old page as a bitmap screenshot. No old-page JavaScript runs during the transition.

---

## slide-directional

**Complexity**: L
**Performance cost**: 1
**Dependencies**: view-transitions-api | barba.js + gsap

### Description

Pages slide in from the direction of navigation. Clicking a "next" link slides the new page in from the right. Clicking "back" slides from the left. Creates spatial orientation that maps to the site's information architecture.

### CSS for View Transitions API

```css
/* Forward navigation: old slides left, new slides in from right */
::view-transition-old(root) {
  animation: slide-out-left 400ms ease-in-out both;
}
::view-transition-new(root) {
  animation: slide-in-right 400ms ease-in-out both;
}

@keyframes slide-out-left {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-30%); opacity: 0; }
}

@keyframes slide-in-right {
  from { transform: translateX(30%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Backward navigation (apply via JS class on documentElement) */
.back-nav::view-transition-old(root) {
  animation: slide-out-right 400ms ease-in-out both;
}
.back-nav::view-transition-new(root) {
  animation: slide-in-left 400ms ease-in-out both;
}
```

### Barba.js Fallback

```javascript
barba.init({
  transitions: [{
    leave: ({ current, trigger }) => {
      const direction = trigger.dataset.direction === 'back' ? 1 : -1;
      return gsap.to(current.container, {
        x: direction * window.innerWidth * 0.3,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      });
    },
    enter: ({ next, trigger }) => {
      const direction = trigger.dataset.direction === 'back' ? -1 : 1;
      return gsap.fromTo(next.container,
        { x: direction * window.innerWidth * 0.3, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }]
});
```

### Animation Choreography

**Forward navigation** (going deeper into content):
1. Old page slides left + fades out (400ms)
2. New page slides in from right + fades in (400ms)

**Backward navigation** (returning to overview):
1. Old page slides right + fades out (400ms)
2. New page slides in from left + fades in (400ms)

Direction is determined by the clicked link's position in the nav hierarchy or an explicit `data-direction` attribute.

### Accessibility

- `prefers-reduced-motion: reduce`: Instant page swap. No sliding.
- Slide distance should be moderate (20-30% of viewport, not 100%). Full-viewport slides can be disorienting.
- Direction should be consistent and meaningful -- it should map to the user's mental model of the site structure.

### Implementation Notes

- For View Transitions, set a CSS class on `document.documentElement` before starting the transition to control direction:
  ```javascript
  document.documentElement.classList.add('back-nav');
  document.startViewTransition(() => updateContent());
  // Remove class after transition
  ```
- Slide + opacity together (not just slide alone) prevents the awkward moment when both pages are fully visible side-by-side.
- Keep the slide distance small (30% max). Large slides make the transition feel slow and spatial movement triggers motion sensitivity more than opacity alone.

---

## curtain-wipe

**Complexity**: M
**Performance cost**: 1
**Dependencies**: barba.js + gsap | view-transitions-api

### Description

A solid-color overlay sweeps across the screen (like a curtain closing), covers the old page completely, then sweeps off in the same or opposite direction to reveal the new page. A two-phase transition with a brief moment of full coverage. The cover color often matches the brand's accent color.

### HTML Structure (Barba.js approach)

```html
<div class="transition-curtain" aria-hidden="true">
  <div class="transition-curtain__panel transition-curtain__panel--1"></div>
  <div class="transition-curtain__panel transition-curtain__panel--2"></div>
</div>
```

### CSS Contract

```css
.transition-curtain {
  position: fixed;
  inset: 0;
  z-index: var(--z-transition);
  pointer-events: none;
}

.transition-curtain__panel {
  position: absolute;
  inset: 0;
  background: var(--color-transition-cover);
  transform: translateX(-100%);
}
```

### CSS for View Transitions API

```css
::view-transition-old(root) {
  animation: none;
  mix-blend-mode: normal;
  z-index: 1;
}

::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
  z-index: 2;
}

/* Curtain overlay via ::view-transition-group pseudo */
::view-transition-group(root) {
  animation: curtain-in 0.4s ease-in-out, curtain-out 0.4s ease-in-out 0.4s;
}

@keyframes curtain-in {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}

@keyframes curtain-out {
  from { clip-path: inset(0 0 0 0); }
  to { clip-path: inset(0 0 0 100%); }
}
```

### Barba.js + GSAP Implementation

```javascript
barba.init({
  transitions: [{
    leave: ({ current }) => {
      const tl = gsap.timeline();
      // Curtain sweeps in from left
      tl.to('.transition-curtain__panel--1', {
        x: 0, duration: 0.5, ease: 'power3.inOut'
      });
      // Old page is now covered
      tl.set(current.container, { opacity: 0 });
      return tl;
    },
    enter: ({ next }) => {
      const tl = gsap.timeline();
      // Curtain sweeps out to the right
      tl.to('.transition-curtain__panel--1', {
        x: '100%', duration: 0.5, ease: 'power3.inOut'
      });
      // Reset curtain position
      tl.set('.transition-curtain__panel--1', { x: '-100%' });
      return tl;
    }
  }]
});
```

### Animation Choreography

1. User clicks a link
2. **Phase 1 -- Cover** (0-500ms): Curtain panel slides from left to right, covering the old page
3. Old page content swaps (invisible, behind the curtain)
4. **Phase 2 -- Reveal** (500-1000ms): Curtain continues to the right and exits, revealing the new page
5. New page content entrance animations begin

**Variations**:
- **Multi-panel curtain**: 2-3 panels stagger with slight delays (50-100ms between panels) for a richer wipe
- **Vertical wipe**: Curtain slides top-to-bottom or bottom-to-top
- **Diagonal wipe**: Curtain uses `clip-path: polygon(...)` for an angled edge
- **Color flash**: Curtain holds for 100-200ms at full coverage (brand moment)

### Accessibility

- `prefers-reduced-motion: reduce`: Instant page swap. No curtain animation.
- Curtain is `aria-hidden="true"` -- it is a decorative transition element.
- The curtain must not block interaction for more than 1 second total.
- Focus management: after the curtain reveals the new page, focus moves to `<main>` or `<h1>`.

### Implementation Notes

- The curtain panel must be in the DOM at page load, positioned off-screen. Do not create/destroy it dynamically.
- `pointer-events: none` on the curtain container ensures the page remains clickable during idle state. Toggle to `pointer-events: auto` during transition to prevent double-clicks.
- The "hold" moment (curtain fully covering the page) is when the DOM swap happens. Ensure the new content is fully loaded before the reveal phase begins.
- Barba.js's `prefetch` option loads the next page on link hover, reducing the time the curtain needs to hold.
- Brand color curtain: use `--color-transition-cover` set to the brand's primary or accent color. This creates a "branded moment" during navigation.

---

## zoom-morph

**Complexity**: M
**Performance cost**: 2
**Dependencies**: view-transitions-api

### Description

A clicked element (card, thumbnail, button) zooms up to fill the viewport, and the new page appears as if expanding from that element. Creates a strong spatial connection between the trigger and the destination. The reverse (going back) shrinks the page back into the originating element.

### CSS for View Transitions API

```css
/* Name the clickable element on the source page */
.project-card {
  view-transition-name: project-zoom;
  contain: paint; /* required for view-transition-name */
}

/* Name the hero on the destination page */
.project-hero {
  view-transition-name: project-zoom;
  contain: paint;
}

/* Customize the morph animation */
::view-transition-group(project-zoom) {
  animation-duration: 500ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Background crossfade */
::view-transition-old(root) {
  animation: fade-out 300ms ease-out both;
}
::view-transition-new(root) {
  animation: fade-in 500ms ease-in both;
  animation-delay: 100ms;
}
```

### Animation Choreography

1. User clicks a project card
2. View Transitions API captures the card's position and size
3. The card element morphs: position, size, and border-radius animate from card to hero
4. Background crossfades from the listing page to the detail page
5. New page content fades in around the expanded hero element

**Reverse** (back navigation):
1. Hero element shrinks and repositions back to where the card was
2. Listing page fades back in
3. The card is in its original position

### Accessibility

- `prefers-reduced-motion: reduce`: Instant page swap. No zoom or morph animation.
- The zoom effect uses browser-native compositing (no layout changes during transition) so it is inherently performant.
- The spatial connection (card -> hero) is meaningful, not decorative. Consider keeping a very fast version (100ms) even for reduced motion users.

### Implementation Notes

- `view-transition-name` must be unique per page snapshot. Two elements with the same name on one page causes an error.
- `contain: paint` (or `contain: layout paint`) is required on elements with `view-transition-name` in some browsers.
- Dynamic naming: for card grids, assign `view-transition-name` dynamically based on which card was clicked:
  ```javascript
  card.style.viewTransitionName = 'project-zoom';
  document.startViewTransition(() => navigate(card.href));
  ```
  Clear the name after transition to avoid conflicts when navigating between detail pages.
- For MPA, both pages must have matching `view-transition-name` values. The browser matches them automatically.
- The morph animates: position (`top`, `left`), dimensions (`width`, `height`), and `border-radius`. Ensure the destination element's styling is different enough to create a visible morph (e.g., card at 300x200 with border-radius: 12px -> hero at 1280x600 with border-radius: 0).

---

## shared-element

**Complexity**: H
**Performance cost**: 2
**Dependencies**: view-transitions-api

### Description

Multiple elements morph between pages simultaneously. Unlike zoom-morph (which focuses on one element), shared-element transitions morph several elements at once: a thumbnail becomes a hero image, a card title becomes a page heading, a color swatch becomes a background, and nav elements stay in place. This is the most sophisticated View Transitions pattern.

### CSS for View Transitions API

```css
/* Source page (listing) */
.card__image { view-transition-name: hero-image; }
.card__title { view-transition-name: hero-title; }
.card__tag   { view-transition-name: hero-tag; }
.nav         { view-transition-name: main-nav; }

/* Destination page (detail) */
.detail__hero-image { view-transition-name: hero-image; }
.detail__title      { view-transition-name: hero-title; }
.detail__tag        { view-transition-name: hero-tag; }
.nav                { view-transition-name: main-nav; }

/* Custom easing per element */
::view-transition-group(hero-image) {
  animation-duration: 500ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

::view-transition-group(hero-title) {
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: 50ms;
}

::view-transition-group(hero-tag) {
  animation-duration: 350ms;
  animation-delay: 80ms;
}

/* Nav stays in place (minimal animation) */
::view-transition-group(main-nav) {
  animation-duration: 200ms;
}

/* Non-shared content crossfades */
::view-transition-old(root) {
  animation: fade-out 250ms ease-out both;
}
::view-transition-new(root) {
  animation: fade-in 400ms ease-in both;
  animation-delay: 150ms;
}
```

### Animation Choreography

1. User clicks a card on the listing page
2. View Transitions captures all named elements' positions/sizes
3. Elements morph simultaneously with staggered timing:
   - Image: card thumbnail -> full hero (500ms, starts immediately)
   - Title: card title -> page heading (400ms, 50ms delay)
   - Tag: card tag -> page tag (350ms, 80ms delay)
   - Nav: stays in place with minimal morph (200ms)
4. Non-shared content crossfades in the background
5. New page content (body text, etc.) fades in after shared elements settle (200ms delay)

### Element Matching Strategies

**Static naming** (small, predictable set of pages):
```css
.card:nth-child(1) .card__image { view-transition-name: project-1-image; }
.card:nth-child(2) .card__image { view-transition-name: project-2-image; }
```

**Dynamic naming** (large or dynamic content):
```javascript
// Before starting transition, name only the clicked card's elements
card.querySelector('.card__image').style.viewTransitionName = 'hero-image';
card.querySelector('.card__title').style.viewTransitionName = 'hero-title';

document.startViewTransition(() => {
  navigateToDetail(card.dataset.id);
});
```

**`view-transition-class`** (batch styling without unique names):
```css
.card__image { view-transition-class: morph-image; }

::view-transition-group(*.morph-image) {
  animation-duration: 500ms;
}
```

### Accessibility

- `prefers-reduced-motion: reduce`: Instant swap. All elements jump to their destination positions without animation.
- Shared element transitions are the most disorienting transition type for users with vestibular disorders. Always respect the media query.
- Focus management: after transition, focus should land on the new page's primary heading or the shared title element.

### Implementation Notes

- Each `view-transition-name` must be unique within a page snapshot. If multiple cards are visible, only name the elements of the clicked card.
- `contain: paint` may be required on named elements. Without it, some browsers fail to isolate the element for capture.
- Performance: the browser composites shared elements on the GPU. Even complex multi-element transitions are smooth because no layout or paint occurs during the animation.
- For back navigation, the browser automatically reverses the morph (destination -> source). No additional code needed.
- Staggering shared elements (via `animation-delay`) is critical. Everything morphing simultaneously looks chaotic. Lead with the largest element (image), follow with text.
- Clear dynamic `view-transition-name` values after the transition to prevent conflicts on subsequent navigations.

---

## webgl-dissolve

**Complexity**: H
**Performance cost**: 4
**Dependencies**: barba.js + three.js + gsap

### Description

A shader-based transition where the old page dissolves into the new page using a WebGL effect -- noise dissolve, pixel displacement, liquid distortion, or mosaic fragmentation. The most visually impressive transition type, reserved for portfolio and creative agency sites.

### HTML Structure

```html
<canvas class="transition-canvas" aria-hidden="true"></canvas>
<!-- Barba.js containers -->
<div data-barba="wrapper">
  <div data-barba="container">
    <!-- Page content -->
  </div>
</div>
```

### GLSL Fragment Shader (Noise Dissolve)

```glsl
uniform sampler2D u_texOld;      // screenshot of old page
uniform sampler2D u_texNew;      // screenshot of new page
uniform sampler2D u_texNoise;    // noise texture for dissolve pattern
uniform float u_progress;         // 0.0 -> 1.0 transition progress
uniform vec2 u_resolution;

varying vec2 vUv;

void main() {
  vec4 oldColor = texture2D(u_texOld, vUv);
  vec4 newColor = texture2D(u_texNew, vUv);

  float noise = texture2D(u_texNoise, vUv).r;
  float threshold = u_progress;
  float edge = 0.1; // softness of dissolve edge

  float mixFactor = smoothstep(threshold - edge, threshold + edge, noise);

  gl_FragColor = mix(oldColor, newColor, mixFactor);
}
```

### Implementation Pattern

```javascript
import * as THREE from 'three';

class TransitionEffect {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('.transition-canvas'),
      alpha: true,
    });

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        u_texOld: { value: null },
        u_texNew: { value: null },
        u_texNoise: { value: new THREE.TextureLoader().load('noise.png') },
        u_progress: { value: 0 },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: noiseDissolveShader,
    });

    const quad = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(quad, this.material);
    this.scene.add(this.mesh);
  }

  async transition(oldScreenshot, newScreenshot) {
    this.material.uniforms.u_texOld.value = oldScreenshot;
    this.material.uniforms.u_texNew.value = newScreenshot;
    this.material.uniforms.u_progress.value = 0;

    // Show canvas
    this.renderer.domElement.style.opacity = 1;

    // Animate progress
    await gsap.to(this.material.uniforms.u_progress, {
      value: 1,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.renderer.render(this.scene, this.camera);
      }
    });

    // Hide canvas
    this.renderer.domElement.style.opacity = 0;
  }
}
```

### Animation Choreography

1. User clicks a link
2. Old page is captured as a WebGL texture (via `html2canvas` or `OffscreenCanvas`)
3. Barba.js fetches the new page content
4. New page is rendered off-screen and captured as a texture
5. WebGL canvas displays the old page texture, then animates `u_progress` from 0 to 1
6. Shader interpolates between old and new textures using the noise dissolve pattern
7. When complete, canvas hides and the real new page DOM is visible

**Shader Variations**:
- **Noise dissolve**: pixels dissolve based on a noise texture pattern
- **Pixelation**: resolution drops (mosaic), then increases to reveal new page
- **Displacement**: noise texture offsets UV coordinates, creating a liquid distortion
- **Directional wipe with distortion**: wipe boundary has a wobble/displacement effect

### Accessibility

- `prefers-reduced-motion: reduce`: Instant page swap. No WebGL transition. Canvas stays hidden.
- The transition canvas is `aria-hidden="true"` at all times.
- This is the heaviest transition. Only use on sites where the creative expression justifies the cost.

### Implementation Notes

- **Page capture**: Capturing a live DOM as a WebGL texture is the hardest part. Approaches:
  1. `html2canvas` (JS library, renders DOM to canvas) -- most reliable but slow (~200ms)
  2. `OffscreenCanvas` with `drawImage` -- faster but limited by CORS and complexity
  3. Pre-rendered screenshots (fastest, but requires server-side rendering or build-time capture)
- **Noise texture**: a 512x512 grayscale noise image (simplex, perlin, or worley noise). Pre-generate and ship as an asset. Different noise textures create different dissolve patterns.
- **Performance**: the shader runs for ~1 second during transition. GPU load is moderate (one fullscreen quad with two texture lookups per fragment). Not a concern on modern hardware.
- **Fallback**: if WebGL is not available, fall back to a crossfade transition.
- **Dynamic import**: load Three.js only when a navigation event occurs. Do not include it in the initial bundle.
- This is the most complex transition pattern. Reserve it for portfolio and creative agency sites where the transition is part of the brand experience.

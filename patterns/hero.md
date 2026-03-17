# Hero Sections

The hero is the first thing a visitor sees. It sets the emotional tone, establishes the design language, and determines whether someone scrolls further. In award-winning sites, the hero is never an afterthought -- it is the single most choreographed section on the page.

Every hero variant occupies the full viewport (`100svh`). The hero's job is to deliver a clear message, create visual impact, and invite the scroll. Content that depends on the hero (navigation overlay, scroll indicator) must coordinate z-index and animation timing with it.

All hero variants share a base CSS contract (see CSS Contract below), then extend it with variant-specific properties.

### Shared CSS Contract

Every hero expects these design tokens on `:root`:

```
--color-bg-hero          Background color or base for gradient
--color-fg-hero          Primary text color in hero
--color-accent           Accent color for CTAs, highlights
--font-display           Display/headline typeface
--font-body              Body/subhead typeface
--font-size-hero         Headline size (clamp responsive)
--font-weight-hero       Headline weight
--line-height-hero       Headline line-height
--letter-spacing-hero    Headline tracking
--space-section          Vertical padding for sections
--ease-dramatic          Slow, expressive easing (power3.out / cubic-bezier(0.16, 1, 0.3, 1))
--ease-entrance          Standard entrance easing (power2.out)
--duration-hero          Hero animation total duration
--duration-stagger       Stagger between animated elements
--z-hero                 z-index for hero layer (typically 1)
--z-nav                  z-index for navigation overlay (typically 100)
```

### Shared HTML Skeleton

```html
<section class="hero hero--{variant}" aria-label="Hero">
  <div class="hero__content">
    <h1 class="hero__headline">...</h1>
    <p class="hero__subhead">...</p>
    <div class="hero__cta">
      <a href="#" class="btn btn--primary">...</a>
    </div>
  </div>
  <!-- variant-specific elements go here -->
</section>
```

### Shared Accessibility Rules

- Hero must have `aria-label` or contain a visible `<h1>`
- Background media (video, canvas, shader) gets `aria-hidden="true"`
- CTA buttons must have sufficient contrast against any background variant
- Decorative animated elements use `aria-hidden="true"`
- All animations respect `prefers-reduced-motion: reduce`

---

## static-centered

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

The simplest hero: centered headline, subhead, and CTA over a solid or gradient background. No JavaScript required. The text may use CSS transitions on load via `@starting-style`, but there is no scroll-driven or timeline-based animation. This is the baseline -- every other variant builds from it.

Use when: the content speaks for itself, the brief calls for `minimalist` or `japanese-minimalism` aesthetics, or performance budget is extremely tight.

### HTML Structure

```html
<section class="hero hero--static-centered" aria-label="Hero">
  <div class="hero__content">
    <p class="hero__overline">Overline text</p>
    <h1 class="hero__headline">Headline</h1>
    <p class="hero__subhead">Supporting copy that adds context.</p>
    <div class="hero__cta">
      <a href="#next" class="btn btn--primary">Primary CTA</a>
      <a href="#about" class="btn btn--ghost">Secondary CTA</a>
    </div>
  </div>
</section>
```

### CSS Contract

Base shared tokens plus:
- `--color-bg-hero`: solid color or gradient
- `--hero-text-align`: `center`
- `--hero-max-width`: max-width for content container (e.g., `48rem`)

Layout: Flexbox or Grid centering. Content container has `max-width` and horizontal auto margins. Vertical centering via `display: grid; place-items: center; min-height: 100svh`.

### Animation Choreography

1. **On page load** (CSS only, no JS):
   - Overline fades in and translates up 20px (delay: 0ms, duration: 600ms, ease: `var(--ease-entrance)`)
   - Headline fades in and translates up 30px (delay: 100ms, duration: 800ms)
   - Subhead fades in and translates up 20px (delay: 200ms, duration: 600ms)
   - CTA buttons fade in and translate up 20px (delay: 300ms, duration: 600ms)
2. Use `@starting-style` for entry animation on supporting browsers, with `opacity`/`transform` transition fallback.

### Accessibility

- `prefers-reduced-motion: reduce`: Remove all translate animations. Elements appear immediately at full opacity. Keep the stagger timing at 0.
- Screen reader: Standard heading hierarchy. No special ARIA needed beyond the section label.
- Focus: First CTA button should be reachable via Tab without scrolling.

### Implementation Notes

- Use `clamp()` for `--font-size-hero`: e.g., `clamp(2.5rem, 5vw + 1rem, 6rem)`.
- Background gradient via `background: linear-gradient(...)` or `radial-gradient(...)` on the section.
- The overline is optional -- omit if the brief doesn't call for it.
- This variant has zero JS. It is the only hero that scores a perfect performance cost of 1.

---

## animated-text-reveal

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-splittext

### Description

The headline is the hero. Text animates in with GSAP SplitText -- characters, words, or lines reveal with staggered timing, clip-path masks, or translate-from-below effects. The subhead and CTA follow in sequence. This is the most common hero on Awwwards-winning sites.

Use when: the headline is strong enough to carry the section, the brief calls for `editorial`, `dark-luxury`, or `immersive` aesthetics, or typography is specified as the primary visual element.

### HTML Structure

```html
<section class="hero hero--text-reveal" aria-label="Hero">
  <div class="hero__content">
    <h1 class="hero__headline" data-split="words">Design is how it works.</h1>
    <p class="hero__subhead">Supporting line that fades in after the headline.</p>
    <div class="hero__cta">
      <a href="#" class="btn btn--primary">Explore</a>
    </div>
  </div>
  <div class="hero__scroll-indicator" aria-hidden="true">
    <span>Scroll</span>
    <div class="hero__scroll-line"></div>
  </div>
</section>
```

### CSS Contract

Base shared tokens plus:
- `--split-type`: `words` | `chars` | `lines` (data attribute on headline)
- `--reveal-direction`: `bottom` | `top` | `left` | `right` | `fade`
- `--reveal-distance`: translateY/X distance (default: `100%` for masked, `40px` for fade)
- `--stagger-text`: per-unit stagger (default: `0.08s` for words, `0.03s` for chars)
- `--duration-reveal`: per-unit duration (default: `0.8s`)
- `--ease-dramatic`: `power3.out` or `cubic-bezier(0.16, 1, 0.3, 1)`

Text container needs `overflow: hidden` on line wrappers when using translateY reveals (SplitText handles this with its built-in mask feature).

### Animation Choreography

1. **Page load + 200ms delay** (wait for fonts to load):
   - SplitText splits `h1` into units (words by default)
   - Each unit starts at `y: "100%"` (below mask) or `opacity: 0; filter: blur(10px)` depending on reveal style
   - Units animate to `y: 0` / `opacity: 1; filter: blur(0)` with stagger
   - Total headline duration: `stagger * unitCount + duration` (typically 1-2s)
2. **After headline completes** (+100ms):
   - Subhead fades in: `opacity: 0 -> 1`, `y: 20px -> 0` (duration: 0.6s)
3. **After subhead** (+100ms):
   - CTA fades in: same pattern as subhead
4. **Scroll indicator** (after all content, +200ms):
   - Line draws down with `scaleY: 0 -> 1` (duration: 0.8s)
   - Loops: line translates down and resets (infinite, 2s period)

SplitText revert on cleanup: call `split.revert()` when navigating away or on resize to restore original DOM.

### Accessibility

- `prefers-reduced-motion: reduce`: Skip SplitText entirely. Show all text at full opacity immediately. The scroll indicator line appears without animation.
- SplitText preserves semantic text in the DOM -- screen readers see the original text, not individual span wrappers.
- Do not use `aria-live` on the headline -- it is static content that happens to animate visually.

### Implementation Notes

- Always wait for fonts before splitting text (`document.fonts.ready.then(...)`). SplitText calculates line breaks based on rendered dimensions -- splitting before fonts load produces wrong line breaks.
- SplitText's built-in mask feature (available since the GSAP free release) handles `overflow: hidden` wrappers automatically. No need for manual wrapper divs.
- Re-split on `window.resize` (debounced) to handle responsive line-break changes. Use `split.revert()` then re-create.
- For `chars` split with many characters (20+), increase stagger to avoid excessive total duration. Formula: `stagger = min(0.04, 1.5 / charCount)`.
- The scroll indicator is optional but strongly recommended for full-viewport heroes -- it signals that content exists below.

---

## video-background

**Complexity**: M
**Performance cost**: 3
**Dependencies**: css | gsap (optional)

### Description

Full-viewport background video with overlay text. The video is ambient -- muted, looping, visually supports the message without demanding attention. A semi-transparent overlay ensures text readability. This hero trades performance for atmosphere.

Use when: the client has strong brand video assets, the brief calls for `immersive` or `cinematic` aesthetics, and the performance budget allows for it.

### HTML Structure

```html
<section class="hero hero--video-bg" aria-label="Hero">
  <div class="hero__media" aria-hidden="true">
    <video
      class="hero__video"
      autoplay
      muted
      loop
      playsinline
      poster="assets/hero-poster.webp"
      preload="metadata"
    >
      <source src="assets/hero.mp4" type="video/mp4">
    </video>
    <div class="hero__overlay"></div>
  </div>
  <div class="hero__content">
    <h1 class="hero__headline">Headline over video</h1>
    <p class="hero__subhead">Supporting text with guaranteed contrast.</p>
    <div class="hero__cta">
      <a href="#" class="btn btn--primary">Watch</a>
    </div>
  </div>
</section>
```

### CSS Contract

Base shared tokens plus:
- `--overlay-color`: semi-transparent overlay (e.g., `oklch(0.1 0 0 / 0.6)`)
- `--overlay-gradient`: optional gradient overlay for bottom-heavy text (e.g., `linear-gradient(to top, oklch(0.05 0 0 / 0.8) 0%, transparent 60%)`)

Video: `position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%`.
Overlay: same positioning, `background: var(--overlay-color)` or `var(--overlay-gradient)`.
Content: `position: relative; z-index: 2`.

### Animation Choreography

1. **Page load**:
   - Video starts playing immediately (autoplay muted). Poster image shows until first frame decodes.
   - Overlay fades from `opacity: 0.8` to final value (0.5-0.7) over 1.5s -- creates a "lights dimming" entrance.
   - Content fades in with standard entrance stagger (same as static-centered, delay 500ms to let video establish).
2. **On scroll** (optional, GSAP ScrollTrigger):
   - Video opacity reduces as user scrolls past (parallax fade-out).
   - Content translates up slightly faster than scroll (subtle parallax separation).

### Accessibility

- `prefers-reduced-motion: reduce`: Pause the video on load. Show the poster image as a static background instead. Add a visible play/pause button.
- The video element is wrapped in `aria-hidden="true"` -- it is decorative.
- Overlay must ensure WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) between text and the darkest frame of the video. Test with the poster image as baseline.
- Provide a visible pause/play control even for non-reduced-motion users -- autoplay video that cannot be paused fails WCAG 2.2.2.

### Implementation Notes

- Video file should be under 2MB. Compress aggressively: 720p max resolution, 24fps, CRF 28-32 for H.264. Use WebM/AV1 as primary with MP4 fallback.
- Set `poster` to a high-quality WebP screenshot from the video. This is the LCP element -- optimize it.
- `preload="metadata"` not `"auto"` to avoid downloading the full video before it is needed (though `autoplay` will trigger download anyway).
- On mobile, some browsers throttle autoplay video. Always have the poster as a graceful fallback.
- The overlay approach (solid color or gradient) is more reliable than `text-shadow` for ensuring contrast across all video frames.

---

## parallax-layers

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-scrolltrigger + lenis

### Description

Multiple visual layers (background image/gradient, midground decorative elements, foreground text) move at different speeds as the user scrolls, creating a sense of depth. Lenis provides smooth scroll input; ScrollTrigger drives the layer offsets.

Use when: the brief calls for depth and atmosphere, the aesthetic is `dark-luxury`, `immersive`, `glassmorphism`, or `organic`, and there are visual elements to distribute across layers.

### HTML Structure

```html
<section class="hero hero--parallax" aria-label="Hero">
  <div class="hero__layer hero__layer--bg" data-speed="0.3" aria-hidden="true">
    <!-- Background: large image, gradient, or pattern -->
    <img src="assets/hero-bg.webp" alt="" loading="eager">
  </div>
  <div class="hero__layer hero__layer--mid" data-speed="0.6" aria-hidden="true">
    <!-- Midground: decorative shapes, secondary images -->
    <div class="hero__shape hero__shape--circle"></div>
    <div class="hero__shape hero__shape--blur"></div>
  </div>
  <div class="hero__layer hero__layer--fg" data-speed="1.0">
    <div class="hero__content">
      <h1 class="hero__headline">Layered depth</h1>
      <p class="hero__subhead">Elements move at different speeds.</p>
    </div>
  </div>
</section>
```

### CSS Contract

Base shared tokens plus:
- `--parallax-range`: total scroll distance for parallax effect (e.g., `200px`)
- `--speed-bg`: background layer speed multiplier (0.2-0.4)
- `--speed-mid`: midground speed multiplier (0.5-0.7)
- `--speed-fg`: foreground speed multiplier (0.9-1.0)

Section: `position: relative; overflow: hidden; min-height: 100svh`.
Layers: `position: absolute; inset: 0; will-change: transform`.
Background layer images should be oversized (110-120% height) to avoid revealing edges during parallax movement.

### Animation Choreography

1. **Lenis initialization** (page load):
   - `new Lenis({ lerp: 0.1, smoothWheel: true })`
   - Integrate with GSAP ticker: `lenis.on('scroll', ScrollTrigger.update)`
2. **ScrollTrigger per layer** (on load):
   - Each `[data-speed]` element gets a ScrollTrigger:
     ```
     trigger: ".hero--parallax"
     start: "top top"
     end: "bottom top"
     scrub: 0.5
     ```
   - Animation: `y: -(parallaxRange * (1 - speed))` -- slower layers move less
   - Background (speed 0.3): moves ~140px over the scroll range
   - Midground (speed 0.6): moves ~80px
   - Foreground (speed 1.0): moves with scroll (no offset)
3. **Content entrance** (page load, independent of scroll):
   - Headline and subhead fade + translate in with standard entrance timing

### Accessibility

- `prefers-reduced-motion: reduce`: Disable all parallax. All layers sit at their default positions. ScrollTrigger instances are killed. Content entrance plays instantly (no translate).
- Decorative layers are `aria-hidden="true"`. Only the foreground content layer is visible to assistive tech.
- Parallax must not cause motion sickness -- limit total displacement to 200px max, use smooth easing (`scrub: 0.5+`).

### Implementation Notes

- Oversized background: set `height: 120%` and `top: -10%` to prevent edge gaps during parallax.
- Use `will-change: transform` on layers, but only during the active scroll range. Remove after the hero scrolls out of view.
- Mobile: reduce parallax range by 50% or disable entirely. Mobile browsers handle parallax less smoothly due to scroll event throttling.
- Lenis `lerp: 0.1` gives a luxury-smooth feel. Increase to `0.2` for more responsive scroll.
- `scrub: 0.5` provides 0.5 seconds of catch-up smoothing. Higher values = smoother but laggier.

---

## 3d-scene

**Complexity**: H
**Performance cost**: 4
**Dependencies**: three.js + gsap

### Description

A Three.js canvas renders a 3D scene as the hero background -- a product model, abstract geometry, particle environment, or branded 3D world. 2D HTML content overlays the canvas. Scroll or mouse interaction can drive camera movement or scene animation.

Use when: the brief explicitly calls for 3D, the aesthetic is `immersive` or `retro-futurism`, or the project is a product showcase requiring model visualization.

### HTML Structure

```html
<section class="hero hero--3d" aria-label="Hero">
  <canvas class="hero__canvas" aria-hidden="true" role="img" aria-label="Decorative 3D scene"></canvas>
  <div class="hero__content">
    <h1 class="hero__headline">Three-dimensional</h1>
    <p class="hero__subhead">Interactive 3D scene with HTML overlay.</p>
    <div class="hero__cta">
      <a href="#" class="btn btn--primary">Explore</a>
    </div>
  </div>
</section>
```

### CSS Contract

Base shared tokens plus:
- `--canvas-opacity`: opacity of the 3D canvas (default: 1, reduce for subtle backgrounds)

Canvas: `position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0`.
Content: `position: relative; z-index: 2; pointer-events: none` on wrapper, `pointer-events: auto` on interactive children (buttons).

### Animation Choreography

1. **Initialization** (after DOMContentLoaded):
   - Create Three.js scene, camera (PerspectiveCamera, fov: 45-75), renderer (WebGLRenderer, antialias: true, alpha: true)
   - Set `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` to cap GPU load
   - Load model/geometry. Show loading state or poster image while loading.
2. **Entrance animation** (after scene ready):
   - Camera animates from initial position to hero position (GSAP, duration: 2s, ease: `power3.inOut`)
   - 3D objects fade in via material opacity or scale from 0
   - HTML content fades in after 3D entrance completes (delay: 1.5s)
3. **Idle animation** (continuous):
   - Subtle rotation or float on the scene/model (small amplitude, slow)
   - Responds to mouse position: camera or model rotates toward cursor (strength: 0.02-0.05 of cursor offset)
4. **Scroll-driven** (optional, ScrollTrigger):
   - Camera dollies or rotates as user scrolls past hero
   - Scene elements animate (explode view, scale, reposition)

### Accessibility

- `prefers-reduced-motion: reduce`: Render a single static frame of the 3D scene. Disable all animation, mouse-tracking, and scroll-driven camera movement. The canvas becomes a static image.
- Canvas has `role="img"` and descriptive `aria-label`. The label should describe what the 3D scene depicts, not how it animates.
- Interactive 3D elements must have keyboard alternatives. If the 3D canvas is purely decorative (most hero uses), it does not need to be interactive.
- Provide a skip link before the canvas if it captures pointer events.

### Implementation Notes

- **Memory management**: Dispose of geometries, materials, textures, and renderer when navigating away. Three.js does not garbage-collect GPU resources automatically.
- **Pixel ratio cap**: `Math.min(window.devicePixelRatio, 2)`. High-DPI screens at full pixel ratio can 4x the fragment shader workload.
- **Resize handler**: Update camera aspect ratio and renderer size on `window.resize` (debounced 200ms).
- **Intersection Observer**: Pause the render loop (`cancelAnimationFrame`) when the hero scrolls out of view. Resume when it re-enters. This is critical for battery life.
- **Fallback**: If WebGL is not available (`!window.WebGLRenderingContext`), show a static image or gradient background. Test with `renderer.getContext()` error handling.
- **Loading strategy**: Dynamic `import()` for Three.js. Do not include it in the critical bundle. Show the HTML content + a background color while Three.js initializes.
- This is the heaviest hero variant. Only use when the brief explicitly justifies it.

---

## split-screen

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css | gsap (optional)

### Description

The viewport is divided into two halves -- typically image/media on one side and text content on the other. The split can be 50/50, 60/40, or any ratio. On mobile, the halves stack vertically. This layout works well for product showcases, portfolios, and editorial introductions.

Use when: the brief has strong imagery alongside a headline, the aesthetic is `editorial`, `swiss`, or `corporate-clean`, or the content naturally pairs visual + text.

### HTML Structure

```html
<section class="hero hero--split" aria-label="Hero">
  <div class="hero__media">
    <img
      src="assets/hero-image.webp"
      alt="Descriptive alt text for the hero image"
      loading="eager"
      fetchpriority="high"
    >
  </div>
  <div class="hero__content">
    <p class="hero__overline">Category</p>
    <h1 class="hero__headline">Split-screen hero</h1>
    <p class="hero__subhead">Image on one side, content on the other.</p>
    <div class="hero__cta">
      <a href="#" class="btn btn--primary">Learn more</a>
    </div>
  </div>
</section>
```

### CSS Contract

Base shared tokens plus:
- `--split-ratio`: grid template columns (e.g., `1fr 1fr` for 50/50, `3fr 2fr` for 60/40)
- `--split-direction`: which side has media (`media-left` or `media-right`)
- `--split-gap`: gap between halves (default: `0`)

Layout: `display: grid; grid-template-columns: var(--split-ratio); min-height: 100svh`.
Media side: `overflow: hidden` for image scaling effects.
Content side: flexbox vertical centering with padding.

Responsive breakpoint (typically `768px`): `grid-template-columns: 1fr`, media stacks above content.

### Animation Choreography

1. **CSS-only approach** (default):
   - Image fades in with `@starting-style` (`opacity: 0; scale: 1.05` -> `opacity: 1; scale: 1`, duration: 1s)
   - Content side uses standard stagger entrance (same as static-centered)
2. **GSAP-enhanced** (optional):
   - Image clip-path reveal: `inset(0 100% 0 0)` -> `inset(0 0 0 0)` (wipe from left)
   - Content elements stagger in from the content side (translate from the direction of the split)
   - Timeline: image reveal (0-0.8s) -> headline (0.4s) -> subhead (0.6s) -> CTA (0.8s)

### Accessibility

- `prefers-reduced-motion: reduce`: No clip-path animation, no scale. Elements appear immediately.
- The hero image must have meaningful `alt` text (it is content, not decoration, in this layout).
- On mobile stack, ensure the heading still comes first in reading order even if image displays above it visually. Use `order` in CSS if needed, but prefer source order that puts content first.

### Implementation Notes

- Image: `object-fit: cover; width: 100%; height: 100%` in the media container.
- Consider `aspect-ratio` on the media container for layout stability before image loads.
- The split-screen hero works exceptionally well with the `image-reveal` micro-interaction on the media side.
- For diagonal splits, use `clip-path: polygon(...)` on the media container instead of a straight grid division.

---

## interactive-canvas

**Complexity**: H
**Performance cost**: 4
**Dependencies**: three.js | canvas-2d + gsap

### Description

The hero background is a full-viewport `<canvas>` element running an interactive generative visualization -- particle fields, noise landscapes, fluid simulations, or cursor-reactive graphics. Unlike `3d-scene`, this variant focuses on abstract, procedural visuals rather than 3D models.

Use when: the brief calls for a `cyberpunk`, `immersive`, or `vaporwave` aesthetic, or when the hero should feel alive and responsive to user input without requiring specific 3D assets.

### HTML Structure

```html
<section class="hero hero--interactive-canvas" aria-label="Hero">
  <canvas
    class="hero__canvas"
    aria-hidden="true"
    role="img"
    aria-label="Interactive generative background"
  ></canvas>
  <div class="hero__content">
    <h1 class="hero__headline">Generative</h1>
    <p class="hero__subhead">Background responds to your cursor.</p>
  </div>
</section>
```

### CSS Contract

Base shared tokens plus:
- `--canvas-blend`: `mix-blend-mode` for the canvas (default: `normal`, try `screen`, `multiply`, `soft-light`)
- `--canvas-opacity`: base opacity of the canvas layer

Canvas: `position: absolute; inset: 0; width: 100%; height: 100%`.

### Animation Choreography

1. **Initialization**:
   - Create rendering context (WebGL via Three.js for shaders, or 2D canvas for particle systems)
   - Pass uniforms: `u_time` (elapsed), `u_resolution` (canvas size), `u_mouse` (normalized cursor position)
2. **Render loop** (requestAnimationFrame):
   - Update `u_time` each frame
   - Track mouse via `mousemove` listener, normalize to 0-1 range, smooth with lerp (factor: 0.05-0.1)
   - Render the procedural effect
3. **Cursor interaction**:
   - Mouse position influences the visual (particle attraction/repulsion, noise seed offset, color shift)
   - Smoothed with lerp to avoid jitter: `mouseSmooth += (mouseTarget - mouseSmooth) * 0.08`
4. **Content entrance** (page load):
   - Standard headline + subhead stagger after canvas initializes (delay: 300ms)

### Accessibility

- `prefers-reduced-motion: reduce`: Render one static frame and stop the animation loop. The canvas shows a frozen snapshot of the procedural visual.
- Canvas is `aria-hidden="true"` -- purely decorative.
- No canvas interaction should be required to access content. The canvas is passive eye candy.

### Implementation Notes

- Same memory/lifecycle management as `3d-scene`: dispose on leave, pause off-screen.
- For 2D canvas particle systems: cap particle count at 200-300 for 60fps on mobile.
- For WebGL shaders: keep fragment shader complexity reasonable. Avoid excessive loops or texture lookups per fragment.
- Dynamic `import()` for the canvas code. Show background color while loading.
- Consider `OffscreenCanvas` + Web Worker for particle physics to keep main thread clear for interactions.

---

## gradient-morph

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

An animated gradient background that smoothly shifts colors, positions, and shapes over time. Uses CSS `@property` for animatable gradient stops (which cannot otherwise be transitioned) and `@keyframes` for the animation. No JavaScript required.

Use when: the brief calls for `organic`, `vaporwave`, or `glassmorphism` aesthetics, the performance budget is tight, or you need a visually engaging hero without any JS or media assets.

### HTML Structure

```html
<section class="hero hero--gradient-morph" aria-label="Hero">
  <div class="hero__gradient" aria-hidden="true"></div>
  <div class="hero__content">
    <h1 class="hero__headline">Living gradient</h1>
    <p class="hero__subhead">Colors shift and blend continuously.</p>
    <div class="hero__cta">
      <a href="#" class="btn btn--primary">Begin</a>
    </div>
  </div>
</section>
```

### CSS Contract

Base shared tokens plus:
- `--gradient-color-1` through `--gradient-color-4`: the palette of gradient stops (oklch values)
- `--gradient-duration`: full cycle duration (default: `12s`)
- `--gradient-blur`: optional backdrop-blur on content for readability

Requires `@property` registration for each color stop to enable interpolation:

```css
@property --gradient-stop-1 {
  syntax: "<color>";
  inherits: false;
  initial-value: oklch(0.6 0.15 250);
}
```

The gradient div: `position: absolute; inset: 0` with `background: radial-gradient(ellipse at var(--gx1) var(--gy1), var(--gradient-stop-1), transparent), radial-gradient(...)` layering 3-4 radial gradients.

### Animation Choreography

1. **Continuous** (CSS keyframes, no JS):
   - `@keyframes gradient-shift` moves gradient positions (`--gx1`, `--gy1`, etc.) and color stops through a cycle
   - Duration: `var(--gradient-duration)` (8-15 seconds for a relaxed feel)
   - `animation-timing-function: ease-in-out`
   - `animation-iteration-count: infinite`
   - `animation-direction: alternate` for smooth back-and-forth
2. **Content entrance** (CSS @starting-style):
   - Standard stagger entrance, same as static-centered

### Accessibility

- `prefers-reduced-motion: reduce`: Pause the gradient animation (`animation-play-state: paused`). Show the initial gradient state as a static background.
- The gradient is decorative (`aria-hidden="true"` on the gradient div).
- Ensure sufficient contrast between text and the lightest/brightest state of the gradient cycle. Test at multiple keyframe positions.

### Implementation Notes

- `@property` is required for animating gradient color stops. Without it, gradients snap between keyframes instead of interpolating.
- Browser support for `@property`: Chrome 85+, Edge 85+, Safari 15.4+, Firefox 128+. For older browsers, fall back to a static gradient.
- Use `oklch()` for color stops -- it interpolates more naturally than hex or rgb.
- Layering 3-4 `radial-gradient` backgrounds creates the mesh-like effect. Each gradient has its own animated position and color.
- Keep the content readable: use a subtle `backdrop-filter: blur(40px)` on the content container if gradient colors are vivid, or overlay a semi-transparent scrim.
- This is the most visually interesting CSS-only hero. Zero JS, zero media assets, 1/5 performance cost.

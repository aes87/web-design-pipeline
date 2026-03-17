# Award-Winning Web Design Patterns Research (2025-2026)

A structured analysis of patterns, techniques, and tools used by Awwwards, FWA, and CSS Design Awards winners. Designed to feed into an AI-driven component/pattern library generation pipeline.

---

## Table of Contents

1. [Visual Design Trends](#1-visual-design-trends)
2. [Interaction Patterns](#2-interaction-patterns)
3. [Technical Stack & Libraries](#3-technical-stack--libraries)
4. [Animation Patterns](#4-animation-patterns)
5. [Scroll-Driven Narrative Patterns](#5-scroll-driven-narrative-patterns)
6. [WebGL & Shader Patterns](#6-webgl--shader-patterns)
7. [Typography Patterns](#7-typography-patterns)
8. [Image & Media Patterns](#8-image--media-patterns)
9. [Page Transition Patterns](#9-page-transition-patterns)
10. [Performance Strategies](#10-performance-strategies)
11. [Accessibility Layer](#11-accessibility-layer)
12. [Notable Studios & Open Source](#12-notable-studios--open-source)
13. [Pattern Library Taxonomy](#13-pattern-library-taxonomy)

---

## 1. Visual Design Trends

### 1.1 Dark Mode Luxury
- Deep blacks (#0a0a0a, not pure #000) with subtle warm or cool undertones
- High-contrast accent colors (single brand color pops against near-black)
- Subtle gradient overlays and radial glows for depth
- Thin, light-weight sans-serif typography (often custom variable fonts)
- Generous whitespace (paradoxically, "dark-space")
- Use case: luxury brands, portfolios, tech products, SaaS landing pages

### 1.2 Neo-Brutalism
- Thick black borders (2-4px+), hard drop shadows offset 4-8px
- Bright, saturated primary color palettes (no subtle gradients)
- Monospace or slab-serif typography
- Intentionally "raw" or "undesigned" aesthetic that reads as confident
- Blocky, grid-breaking layouts with visible structure
- Use case: indie products, creative tools, developer-facing brands (Gumroad, Figma refresh)

### 1.3 Organic & Fluid Shapes
- Blob-like SVG shapes, often animated (morphing boundaries)
- Soft gradients with organic color transitions
- Rounded corners taken to extremes (pill shapes, full radius)
- Nature-inspired palettes (earth tones, muted greens, terracotta)
- Use case: wellness, sustainability, B2C consumer products

### 1.4 Grain & Noise Textures
- SVG `feTurbulence` filter overlays (type='fractalNoise', baseFrequency 0.6-0.8)
- Film grain effect via animated noise (CSS keyframes shifting background-position)
- Layered with gradients using `mix-blend-mode: multiply` or `overlay`
- Adds tactility and analog warmth to otherwise flat digital surfaces
- Performance note: SVG filters are CPU-intensive; pre-render to WebP/AVIF for static grain

### 1.5 3D Integration
- Product showcases with real-time 3D models (rotate, zoom, explode views)
- Environmental 3D scenes as hero sections (not just decorative)
- Seamless blend of 2D UI overlaying 3D canvas
- Digital showrooms and branded environments that feel like games
- WebGPU emerging as successor to WebGL for complex scenes

### 1.6 Flexible Grid & Layout Freedom
- Elements appearing scattered, floating, or deliberately "broken" from grid
- Modular, card-based layouts that users click/hover to reveal
- Asymmetric compositions with strong diagonal flow
- Overlapping elements with z-index layering creating depth

---

## 2. Interaction Patterns

### 2.1 Custom Cursors
- **Dot + ring follower**: Small dot at exact cursor position, larger circle that lerps behind it
- **Magnetic elements**: Buttons/links that pull the cursor toward their center on proximity
- **Contextual cursor**: Cursor changes shape/content based on what it hovers (text labels, arrows, play icons)
- **Cursor trail / distortion**: WebGL shader responding to cursor position (smoke, liquid, ripple)
- **Blend-mode cursor**: `mix-blend-mode: difference` on a large cursor circle for text inversion

### 2.2 Hover Interactions
- Image distortion on hover (WebGL displacement maps)
- Color shift / duotone filter toggles
- Scale + rotation micro-animations (subtle, 1.02-1.05 scale)
- Clip-path reveals (shape morphing from circle to rectangle)
- Stagger-animated list items on hover

### 2.3 Scroll-Triggered Reveals
- Elements animate in from below/sides as they enter viewport
- Staggered reveal of grid items (0.05-0.1s delay between items)
- Fade + translate (y: 30-60px) with ease-out curves
- Blur-to-sharp focus transitions
- Counter/number animations on scroll entry

### 2.4 Micro-Interactions
- Button press states with scale-down (0.95-0.98)
- Form field focus animations (label float, border morph)
- Toggle switches with physics-based spring animations
- Loading states with skeleton screens + shimmer
- Haptic-feeling feedback through motion (bounce, overshoot)

---

## 3. Technical Stack & Libraries

### 3.1 Core Animation Framework
| Tool | Role | Notes |
|------|------|-------|
| **GSAP** | Animation engine | Industry standard. ScrollTrigger, SplitText, Flip plugins. Free since Webflow acquisition (2024). |
| **Lenis** | Smooth scroll | 3KB, by Darkroom Engineering. Uses scrollTo (not transforms), preserves `position: sticky`. |
| **Framer Motion** | React animation | Declarative API, layout animations, shared layout transitions. |

### 3.2 3D & WebGL
| Tool | Role | Notes |
|------|------|-------|
| **Three.js** | 3D rendering | Dominant 3D library behind most award winners. |
| **React Three Fiber (R3F)** | React + Three.js | Declarative Three.js in React. Used by Vercel, Basement Studio, 14islands. |
| **@react-three/drei** | R3F helpers | Abstractions for common 3D patterns (Environment, ContactShadows, Float, etc.). |
| **WebGPU** | Next-gen GPU API | Successor to WebGL. Better performance for complex scenes. Chrome, Edge, Safari support. |
| **Shader Park / glslCanvas** | Shader prototyping | For custom fragment shaders without full Three.js setup. |

### 3.3 Frameworks & Meta-Frameworks
| Tool | Role | Notes |
|------|------|-------|
| **Next.js** | React framework | Most common among award winners. SSR/SSG for performance + React ecosystem. |
| **Nuxt** | Vue framework | Strong in European creative dev community. |
| **Astro** | Static/hybrid | Growing in creative dev. Ships zero JS by default, islands architecture. |
| **SvelteKit** | Svelte framework | Lightweight, compiler-based. Less common but growing. |

### 3.4 Page Transitions
| Tool | Role | Notes |
|------|------|-------|
| **Barba.js** | AJAX page transitions | 9KB. Manages transitions between pages without full reload. |
| **Swup** | Page transition lib | CSS-driven transitions, extensible plugin system. |
| **View Transitions API** | Native browser API | CSS-only page transitions. Chrome 111+. Polyfill available. Replaces need for Barba/Swup in supported browsers. |

### 3.5 Utility Libraries
| Tool | Role | Notes |
|------|------|-------|
| **splitting.js** | Text splitting | Lightweight alternative to GSAP SplitText (if GSAP not needed). |
| **VFX-JS** | WebGL effects | Applies shader effects to any HTML element. |
| **OGL** | Lightweight WebGL | Minimal WebGL framework, smaller than Three.js. Good for simple effects. |

---

## 4. Animation Patterns

### 4.1 Easing & Timing Principles
- **Default ease**: `power2.out` or `power3.out` (GSAP) / `cubic-bezier(0.16, 1, 0.3, 1)` for most reveals
- **Elastic/spring**: For interactive feedback (buttons, toggles, drag-release)
- **Linear**: Only for scroll-scrubbed animations and progress indicators
- **Duration ranges**: Micro (0.2-0.4s), Standard (0.6-1.0s), Dramatic (1.2-2.0s)
- **Stagger formula**: `index * 0.03-0.08s` for list/grid reveals
- **Choreography**: Elements never animate simultaneously; entrance order follows reading direction (top-left to bottom-right) or importance hierarchy

### 4.2 GPU-Accelerated Properties
Only animate these for 60fps composited animations:
- `transform` (translate, scale, rotate) -- compositor thread
- `opacity` -- compositor thread
- `filter` (blur, brightness) -- partially accelerated
- `clip-path` -- increasingly accelerated in modern browsers

Avoid animating: `width`, `height`, `top`, `left`, `margin`, `padding`, `border-width`, `font-size`, `background-color` (all trigger layout/paint).

### 4.3 The `will-change` Protocol
```css
/* Declare before animation starts */
.element { will-change: transform, opacity; }

/* Remove after animation completes to free GPU memory */
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});
```
- Never apply `will-change` to more than ~20 elements simultaneously
- Mobile battery impact is real -- use sparingly

### 4.4 Composite Layer Strategy
- Promote animated elements to their own layer with `transform: translateZ(0)` or `will-change: transform`
- Keep layer count under control (Chrome DevTools > Layers panel)
- Each layer consumes GPU memory -- balance visual fidelity with memory budget
- Use `contain: layout paint` on complex animated sections

---

## 5. Scroll-Driven Narrative Patterns

### 5.1 GSAP ScrollTrigger Patterns

**Pin + Scrub (The Workhorse)**
Element pins in place while scroll progress drives animation timeline.
```
- pin: true -- fixes element during scroll range
- scrub: 0.5-1.0 -- smoothed catch-up to scroll position
- snap: 1/sectionCount -- optional snap to discrete sections
```

**Batch Reveal**
Multiple elements entering viewport animate in staggered sequence.
```
- ScrollTrigger.batch('.item', { onEnter: stagger animation })
- interval: 0.1 -- minimum time between triggers
```

**Horizontal Scroll Section**
Pin a container, translate inner content horizontally as user scrolls vertically.
```
- Pin the wrapper, animate x of inner track
- scrub: true, end: "+=" + (innerWidth - viewportWidth)
```

**Parallax Layers**
Multiple elements at different scroll speeds creating depth.
```
- Layer speeds: background 0.3x, midground 0.6x, foreground 1.0x
- Apply via scrub-linked y translations
```

### 5.2 CSS Scroll-Driven Animations (Native)
```css
@keyframes reveal {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

.element {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
```
- Runs on compositor thread (off main thread) -- inherently performant
- `scroll()` timeline: progress tied to scroll container position
- `view()` timeline: progress tied to element's visibility in viewport
- Browser support: Chrome 115+, Edge 115+, Safari 18+ (partial), Firefox behind flag
- Polyfill: `scroll-timeline` on npm

### 5.3 Lenis + ScrollTrigger Integration
```javascript
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```
- Lenis smooths the scroll input; ScrollTrigger reads scroll position for animation
- `lerp: 0.07-0.12` is the sweet spot for "luxury" feel
- Higher lerp (0.2+) for more responsive/direct feel

### 5.4 Narrative Scroll Structures
| Pattern | Description | When to Use |
|---------|-------------|-------------|
| **Chapter Scroll** | Full-viewport sections, each a "chapter" with pinned animations | Product launches, stories |
| **Parallax Journey** | Continuous scroll with multi-speed layers | Portfolios, timelines |
| **Zoom Tunnel** | Progressive scale increase creating a "flying through" effect | Brand experiences, intros |
| **Sticky Stack** | Cards/panels stack on top of each other as you scroll | Feature lists, case studies |
| **Horizontal Gallery** | Vertical scroll drives horizontal movement through a gallery | Portfolios, image showcases |
| **Progress Reveal** | Single hero section with animation tied to scroll percentage | Data viz, process explanations |

---

## 6. WebGL & Shader Patterns

### 6.1 Common Fragment Shader Effects
| Effect | Technique | Use Case |
|--------|-----------|----------|
| **Noise/Grain** | `fract(sin(dot(...)) * 43758.5453)` or Perlin/Simplex noise | Background texture, film grain |
| **Distortion** | Displacement map sampling with `texture2D` offset | Image hover, transitions |
| **Liquid/Fluid** | Metaball SDF, curl noise for velocity fields | Cursor trails, backgrounds |
| **Blur/Bokeh** | Multi-pass gaussian or custom bokeh kernel | Depth of field, focus transitions |
| **Color Grading** | Post-processing color matrix transforms | Consistent cinematic look |
| **Wave/Ripple** | `sin(distance * frequency + time)` displacement | Water effects, audio reactive |

### 6.2 Cursor-Reactive Shaders
- Track mouse position via uniform (`u_mouse`)
- Calculate distance from each pixel to cursor: `distance(uv, u_mouse)`
- Apply `smoothstep` for soft falloff influence radius
- Common effects: ripple at cursor, color shift, displacement, liquid distortion

### 6.3 Image Transition Shaders
- **Displacement transitions**: Use noise texture to offset UV coordinates during transition
- **Morphing**: Interpolate between two textures using a progress uniform (0-1)
- **Pixel sorting/glitch**: Selectively offset rows/columns based on brightness threshold
- **Curtain/wipe**: Animate clip boundary with eased progress

### 6.4 Background Effect Patterns
- **Gradient mesh**: Animated gradient with multiple control points (CSS `@property` or WebGL)
- **Particle fields**: Instanced geometry responding to mouse/scroll
- **Noise landscapes**: Vertex displacement using simplex noise for terrain-like motion
- **Blob/metaball**: Signed distance function combining multiple spheres

---

## 7. Typography Patterns

### 7.1 GSAP SplitText Techniques
SplitText splits HTML text into individual `<div>` elements per character, word, or line, enabling per-unit animation.

| Pattern | Implementation | Visual Effect |
|---------|---------------|---------------|
| **Stagger Reveal** | Split to chars, animate `y: 100%` with parent `overflow: hidden` | Characters slide up one-by-one |
| **Fade Blur In** | Split to words, animate `opacity: 0, filter: blur(10px)` | Words materialize from blur |
| **Rotate In** | Split to chars, animate `rotationX: -90` with `transformOrigin: bottom` | Characters flip up from baseline |
| **Scale Bounce** | Split to chars, animate `scale: 0` with `elastic` ease | Characters pop in with bounce |
| **Scramble** | GSAP TextPlugin `scrambleText` effect | Random characters resolve to real text |
| **Clip Mask Reveal** | SplitText mask feature, animate `y` within masked container | Clean bottom-to-top text reveal |

### 7.2 Kinetic Typography
- Large display text (80-200px+) with letter-spacing animation
- Individual character rotation/translation on scroll
- Text that responds to cursor proximity (repulsion/attraction)
- Stroke-only text with fill animating on scroll progress
- Variable font `font-weight` or `font-width` animation (requires variable font)

### 7.3 Typography Performance
- SplitText now ~7KB with built-in masking (no manual overflow-hidden wrappers)
- Screen reader compatible -- maintains semantic text in DOM
- Responsive: re-split on resize to handle line-break changes
- Avoid splitting more than ~500 characters simultaneously

---

## 8. Image & Media Patterns

### 8.1 Image Reveal Animations
| Pattern | CSS/JS Technique | Description |
|---------|-----------------|-------------|
| **Clip-Path Wipe** | `clip-path: inset(0 100% 0 0)` -> `inset(0 0 0 0)` | Directional reveal (L/R/T/B) |
| **Circle Expand** | `clip-path: circle(0% at 50% 50%)` -> `circle(100%)` | Radial reveal from center |
| **Polygon Morph** | `clip-path: polygon(...)` keyframes | Shape-shifting reveals |
| **Scale + Overflow** | Container `overflow: hidden`, image `scale(1.2)` -> `scale(1)` | Ken Burns / zoom reveal |
| **Mask SVG** | SVG `<mask>` with animated path | Organic/hand-drawn reveal shapes |
| **Curtain Overlay** | Colored div slides across, reveals image underneath | Two-phase: color block then image |

### 8.2 Parallax Image Techniques
- **CSS-only**: `background-attachment: fixed` (limited, not smooth on mobile)
- **Transform-based**: Oversize image in `overflow: hidden` container, `translateY` on scroll
- **GSAP scrub**: Tie `y` offset to scroll progress with `scrub: true`
- **Multi-layer**: 2-3 images at different parallax speeds for depth
- **Speed formula**: `scrollDelta * speedFactor` where foreground = 1.0, background = 0.2-0.5

### 8.3 Video Patterns
- **Scroll-scrubbed video**: Canvas-based frame-by-frame playback tied to scroll (Apple-style)
- **Background ambient video**: Muted, looping, compressed to <2MB, lazy-loaded after LCP
- **Video mask**: Video content visible through animated SVG/clip-path mask
- **Intersection observer**: Play on enter viewport, pause on exit

---

## 9. Page Transition Patterns

### 9.1 View Transitions API (Native, Preferred)
```css
::view-transition-old(root) {
  animation: fade-out 0.3s ease-out;
}
::view-transition-new(root) {
  animation: fade-in 0.3s ease-in;
}
```
- Assign `view-transition-name` to elements that should morph between pages
- Browser captures "old" and "new" snapshots, animates between them
- Works with MPA (multi-page) in Chrome 126+ and SPA via `document.startViewTransition()`

### 9.2 Common Transition Types
| Transition | Description | Complexity |
|-----------|-------------|------------|
| **Crossfade** | Old page fades out, new fades in | Low |
| **Slide** | Pages slide horizontally (directional based on nav) | Low |
| **Curtain/Wipe** | Colored overlay sweeps across, reveals new page | Medium |
| **Zoom** | Clicked element scales to fill viewport, becomes new page | Medium |
| **Morph** | Shared elements (images, headings) smoothly transition position/size | High |
| **WebGL Dissolve** | Shader-based transition (noise dissolve, pixel displacement) | High |

### 9.3 Barba.js Integration Pattern
```javascript
barba.init({
  transitions: [{
    leave: ({ current }) => gsap.to(current.container, { opacity: 0 }),
    enter: ({ next }) => gsap.from(next.container, { opacity: 0 }),
  }]
});
```
- Handles AJAX page loading, container swapping, and transition lifecycle
- Combine with GSAP for complex choreographed transitions
- Prefetch on hover for perceived instant navigation

---

## 10. Performance Strategies

### 10.1 Core Web Vitals Targets (2025-2026)
| Metric | Good | Measures |
|--------|------|----------|
| **LCP** | < 2.5s | Largest Contentful Paint -- hero image/text render time |
| **INP** | < 200ms | Interaction to Next Paint (replaced FID in 2024) -- input responsiveness |
| **CLS** | < 0.1 | Cumulative Layout Shift -- visual stability |

### 10.2 Heavy Visual Content Strategies
- **Lazy load below-fold**: `loading="lazy"` on images/iframes not in initial viewport
- **Eager load LCP element**: Explicitly `loading="eager"` + `fetchpriority="high"` on hero image
- **Responsive images**: `srcset` + `sizes` to serve appropriately sized assets
- **Modern formats**: WebP/AVIF with `<picture>` fallback to JPEG
- **Video compression**: H.265/AV1 encoding, limit hero video to 1-2MB, poster frame for LCP

### 10.3 JavaScript Performance
- **Code split animation libraries**: Dynamic `import()` for GSAP, Three.js -- not in critical path
- **Tree-shake**: Import only needed GSAP plugins (`gsap/ScrollTrigger` not all of GSAP)
- **Defer WebGL init**: Initialize 3D canvas after DOMContentLoaded, show fallback image during load
- **Worker offload**: Heavy computations (particle physics, noise generation) in Web Workers
- **Intersection Observer gating**: Only run animations for elements in/near viewport

### 10.4 Progressive Enhancement Pattern
```
Layer 0: HTML content (readable without CSS/JS)
Layer 1: CSS layout + base styling (usable without JS)
Layer 2: CSS animations (transitions, scroll-driven native)
Layer 3: JS-enhanced animations (GSAP, scroll effects)
Layer 4: WebGL/3D effects (Three.js canvas overlays)
```
Each layer enhances without breaking the layer below. If JS fails, content is still accessible and styled.

### 10.5 GPU Memory Budget
- Monitor layer count in DevTools (target: < 30 promoted layers)
- Destroy WebGL contexts when off-screen (Intersection Observer)
- Use `renderer.dispose()` in Three.js for cleanup
- Texture atlas where possible (fewer GPU texture units)
- Limit simultaneous `will-change` declarations

---

## 11. Accessibility Layer

### 11.1 prefers-reduced-motion (Mandatory)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In JavaScript (GSAP):
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(100); // effectively instant
  ScrollTrigger.getAll().forEach(st => st.disable());
}
```

### 11.2 Animation Accessibility Checklist
- [ ] All decorative animations disabled when `prefers-reduced-motion: reduce`
- [ ] Functional animations (navigation feedback, state changes) reduced but not removed
- [ ] No content is only accessible through animation (e.g., scroll-revealed text must be in DOM)
- [ ] Parallax and scroll-hijacking disabled for reduced-motion users
- [ ] Auto-playing animations have visible pause/stop controls
- [ ] No flashing content > 3 flashes per second (WCAG 2.3.1)

### 11.3 Focus Management
- Custom cursors must not hide the native focus indicator
- After page transitions (Barba/Swup), reset focus to `<main>` or `<h1>` of new page
- Scroll-pinned sections must not trap keyboard navigation
- Interactive 3D canvases need a skip link and keyboard alternative
- `aria-live="polite"` for dynamically revealed content

### 11.4 Screen Reader Considerations
- SplitText output maintains semantic structure (GSAP handles this)
- WebGL canvases need `role="img"` + `aria-label` describing the visual
- Scroll-driven narrative content should be readable in source order without scroll
- Decorative animated elements: `aria-hidden="true"`

### 11.5 European Accessibility Act (2025)
- All digital services in the EU must meet WCAG 2.1 AA standards
- Specific attention to animation: pause, stop, hide controls required
- Motion that auto-plays for more than 5 seconds must be controllable

---

## 12. Notable Studios & Open Source

### 12.1 Award-Winning Studios
| Studio | Location | Signature | Notable |
|--------|----------|-----------|---------|
| **Locomotive** | Montreal | 6x Awwwards Agency of the Year. Meaningful digital experiences, branding + web. | Created Locomotive Scroll (predecessor to Lenis). |
| **Darkroom Engineering** | -- | Technical craft, performance-first creative development. | Created **Lenis** (smooth scroll), **Hamo**, **Specto**. Major open-source contributors. |
| **Active Theory** | Venice Beach | Full WebGL immersive environments. Case studies feel like short films. | Proprietary **Hydra** framework (WebGL + GUI for designers). |
| **Basement Studio** | Buenos Aires | "Cool shit that performs." React Three Fiber, bold visual experiments. | R3F ecosystem contributor. |
| **14islands** | Stockholm/Reykjavik | Design + technology blend, interactive storytelling. People-first agency. | Known for R3F/Three.js work. |
| **Unseen Studio** | -- | Brand, digital, motion. "Refreshingly unexpected" visuals. | Consistent Awwwards SOTD winner. |
| **Immersive Garden** | Paris | Luxury digital experiences. Clients: tech platforms, luxury brands, broadcasters. | Known for polished WebGL work. |
| **Monopo** | Tokyo/London/NYC | Multidisciplinary: branding, digital, communication design. | Global reach, Tokyo design sensibility. |
| **Aristide Benoist** | -- (Individual) | Creative development + motion. | Multiple Awwwards SOTD. |

### 12.2 Open Source Ecosystem from Studios
| Tool | Creator | Purpose |
|------|---------|---------|
| **Lenis** | Darkroom Engineering | Smooth scroll (3KB) |
| **Locomotive Scroll** | Locomotive | Smooth scroll + parallax detection (predecessor) |
| **GSAP** | GreenSock (now Webflow) | Animation platform (free since 2024) |
| **React Three Fiber** | Poimandres (pmndrs) | React renderer for Three.js |
| **@react-three/drei** | Poimandres | Useful R3F helpers/abstractions |
| **Barba.js** | Luigi De Rosa | Page transitions |
| **Swup** | Community | Page transitions |
| **VFX-JS** | Community | WebGL effects on HTML elements |
| **Hydra** | Active Theory | WebGL framework + visual GUI (proprietary) |

### 12.3 Educational Resources
| Resource | Type | Focus |
|----------|------|-------|
| **Codrops (Tympanus)** | Tutorials + demos | Cutting-edge CSS/JS/WebGL techniques with open-source demos |
| **Three.js Journey** | Course | Comprehensive Three.js + R3F education |
| **GSAP Docs** | Documentation | ScrollTrigger, SplitText, Flip plugin guides |
| **Awwwards Collections** | Curated galleries | WebGL, Typography, Parallax categorized showcases |

---

## 13. Pattern Library Taxonomy

The following taxonomy organizes all patterns into a hierarchy suitable for an AI generation pipeline. Each pattern is tagged with complexity (L/M/H), performance cost (1-5), and required dependencies.

### 13.1 Background Effects
```
backgrounds/
  gradient-mesh          [L] [cost:1] [css]
  grain-texture          [L] [cost:2] [svg-filter]
  animated-grain         [M] [cost:3] [css-keyframes]
  noise-gradient         [M] [cost:2] [svg-filter + css-blend]
  particle-field         [H] [cost:4] [three.js OR canvas]
  fluid-simulation       [H] [cost:5] [webgl-shader]
  shader-gradient        [H] [cost:4] [webgl-shader]
  video-ambient          [M] [cost:3] [html-video]
```

### 13.2 Text Animations
```
text/
  fade-up-words          [L] [cost:1] [gsap + splittext]
  stagger-chars          [M] [cost:1] [gsap + splittext]
  blur-reveal            [M] [cost:2] [gsap + splittext]
  clip-mask-reveal       [M] [cost:1] [gsap + splittext]
  rotate-in-chars        [M] [cost:2] [gsap + splittext]
  scramble-resolve       [M] [cost:1] [gsap-textplugin]
  kinetic-scroll         [H] [cost:2] [gsap + scrolltrigger]
  variable-font-morph    [H] [cost:2] [css-variable-font]
  stroke-fill-reveal     [H] [cost:2] [svg-text + gsap]
```

### 13.3 Image/Media Reveals
```
media/
  clip-path-wipe         [L] [cost:1] [css OR gsap]
  circle-expand          [L] [cost:1] [css OR gsap]
  curtain-reveal         [M] [cost:1] [gsap]
  scale-overflow         [L] [cost:1] [css]
  parallax-image         [M] [cost:1] [gsap + scrolltrigger]
  webgl-distortion       [H] [cost:4] [three.js + shader]
  scroll-scrub-video     [H] [cost:3] [canvas + gsap]
  svg-mask-reveal        [M] [cost:2] [svg + gsap]
```

### 13.4 Scroll Sections
```
scroll/
  pin-and-reveal         [M] [cost:2] [gsap + scrolltrigger]
  horizontal-scroll      [M] [cost:2] [gsap + scrolltrigger]
  sticky-stack           [M] [cost:2] [gsap + scrolltrigger]
  parallax-layers        [M] [cost:2] [gsap + scrolltrigger]
  zoom-tunnel            [H] [cost:3] [gsap + scrolltrigger]
  chapter-snap           [M] [cost:2] [gsap + scrolltrigger]
  progress-driven        [L] [cost:1] [css-scroll-timeline OR gsap]
  batch-reveal           [L] [cost:1] [gsap + scrolltrigger]
```

### 13.5 Cursors
```
cursors/
  dot-ring-follower      [L] [cost:1] [js + css]
  magnetic-button        [M] [cost:1] [gsap]
  contextual-label       [M] [cost:1] [js + css]
  blend-mode-circle      [L] [cost:1] [css-mix-blend]
  webgl-distortion       [H] [cost:4] [webgl-shader]
  trail-particles        [H] [cost:3] [canvas]
```

### 13.6 Page Transitions
```
transitions/
  crossfade              [L] [cost:1] [view-transitions-api OR barba]
  slide-directional      [L] [cost:1] [view-transitions-api OR barba]
  curtain-wipe           [M] [cost:1] [barba + gsap]
  zoom-morph             [M] [cost:2] [view-transitions-api]
  shared-element         [H] [cost:2] [view-transitions-api]
  webgl-dissolve         [H] [cost:4] [barba + three.js]
```

### 13.7 UI Micro-Interactions
```
micro/
  button-press           [L] [cost:1] [css]
  magnetic-hover         [M] [cost:1] [gsap]
  input-focus-float      [L] [cost:1] [css]
  toggle-spring          [M] [cost:1] [framer-motion OR gsap]
  skeleton-shimmer       [L] [cost:1] [css]
  counter-animate        [L] [cost:1] [gsap]
  list-stagger           [L] [cost:1] [gsap OR css]
```

### 13.8 Layout Patterns
```
layout/
  bento-grid             [L] [cost:1] [css-grid]
  asymmetric-overlap     [M] [cost:1] [css-grid + z-index]
  floating-scattered     [M] [cost:1] [css-absolute + gsap]
  fullscreen-hero        [L] [cost:1] [css]
  split-screen           [L] [cost:1] [css-grid]
  masonry                [M] [cost:1] [css-columns OR js]
  sticky-sidebar         [L] [cost:1] [css-sticky]
```

---

## Appendix: Generation Pipeline Considerations

### A. Complexity Tiers for AI Generation
- **Tier 1 (CSS-only)**: Grain textures, clip-path reveals, basic scroll animations, micro-interactions. Can be generated as pure HTML/CSS.
- **Tier 2 (CSS + GSAP)**: Text animations, scroll sections, parallax, batch reveals, page transitions. Requires GSAP boilerplate generation.
- **Tier 3 (WebGL)**: Shader effects, 3D scenes, cursor distortion, displacement transitions. Requires Three.js scene scaffolding and custom shader code.

### B. Minimum Viable "Award-Winning" Stack
```
Framework:    Next.js or Astro
Animation:    GSAP (free) + ScrollTrigger + SplitText
Scroll:       Lenis (3KB)
Transitions:  View Transitions API (+ Barba.js fallback)
3D (if any):  Three.js or R3F
Accessibility: prefers-reduced-motion media query on every animation
Performance:  Lazy load, code split, progressive enhancement layers
```

### C. Quality Signals That Win Awards
1. **Animation choreography** -- not just "things move," but precise timing, sequencing, and easing that creates a rhythm
2. **Custom, not template** -- bespoke interactions, not off-the-shelf
3. **Performance under complexity** -- visually rich but still 60fps
4. **Typography as hero** -- oversized, animated, custom typefaces as primary visual element
5. **Scroll as narrative** -- content reveals with pacing and intention, not just "fade in on scroll"
6. **Cohesive motion language** -- every animation uses consistent easing, timing, and direction
7. **Restraint** -- knowing when NOT to animate; negative space in motion
8. **Sound design** (emerging) -- subtle audio feedback for interactions (with user opt-in)

---

*Research compiled March 2026. Based on analysis of Awwwards, FWA, and CSS Design Awards winners and nominees from 2024-2026.*

Sources:
- [Awwwards Website Awards](https://www.awwwards.com/)
- [Awwwards 2025 Nominees](https://www.awwwards.com/websites/2025/)
- [Web Design Trends 2026 - Really Good Designs](https://reallygooddesigns.com/web-design-trends-2026/)
- [Web Design Trends 2026 - Hostinger](https://www.hostinger.com/tutorials/web-design-trends)
- [Codrops WebGL Tutorials](https://tympanus.net/codrops/)
- [Building Scroll-Revealed WebGL Gallery - Codrops](https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/)
- [Animating WebGL Shaders with GSAP - Codrops](https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/)
- [GSAP Animation Tips - Codrops](https://tympanus.net/codrops/2025/09/03/7-must-know-gsap-animation-tips-for-creative-developers/)
- [14islands Agency Profile - Codrops](https://tympanus.net/codrops/2025/11/24/building-a-different-kind-of-agency-inside-14islands-people-first-creative-vision/)
- [VFX-JS WebGL Effects - Codrops](https://tympanus.net/codrops/2025/01/20/vfx-js-webgl-effects-made-easy/)
- [Lenis Smooth Scroll - Darkroom Engineering](https://lenis.darkroom.engineering/)
- [Lenis GitHub](https://github.com/darkroomengineering/lenis)
- [Darkroom Engineering](https://darkroom.engineering)
- [Building Smooth Scroll with Lenis - Edoardo Lunardi](https://www.edoardolunardi.dev/blog/building-smooth-scroll-in-2025-with-lenis)
- [GSAP ScrollTrigger Docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [GSAP SplitText Docs](https://gsap.com/docs/v3/Plugins/SplitText/)
- [GSAP Scroll Page](https://gsap.com/scroll/)
- [GSAP Text Animations](https://gsap.com/text/)
- [Barba.js](https://barba.js.org/)
- [Swup Page Transitions](https://swup.js.org/)
- [View Transitions API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [CSS Scroll-Driven Animations - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [Mastering CSS Scroll Timeline 2026](https://dev.to/softheartengineer/mastering-css-scroll-timeline-a-complete-guide-to-animation-on-scroll-in-2025-3g7p)
- [CSS GPU Acceleration Guide](https://www.lexo.ch/blog/2025/01/boost-css-performance-with-will-change-and-transform-translate3d-why-gpu-acceleration-matters/)
- [GPU Animation Done Right - Smashing Magazine](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
- [Core Web Vitals 2025 - OWDT](https://owdt.com/insight/how-to-improve-core-web-vitals/)
- [Web Performance 2026 - Solid App Maker](https://solidappmaker.com/web-performance-in-2026-best-practices-for-speed-security-core-web-vitals/)
- [Accessible Animation - Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [Building Accessible Web 2025 - Medium](https://medium.com/@thewcag/building-for-everyone-the-developers-guide-to-accessible-web-technologies-in-2025-f5b05c92b82b)
- [prefers-reduced-motion - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [Accessible Web Animations - Pixel Free Studio](https://blog.pixelfreestudio.com/best-practices-for-creating-accessible-web-animations/)
- [Neobrutalism - NN/g](https://www.nngroup.com/articles/neobrutalism/)
- [Neo-Brutalism 2025 - Clover Technology](https://www.clovertechnology.co/insights/how-neo-brutalism-took-over-digital-design-in-2025)
- [Grainy CSS Backgrounds - freeCodeCamp](https://www.freecodecamp.org/news/grainy-css-backgrounds-using-svg-filters/)
- [Grainy Gradients - CSS-Tricks](https://css-tricks.com/grainy-gradients/)
- [Active Theory WebGL Portfolio](https://www.webgpu.com/showcase/active-theory-portfolio/)
- [Active Theory Technology Story - Medium](https://medium.com/active-theory/the-story-of-technology-built-at-active-theory-5d17ae0e3fb4)
- [React Three Fiber - GitHub](https://github.com/pmndrs/react-three-fiber)
- [Award-Winning Web Design Guide - Utsubo](https://www.utsubo.com/blog/award-winning-website-design-guide)
- [Build Award-Winning 3D Website - DEV Community](https://dev.to/robinzon100/build-an-award-winning-3d-website-with-scroll-based-animations-nextjs-threejs-gsap-3630)
- [CSS Design Awards 2025 Winners](https://www.cssdesignawards.com/blog/2025-website-of-the-year-winners/430/)
- [Clip-Path Magic - Emil Kowalski](https://emilkowal.ski/ui/the-magic-of-clip-path)
- [Awwwards Parallax Collection](https://www.awwwards.com/websites/parallax/)
- [Smooth Scroll: GSAP vs Lenis - Zun Creative](https://zuncreative.com/blog/smooth_scroll_meditation/)

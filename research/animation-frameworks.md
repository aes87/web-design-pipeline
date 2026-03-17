# Web Animation & Graphics Frameworks: 2025-2026 Landscape Report

Research compiled March 2026. Covers maturity, bundle size, SSR compatibility, and suitability for programmatic/Claude-driven workflows.

---

## 1. Animation Libraries

### GSAP (GreenSock Animation Platform)

- **Status**: Acquired by Webflow (fall 2024). Made 100% free on April 30, 2025, including all formerly paid Club plugins (MorphSVG, SplitText, ScrollSmoother, DrawSVG, etc.).
- **License caveat**: New "Standard License" prohibits use in visual animation builder tools that compete with Webflow. Using GSAP on any website or web app (even a Webflow competitor's marketing site) is fine -- you just cannot embed GSAP inside a no-code animation builder product.
- **Bundle size**: ~23 KB gzipped (core). Modular -- import only what you need (ScrollTrigger, MorphSVG, etc. are separate).
- **Strengths**: Timeline orchestration (unmatched), SVG morphing, scroll-driven animation (ScrollTrigger), text splitting (SplitText), physics-like easing, cross-browser consistency. The imperative API gives frame-level control.
- **Learning curve**: Moderate. Extensive docs and community examples. The imperative model is intuitive for anyone comfortable with JS.
- **SSR**: Works fine -- GSAP operates on DOM refs, so animations initialize client-side. No SSR rendering issues. Compatible with Next.js, Nuxt, Astro, etc.
- **Claude workflow fit**: Excellent. Purely imperative JS -- easy to generate, modify, and reason about programmatically. No visual GUI dependency.

### Motion (formerly Framer Motion)

- **Status**: Spun off from Framer as an independent project at motion.dev. Now framework-agnostic: React, Vue, and vanilla JS. MIT licensed. 30M+ npm downloads/month.
- **Bundle size**: ~32 KB gzipped (React). Supports tree-shaking in modern bundlers (Vite, Rollup). Vanilla JS bundle is smaller.
- **Strengths**: Declarative API, layout animations (magic `layout` prop), `AnimatePresence` for enter/exit, gesture recognition (drag, hover, tap), spring physics, scroll-linked animations via Web Animations API and ScrollTimeline.
- **Performance**: Claims 2.5x faster than GSAP for animating from unknown values; 6x faster for cross-type animations. Uses Web Animations API natively for 120fps, falls back to JS for springs/interrupts.
- **Learning curve**: Low for React developers. Declarative model is natural in component-based frameworks.
- **SSR**: Good. Designed for React SSR from the start. Animations are client-side but don't break server rendering.
- **Claude workflow fit**: Good for React/Vue projects. Declarative JSX props are easy to generate. Less suitable for framework-free contexts.

### anime.js v4

- **Status**: v4.3.0 released January 2026. Major rewrite with modular API.
- **Bundle size**: ~17 KB gzipped (core module with subpath imports in v4.2+). Previously ~75 KB minified for the full bundle in v3.
- **Strengths**: Lightweight, clean API, staggering, SVG line drawing, CSS property animation. v4 adds scroll-linked animations, draggables, responsive animations, WAAPI support, `createLayout()` for layout state morphing, `text.split()`.
- **Learning curve**: Low. The simplest API of the group.
- **SSR**: Fine -- DOM-targeting, client-side only.
- **Claude workflow fit**: Excellent. Simple, predictable API. Easy to generate and tweak.

### Lottie (lottie-web)

- **Status**: Maintained by Airbnb + LottieFiles. dotLottie format gaining traction. Mature.
- **Bundle size**: ~60 KB gzipped (lottie-web full). Lighter players available (dotlottie-player).
- **Strengths**: Plays back After Effects animations as JSON. Pixel-perfect designer-to-dev handoff. Ideal for icons, micro-interactions, loading states, illustrations.
- **Limitations**: Not a programming animation library -- it plays pre-authored content. Limited runtime control (play, pause, speed, direction). Cannot create animations in code.
- **SSR**: Renders to SVG/canvas client-side. SSR-safe (just renders nothing server-side).
- **Claude workflow fit**: Poor for authoring (requires After Effects or LottieFiles editor). Fine for integration -- embedding a Lottie player is trivial to generate.

### Theatre.js

- **Status**: Active development. Niche but powerful for cinematic/3D animation.
- **Bundle size**: ~30-50 KB gzipped depending on modules.
- **Strengths**: Professional sequence editor in the browser. Timeline-based keyframing with graph editor. Works with Three.js, R3F, plain DOM. Designed for "create in code, perfect in browser" workflow.
- **Limitations**: Smaller community. Best suited for projects where you need a visual timeline editor during development.
- **SSR**: Animations are client-side; editor is dev-only.
- **Claude workflow fit**: Mixed. The code layer (defining props and sequences) is programmatic and works well. But the real value is the visual editor, which requires human interaction.

### Summary Table -- Animation Libraries

| Library | Bundle (gzip) | Framework | Best For | Claude-Friendly |
|---------|--------------|-----------|----------|-----------------|
| GSAP | ~23 KB core | Any | Timeline orchestration, SVG, scroll | Excellent |
| Motion | ~32 KB | React/Vue/Vanilla | Declarative UI animation, layout | Good |
| anime.js v4 | ~17 KB | Any | Lightweight, simple animations | Excellent |
| Lottie | ~60 KB | Any | Designer handoff, icon animation | Integration only |
| Theatre.js | ~30-50 KB | Any + Three.js | Cinematic sequences, 3D scenes | Mixed |

---

## 2. 3D / WebGL Frameworks

### Three.js

- **Status**: The dominant 3D library for the web. Massive ecosystem. Active development with WebGPU renderer shipping.
- **Bundle size**: ~150 KB gzipped (core). Tree-shakable in recent versions.
- **Strengths**: Largest community, most tutorials, most third-party addons. Full control over rendering pipeline. WebGPU support via new renderer + TSL (Three Shader Language).
- **Learning curve**: Steep. Sparse official docs historically, though improving. Many breaking changes between versions.
- **Best for**: Custom 3D experiences, data visualization, creative experiments, production sites needing 3D elements.
- **SSR**: Client-side only (WebGL/WebGPU). Can pre-render snapshots for SSR placeholder.
- **Claude workflow fit**: Excellent. Imperative JS API is straightforward to generate and modify. Enormous corpus of examples to draw from.

### React Three Fiber (R3F)

- **Status**: Industry standard for declarative 3D in React. Built on Three.js.
- **Bundle size**: ~20 KB gzipped (on top of Three.js).
- **Strengths**: React's component model applied to 3D. Ecosystem: drei (helpers), rapier (physics), postprocessing. Works with React state, Suspense, concurrent features.
- **Best for**: React applications needing 3D. Product configurators, interactive backgrounds, data viz.
- **SSR**: No server-side 3D rendering, but compatible with React SSR (renders nothing on server, hydrates on client).
- **Claude workflow fit**: Good. JSX-based scene graphs are easy to generate if you know the component patterns.

### Babylon.js

- **Status**: Microsoft-backed. Full game engine, not just a rendering library. TypeScript-first.
- **Bundle size**: ~300+ KB gzipped (full engine). Modular imports available.
- **Strengths**: Built-in physics (Havok), audio, XR/VR support, comprehensive GUI system, excellent documentation, Playground IDE.
- **Learning curve**: More linear than Three.js due to better docs. Heavier conceptual overhead (it is a full engine).
- **Best for**: Browser games, VR/AR, complex simulations, teams wanting an integrated solution.
- **Claude workflow fit**: Good. Well-documented API, TypeScript definitions help with correctness. Larger API surface to learn.

### Spline (spline.design)

- **Status**: Major growth in 2025-2026. AI features (Spell 3D World Model, Hana Canvas). Multi-platform.
- **Bundle size**: Runtime viewer ~100-200 KB. Scenes load as separate assets.
- **Strengths**: No-code 3D design in browser. Real-time collaboration. Web-native event system (hover, click, scroll). Exports to embed code, React component, or hosted URL. Mature Blender-to-Spline pipeline.
- **Limitations**: Proprietary. Output quality depends on their runtime. Limited programmatic control compared to Three.js.
- **Best for**: Designers creating interactive 3D elements. Marketing sites. Rapid prototyping.
- **Claude workflow fit**: Poor for creation (visual tool). Fine for embed integration code.

### cables.gl

- **Status**: Open source (NLnet funded). Node-based visual programming for WebGL.
- **Bundle size**: Exported projects vary. Runtime is lightweight.
- **Strengths**: Visual node-based editor. Real-time preview. Exports standalone embeddable code. Great for generative visuals, audio-reactive content, VR.
- **Limitations**: Small community. Node-based workflow is inherently visual.
- **Best for**: Creative coding, installations, audio-visual experiences.
- **Claude workflow fit**: Poor for creation (node-based GUI). Exported code can be integrated programmatically.

### Summary Table -- 3D Frameworks

| Framework | Type | Bundle | Best For | Claude-Friendly |
|-----------|------|--------|----------|-----------------|
| Three.js | Library | ~150 KB | Custom 3D, full control | Excellent |
| R3F | React wrapper | +20 KB | React 3D integration | Good |
| Babylon.js | Engine | ~300 KB+ | Games, VR/AR, simulations | Good |
| Spline | No-code tool | Runtime | Designer workflow, embeds | Integration only |
| cables.gl | Visual coding | Varies | Creative/generative | Integration only |

---

## 3. Shader / Generative Graphics

### ShaderToy Patterns + GLSL Integration

- **Approach**: ShaderToy (shadertoy.com) is the de facto community for fragment shader experimentation. Shaders port to Three.js via `ShaderMaterial` / `RawShaderMaterial` by mapping uniforms (`iTime` -> `u_time`, `iResolution` -> `u_resolution`, etc.).
- **WebGPU transition**: Three.js now offers TSL (Three Shader Language) -- a JS-based shader authoring system that compiles to both WGSL (WebGPU) and GLSL (WebGL). This is the recommended path for future-proofing. Compute shaders in WebGPU unlock 10-100x performance for particle systems.
- **Claude workflow fit**: Excellent. GLSL is text-based and well-suited to programmatic generation. ShaderToy's uniform conventions are standardized.

### p5.js

- **Status**: Mature creative coding framework. Huge educational community. WebGL mode supports custom shaders via `p5.Shader`.
- **Bundle size**: ~100 KB gzipped.
- **Strengths**: Beginner-friendly. Excellent for sketches, prototypes, generative art. Processing-style `setup()`/`draw()` loop. Active Genuary community (Genuary 2026 saw heavy participation).
- **Limitations**: Not performance-optimized for production. WebGL mode is less ergonomic than raw Three.js for complex work.
- **Claude workflow fit**: Excellent. Simple, well-documented API. Ideal for iterative creative coding -- generate a sketch, tweak parameters, repeat.

### canvas-sketch (mattdesl)

- **Status**: Stable but not actively developed. Created by Matt DesLauriers.
- **Strengths**: Professional creative coding toolkit. Built-in glslify support (import shaders from npm like `glsl-noise`). Hot reloading. Export to PNG, GIF, MP4. Integrates with regl for WebGL.
- **Limitations**: Niche community. Not a runtime library -- it is a development harness.
- **Claude workflow fit**: Good. Text-based shader files, JS configuration. But the workflow assumes a human running the dev server.

### Generative SVG Tools

- **Approach**: Libraries like `svg.js`, `paper.js`, or plain DOM manipulation for procedural SVG generation. Noise functions via `simplex-noise` npm package.
- **Strengths**: Resolution-independent output. SSR-compatible (SVGs can render server-side). Small bundle footprint.
- **Claude workflow fit**: Excellent. SVG is text/XML -- trivially generated and modified by code.

### Practical Recommendations

| Use Case | Tool | Notes |
|----------|------|-------|
| Procedural backgrounds | GLSL via Three.js ShaderMaterial | Noise textures, gradients, organic patterns |
| Particle systems | Three.js + compute shaders (WebGPU) or InstancedMesh (WebGL) | TSL for future-proofing |
| Generative SVG | Plain JS + simplex-noise | SSR-safe, resolution-independent |
| Prototyping / sketching | p5.js | Fastest iteration loop |
| Production generative art | Three.js + custom shaders | Best performance and control |

---

## 4. Scroll-Driven Animations

### CSS Scroll-Driven Animations (Native Spec)

- **Spec**: `animation-timeline: scroll()` and `animation-timeline: view()`. Scroll-Driven Animations Module Level 1.
- **Browser support (March 2026)**: Chrome 115+, Edge 115+, Safari 26+ (September 2025). Firefox: partial/in progress. Interop 2026 includes this as a focus area.
- **Strengths**: Runs off main thread. Zero JavaScript. GPU-accelerated. Progressive enhancement with `@supports (animation-timeline: view())`.
- **Limitations**: Limited to what CSS animations can express. No complex orchestration, conditional logic, or callback hooks.
- **Claude workflow fit**: Excellent. Pure CSS -- easy to generate and modify.

### GSAP ScrollTrigger

- **Status**: Now free (post-Webflow acquisition). The industry standard for JS scroll animation.
- **Bundle size**: ~10 KB gzipped (plugin, requires GSAP core).
- **Strengths**: Pin elements, scrub animations to scroll position, batch triggers, callbacks, markers for debugging. Works with any GSAP animation (timelines, morphs, text splits). ScrollSmoother (~26 KB) adds momentum scrolling.
- **Limitations**: ScrollSmoother can conflict with native sticky and Intersection Observer.
- **Claude workflow fit**: Excellent. Imperative JS config objects.

### Lenis

- **Status**: By Darkroom Engineering. 3 KB gzipped. The 2025-2026 industry standard for smooth/momentum scrolling.
- **Strengths**: Lightweight. Does not hijack the DOM or break native `position: sticky`. Does not interfere with Intersection Observer. Plays perfectly with GSAP ScrollTrigger. Configurable friction, duration, easing.
- **Best pattern**: Lenis for smooth scrolling + GSAP ScrollTrigger for scroll-linked animations. This is the dominant combination on award-winning sites.
- **Claude workflow fit**: Excellent. Minimal API, simple initialization.

### Locomotive Scroll

- **Status**: Declining. Developers are migrating to Lenis.
- **Problems**: Alters DOM structure, breaks CSS sticky, conflicts with ScrollTrigger, heavier than Lenis.
- **Recommendation**: Avoid for new projects. Use Lenis instead.

### Best Practice Stack (2026)

```
Lenis (smooth scroll, 3KB)
  + GSAP ScrollTrigger (scroll-linked animations)
  + CSS scroll-driven animations (simple parallax, fade-in)
  + @media (prefers-reduced-motion: reduce) { /* disable */ }
```

---

## 5. SVG Animation

### GSAP MorphSVG Plugin

- **Status**: Now free. The most capable SVG morphing solution.
- **Capabilities**: Morphs between paths with different point counts. Automatic cubic bezier conversion and subdivision. Control over morphing algorithm, rotation, and easing. Combines with GSAP timelines for sequenced morphs.
- **Claude workflow fit**: Excellent. Define source/target paths + GSAP config.

### GSAP DrawSVG Plugin

- **Status**: Now free.
- **Capabilities**: Animates SVG stroke drawing (the "line drawing" effect). Controls `stroke-dashoffset` and `stroke-dasharray` with precise percentage-based start/end values.
- **Claude workflow fit**: Excellent.

### Flubber

- **Status**: Maintained but less actively developed than GSAP plugins.
- **Bundle size**: ~12 KB gzipped.
- **Strengths**: Framework-agnostic SVG morphing. Works well with Motion (Framer Motion) and other declarative libraries. Interpolation function returns intermediate path strings.
- **Limitations**: Less control over morphing algorithm compared to GSAP MorphSVG. Can produce less smooth results on complex paths.
- **Claude workflow fit**: Good. Simple `interpolate(fromPath, toPath)` API.

### SVG Filter Effects

- **Approach**: Native SVG filters (`<feTurbulence>`, `<feDisplacementMap>`, `<feGaussianBlur>`, etc.) animated via CSS or JS.
- **Strengths**: Hardware-accelerated in modern browsers. No library needed. Can create noise textures, glow, distortion.
- **Limitations**: Performance can degrade with complex filter chains on large elements. Browser rendering inconsistencies.
- **Claude workflow fit**: Excellent. Pure SVG/CSS markup.

### Motion (SVG)

- **Status**: Built-in SVG path animation support.
- **Capabilities**: `pathLength`, line drawing, path morphing (via flubber integration), SVG filter animation.
- **Claude workflow fit**: Good in React/Vue context.

---

## 6. CSS-Native Animation Features

### View Transitions API

- **Same-document**: Baseline Newly Available (October 2025). Chrome 111+, Edge 111+, Firefox 133+, Safari 18+.
- **Cross-document**: Chrome 126+, Edge 126+, Safari 18.2+. Firefox: not yet. Interop 2026 focus area.
- **Capabilities**: Smooth animated transitions between DOM states (or page navigations) with `document.startViewTransition()`. Browser captures before/after snapshots and animates between them. `view-transition-name` and `view-transition-class` for targeting specific elements.
- **Claude workflow fit**: Excellent. Small amount of CSS + one JS call.

### @starting-style

- **Support**: Chrome 117+, Edge 117+, Safari 17.5+, Firefox 129+. Baseline Newly Available.
- **Capabilities**: Defines the initial style for CSS transitions when an element first appears (e.g., from `display: none`). Enables enter/exit animations without JavaScript.
- **Required companion**: `transition-behavior: allow-discrete` to transition discrete properties like `display`.
- **Claude workflow fit**: Excellent. Pure CSS.

### animation-timeline

- **Support**: Chrome 115+, Edge 115+, Safari 26+. Firefox in progress.
- **Values**: `scroll()` (scroll progress of a container), `view()` (element visibility in viewport).
- **Claude workflow fit**: Excellent. CSS property.

### Discrete Property Animations

- **What**: Ability to animate `display`, `visibility`, `content-visibility`, `mix-blend-mode`, and other discrete (non-interpolatable) properties.
- **How**: `transition-behavior: allow-discrete` + keyframe rules can now include `display` changes.
- **Support**: Chrome 116+, Edge 116+, Safari 17.5+, Firefox 129+.
- **Claude workflow fit**: Excellent. CSS property.

### overlay Property

- **What**: Controls top-layer behavior during animations (for dialogs, popovers).
- **Support**: Chrome 117+.

### What You Can Now Do Without JS (2026)

1. Animate elements entering the DOM (from `display: none`) -- `@starting-style`
2. Scroll-linked parallax, fade-in, progress bars -- `animation-timeline: scroll()/view()`
3. Page transitions (SPA and MPA) -- View Transitions API
4. Smooth entry/exit of dialogs and popovers -- `@starting-style` + `overlay`
5. Animate discrete properties -- `transition-behavior: allow-discrete`

Remaining JS-only territory: complex timeline orchestration, spring physics, gesture-driven animation, SVG morphing, conditional/interactive sequences.

---

## 7. Video / Media Integration

### Apple-Style Scroll-to-Video (Canvas Sequence)

- **Technique**: Pre-render a video as numbered image frames (e.g., `frame-001.jpg` through `frame-120.jpg`). Draw the current frame to a `<canvas>` element based on scroll position. GSAP ScrollTrigger is the standard orchestrator.
- **Performance considerations**: Image decoding is the bottleneck. Strategies:
  - Preload all frames (memory-heavy but smooth).
  - Use low-res thumbnails + swap to high-res on pause.
  - WebP/AVIF for smaller frame files.
  - `requestAnimationFrame` + scroll position for smooth rendering.
- **Alternative**: HTML5 `<video>` with `currentTime` scrubbed by scroll position. Simpler but jankier (video decode is not frame-accurate on all browsers).
- **Claude workflow fit**: Excellent. The GSAP + canvas pattern is well-documented and template-able.

### WebM / Video Integration Patterns

- **Transparent video**: WebM with alpha channel for overlay effects. Supported in Chrome, Edge, Firefox. Safari requires HEVC with alpha (MP4).
- **Autoplay**: `<video autoplay muted playsinline>` for background video. Must be muted for autoplay policy.
- **Intersection Observer**: Play/pause video based on viewport visibility.
- **Performance**: Use `loading="lazy"` patterns. Compress aggressively. Consider `<picture>`-like `<source>` elements for format negotiation.

### Canvas-Rendered Video

- **Approach**: Draw video frames to canvas for post-processing (color grading, masking, distortion, chroma key).
- **WebCodecs API**: Lower-level video frame access for advanced use cases. Growing support.
- **Claude workflow fit**: Good. Canvas API is imperative and well-suited to code generation.

### Modern Award-Winning Site Patterns (2026)

1. **Hero scroll sequence**: Pinned canvas + image frame sequence (Apple pattern)
2. **Ambient video backgrounds**: Muted WebM/MP4 loops with CSS `object-fit: cover`
3. **Video reveal on scroll**: ScrollTrigger + clip-path animation revealing video
4. **3D model + video texture**: Three.js with video as texture on geometry
5. **Split-screen video transitions**: View Transitions API + video elements

---

## Cross-Cutting Recommendations

### For a Claude-Driven Iterative Workflow

The following tools are best suited to programmatic generation and modification (no visual GUI required):

| Tier | Tools |
|------|-------|
| Ideal | GSAP (all plugins), anime.js v4, CSS-native features, GLSL shaders, SVG generation, p5.js, Three.js |
| Good | Motion (React/Vue), R3F, Flubber, Lenis, canvas-sketch |
| GUI-dependent | Spline, cables.gl, Theatre.js (editor), Lottie (authoring), After Effects |

### Recommended Default Stack (2026)

For a modern, high-performance animated website:

```
CSS-native:     @starting-style, animation-timeline, View Transitions
Scroll:         Lenis (3 KB) + GSAP ScrollTrigger (10 KB)
Animation:      GSAP core (23 KB) -- timelines, morphs, text
3D (if needed): Three.js + custom shaders (or R3F for React)
Generative:     GLSL fragment shaders via Three.js ShaderMaterial
SVG:            GSAP MorphSVG + DrawSVG (now free)
Video:          Canvas frame sequence + ScrollTrigger
```

Total JS overhead for animation layer: ~36 KB gzipped (Lenis + GSAP + ScrollTrigger) before 3D.

### Key 2025-2026 Shifts

1. **GSAP going free** is the single biggest change. Previously paid plugins (MorphSVG, SplitText, DrawSVG, ScrollSmoother) are now accessible to everyone. This removes the main argument for alternatives.
2. **Motion independence** from Framer, plus vanilla JS support, makes it a real GSAP alternative for the first time.
3. **CSS scroll-driven animations** reaching Safari (26+) makes progressive enhancement viable without polyfills.
4. **WebGPU** is now universal (Safari 26, September 2025). Three.js TSL provides the migration path from GLSL.
5. **Locomotive Scroll is dead** -- Lenis won definitively.
6. **View Transitions API** reaching cross-browser support enables native page transitions in MPAs.

---

## Sources

- [GSAP vs Motion: A detailed comparison](https://motion.dev/docs/gsap-vs-motion)
- [Comparing the best React animation libraries for 2026 - LogRocket](https://blog.logrocket.com/best-react-animation-libraries/)
- [GSAP vs Motion guide 2026](https://satishkumar.xyz/blogs/gsap-vs-motion-guide-2026)
- [Webflow makes GSAP 100% free](https://webflow.com/blog/gsap-becomes-free)
- [GSAP Standard License](https://gsap.com/community/standard-license/)
- [GSAP is now completely free - CSS-Tricks](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/)
- [Motion - JavaScript & React animation library](https://motion.dev/)
- [Framer Motion Becomes Independent: Introducing Motion](https://fireup.pro/news/framer-motion-becomes-independent-introducing-motion)
- [anime.js v4 - What's New](https://github.com/juliangarnier/anime/wiki/What's-new-in-Anime.js-V4)
- [anime.js Releases](https://github.com/juliangarnier/anime/releases)
- [Three.js vs Babylon.js vs PlayCanvas Comparison 2026](https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison)
- [Babylon.js vs React Three Fiber - Aircada](https://aircada.com/blog/babylon-js-vs-react-three-fiber)
- [Spline.design in 2026 Complete Guide](https://medium.com/@abhinav.dobhal/spline-design-in-2026-the-complete-guide-to-building-immersive-3d-web-experiences-without-code-097f475b3951)
- [cables.gl](https://cables.gl/)
- [CSS scroll-driven animations - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [What's new in View Transitions (2025) - Chrome Developers](https://developer.chrome.com/blog/view-transitions-in-2025)
- [Announcing Interop 2026 - WebKit](https://webkit.org/blog/17818/announcing-interop-2026/)
- [Mastering CSS Scroll Timeline 2026](https://dev.to/softheartengineer/mastering-css-scroll-timeline-a-complete-guide-to-animation-on-scroll-in-2025-3g7p)
- [@starting-style - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style)
- [CSS @starting-style Complete Guide 2026](https://devtoolbox.dedyn.io/blog/css-starting-style-guide)
- [Entry/exit animations - Chrome Developers](https://developer.chrome.com/blog/entry-exit-animations/)
- [Lenis - Smooth Scroll](https://lenis.darkroom.engineering/)
- [Smooth Scrolling Libraries Comparison](https://www.borndigital.be/blog/our-smooth-scrolling-libraries)
- [Best JavaScript Scroll Animation Libraries 2026](https://cssauthor.com/best-javascript-scroll-animation-scrollytelling-libraries/)
- [MorphSVG Plugin - GSAP](https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/)
- [SVG Animation Encyclopedia 2025](https://www.svgai.org/blog/research/svg-animation-encyclopedia-complete-guide)
- [From SplitText to MorphSVG - Codrops](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/)
- [Field Guide to TSL and WebGPU](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [Migrate Three.js to WebGPU 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- [Using ShaderToy Shaders in Three.js](https://felixrieseberg.com/using-webgl-shadertoy-shaders-in-three-js/)
- [p5.js](https://p5js.org/)
- [canvas-sketch WebGL docs](https://mattdesl.github.io/canvas-sketch/docs/webgl.html)
- [Apple-style scroll animations - CSS-Tricks](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)
- [Scroll sequence video animation guide 2026](https://scrollsequence.com/how-to-make-scroll-image-animation/)
- [Apple-style scroll animations with CSS view-timeline](https://www.builder.io/blog/view-timeline)
- [Theatre.js](https://www.theatrejs.com/)
- [Lottie-web - GitHub](https://github.com/airbnb/lottie-web)

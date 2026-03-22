# SVG Decorative Elements

Inline SVG decorative elements add visual richness to a page without external image dependencies. They are resolution-independent, token-driven, styleable with CSS, and animatable. Because they live in the DOM as code, they contribute zero additional network requests when inlined.

Use decorative SVGs for: section dividers, background textures, hero accent shapes, abstract compositions, subtle grid patterns, and geometric decorations. They bridge the gap between purely CSS-based visuals and full Canvas/WebGL generative art — more expressive than CSS, lighter than Canvas.

The pipeline provides a programmatic generator (`lib/svg-gen.js`) and a CLI (`bin/generate-svg.js`) that produce token-driven SVGs. The generator agent can also write SVG inline following the patterns below.

### CLI Quick Reference

```bash
# Generate all SVGs for a design (reads tokens.json for colors)
node bin/generate-svg.js designs/<name> --style=dark-luxury

# Generate specific types
node bin/generate-svg.js designs/<name> --type=wave-divider,blob,dot-grid

# List available types
node bin/generate-svg.js --list
```

### Shared CSS Contract

```
--color-bg-base          Base background color
--color-bg-surface       Surface/card background
--color-fg-base          Foreground text color
--color-accent-primary   Primary accent color
--color-accent-secondary Secondary accent color
```

### Shared Rules

- All decorative SVGs must have `aria-hidden="true"`
- Use design token colors — never hardcode color values
- Inline SVGs directly in HTML when under 2KB; use `<img>` with `.svg` file for larger ones
- Keep SVG output optimized: 2 decimal places max, no unnecessary attributes
- For animated SVGs, respect `prefers-reduced-motion: reduce` — pause or remove animations
- SVGs are `pointer-events: none` when used as background decoration
- Test at all three viewports: decorative elements must not cause overflow or layout shifts

### Style-to-Type Mapping

| Aesthetic | Recommended SVG Types |
|-----------|----------------------|
| dark-luxury | wave-divider, blob, rings, noise |
| brutalist | geometric-pattern, radial-burst, noise |
| glassmorphism | blob, rings, noise |
| editorial | dot-grid, wave-divider, abstract |
| organic | blob, wave-divider, dot-grid |
| cyberpunk | geometric-pattern, radial-burst, noise, rings |
| swiss | dot-grid, geometric-pattern |
| japanese-minimalism | dot-grid, rings |
| minimalist | dot-grid, wave-divider |
| maximalist | blob, abstract, geometric-pattern, noise, rings |

---

## wave-divider

**Complexity**: L
**Performance cost**: 1
**Dependencies**: none (inline SVG)

### Description

Multi-layer wave section dividers that create organic transitions between page sections. Multiple overlapping wave paths with different amplitudes produce a layered, dimensional effect. Used at the top or bottom of sections to replace hard horizontal lines.

### HTML Structure

```html
<!-- Top of section (waves flow down) -->
<div class="section-divider section-divider--top" aria-hidden="true">
  <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <path d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 V120 H0 Z"
          fill="var(--color-bg-surface)" opacity="0.7"/>
    <path d="M0,70 C360,30 720,110 1080,70 C1260,50 1380,90 1440,75 V120 H0 Z"
          fill="var(--color-bg-base)" opacity="0.85"/>
    <path d="M0,80 C180,60 540,100 900,75 C1200,55 1380,95 1440,85 V120 H0 Z"
          fill="var(--color-bg-base)"/>
  </svg>
</div>

<!-- Bottom of section (flip vertically) -->
<div class="section-divider section-divider--bottom" aria-hidden="true">
  <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <g transform="scale(1,-1) translate(0,-120)">
      <!-- Same paths as above -->
    </g>
  </svg>
</div>
```

### CSS Contract

```css
.section-divider {
  position: relative;
  width: 100%;
  line-height: 0; /* Remove inline spacing */
  overflow: hidden;
}

.section-divider svg {
  display: block;
  width: 100%;
  height: auto;
  min-height: 60px;
}

.section-divider--top {
  margin-bottom: -1px; /* Prevent subpixel gap */
}

.section-divider--bottom {
  margin-top: -1px;
}
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| viewBox height | Divider thickness | 60 (subtle) - 200 (dramatic) |
| Number of layers | Visual depth | 2 (simple) - 4 (rich) |
| Curve amplitude | Wave drama | 20% (gentle) - 50% (bold) of height |
| Segments per path | Curve complexity | 4 (smooth) - 8 (varied) |
| Layer opacity | Depth effect | Front: 1.0, Back: 0.5-0.7 |

### Accessibility

No special requirements — `aria-hidden="true"` and `preserveAspectRatio="none"` are sufficient. Waves are purely decorative and carry no semantic content.

### Implementation Notes

- Use `preserveAspectRatio="none"` so the wave stretches to fill any container width without distortion
- Build paths with cubic bezier curves (`C` command) for smooth transitions — avoid straight line segments
- The bottommost path should have `opacity="1"` and match the next section's background color exactly
- `line-height: 0` on the container prevents unwanted whitespace below the SVG
- For dynamic generation: `node bin/generate-svg.js designs/<name> --type=wave-divider`
- The `--seed` flag ensures identical output across regenerations

---

## blob

**Complexity**: L
**Performance cost**: 1
**Dependencies**: none (inline SVG)

### Description

Organic blob shapes created by perturbing radial control points around a circle and connecting them with smooth cubic bezier curves. Used as background accent shapes, hero decorations, or floating visual elements. Can be animated with CSS for gentle morphing.

### HTML Structure

```html
<!-- Background decoration -->
<div class="blob-decoration" aria-hidden="true">
  <svg class="blob blob--accent" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <path d="M200,60 C260,55 340,120 330,200 C320,280 260,345 200,340 C140,335 60,280 70,200 C80,120 140,65 200,60"
          fill="var(--color-accent-primary)"/>
  </svg>
</div>
```

### CSS Contract

```css
.blob-decoration {
  position: absolute;
  pointer-events: none;
  z-index: 0;
}

.blob {
  width: 300px;
  height: 300px;
  opacity: 0.15;
  filter: blur(40px); /* Soft edges */
}

.blob--accent {
  fill: var(--color-accent-primary);
}

/* Optional: gentle float animation */
.blob--animated {
  animation: blob-float 20s ease-in-out infinite alternate;
}

@keyframes blob-float {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -15px) scale(1.05); }
  100% { transform: translate(-10px, 10px) scale(0.95); }
}

@media (prefers-reduced-motion: reduce) {
  .blob--animated { animation: none; }
}
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `points` | Shape complexity | 4 (simple) - 10 (complex) |
| `variance` | Irregularity | 0.1 (near-circle) - 0.5 (wild) |
| `filter: blur()` | Edge softness | 0 (crisp) - 80px (ambient glow) |
| `opacity` | Visibility | 0.05 (ghost) - 0.3 (prominent) |
| `size` | Scale | 200px (small accent) - 600px (hero background) |

### Algorithm

1. Place N points equally around a circle in polar coordinates
2. Perturb each radius by `variance * random`
3. Smooth adjacent radii to prevent sharp spikes
4. Convert to Cartesian, connect with cubic bezier curves maintaining C1 continuity
5. Control point handles are tangent to the curve at each vertex

### Implementation Notes

- Apply `filter: blur()` for ambient background blobs — the blur hides imperfections and creates a soft glow
- For crisp decorative shapes (editorial, swiss), skip the blur and use `stroke` instead of or in addition to `fill`
- Multiple blobs at different sizes and positions create depth
- CSS `d: path()` animation can morph between blob shapes (see `morphing-blobs` generative art pattern)
- For generation: `node bin/generate-svg.js designs/<name> --type=blob`

---

## geometric-pattern

**Complexity**: L
**Performance cost**: 1
**Dependencies**: none (inline SVG)

### Description

Repeating geometric patterns using SVG `<pattern>` tiles. A single tile is defined once and repeated across any area. Available shapes: hexagon, triangle, circle, diamond, cross, line. Used as subtle background textures or section overlays.

### HTML Structure

```html
<svg class="geo-overlay" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <pattern id="hex-pattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
      <polygon points="30,4 53,17 53,43 30,56 7,43 7,17"
               fill="var(--color-fg-base)"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#hex-pattern)" opacity="0.08"/>
</svg>
```

### CSS Contract

```css
.geo-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
```

### Available Shapes

| Shape | Visual | Best For |
|-------|--------|----------|
| `hexagon` | Pointy-top hexagonal grid | Tech, scientific, cyberpunk |
| `triangle` | Equilateral triangle rows | Geometric, modern |
| `circle` | Regular dot grid | Minimal, editorial |
| `diamond` | Rotated squares | Art deco, retro |
| `cross` | Plus signs | Swiss, medical, structured |
| `line` | Horizontal stripes | Minimal, editorial |

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `cellSize` | Pattern tile size | 20 (dense) - 80 (sparse) |
| `gap` | Space between shapes | 2 (tight) - 12 (airy) |
| `opacity` | Pattern visibility | 0.03 (barely visible) - 0.2 (prominent) |
| `fill` vs `stroke` | Solid vs outline shapes | Solid for texture, outline for grids |

### Implementation Notes

- Keep `opacity` very low (0.03-0.12) — geometric patterns are meant to add subtle texture, not compete with content
- `patternUnits="userSpaceOnUse"` gives pixel-level control over tile size
- For responsive patterns, set the SVG to `width: 100%; height: 100%` and let the pattern tile naturally
- Unique `id` on `<pattern>` is required when multiple patterns exist on the same page
- For generation: `node bin/generate-svg.js designs/<name> --type=geometric-pattern`

---

## dot-grid

**Complexity**: L
**Performance cost**: 1
**Dependencies**: none (inline SVG)

### Description

A grid of small dots — the quintessential subtle background texture. Dots can be uniform, randomly varied, or sized with radial falloff (larger at center, smaller at edges). A slight position jitter adds organic warmth. Works with any aesthetic but particularly effective for editorial, swiss, and minimalist styles.

### HTML Structure

```html
<svg class="dot-grid-bg" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g fill="var(--color-fg-base)" opacity="0.15">
    <circle cx="24" cy="24" r="1.5"/>
    <circle cx="48" cy="24" r="1.5"/>
    <!-- ... grid continues -->
  </g>
</svg>
```

### CSS Contract

```css
.dot-grid-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `spacing` | Distance between dots | 16 (dense) - 40 (sparse) |
| `minRadius` / `maxRadius` | Dot size range | 0.5-1 (subtle) to 2-4 (prominent) |
| `opacity` | Overall visibility | 0.08 (ghost) - 0.25 (visible) |
| `radialFalloff` | Size gradient from center | Creates depth/focus effect |
| `randomSize` | Random dot sizes | Organic, hand-placed feel |

### Accessibility

Purely decorative — `aria-hidden="true"` only.

### Implementation Notes

- Dot grids can produce many elements (a 800x600 grid at 24px spacing = ~600 circles). For very large grids, consider using an SVG `<pattern>` with a single dot tile instead
- The position jitter (±15% of spacing) prevents the grid from looking too mechanical
- `radialFalloff` creates a natural vignette effect — dots are largest and most visible at center, fading toward edges
- For generation: `node bin/generate-svg.js designs/<name> --type=dot-grid`

---

## abstract

**Complexity**: L-M
**Performance cost**: 1
**Dependencies**: none (inline SVG)

### Description

An abstract composition of circles, arcs, lines, and concentric rings placed randomly within a viewBox. Creates a unique, artistic backdrop for hero sections or feature areas. Each generation with a different seed produces a different composition while maintaining consistent aesthetic feel through token colors.

### HTML Structure

```html
<svg class="abstract-bg" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="120" cy="340" r="85" fill="var(--color-accent-primary)" opacity="0.12"/>
  <path d="M400,200 A60,60 0 1 1 450,280" fill="none"
        stroke="var(--color-accent-secondary)" stroke-width="1.5" opacity="0.15"/>
  <line x1="600" y1="100" x2="700" y2="300"
        stroke="var(--color-fg-base)" stroke-width="0.8" opacity="0.1"/>
  <!-- ... more elements -->
</svg>
```

### Element Types

| Type | Weight | Visual Role |
|------|--------|-------------|
| Filled circle | 35% | Anchor points, color blocks |
| Stroked circle | - | (variant of above) |
| Arc | 25% | Movement, connection, rhythm |
| Line | 20% | Direction, structure |
| Concentric ring pair | 20% | Focus, echo, depth |

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `elements` | Composition density | 8 (sparse) - 25 (rich) |
| `opacityRange` | Element transparency | [0.03, 0.15] (subtle) - [0.1, 0.3] (bold) |
| `colors` | Palette | 2-4 colors from design tokens |

### Implementation Notes

- Lower opacity ranges (0.03-0.15) keep compositions atmospheric; higher ranges make them assertive
- Seed-based generation means compositions can be regenerated identically or varied by changing the seed
- Mix filled and stroked elements for visual variety
- For generation: `node bin/generate-svg.js designs/<name> --type=abstract`

---

## noise

**Complexity**: L
**Performance cost**: 1
**Dependencies**: svg-filter

### Description

An SVG `feTurbulence`-based noise texture for film grain overlays. Produces the same effect as the `grain-noise` background pattern but as a standalone, reusable SVG asset. Can be applied as a tiling background image via CSS.

### Inline Usage

```html
<svg class="noise-overlay" aria-hidden="true">
  <filter id="noise-filter">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#noise-filter)" opacity="0.4"/>
</svg>
```

### CSS Background Usage

```css
.grain-overlay {
  background-image: url('assets/svg/noise-texture.svg');
  background-repeat: repeat;
  mix-blend-mode: overlay;
  opacity: 0.3;
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100; /* Above content for overlay effect */
}
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `baseFrequency` | Grain size | 0.5 (coarse) - 0.8 (fine) |
| `numOctaves` | Detail layers | 1 (simple) - 4 (detailed) |
| `opacity` | Intensity | 0.2 (subtle) - 0.5 (heavy) |
| `type` | Noise character | `fractalNoise` (natural), `turbulence` (structured) |

### Implementation Notes

- For generation: `node bin/generate-svg.js designs/<name> --type=noise`
- When used as tiling background, generate at 200x200px for good balance of file size and pattern variety
- `stitchTiles="stitch"` ensures seamless tiling

---

## rings

**Complexity**: L
**Performance cost**: 1
**Dependencies**: none (inline SVG)

### Description

Concentric rings radiating from a point with gradually decreasing opacity and stroke width. Creates a sonar/ripple effect. Can be offset from center for asymmetric compositions. Optional dashed strokes add rhythm.

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `rings` | Number of circles | 4 (minimal) - 12 (dense) |
| `centerX/Y` | Ring center (normalized) | 0.0-1.0 (corner to corner) |
| `dashed` | Stroke style | `false` (solid) or `true` (dashed with proportional gaps) |
| `opacity` | Base opacity (fades per ring) | 0.1 (ghost) - 0.3 (visible) |

### Implementation Notes

- Off-center placement (e.g., `centerX: 0.2, centerY: 0.3`) creates more dynamic compositions
- Combine with a blob at the center point for a focal anchor
- For generation: `node bin/generate-svg.js designs/<name> --type=rings`

---

## radial-burst

**Complexity**: L
**Performance cost**: 1
**Dependencies**: none (inline SVG)

### Description

Lines radiating from a center point outward, like a starburst or sunray pattern. Ray lengths and angles have slight random variation to avoid mechanical uniformity. Used as dramatic hero decorations or subtle section accents at very low opacity.

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `rays` | Number of lines | 12 (sparse) - 48 (dense) |
| `innerRadius` | Start distance (normalized) | 0 (from center) - 0.3 (ring of rays) |
| `opacity` | Ray visibility | 0.05 (subtle) - 0.2 (prominent) |
| `strokeWidth` | Line thickness | 0.5 (hairline) - 3 (bold) |

### Implementation Notes

- At very low ray counts (8-12) and higher opacity, creates art deco sunburst effects
- At high ray counts (36+) and low opacity, creates subtle texture
- Combine with concentric rings for a target/radar aesthetic
- For generation: `node bin/generate-svg.js designs/<name> --type=radial-burst`

---

## Composing Multiple SVG Elements

The most effective decorative treatments combine 2-3 SVG types:

### Hero Section Example
```
blob (large, blurred, accent color, low opacity)
  + radial-burst (centered on blob, very low opacity)
  + noise (overlay, 0.2 opacity)
```

### Section Transition Example
```
wave-divider (top of section)
  + dot-grid (section background)
  + wave-divider (bottom, flipped)
```

### Editorial Feature Example
```
abstract (positioned behind feature content)
  + geometric-pattern (subtle overlay across full section)
```

### Integration with Generated Code

The SVG generator writes files to `designs/<name>/assets/svg/`. The generator agent can then:

1. **Inline small SVGs** directly in `index.html` (recommended for < 2KB)
2. **Reference larger SVGs** via `<img src="assets/svg/name.svg">` or CSS `background-image`
3. **Animate SVGs** with CSS keyframes (transform, opacity, d: path() for morphing)
4. **Layer SVGs** using absolute positioning and z-index stacking

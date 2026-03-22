# Generative Art Backgrounds

Generative art backgrounds produce unique, procedural visuals that run in the browser — every page load can be subtly different, or deterministic with a seed. These use vanilla Canvas 2D (no dependencies) or pure CSS/SVG, making them lighter than the WebGL/Three.js shader approaches documented in `backgrounds.md`.

Choose generative art when you want: organic movement, interactive cursor response, unique visual identity per design, or effects that feel alive without the weight of a 3D engine. For heavier effects (shader noise, fluid simulation, particle fields with 500+ particles), see `backgrounds.md`.

The pipeline provides a code generator (`lib/generative-art.js`) and CLI (`bin/generate-art.js`) that produce embeddable `{ html, css, js }` snippets. The generator agent can also compose these effects from scratch following the patterns below.

### CLI Quick Reference

```bash
# Generate art for a design based on aesthetic style
node bin/generate-art.js designs/<name> --style=dark-luxury

# Generate specific types
node bin/generate-art.js designs/<name> --type=flow-field,morphing-blobs

# Preview generated code (stdout)
node bin/generate-art.js designs/<name> --type=flow-field --stdout

# List available types
node bin/generate-art.js --list
```

### Shared CSS Contract

```
--color-bg-base          Base background (used for trail fading, fills)
--color-bg-surface       Surface variant (used for mesh gradients)
--color-fg-base          Foreground (used for particles, lines)
--color-accent-primary   Primary accent (used for highlighted elements)
--color-accent-secondary Secondary accent (used for blobs, gradients)
```

### Shared Rules

- All canvas/container elements are `aria-hidden="true"` and `pointer-events: none`
- Position with `position: fixed; inset: 0; z-index: -1`
- `prefers-reduced-motion: reduce`: render one static frame, then stop the animation loop
- Read colors from CSS custom properties (not hardcoded) so they adapt to token changes
- Cap `devicePixelRatio` at 2 to prevent GPU overload on high-DPI displays
- Handle window resize — update canvas dimensions and re-initialize if needed
- Use IIFE scoping so the JS coexists with GSAP, Lenis, and other pipeline scripts
- All effects include an inline Perlin noise implementation (no external dependencies)
- Page must be readable and functional with the canvas removed (progressive enhancement)

### Style-to-Type Mapping

| Aesthetic | Recommended Art Types |
|-----------|----------------------|
| dark-luxury | morphing-blobs, flow-field |
| brutalist | geometric-mesh, noise-gradient |
| glassmorphism | morphing-blobs, particle-constellation |
| editorial | flow-field, wave-landscape |
| organic | morphing-blobs, flow-field |
| cyberpunk | particle-constellation, geometric-mesh |
| swiss | geometric-mesh |
| japanese-minimalism | wave-landscape |
| retro-futurism | geometric-mesh, wave-landscape |
| minimalist | wave-landscape |
| maximalist | flow-field, particle-constellation, morphing-blobs |
| corporate-clean | particle-constellation |
| handcrafted | morphing-blobs, flow-field |

---

## flow-field

**Complexity**: M
**Performance cost**: 2
**Dependencies**: canvas-2d

### Description

Particles trace paths through a 2D Perlin noise vector field, leaving colored trails that reveal the underlying flow structure. The result is organic, river-like patterns that evolve slowly over time. One of the most visually striking generative techniques for the computational cost.

### HTML Structure

```html
<canvas id="flow-field" class="gen-art-canvas" aria-hidden="true"></canvas>
```

### CSS

```css
#flow-field {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  width: 100%;
  height: 100%;
}
```

### JavaScript Pattern

```javascript
(function() {
  'use strict';
  const canvas = document.getElementById('flow-field');
  const ctx = canvas.getContext('2d');

  // ... inline Perlin noise implementation ...
  // ... prefers-reduced-motion check ...
  // ... CSS color reader ...

  const PARTICLE_COUNT = 800;
  const NOISE_SCALE = 0.003;
  const SPEED = 1.5;
  const TRAIL_ALPHA = 0.02; // Controls trail length

  // Initialize particles at random positions
  const particles = Array.from({ length: PARTICLE_COUNT },
    () => ({ x: Math.random() * W, y: Math.random() * H }));

  function draw() {
    // Fade: semi-transparent fill over existing trails
    ctx.fillStyle = bgColor;
    ctx.globalAlpha = TRAIL_ALPHA;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // Move each particle along the noise field
    ctx.strokeStyle = accentColor;
    for (const p of particles) {
      const angle = noise2D(p.x * NOISE_SCALE, p.y * NOISE_SCALE + t) * Math.PI * 4;
      const prevX = p.x, prevY = p.y;
      p.x += Math.cos(angle) * SPEED;
      p.y += Math.sin(angle) * SPEED;

      // Wrap around edges
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
      } else {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
    t += 0.0003;
    requestAnimationFrame(draw);
  }
})();
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `particleCount` | Trail density | 200 (sparse) - 1500 (dense) |
| `noiseScale` | Flow cell size | 0.001 (large swirls) - 0.01 (tight curls) |
| `speed` | Particle velocity | 0.5 (lazy) - 3.0 (energetic) |
| `trailAlpha` | Trail persistence | 0.01 (long trails) - 0.1 (short trails) |
| `lineWidth` | Stroke thickness | 0.5 (delicate) - 2 (bold) |
| `t increment` | Field evolution speed | 0.0001 (frozen) - 0.001 (shifting) |

### Visual Characteristics

- **Low noiseScale + low speed**: gentle, river-like streams
- **High noiseScale + high speed**: chaotic, wind-like turbulence
- **Low trailAlpha**: long, luminous trails (good for dark-luxury)
- **High trailAlpha**: short dashes, more dynamic feel

### Accessibility

- `prefers-reduced-motion: reduce`: Draw a single static snapshot (200 particles traced 40 steps each) and stop. The static image shows the flow field structure without animation.

### Implementation Notes

- The trail effect works by repeatedly drawing a semi-transparent background rectangle. Lower alpha = longer trails. This is more performant than storing and redrawing trail histories.
- Color is read once from CSS custom properties at initialization. If tokens change dynamically, re-read on a debounced interval.
- For generation: `node bin/generate-art.js designs/<name> --type=flow-field`

---

## noise-gradient

**Complexity**: M
**Performance cost**: 2
**Dependencies**: canvas-2d

### Description

An animated gradient where color transitions are driven by Perlin noise rather than linear interpolation. Produces organic, cloud-like color fields that shift slowly. The canvas renders at reduced resolution (1 pixel per 4px) and CSS scaling with `image-rendering: auto` naturally smooths the result.

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `scale` | Noise frequency | 0.002 (large blobs) - 0.01 (fine texture) |
| `speed` | Animation speed | 0.0002 (glacial) - 0.002 (active) |
| `pixelSize` | Render resolution | 2 (sharp, expensive) - 8 (chunky, fast) |
| Colors | Palette (3-point gradient) | Read from `--color-bg-base`, `--color-accent-primary`, `--color-accent-secondary` |

### Visual Characteristics

- **Low scale + low speed**: vast, slowly drifting color fields (ambient, meditative)
- **Higher scale**: more detailed, cloud-like texture
- **pixelSize=2**: nearly full-resolution, expensive but smooth
- **pixelSize=8**: visible pixel grid, retro/digital aesthetic

### Accessibility

- `prefers-reduced-motion: reduce`: Render one static frame.

### Implementation Notes

- The per-pixel approach iterates `cols * rows` pixels each frame. At pixelSize=4 on a 1440x900 viewport, that is 360 * 225 = 81,000 noise evaluations per frame — acceptable at 60fps
- Uses `createImageData` for direct pixel manipulation, which is faster than individual `fillRect` calls
- For generation: `node bin/generate-art.js designs/<name> --type=noise-gradient`

---

## particle-constellation

**Complexity**: M
**Performance cost**: 2
**Dependencies**: canvas-2d

### Description

Floating particles connected by lines when within a threshold distance. Near the cursor, particles create additional connections in the accent color, producing a constellation/network effect. The classic "connected dots" background popular on tech and portfolio sites.

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `particleCount` | Dot density | 60 (sparse) - 200 (dense) |
| `connectionDistance` | Line threshold | 80 (tight clusters) - 180 (web-like) |
| `particleSize` | Dot radius | 1 (subtle) - 3 (prominent) |
| `speed` | Drift velocity | 0.1 (still) - 0.8 (active) |
| Cursor connection range | Mouse influence | 1.5x connectionDistance |

### Performance Notes

- Connection checking is O(n²). At 120 particles, that is 7,140 distance checks per frame — fine
- At 200 particles, that is 19,900 checks — still acceptable
- Beyond 250 particles, consider spatial partitioning or reducing connectionDistance

### Visual Characteristics

- Foreground-colored particles + connections create a neutral network
- Accent-colored cursor connections highlight interactivity
- Works on any background color

### Accessibility

- `prefers-reduced-motion: reduce`: Draw particles and connections in a static snapshot. No drift, no cursor interaction.
- Touch devices: cursor connections are disabled (mouseX/Y stay off-screen)

### Implementation Notes

- For generation: `node bin/generate-art.js designs/<name> --type=particle-constellation`

---

## geometric-mesh

**Complexity**: M
**Performance cost**: 2
**Dependencies**: canvas-2d

### Description

A grid of points, jittered from their base positions, triangulated into a mesh. The mesh slowly undulates via sine-wave displacement, creating a low-poly geometric surface. Triangles are filled with colors that vary by position, producing a gradient across the grid.

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `cols` / `rows` | Grid density | 6x4 (coarse) - 20x14 (fine) |
| `jitter` | Position randomness | 0.1 (structured) - 0.6 (organic) |
| `waveSpeed` | Undulation speed | 0.0005 (subtle) - 0.003 (active) |
| `waveAmplitude` | Displacement amount | 5 (gentle) - 30 (dramatic) |

### Visual Characteristics

- **Low jitter + low amplitude**: subtle, corporate geometric texture
- **High jitter + high amplitude**: dynamic, expressive surface
- **Few cols/rows**: large triangles, bold low-poly look
- **Many cols/rows**: fine mesh, near-continuous gradient

### Accessibility

- `prefers-reduced-motion: reduce`: Render one frame of the mesh and stop. The static mesh still looks good.

### Implementation Notes

- Triangle fill colors interpolate between `--color-bg-base`, `--color-bg-surface`, and a touch of `--color-accent-primary` based on grid position
- Triangle edges are stroked in accent color at very low opacity (0.06) for definition
- For generation: `node bin/generate-art.js designs/<name> --type=geometric-mesh`

---

## morphing-blobs

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css + svg (no JS needed)

### Description

Animated organic blob shapes that morph between random forms using CSS `d: path()` animation. The blobs are rendered as SVG paths with heavy blur filters, creating ambient color clouds. This is the lightest generative effect — pure CSS animation with no JavaScript or Canvas.

### HTML Structure

```html
<div class="morphing-blobs" aria-hidden="true">
  <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <path class="morphing-blobs__blob morphing-blobs__blob--0"
          d="M300,120 C350,110 ..." transform="translate(-20, 30)"/>
    <path class="morphing-blobs__blob morphing-blobs__blob--1"
          d="M300,140 C340,125 ..." transform="translate(40, -15)"/>
    <path class="morphing-blobs__blob morphing-blobs__blob--2"
          d="M300,130 C360,120 ..." transform="translate(-10, 50)"/>
  </svg>
</div>
```

### CSS Pattern

```css
.morphing-blobs {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.morphing-blobs svg {
  width: 100%;
  height: 100%;
}

.morphing-blobs__blob--0 {
  fill: var(--color-accent-primary);
  opacity: 0.3;
  filter: blur(40px);
  animation: morph-0 20s ease-in-out infinite alternate;
}

@keyframes morph-0 {
  0%   { d: path("M300,120 C350,110 ..."); }
  33%  { d: path("M300,140 C340,125 ..."); }
  66%  { d: path("M300,130 C360,120 ..."); }
  100% { d: path("M300,150 C345,115 ..."); }
}

@media (prefers-reduced-motion: reduce) {
  .morphing-blobs__blob { animation: none !important; }
}
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `blobCount` | Number of blob layers | 2 (simple) - 4 (rich) |
| `points` | Blob complexity | 4 (smooth) - 8 (complex) |
| `filter: blur()` | Edge softness | 30px (defined) - 80px (ambient) |
| `opacity` | Layer visibility | 0.15 (subtle) - 0.4 (prominent) |
| `duration` | Morph cycle | 15s (active) - 30s (glacial) |

### Visual Characteristics

- Multiple blobs with different colors, sizes, and animation timings create depth
- The `transform="translate(x, y)"` on each blob offsets them for asymmetric compositions
- `filter: blur()` is the key — without it, blobs look like amoebas; with it, they look like light or fog
- `alternate` animation direction prevents visible loop discontinuity

### Accessibility

- `prefers-reduced-motion: reduce`: CSS disables all animations. Static blobs remain visible as colored shapes.

### Implementation Notes

- CSS `d: path()` animation requires the same number and type of path commands in each keyframe
- The blob generator ensures all keyframe paths use the same number of control points
- Browser support: `d: path()` animation works in Chrome 89+, Safari 15.4+, Firefox 97+
- This is the recommended first choice for ambient backgrounds — lowest cost, no JS, no Canvas
- For generation: `node bin/generate-art.js designs/<name> --type=morphing-blobs`

---

## wave-landscape

**Complexity**: M
**Performance cost**: 2
**Dependencies**: canvas-2d

### Description

Horizontal wave lines drawn with Perlin noise displacement, stacked with perspective foreshortening to create a 3D terrain/landscape effect. Back lines are thinner, less opaque, and closer together. The effect resembles a topographic map or digital terrain visualization.

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `lineCount` | Terrain detail | 20 (sparse) - 60 (dense) |
| `pointsPerLine` | Line smoothness | 40 (angular) - 120 (smooth) |
| `amplitude` | Wave height | 10 (gentle) - 50 (dramatic) |
| `speed` | Wave evolution | 0.005 (slow) - 0.03 (dynamic) |
| `perspective` | Depth compression | 0.3 (flat) - 0.8 (deep perspective) |

### Visual Characteristics

- Accent-colored lines on dark background create a wireframe terrain
- Higher perspective values compress back lines closer together, creating more dramatic depth
- Multi-octave noise (2 octaves) creates natural wave shapes with detail variation
- Lines positioned in the lower 60% of the viewport, leaving space for content above

### Accessibility

- `prefers-reduced-motion: reduce`: Render one frame and stop.

### Implementation Notes

- Each line is drawn as a single continuous path with `moveTo` + `lineTo` — simple and fast
- Back lines are drawn first (painter's algorithm), front lines drawn on top
- Perspective is achieved by varying: y-position (compressed), opacity (fading), lineWidth (thinning), and amplitude (reducing) as lines go "further away"
- For generation: `node bin/generate-art.js designs/<name> --type=wave-landscape`

---

## Composing Generative Art with SVG Decorations

Generative art backgrounds work best when layered with other visual elements:

### Layering Order (back to front)

1. **Generative art canvas** (`z-index: -1`) — flow-field, noise-gradient, or morphing-blobs
2. **SVG decorative elements** (`z-index: 0, opacity: 0.05-0.15`) — dot-grid, geometric-pattern
3. **SVG grain overlay** (`z-index: 100, mix-blend-mode: overlay`) — noise texture
4. **Content** (`z-index: auto`) — text, images, interactive elements

### Recommended Pairings

| Generative Art | + SVG Layer | Result |
|----------------|-------------|--------|
| flow-field | + noise overlay | Organic trails with analog texture |
| morphing-blobs | + dot-grid | Ambient color + subtle structure |
| geometric-mesh | + noise overlay | Low-poly surface with grain |
| particle-constellation | + radial-burst (behind) | Particle network with depth |
| wave-landscape | + wave-divider (sections) | Cohesive topographic theme |

### Integration in the Generator Workflow

1. Generator creates `tokens.json`
2. `node bin/generate-svg.js` produces SVG assets
3. `node bin/generate-art.js` produces art code snippets
4. Generator reads the art JSON from `assets/art/<name>.json`
5. Generator embeds `html` in `index.html`, `css` in `style.css`, `js` in `script.js`
6. SVG assets are either inlined or referenced from `assets/svg/`
7. Validation pipeline checks the complete page

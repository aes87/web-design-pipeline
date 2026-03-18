# Background Effects

Background effects create atmosphere, depth, and texture without competing with content. They operate in the background layer -- literally behind everything else -- and their job is to make the page feel alive, tactile, or immersive without demanding attention.

The six patterns here span from CSS-only (grain-noise, gradient-mesh) to full WebGL (shader-noise, particle-field, fluid-simulation, aurora). Choose based on the brief's performance budget and aesthetic requirements.

### Shared CSS Contract

```
--color-bg-base          Base background color
--color-bg-alt           Alternate section background
--color-accent           Accent color for gradient/effect highlights
--bg-effect-opacity      Global opacity for background effects (0.3-1.0)
--z-bg-effect            z-index for background layer (0 or -1)
```

### Shared Rules

- Background effects are always `aria-hidden="true"` and `pointer-events: none`
- They sit behind content via z-index or DOM order
- `prefers-reduced-motion: reduce`: static snapshot or disabled entirely
- Performance: monitor GPU memory usage. Background effects that run continuously consume battery.
- Progressive enhancement: the page must look complete with just `--color-bg-base`. Effects are a visual bonus.

---

## grain-noise

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css + svg-filter

### Description

A film grain texture overlay that adds analog warmth and tactility to digital surfaces. The grain is generated via SVG `feTurbulence` filter and composited using `mix-blend-mode`. It can be static (single frame) or animated (shifting noise pattern).

### Implementation: SVG Filter

```html
<svg class="grain-filter" aria-hidden="true">
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
    <feColorMatrix type="saturate" values="0" />
  </filter>
</svg>
```

### CSS Application

```css
.grain-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg-effect);
  pointer-events: none;
  opacity: var(--bg-effect-opacity, 0.4);
  mix-blend-mode: overlay; /* or multiply, soft-light */
}

/* Method 1: SVG filter reference */
.grain-overlay::after {
  content: '';
  position: absolute;
  inset: -50%; /* oversized to prevent edge artifacts during animation */
  filter: url(#grain);
  opacity: 0.5;
}

/* Method 2: Inline SVG as background */
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
}
```

### Animated Grain

```css
@keyframes grain-shift {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  30% { transform: translate(3%, -15%); }
  50% { transform: translate(12%, 9%); }
  70% { transform: translate(9%, 4%); }
  90% { transform: translate(-1%, 7%); }
}

.grain-overlay::after {
  animation: grain-shift 0.5s steps(6) infinite;
}
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `baseFrequency` | Grain size | 0.5 (coarse) - 0.8 (fine) |
| `numOctaves` | Detail layers | 1 (simple) - 4 (detailed) |
| `opacity` | Grain intensity | 0.2 (subtle) - 0.6 (heavy) |
| `mix-blend-mode` | How grain composites | `overlay`, `multiply`, `soft-light` |

### Accessibility

- `prefers-reduced-motion: reduce`: Stop the grain animation (`animation-play-state: paused`). Static grain is fine.
- Grain at high opacity can reduce text readability. Keep opacity under 0.5 on sections with body text.

### Implementation Notes

- **Performance**: SVG filters are CPU-rendered and can be expensive on large viewports. Two mitigations:
  1. Use a pre-rendered grain image (WebP, 512x512, tiled) instead of live SVG filter. Much lighter.
  2. Limit the animated grain to the hero section, use static grain elsewhere.
- The oversized pseudo-element (`inset: -50%`) with `overflow: hidden` on the parent prevents visible edges during animation translation.
- `fractalNoise` produces a more natural grain than `turbulence` (which has a more structured, wavy pattern).
- Grain works on any background color but is most visible on medium tones. On pure black or pure white, grain effect is diminished.

---

## gradient-mesh

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

An animated multi-point gradient that simulates a mesh gradient. Multiple overlapping `radial-gradient` layers with `@property`-animated color stops and positions create a living, breathing color field. Pure CSS, no JavaScript.

### CSS Implementation

```css
@property --gx1 { syntax: "<percentage>"; inherits: false; initial-value: 20%; }
@property --gy1 { syntax: "<percentage>"; inherits: false; initial-value: 30%; }
@property --gx2 { syntax: "<percentage>"; inherits: false; initial-value: 70%; }
@property --gy2 { syntax: "<percentage>"; inherits: false; initial-value: 60%; }
@property --gc1 { syntax: "<color>"; inherits: false; initial-value: oklch(0.6 0.15 250); }
@property --gc2 { syntax: "<color>"; inherits: false; initial-value: oklch(0.5 0.2 310); }
@property --gc3 { syntax: "<color>"; inherits: false; initial-value: oklch(0.7 0.1 180); }

.gradient-mesh {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg-effect);
  pointer-events: none;

  background:
    radial-gradient(ellipse 50% 50% at var(--gx1) var(--gy1), var(--gc1), transparent 70%),
    radial-gradient(ellipse 60% 40% at var(--gx2) var(--gy2), var(--gc2), transparent 60%),
    radial-gradient(ellipse 40% 60% at 50% 80%, var(--gc3), transparent 65%),
    var(--color-bg-base);

  animation: mesh-drift 15s ease-in-out infinite alternate;
}

@keyframes mesh-drift {
  0% {
    --gx1: 20%; --gy1: 30%;
    --gx2: 70%; --gy2: 60%;
    --gc1: oklch(0.6 0.15 250);
    --gc2: oklch(0.5 0.2 310);
  }
  33% {
    --gx1: 60%; --gy1: 20%;
    --gx2: 30%; --gy2: 70%;
    --gc1: oklch(0.55 0.18 280);
    --gc2: oklch(0.6 0.15 340);
  }
  66% {
    --gx1: 40%; --gy1: 70%;
    --gx2: 80%; --gy2: 30%;
    --gc1: oklch(0.65 0.12 220);
    --gc2: oklch(0.45 0.22 290);
  }
  100% {
    --gx1: 80%; --gy1: 50%;
    --gx2: 20%; --gy2: 40%;
    --gc1: oklch(0.6 0.15 260);
    --gc2: oklch(0.5 0.2 320);
  }
}
```

### Tuning Parameters

| Parameter | Effect | Notes |
|-----------|--------|-------|
| Gradient count | Richness | 3-5 radial gradients layered |
| Ellipse size | Blob size | 30-60% of viewport |
| Animation duration | Speed | 10-20s for relaxed, 5-8s for dynamic |
| Color range | Palette breadth | Keep within 60-120deg of hue wheel for cohesion |
| `mix-blend-mode` | Blending with content | `normal` default; `multiply` or `screen` for interaction with content bg |

### Accessibility

- `prefers-reduced-motion: reduce`: Pause the animation. Show a static gradient snapshot.

### Implementation Notes

- `@property` registration is required for each animated custom property. Without it, gradients snap between keyframes instead of interpolating.
- Use `oklch()` for color stops. It interpolates through perceptually uniform color space, avoiding the muddy midpoints that `hsl()` produces.
- The `alternate` direction creates a natural back-and-forth drift without a visible loop seam.
- Layer a subtle grain overlay on top of the gradient mesh for added depth and texture.
- Browser support for `@property`: Chrome 85+, Edge 85+, Safari 15.4+, Firefox 128+. Fall back to a static gradient for unsupported browsers.

---

## shader-noise

**Complexity**: H
**Performance cost**: 3-4
**Dependencies**: three.js + glsl

### Description

A WebGL fragment shader running on a fullscreen quad, generating procedural noise patterns (simplex, perlin, worley, curl noise) as a background. The shader responds to time and optionally to cursor position. This produces organic, infinitely varied backgrounds that cannot be achieved with CSS.

### HTML Structure

```html
<canvas class="shader-bg" aria-hidden="true" role="img" aria-label="Animated background"></canvas>
```

### GLSL Fragment Shader: Simplex Noise Gradient

```glsl
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse; // normalized 0-1
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_speed;
uniform float u_scale;

// Simplex noise function (2D)
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time * u_speed;

  // Multi-octave noise
  float n = 0.0;
  n += 0.5 * snoise(uv * u_scale + t * 0.1);
  n += 0.25 * snoise(uv * u_scale * 2.0 + t * 0.15);
  n += 0.125 * snoise(uv * u_scale * 4.0 + t * 0.2);
  n = n * 0.5 + 0.5; // normalize to 0-1

  // Mouse influence: shift noise near cursor
  float mouseDist = length(uv - u_mouse);
  n += 0.15 * smoothstep(0.3, 0.0, mouseDist);

  // Color mapping: blend three colors based on noise value
  vec3 color = mix(u_color1, u_color2, smoothstep(0.3, 0.6, n));
  color = mix(color, u_color3, smoothstep(0.6, 0.9, n));

  gl_FragColor = vec4(color, 1.0);
}
```

### Three.js Setup

```javascript
const canvas = document.querySelector('.shader-bg');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_color1: { value: new THREE.Color('#0a0a2e') },
    u_color2: { value: new THREE.Color('#1a1a4e') },
    u_color3: { value: new THREE.Color('#2d1b69') },
    u_speed: { value: 0.3 },
    u_scale: { value: 3.0 },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
  fragmentShader: shaderSource,
});

const quad = new THREE.PlaneGeometry(2, 2);
scene.add(new THREE.Mesh(quad, material));

function animate(time) {
  material.uniforms.u_time.value = time * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate(0);
```

### Tuning Parameters

| Uniform | Effect | Range |
|---------|--------|-------|
| `u_speed` | Animation speed | 0.1 (glacial) - 1.0 (active) |
| `u_scale` | Noise frequency (blob size) | 1.0 (large) - 8.0 (fine) |
| `u_color1-3` | Color palette | Derived from design tokens |
| `u_mouse` | Cursor reactivity | 0.0-1.0 normalized coords |

### Accessibility

- `prefers-reduced-motion: reduce`: Render one frame and stop the animation loop. The background becomes a static noise texture.
- Canvas is `aria-hidden="true"`.

### Implementation Notes

- **Pixel ratio cap**: `Math.min(window.devicePixelRatio, 2)`. A 4x display quadruples fragment shader invocations.
- **Intersection Observer**: Pause the render loop when the canvas is not visible.
- **Dynamic import**: Load Three.js asynchronously. Show `--color-bg-base` as fallback while loading.
- **Resize**: Update `u_resolution` and renderer size on `window.resize` (debounced).
- **Dispose**: Call `renderer.dispose()`, `material.dispose()`, `geometry.dispose()` on teardown.
- For simpler noise effects (no cursor reactivity, static speed), consider a CSS-only approach with an SVG `feTurbulence` filter or a pre-rendered noise video loop.

---

## shader-noise-tsl

**Complexity**: M (lower than raw GLSL)
**Performance cost**: 3
**Dependencies**: three.js (r171+)

### Description

Three.js TSL (Three Shading Language) replaces raw GLSL string manipulation with JavaScript function composition. Shaders are written as node graphs in JS with full IDE support — autocomplete, refactoring, error messages. TSL auto-compiles to GLSL (WebGL) and WGSL (WebGPU). This is the preferred approach for AI code generation because it eliminates GLSL syntax errors and string template complexity.

### TSL Implementation

```javascript
import { WebGPURenderer } from 'three/webgpu';
import {
  uniform, vec2, vec3, float,
  sin, cos, mul, add, mix, smoothstep,
  uv, time, positionLocal,
  MeshBasicNodeMaterial,
} from 'three/tsl';

// Create material with TSL nodes
const material = new MeshBasicNodeMaterial();

// Uniforms
const uSpeed = uniform(0.3);
const uScale = uniform(3.0);
const uColor1 = uniform(new THREE.Color('#0a0a2e'));
const uColor2 = uniform(new THREE.Color('#1a1a4e'));
const uColor3 = uniform(new THREE.Color('#2d1b69'));

// Noise function as TSL nodes (simplex approximation)
const noiseUV = mul(uv(), uScale);
const timeOffset = mul(time, uSpeed);
const noise = sin(add(mul(noiseUV.x, 4.0), timeOffset))
  .mul(0.5)
  .add(cos(add(mul(noiseUV.y, 3.0), mul(timeOffset, 0.7))).mul(0.3))
  .add(0.5);

// Color mapping
const color = mix(
  vec3(uColor1),
  vec3(uColor2),
  smoothstep(0.3, 0.6, noise)
);
const finalColor = mix(
  color,
  vec3(uColor3),
  smoothstep(0.6, 0.9, noise)
);

material.colorNode = finalColor;

// Renderer with automatic WebGL fallback
const renderer = new WebGPURenderer({ canvas, alpha: true });
// Falls back to WebGL2 if WebGPU is unavailable — no code changes needed
```

### TSL vs GLSL Comparison

| Aspect | GLSL (raw strings) | TSL (JavaScript) |
|--------|-------------------|-----------------|
| Syntax errors | Runtime, cryptic | Compile-time, IDE catches |
| IDE support | None (strings) | Full autocomplete, refactoring |
| Renderer target | WebGL only | WebGL + WebGPU auto |
| AI generation | Error-prone string templates | Native JS, much more reliable |
| File size | Inline strings | Tree-shakeable imports |
| Debugging | Shader compilation errors | JS stack traces |

### When to Use TSL vs Raw GLSL

- **Use TSL** for new shader backgrounds, especially when generated by AI. The JavaScript API eliminates the class of errors that LLMs commonly make with GLSL (missing semicolons, type mismatches, undeclared variables).
- **Use raw GLSL** when porting an existing shader from ShaderToy/GLSL Sandbox, or when the brief references a specific GLSL implementation.

### Accessibility

Same as shader-noise: `prefers-reduced-motion: reduce` renders one frame and stops. Canvas is `aria-hidden="true"`.

### Implementation Notes

- Requires Three.js r171+ for `three/webgpu` and `three/tsl` imports.
- TSL nodes are composable — complex shaders are built by chaining small functions.
- `WebGPURenderer` automatically falls back to WebGL2 if WebGPU is unavailable.
- Color uniforms accept `THREE.Color` objects — derive from design tokens.
- Import only what you use — TSL is tree-shakeable.

---

## particle-field

**Complexity**: H
**Performance cost**: 3
**Dependencies**: three.js

### Description

A field of floating particles (dots, lines, shapes) that drift gently and respond to the cursor. Particles may attract/repel from the mouse, form constellation patterns (connecting nearby particles with lines), or drift in a flow field. Common as hero backgrounds on tech and creative sites.

### Three.js Implementation Pattern

```javascript
const particleCount = 200; // cap for performance
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 10;     // x
  positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // y
  positions[i * 3 + 2] = (Math.random() - 0.5) * 2;  // z (shallow depth)
  velocities[i * 3] = (Math.random() - 0.5) * 0.01;
  velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
  velocities[i * 3 + 2] = 0;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.05,
  transparent: true,
  opacity: 0.6,
  sizeAttenuation: true,
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

// Animation loop: update positions, apply cursor repulsion
function updateParticles(mouseX, mouseY) {
  const pos = geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    // Drift
    pos[i * 3] += velocities[i * 3];
    pos[i * 3 + 1] += velocities[i * 3 + 1];

    // Boundary wrap
    if (Math.abs(pos[i * 3]) > 5) pos[i * 3] *= -1;
    if (Math.abs(pos[i * 3 + 1]) > 5) pos[i * 3 + 1] *= -1;

    // Cursor repulsion
    const dx = pos[i * 3] - mouseX;
    const dy = pos[i * 3 + 1] - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1.5) {
      const force = (1.5 - dist) * 0.01;
      pos[i * 3] += dx * force;
      pos[i * 3 + 1] += dy * force;
    }
  }
  geometry.attributes.position.needsUpdate = true;
}
```

### Constellation Lines (Optional)

Connect particles within a threshold distance:

```javascript
// Use THREE.LineSegments with dynamic geometry
// For each frame, calculate pairs within threshold distance
// Performance cap: only check nearby particles (spatial hashing or limit checks)
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `particleCount` | Density | 100 (sparse) - 300 (rich). Cap at 500 for mobile. |
| `size` | Particle size | 0.02 (dot) - 0.1 (prominent) |
| `opacity` | Visibility | 0.3 (ghostly) - 0.8 (solid) |
| `drift speed` | Movement | 0.005 (calm) - 0.02 (active) |
| `repulsion radius` | Cursor zone | 1.0 - 3.0 world units |

### Accessibility

- `prefers-reduced-motion: reduce`: Freeze particles in initial positions. No drift, no cursor interaction.
- Canvas is `aria-hidden="true"`.

### Implementation Notes

- **Performance**: `THREE.Points` is efficient for up to ~1000 particles. Beyond that, use `InstancedMesh` or compute shaders (WebGPU).
- **Constellation lines** are the expensive part. Naive pairwise distance checking is O(n^2). For 200 particles, that is 20,000 checks per frame -- manageable. For 500+, use spatial hashing.
- **Mobile**: reduce particle count to 100. Disable cursor repulsion (no hover on touch). Reduce `size` for performance.
- **Color**: single color is simplest. For multi-color, assign random colors via a vertex color attribute.
- **Depth of field**: vary particle opacity based on z-position for a 3D feel without true perspective rendering.

---

## fluid-simulation

**Complexity**: H
**Performance cost**: 5
**Dependencies**: three.js + glsl (multi-pass)

### Description

A real-time fluid simulation that responds to cursor movement. The cursor creates "ink drops" or "smoke" that flow, dissipate, and interact with each other. This is the most computationally expensive background effect and should only be used when the brief explicitly calls for it.

### GLSL Approach: Navier-Stokes Approximation

The simulation requires multiple render passes:

1. **Advection pass**: Move the fluid velocity field by itself
2. **Pressure pass**: Solve for pressure to enforce incompressibility (Jacobi iteration, 20-40 iterations)
3. **Divergence pass**: Calculate divergence of velocity field
4. **Gradient subtraction**: Subtract pressure gradient from velocity
5. **Splat pass**: Add velocity and dye at cursor position
6. **Display pass**: Render the dye field to the screen

Each pass renders a fullscreen quad with a different shader, reading from/writing to ping-pong framebuffers.

### Key Uniforms

```glsl
// Splat shader
uniform vec2 u_point;       // cursor position
uniform vec3 u_color;        // dye color
uniform float u_radius;      // splat radius
uniform float u_force;       // velocity force

// Advection shader
uniform sampler2D u_velocity;
uniform sampler2D u_source;
uniform float u_dt;           // timestep
uniform float u_dissipation;  // how fast the fluid fades
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `resolution` | Simulation grid | 128 (fast, chunky) - 512 (smooth, expensive) |
| `dissipation` | Fade speed | 0.95 (fast fade) - 0.999 (long-lasting) |
| `pressure iterations` | Accuracy | 20 (fast) - 50 (smooth) |
| `splat radius` | Cursor effect size | 0.1 - 0.5 |
| `curl` | Vorticity | 0 (straight flow) - 30 (swirly) |

### Accessibility

- `prefers-reduced-motion: reduce`: Show a static gradient derived from the fluid's color palette. No simulation.
- Canvas is `aria-hidden="true"`.

### Implementation Notes

- **This is expensive**: 6+ shader passes per frame at simulation resolution. Even on modern GPUs, limit the simulation grid to 256x256 for smooth 60fps.
- **Simulation resolution != display resolution**: Simulate at 256x256, render to fullscreen. The bilinear interpolation creates smooth visuals.
- **Reference implementation**: Pavel Dobryakov's WebGL fluid simulation (MIT licensed) is the standard starting point. Port uniforms to match design tokens.
- **Mobile**: reduce simulation resolution to 128x128 and pressure iterations to 15. Consider disabling on mobile entirely and showing a gradient-mesh instead.
- **Touch**: on mobile, touch events create splats. The fluid simulation is one of the few background effects that translates well to touch interaction.
- **Initialization**: show `--color-bg-base` while loading. The simulation needs a warm-up frame before it looks good.

---

## aurora

**Complexity**: H
**Performance cost**: 3
**Dependencies**: three.js + glsl | css (simplified)

### Description

Flowing bands of color that undulate like the aurora borealis. Organic, slow-moving waves of light with soft edges and color blending. Can be implemented as a WebGL shader (full effect) or approximated with CSS (simplified version).

### CSS-Only Approximation

```css
.aurora {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg-effect);
  pointer-events: none;
  overflow: hidden;
}

.aurora__band {
  position: absolute;
  width: 200%;
  height: 40%;
  filter: blur(80px);
  opacity: 0.5;
  border-radius: 50%;
  mix-blend-mode: screen;
}

.aurora__band--1 {
  top: -10%;
  left: -25%;
  background: oklch(0.6 0.15 160);
  animation: aurora-wave 12s ease-in-out infinite alternate;
}

.aurora__band--2 {
  top: 10%;
  left: -15%;
  background: oklch(0.5 0.2 250);
  animation: aurora-wave 15s ease-in-out infinite alternate-reverse;
}

.aurora__band--3 {
  top: 5%;
  left: -20%;
  background: oklch(0.55 0.18 300);
  animation: aurora-wave 18s ease-in-out infinite alternate;
  animation-delay: -3s;
}

@keyframes aurora-wave {
  0% {
    transform: translateX(0%) translateY(0%) rotate(-5deg) scaleY(1);
  }
  50% {
    transform: translateX(10%) translateY(5%) rotate(3deg) scaleY(1.2);
  }
  100% {
    transform: translateX(-5%) translateY(-3%) rotate(-2deg) scaleY(0.8);
  }
}
```

### GLSL Fragment Shader: Aurora

```glsl
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

// Simplex noise function (same as shader-noise)
float snoise(vec2 v) { /* ... */ }

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Vertical bands that wave horizontally
  float wave1 = snoise(vec2(uv.x * 2.0 + u_time * 0.05, uv.y * 0.5)) * 0.3;
  float wave2 = snoise(vec2(uv.x * 1.5 + u_time * 0.03, uv.y * 0.8 + 1.0)) * 0.25;
  float wave3 = snoise(vec2(uv.x * 3.0 + u_time * 0.07, uv.y * 0.3 + 2.0)) * 0.2;

  // Band shapes (concentrated in upper portion)
  float band1 = smoothstep(0.3, 0.7, uv.y + wave1) * smoothstep(1.0, 0.6, uv.y + wave1);
  float band2 = smoothstep(0.2, 0.6, uv.y + wave2) * smoothstep(0.9, 0.5, uv.y + wave2);
  float band3 = smoothstep(0.4, 0.8, uv.y + wave3) * smoothstep(1.1, 0.7, uv.y + wave3);

  // Color blending
  vec3 color = vec3(0.0);
  color += u_color1 * band1 * 0.6;
  color += u_color2 * band2 * 0.5;
  color += u_color3 * band3 * 0.4;

  // Fade at edges
  float edgeFade = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x);
  color *= edgeFade;

  gl_FragColor = vec4(color, length(color) * 0.8);
}
```

### Tuning Parameters

| Parameter | Effect | Range |
|-----------|--------|-------|
| `u_speed` (implicit in `u_time` multiplier) | Wave speed | 0.03 (slow, dreamy) - 0.1 (active) |
| Band count | Number of color layers | 2-4 |
| `blur` (CSS) | Softness | 60px (defined) - 120px (diffuse) |
| Colors | Palette | Classic aurora: greens + purples. Custom: derived from design tokens. |
| Band position | Vertical placement | Top-heavy is natural. Full-screen for immersive. |

### Accessibility

- `prefers-reduced-motion: reduce`: CSS version pauses animation. WebGL version renders one frame and stops.
- Both implementations are `aria-hidden="true"`.

### Implementation Notes

- **CSS vs WebGL**: The CSS approximation is surprisingly effective for most use cases. Use it unless the brief specifically demands the smoothness and detail of a WebGL shader.
- **CSS blur performance**: `filter: blur(80px)` on large elements triggers paint. Use `backdrop-filter` on a thin element instead if possible, or accept the paint cost (it is a background, not an interactive element).
- **Color palette**: aurora effects look best with analogous or split-complementary colors. Avoid complementary colors (they mix to mud in the overlap zones).
- **Blend mode**: `mix-blend-mode: screen` on dark backgrounds makes the bands additive (lighter where they overlap). On light backgrounds, use `multiply`.
- **Placement**: auroras are naturally top-heavy (sky). For a more abstract effect, position bands across the full viewport.
- **Performance**: the CSS version costs ~1-2 on the performance scale. The WebGL version costs ~3 but gives much smoother undulation and more control over the noise pattern.

---

## WebGPU Performance Notes

**Browser support (Nov 2025)**: Chrome 113+, Edge 113+, Firefox 139+, Safari 26+. All major browsers.

WebGPU offers 2-10x performance improvement over WebGL for complex scenes. For the background effects in this file:

### When to Use WebGPU vs WebGL

| Scenario | Recommendation |
|----------|---------------|
| Single shader background | WebGL (simpler, sufficient) |
| Particle field (500+ particles) | WebGPU (compute shaders for physics) |
| Fluid simulation | WebGPU (massive perf gain on multi-pass) |
| Multiple simultaneous effects | WebGPU (better multi-draw performance) |
| Maximum compatibility | WebGL (100% support) |

### Three.js WebGPU Setup

```javascript
import { WebGPURenderer } from 'three/webgpu';

// WebGPURenderer automatically falls back to WebGL2
const renderer = new WebGPURenderer({
  canvas: document.querySelector('.shader-bg'),
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// All existing Three.js code works unchanged
// TSL shaders auto-compile to WGSL (WebGPU) or GLSL (WebGL)
```

### Compute Shaders for Particle Physics

WebGPU compute shaders run particle physics on the GPU instead of the CPU:

```javascript
import { compute, storage, uniform, instanceIndex } from 'three/tsl';

// GPU-side particle position buffer
const positionBuffer = storage(particlePositions, 'vec3', particleCount);
const velocityBuffer = storage(particleVelocities, 'vec3', particleCount);

// Compute shader updates positions on GPU
const computeUpdate = compute(() => {
  const i = instanceIndex;
  const pos = positionBuffer.element(i);
  const vel = velocityBuffer.element(i);
  pos.addAssign(vel);
}, particleCount);

// Run compute shader each frame
renderer.computeAsync(computeUpdate);
```

This moves particle physics from O(n) CPU per frame to O(1) CPU + GPU parallel. Enables 10,000+ particles at 60fps.

### Progressive Enhancement Pattern

```javascript
// Feature detection
const hasWebGPU = 'gpu' in navigator;

// Use WebGPURenderer regardless — it falls back automatically
const renderer = new WebGPURenderer({ canvas, alpha: true });

// Adjust quality based on capability
if (hasWebGPU) {
  particleCount = 5000;   // GPU compute handles this easily
  simResolution = 512;     // Higher fluid sim resolution
} else {
  particleCount = 500;     // CPU-bound limit
  simResolution = 256;     // Lower for WebGL performance
}
```

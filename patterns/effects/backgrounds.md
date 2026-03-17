# Background Effect Patterns

Decorative background effects that add visual depth and atmosphere. These sit behind content and create the environmental tone of the design.

---

## Grain Noise

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css + svg-filter

### Description
Film grain texture overlay that adds analog warmth and tactility to flat digital surfaces. Common in dark-luxury, editorial, and handcrafted aesthetics.

### Implementation (SVG Filter)
```html
<svg class="grain-filter" aria-hidden="true">
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
</svg>
```

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  filter: url(#grain);
  opacity: 0.04;
  mix-blend-mode: overlay;
}
```

### Tuning
- `baseFrequency`: 0.5 (coarse) to 0.8 (fine). 0.65 is the sweet spot.
- `opacity`: 0.02 (subtle) to 0.08 (heavy). Dark backgrounds tolerate higher values.
- `mix-blend-mode: overlay` or `multiply` depending on light/dark theme.
- For animated grain: add `<feDisplacementMap>` driven by CSS `animation` on `seed` attribute, or shift `background-position` of a tiled grain image.

### Performance Notes
- SVG filters are CPU-rendered. On large viewports, can cause jank.
- Pre-render: generate a 512x512 grain PNG/WebP, tile it as `background-image`. Much cheaper.
- Use `will-change: auto` (not `will-change: filter`) — doesn't help and wastes memory.

### Accessibility
- `aria-hidden="true"` on the SVG filter
- The grain overlay must never reduce text contrast below WCAG AA thresholds
- Test with the grain at maximum opacity against the lightest text

---

## Gradient Mesh

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description
Multi-point gradient that creates a soft, organic color field. Achieved with multiple overlapping `radial-gradient` layers, animated via CSS `@property` for hue/position shifts.

### CSS Implementation
```css
@property --gradient-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.gradient-mesh {
  background:
    radial-gradient(ellipse at 20% 50%, oklch(0.5 0.15 280 / 0.4), transparent 60%),
    radial-gradient(ellipse at 80% 20%, oklch(0.6 0.12 55 / 0.3), transparent 50%),
    radial-gradient(ellipse at 50% 80%, oklch(0.4 0.10 180 / 0.3), transparent 55%),
    var(--color-bg-base);

  animation: mesh-shift 20s ease-in-out infinite alternate;
}

@keyframes mesh-shift {
  to {
    background:
      radial-gradient(ellipse at 60% 30%, oklch(0.55 0.12 300 / 0.4), transparent 60%),
      radial-gradient(ellipse at 30% 70%, oklch(0.65 0.10 40 / 0.3), transparent 50%),
      radial-gradient(ellipse at 70% 50%, oklch(0.45 0.12 200 / 0.3), transparent 55%),
      var(--color-bg-base);
  }
}
```

### Performance Notes
- CSS gradients are GPU-composited — excellent performance
- `@property` enables smooth transitions between gradient states
- Keep to 3-4 gradient layers max

### Accessibility
- `prefers-reduced-motion`: stop animation, show static gradient
- Ensure text contrast over every area of the gradient

---

## Shader Noise

**Complexity**: H
**Performance cost**: 3
**Dependencies**: three.js + glsl

### Description
A WebGL fragment shader that generates procedural noise patterns (Simplex, Perlin, Worley) as a full-screen background. Creates organic, ever-shifting atmospheric effects.

### GLSL Fragment Shader (Simplex Noise)
```glsl
uniform float u_time;
uniform vec2 u_resolution;

// Simplex noise function (insert standard snoise implementation)
// ... (300+ lines for full 3D simplex, or use a noise library)

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  float noise = snoise(vec3(uv * 3.0, u_time * 0.1));
  noise = noise * 0.5 + 0.5; // Remap to 0-1

  // Color mapping
  vec3 color1 = vec3(0.05, 0.07, 0.09); // dark base
  vec3 color2 = vec3(0.12, 0.08, 0.15); // subtle purple
  vec3 mixed = mix(color1, color2, noise);

  gl_FragColor = vec4(mixed, 1.0);
}
```

### Three.js Setup
```javascript
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.querySelector('.shader-bg').appendChild(renderer.domElement);

const material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  },
  vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
  fragmentShader: noiseShaderSource,
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(quad);

function animate(time) {
  material.uniforms.u_time.value = time * 0.001;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate(0);
```

### Performance Notes
- Run at device pixel ratio 1 (not 2) for retina — noise doesn't benefit from high DPI
- Use `renderer.setPixelRatio(1)` to halve fragment count
- Pause animation when tab is not visible (`document.visibilitychange`)
- `prefers-reduced-motion`: render one frame, stop animation loop

---

## Particle Field

**Complexity**: H
**Performance cost**: 3
**Dependencies**: three.js

### Description
Floating particles that drift slowly, respond to cursor proximity, and create a sense of depth. Common in immersive and dark-luxury designs.

### Three.js Implementation (Points)
```javascript
const count = 500;
const positions = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i += 3) {
  positions[i] = (Math.random() - 0.5) * 10;     // x
  positions[i + 1] = (Math.random() - 0.5) * 10;  // y
  positions[i + 2] = (Math.random() - 0.5) * 5;   // z (depth)
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  size: 2,
  color: 0xffffff,
  transparent: true,
  opacity: 0.4,
  sizeAttenuation: true,
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);
```

### Cursor Interaction
Pass mouse position as a uniform. In the vertex shader, push particles away from the cursor:
```glsl
float dist = distance(position.xy, u_mouse.xy);
float push = smoothstep(2.0, 0.0, dist) * 0.5;
vec3 displaced = position + normalize(position - vec3(u_mouse, 0.0)) * push;
```

### Performance Notes
- 500 particles is the sweet spot for visual density vs. performance
- Use `THREE.Points` (not individual meshes) — single draw call
- For 1000+ particles, use `InstancedMesh` or compute shaders

---

## Fluid Simulation

**Complexity**: H
**Performance cost**: 4
**Dependencies**: three.js + glsl

### Description
A fluid/smoke simulation that responds to cursor movement. The cursor leaves colorful trails that dissipate over time. Extremely impressive but GPU-intensive.

### Implementation Notes
- Based on Jos Stam's "Stable Fluids" (2003) algorithm
- Requires multiple render targets (ping-pong buffers) for velocity and density fields
- Libraries: `fluid-simulation-webgl` or hand-rolled with Three.js FBO
- Typical resolution: 128x128 or 256x256 simulation grid, upscaled for display
- `prefers-reduced-motion`: show static gradient, no simulation

### Performance Budget
- Desktop only — too heavy for mobile
- Cap at 256x256 simulation resolution
- Use `requestAnimationFrame` with frame skipping if FPS drops below 30

---

## Aurora

**Complexity**: M
**Performance cost**: 2
**Dependencies**: css OR glsl

### Description
Flowing, aurora borealis-like color bands that undulate slowly. Can be achieved with CSS gradients + animation or GLSL for smoother results.

### CSS Implementation (Lightweight)
```css
.aurora {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.aurora::before,
.aurora::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    oklch(0.4 0.15 280 / 0.3),
    oklch(0.3 0.10 180 / 0.2),
    oklch(0.4 0.12 120 / 0.3),
    oklch(0.3 0.15 280 / 0.2)
  );
  filter: blur(80px);
  animation: aurora-rotate 30s linear infinite;
}

.aurora::after {
  animation-duration: 45s;
  animation-direction: reverse;
  opacity: 0.5;
}

@keyframes aurora-rotate {
  to { transform: rotate(360deg); }
}
```

### Performance Notes
- CSS version: `filter: blur(80px)` can be expensive on large elements. Use `will-change: transform`.
- GLSL version: smoother, more controllable, but requires Three.js setup
- `prefers-reduced-motion`: show static blurred gradient, no rotation

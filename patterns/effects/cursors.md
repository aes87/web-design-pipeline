# Cursor Effect Patterns

Custom cursor implementations that add interactive polish. These replace or augment the default browser cursor with custom visual elements that respond to context and position.

**Important**: Always preserve the native cursor for accessibility. Custom cursors are enhancement layers, not replacements. Use `cursor: none` sparingly and only on specific interactive zones.

---

## Dot-Ring Follower

**Complexity**: L
**Performance cost**: 1
**Dependencies**: js + css

### Description
Small dot at exact cursor position, larger ring that lerps (smoothly follows) behind it. The most common custom cursor on award-winning sites.

### HTML Structure
```html
<div class="cursor-dot" aria-hidden="true"></div>
<div class="cursor-ring" aria-hidden="true"></div>
```

### CSS
```css
.cursor-dot,
.cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9999;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.cursor-dot {
  width: 6px;
  height: 6px;
  background: var(--color-accent-primary);
}

.cursor-ring {
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--color-accent-primary);
  opacity: 0.5;
  transition: width 0.2s, height 0.2s, opacity 0.2s;
}

/* Hover state — ring expands */
.cursor-ring.is-hovering {
  width: 56px;
  height: 56px;
  opacity: 0.3;
}
```

### JavaScript
```javascript
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left = `${mouseX}px`;
  dot.style.top = `${mouseY}px`;
});

function animateRing() {
  ringX += (mouseX - ringX) * 0.15;
  ringY += (mouseY - ringY) * 0.15;
  ring.style.left = `${ringX}px`;
  ring.style.top = `${ringY}px`;
  requestAnimationFrame(animateRing);
}
animateRing();

// Expand ring on interactive elements
document.querySelectorAll('a, button, [role="button"]').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('is-hovering'));
  el.addEventListener('mouseleave', () => ring.classList.remove('is-hovering'));
});
```

### Accessibility
- Both elements have `aria-hidden="true"`
- Native cursor remains visible (don't set `cursor: none` on body)
- Hide custom cursor on touch devices: `@media (hover: none) { .cursor-dot, .cursor-ring { display: none; } }`
- `prefers-reduced-motion`: hide ring, keep dot only (no lerp animation)

---

## Magnetic Button

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap

### Description
Buttons subtly shift toward the cursor when it's nearby. The effect creates a "magnetic" pull that makes buttons feel interactive before you even click.

### JavaScript (GSAP)
```javascript
document.querySelectorAll('[data-magnetic]').forEach(el => {
  const strength = parseFloat(el.dataset.magnetic || '0.3');
  const radius = 100;

  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    gsap.to(el, {
      x: dx * strength,
      y: dy * strength,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
  });
});
```

### HTML Usage
```html
<button data-magnetic="0.3" class="btn btn--primary">Get Started</button>
```

### Accessibility
- The magnetic shift is purely visual — focus/click behavior unchanged
- `prefers-reduced-motion`: disable the transform, button stays static
- Keep displacement small (max 15-20px) to avoid confusion about click targets

---

## Contextual Label

**Complexity**: M
**Performance cost**: 1
**Dependencies**: js + css

### Description
Cursor displays a text label that changes based on what it's hovering. For portfolio sites: "View", "Play", "Drag", "Read" labels appear near the cursor over different content types.

### Implementation Notes
- Create a single `<div class="cursor-label">` element
- On `mouseenter` of elements with `data-cursor-label="View"`, update the label text and show it
- Position with `transform: translate()` following the cursor
- Animate in with scale + opacity transition

### Accessibility
- Label is purely decorative — the underlying element must have its own accessible label
- Hide from screen readers with `aria-hidden="true"`

---

## Blend-Mode Circle

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css + minimal js

### Description
A large circle follows the cursor with `mix-blend-mode: difference`, creating an inverted-color spotlight effect. Particularly dramatic on dark-luxury and editorial designs.

### CSS
```css
.cursor-blend {
  position: fixed;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: white;
  mix-blend-mode: difference;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}
```

### Implementation Notes
- `mix-blend-mode: difference` inverts colors under the circle
- Works best with high-contrast designs (black text on white, or white text on dark)
- Expand the circle on hover over interactive elements
- Performance is excellent — `mix-blend-mode` is GPU-composited

---

## WebGL Distortion

**Complexity**: H
**Performance cost**: 4
**Dependencies**: webgl shader

### Description
A WebGL shader responds to cursor position, creating distortion, ripple, or liquid effects in the area around the cursor. Used for immersive hero sections.

### GLSL Fragment Shader (Ripple)
```glsl
uniform vec2 u_mouse;       // cursor position (normalized 0-1)
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_texture;  // page content as texture

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 toMouse = uv - u_mouse;
  float dist = length(toMouse);

  // Ripple distortion
  float strength = 0.02;
  float ripple = sin(dist * 30.0 - u_time * 3.0) * strength;
  ripple *= smoothstep(0.3, 0.0, dist); // falloff

  vec2 distortedUV = uv + normalize(toMouse) * ripple;
  gl_FragColor = texture2D(u_texture, distortedUV);
}
```

### Implementation Notes
- Requires Three.js or raw WebGL setup
- Render the page content to a texture, then apply the shader as a post-processing effect
- Alternative: apply shader only to a specific section's background, not the full page
- Performance: run at half resolution for acceptable framerates on mobile
- `prefers-reduced-motion`: disable shader entirely, show static content

### Accessibility
- This is purely decorative — all content must be accessible without the effect
- Provide a way to disable the effect (respect `prefers-reduced-motion`)
- The distortion should never make text unreadable

# Page Transition Patterns

Animated transitions between pages. The View Transitions API (Baseline 2026) is the primary approach. Barba.js is the fallback for browsers that don't support it or for complex transitions.

---

## Crossfade

**Complexity**: L | **Cost**: 1 | **Deps**: view-transitions-api

### Description
Simple opacity fade between old and new page. The default View Transition effect.

### CSS Implementation
```css
::view-transition-old(root) {
  animation: fade-out 0.3s var(--ease-exit) forwards;
}
::view-transition-new(root) {
  animation: fade-in 0.3s var(--ease-entrance) forwards;
}

@keyframes fade-out {
  to { opacity: 0; }
}
@keyframes fade-in {
  from { opacity: 0; }
}
```

### JavaScript (SPA)
```javascript
document.querySelectorAll('a[href]').forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!document.startViewTransition) {
      window.location.href = link.href;
      return;
    }
    const transition = document.startViewTransition(async () => {
      const res = await fetch(link.href);
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      document.title = doc.title;
      document.querySelector('main').innerHTML =
        doc.querySelector('main').innerHTML;
      history.pushState(null, '', link.href);
    });
  });
});
```

### MPA (Multi-Page Application)
```css
/* In both pages' CSS */
@view-transition {
  navigation: auto;
}
```

No JavaScript needed for MPA crossfade — the browser handles it.

---

## Slide Directional

**Complexity**: L | **Cost**: 1 | **Deps**: view-transitions-api

### Description
Pages slide left/right based on navigation direction. Forward navigation slides left, back navigation slides right.

### CSS
```css
::view-transition-old(root) {
  animation: slide-out-left 0.4s var(--ease-standard) forwards;
}
::view-transition-new(root) {
  animation: slide-in-right 0.4s var(--ease-standard) forwards;
}

@keyframes slide-out-left {
  to { transform: translateX(-100%); opacity: 0; }
}
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
}

/* Reverse for back navigation */
.back-nav::view-transition-old(root) {
  animation-name: slide-out-right;
}
.back-nav::view-transition-new(root) {
  animation-name: slide-in-left;
}
```

### Notes
- Determine direction by comparing current and target URL indices
- Set a CSS class on `<html>` before starting the transition to control direction

---

## Curtain Wipe

**Complexity**: M | **Cost**: 1 | **Deps**: view-transitions-api OR barba + gsap

### Description
A colored overlay wipes across the screen, covering the old page, then reveals the new page as it wipes off the other side.

### CSS (View Transitions)
```css
::view-transition-old(root) {
  animation: none;
  z-index: 1;
}
::view-transition-new(root) {
  animation: none;
  z-index: 3;
  clip-path: inset(0 100% 0 0);
  animation: curtain-reveal 0.6s var(--ease-dramatic) 0.3s forwards;
}

/* Overlay pseudo-element */
::view-transition-group(root) {
  animation: curtain-overlay 0.6s var(--ease-dramatic) forwards;
}

@keyframes curtain-reveal {
  to { clip-path: inset(0 0 0 0); }
}
```

### Barba.js Implementation
```javascript
barba.init({
  transitions: [{
    leave({ current }) {
      return gsap.to('.page-curtain', {
        scaleX: 1,
        transformOrigin: 'left',
        duration: 0.5,
        ease: 'power3.inOut',
      });
    },
    enter({ next }) {
      return gsap.to('.page-curtain', {
        scaleX: 0,
        transformOrigin: 'right',
        duration: 0.5,
        ease: 'power3.inOut',
        delay: 0.1,
      });
    },
  }],
});
```

---

## Zoom Morph

**Complexity**: M | **Cost**: 2 | **Deps**: view-transitions-api

### Description
The viewport zooms into a specific element (e.g., a card), which then expands to become the new page. Creates a spatial relationship between pages.

### CSS
```css
/* Give the target element a unique transition name */
.card-link { view-transition-name: card-hero; }
.page-hero { view-transition-name: card-hero; }

/* The matched element morphs automatically */
::view-transition-group(card-hero) {
  animation-duration: 0.5s;
  animation-timing-function: var(--ease-dramatic);
}

/* Background crossfades */
::view-transition-old(root) {
  animation: fade-out 0.3s ease forwards;
}
::view-transition-new(root) {
  animation: fade-in 0.3s ease 0.2s forwards;
}
```

### Notes
- The `view-transition-name` must match between the source and destination elements
- The browser automatically morphs size, position, and appearance
- Works best when the source and destination elements are visually similar

---

## Shared Element

**Complexity**: H | **Cost**: 2 | **Deps**: view-transitions-api

### Description
Multiple elements are matched between pages and morph independently. A product image, title, and price each morph to their new positions on the detail page.

### Implementation
```css
/* List page */
.product-card__image { view-transition-name: product-img; }
.product-card__title { view-transition-name: product-title; }
.product-card__price { view-transition-name: product-price; }

/* Detail page */
.product-detail__image { view-transition-name: product-img; }
.product-detail__title { view-transition-name: product-title; }
.product-detail__price { view-transition-name: product-price; }
```

### Dynamic Names
For lists with multiple items, use `view-transition-class` or dynamic names:
```javascript
// Before starting transition, set unique names
card.style.viewTransitionName = `product-${card.dataset.id}`;
```

### Notes
- Each `view-transition-name` must be unique on the page at transition time
- More shared elements = more complex choreography. Keep it to 2-4 matched elements.
- The browser interpolates between the old and new states automatically

---

## WebGL Dissolve

**Complexity**: H | **Cost**: 4 | **Deps**: three.js + barba OR custom

### Description
Pages dissolve through a WebGL shader — noise-based dissolve, pixelation, or distortion. The most visually impressive but heaviest transition.

### Implementation Approach
1. Capture the current page as a texture (using `html2canvas` or a render target)
2. Load the new page content off-screen
3. Capture the new page as a second texture
4. Run a Three.js shader that transitions between the two textures using a noise-based dissolve

### GLSL Dissolve Shader
```glsl
uniform sampler2D u_texture_old;
uniform sampler2D u_texture_new;
uniform float u_progress;       // 0 = old page, 1 = new page
uniform sampler2D u_noise;      // noise texture for dissolve pattern

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float noise = texture2D(u_noise, uv).r;
  float threshold = smoothstep(u_progress - 0.1, u_progress + 0.1, noise);

  vec4 old = texture2D(u_texture_old, uv);
  vec4 new = texture2D(u_texture_new, uv);

  gl_FragColor = mix(old, new, threshold);
}
```

### Notes
- Very heavy — requires capturing DOM as textures, which is slow
- Best for portfolio sites or creative showcases where the transition IS the experience
- Not suitable for content-heavy sites where users navigate frequently
- `prefers-reduced-motion`: fall back to simple crossfade

### Accessibility
- All page transitions must complete within 1 second
- Users must be able to navigate without relying on the animation
- `prefers-reduced-motion`: disable all transition animations, use instant page loads
- Ensure focus management — focus should move to the main content of the new page after transition

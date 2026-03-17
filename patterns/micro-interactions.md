# Micro-Interaction Patterns

Small, targeted feedback animations that respond to user actions. These are the details that make a site feel alive and considered. Every micro-interaction should have a clear purpose: confirm an action, guide attention, or provide feedback.

**Rule**: Every micro-interaction must have a `prefers-reduced-motion` fallback that either disables the animation or reduces it to a simple opacity change.

---

## Hover Lift

**Complexity**: L | **Cost**: 1 | **Deps**: css

Card rises with enhanced shadow on hover. The most universal micro-interaction.

```css
.card {
  transition: transform var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
  .card:hover { transform: none; }
}
```

**Tuning**: lift 2-4px for subtle, 6-8px for dramatic. Always pair with shadow deepening.

---

## Hover Glow

**Complexity**: L | **Cost**: 1 | **Deps**: css

Subtle colored glow appears around element on hover. Works well on dark backgrounds.

```css
.glow-target {
  transition: box-shadow var(--duration-fast) var(--ease-standard);
}
.glow-target:hover {
  box-shadow: 0 0 20px oklch(0.75 0.15 55 / 0.15),
              0 0 40px oklch(0.75 0.15 55 / 0.08);
}
```

**Notes**: Use the accent color at low opacity (0.1-0.2). On light backgrounds, use a darker accent or skip this pattern.

---

## Magnetic Button

**Complexity**: M | **Cost**: 1 | **Deps**: gsap

Button shifts toward cursor when nearby. See `patterns/effects/cursors.md` for full implementation.

```html
<button data-magnetic="0.3">Get Started</button>
```

**Key constraints**: Max displacement 15-20px. Elastic reset on `mouseleave`. Disable on touch devices.

---

## Cursor Spotlight

**Complexity**: L | **Cost**: 1 | **Deps**: js + css

Radial gradient follows cursor position on a container, creating a spotlight effect.

```css
.spotlight {
  --mx: 50%;
  --my: 50%;
  background: radial-gradient(
    600px circle at var(--mx) var(--my),
    oklch(0.75 0.15 55 / 0.06),
    transparent 60%
  );
}
```

```javascript
document.querySelector('.spotlight').addEventListener('mousemove', (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
});
```

**Notes**: Great for card grids — apply to the grid container, not individual cards.

---

## Text Gradient Hover

**Complexity**: L | **Cost**: 1 | **Deps**: css

Text fills with a gradient or color shift on hover using `background-clip: text`.

```css
.text-gradient-hover {
  background: linear-gradient(90deg,
    var(--color-fg-base) 50%,
    var(--color-accent-primary) 50%
  );
  background-size: 200% 100%;
  background-position: 0% 0%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: background-position var(--duration-base) var(--ease-standard);
}
.text-gradient-hover:hover {
  background-position: -100% 0%;
}
```

---

## Underline Draw

**Complexity**: L | **Cost**: 1 | **Deps**: css

Link underline draws in from left on hover, draws out to right on unhover.

```css
.link-draw {
  position: relative;
  text-decoration: none;
}
.link-draw::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--color-accent-primary);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform var(--duration-fast) var(--ease-standard);
}
.link-draw:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

**Notes**: The `transform-origin` swap creates the draw-in-from-left, draw-out-to-right effect.

---

## Button Ripple

**Complexity**: M | **Cost**: 1 | **Deps**: js + css

Material-style click ripple emanating from the click point.

```javascript
document.querySelectorAll('.btn-ripple').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});
```

```css
.btn-ripple { position: relative; overflow: hidden; }
.ripple {
  position: absolute;
  width: 0; height: 0;
  border-radius: 50%;
  background: oklch(1 0 0 / 0.2);
  transform: translate(-50%, -50%);
  animation: ripple-expand 0.6s var(--ease-entrance) forwards;
}
@keyframes ripple-expand {
  to { width: 300px; height: 300px; opacity: 0; }
}
```

---

## Focus Ring

**Complexity**: L | **Cost**: 1 | **Deps**: css

Animated focus indicator that expands outward. Replaces the default browser outline with a branded, accessible alternative.

```css
:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
  transition: outline-offset var(--duration-fast) var(--ease-standard);
}
:focus-visible:active {
  outline-offset: 0px;
}
```

**Accessibility**: This is the one micro-interaction that MUST remain even with `prefers-reduced-motion`. Focus indicators are navigational, not decorative.

---

## Image Reveal

**Complexity**: L | **Cost**: 1 | **Deps**: css OR gsap

Image reveals with a sliding mask. See `patterns/effects/image-reveals.md` for full variants (clip-path wipe, circle expand, curtain, scale overflow).

---

## Counter Tick

**Complexity**: L | **Cost**: 1 | **Deps**: gsap OR css

Numbers count up/down to their target value when they enter the viewport.

### GSAP Implementation
```javascript
const counters = document.querySelectorAll('[data-count]');
counters.forEach(el => {
  const target = parseFloat(el.dataset.count);
  gsap.from(el, {
    textContent: 0,
    duration: 2,
    snap: { textContent: 1 },
    ease: 'power2.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 80%',
    },
  });
});
```

### CSS-Only (Using @property)
```css
@property --counter {
  syntax: '<integer>';
  initial-value: 0;
  inherits: false;
}
.counter {
  --counter: 0;
  counter-reset: num var(--counter);
  transition: --counter 2s var(--ease-standard);
}
.counter.is-visible { --counter: 150; }
.counter::after {
  content: counter(num);
}
```

**Notes**: CSS-only approach works in Chromium (CSS `@property`). GSAP approach is cross-browser. For decimal numbers (percentages, prices), use `snap: { textContent: 0.1 }`.

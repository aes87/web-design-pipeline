# Micro-Interactions

Micro-interactions are the small, focused animations that respond to user input -- hover, focus, click, drag. They provide feedback, communicate state, and add delight. In isolation, each is trivial. Together, they form the texture of a well-crafted interface.

The line between "polished" and "annoying" is thin. Micro-interactions should be fast (under 300ms), subtle (small transforms, not dramatic animations), and consistent (every interactive element follows the same motion language). If a user notices a micro-interaction, it is probably too much.

### Shared CSS Contract

```
--ease-standard          Standard easing (power2.out / cubic-bezier(0.16, 1, 0.3, 1))
--ease-spring            Spring-like overshoot (cubic-bezier(0.34, 1.56, 0.64, 1))
--ease-elastic           Elastic bounce (GSAP-only or complex cubic-bezier)
--duration-micro         Micro-interaction duration (150-250ms)
--duration-hover         Hover transition duration (200-300ms)
--color-accent           Accent color for highlights
--color-focus            Focus ring color (typically accent at 50% opacity)
--shadow-sm              Small shadow for default state
--shadow-md              Medium shadow for hover/elevated state
--shadow-lg              Large shadow for active/dragged state
--radius-interactive     Border-radius for interactive elements
```

### Shared Principles

1. **Only animate compositable properties**: `transform`, `opacity`, `filter`, `clip-path`. Never animate `width`, `height`, `margin`, `padding`, `background-color` (triggers layout/paint).
2. **Hover is not the only state**: Every hover effect needs a corresponding focus-visible style for keyboard users.
3. **prefers-reduced-motion**: Reduce or remove decorative motion. Keep functional state changes (color, border) but remove transforms and opacity animations.
4. **Mobile**: Hover effects do not exist on touch devices. Ensure the non-hover state is the default and looks intentional.
5. **Performance**: Add `will-change` only on hover-capable contexts (`@media (hover: hover)`) to avoid promoting elements to GPU layers on touch devices where hover never triggers.

---

## hover-lift

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

Cards or interactive elements rise slightly and gain a deeper shadow on hover. The simplest and most universally applicable micro-interaction. It communicates "this is interactive" without being distracting.

### CSS Properties to Animate

```css
.card {
  transition:
    transform var(--duration-hover) var(--ease-standard),
    box-shadow var(--duration-hover) var(--ease-standard);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.card:active {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  transition-duration: 100ms;
}
```

### Timing Values

- **Hover on**: 200-300ms, `ease-out` (fast response)
- **Hover off**: 300-400ms, `ease-in-out` (gentle return)
- **Active/press**: 100ms, `ease-out` (immediate feedback)
- **Lift distance**: -4px (subtle) to -8px (dramatic)
- **Shadow progression**: `0 2px 4px` (rest) -> `0 8px 24px` (hover) -> `0 4px 12px` (active)

### Hover/Focus/Active States

| State | transform | box-shadow | Notes |
|-------|-----------|------------|-------|
| Rest | `translateY(0)` | `var(--shadow-sm)` | Default |
| Hover | `translateY(-4px)` | `var(--shadow-md)` | Elevates |
| Focus-visible | `translateY(-4px)` | `0 0 0 3px var(--color-focus)` | Focus ring + lift |
| Active | `translateY(-2px)` | `var(--shadow-sm)` | Presses down slightly |

### prefers-reduced-motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: box-shadow var(--duration-hover) var(--ease-standard);
  }
  .card:hover {
    transform: none;
    box-shadow: var(--shadow-md);
  }
}
```

Keep the shadow change (it is a state indicator) but remove the translate (it is decorative motion).

### Implementation Notes

- Apply `will-change: transform, box-shadow` inside `@media (hover: hover)` only.
- Shadow animation is not GPU-accelerated and triggers paint. For very large elements or many simultaneous hovers, use `filter: drop-shadow()` instead (partially accelerated).
- The active state (press down) should have a shorter duration than hover-on -- it needs to feel immediate.

---

## hover-glow

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

Elements gain a soft color glow on hover -- a colored shadow or radial gradient that emanates from the element. Creates a neon or premium feel depending on the color. Common with `cyberpunk`, `dark-luxury`, and `vaporwave` aesthetics.

### CSS Properties to Animate

```css
.element {
  transition: box-shadow var(--duration-hover) var(--ease-standard);
}

.element:hover {
  box-shadow:
    0 0 20px oklch(0.7 0.15 250 / 0.3),
    0 0 60px oklch(0.7 0.15 250 / 0.15);
}
```

Alternative with `filter` for better performance:
```css
.element:hover {
  filter: drop-shadow(0 0 20px oklch(0.7 0.15 250 / 0.4));
}
```

### Timing Values

- **Hover on**: 300ms, `ease-out`
- **Hover off**: 500ms, `ease-in-out` (glow fades slowly for drama)
- **Glow radius**: 20-60px spread
- **Glow opacity**: 0.15-0.4 (subtle, not overpowering)

### Hover/Focus/Active States

| State | Effect | Notes |
|-------|--------|-------|
| Rest | No glow | Clean default |
| Hover | Colored glow shadow | Primary effect |
| Focus-visible | Glow + focus ring | Both indicators visible |
| Active | Glow intensifies (higher opacity, larger spread) | Feedback |

### prefers-reduced-motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .element:hover {
    box-shadow: 0 0 0 2px var(--color-accent);
  }
}
```

Replace animated glow with a simple solid border/outline.

### Implementation Notes

- `box-shadow` with large blur radii triggers paint on every frame during transition. Use `filter: drop-shadow()` for better performance on older GPUs.
- For neon aesthetics, use two layered shadows: tight + wide. The tight shadow (10-20px) creates intensity; the wide shadow (40-60px) creates atmosphere.
- Glow color should match or complement `--color-accent`. For multi-color elements, derive glow from the element's own color.

---

## magnetic-button

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap

### Description

Buttons or clickable elements subtly move toward the cursor when it enters a proximity zone. The element tracks the cursor's position relative to its center and shifts by a fraction of the offset. Creates a premium, physical feel.

### CSS Properties to Animate

- `transform: translate(x, y)` on the button
- Optionally, the button's inner text/icon moves in the opposite direction or at a different factor for a parallax feel

### JavaScript Pattern

```javascript
const button = document.querySelector('.magnetic-btn');
const strength = 0.3; // 0-1, how strongly it follows
const radius = 100;   // px, activation zone around button

button.addEventListener('mousemove', (e) => {
  const rect = button.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < radius) {
    gsap.to(button, {
      x: dx * strength,
      y: dy * strength,
      duration: 0.3,
      ease: 'power2.out'
    });
  }
});

button.addEventListener('mouseleave', () => {
  gsap.to(button, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
});
```

### Timing Values

- **Follow speed**: 0.3s, `power2.out` (smooth catch-up)
- **Return speed**: 0.5s, `elastic.out(1, 0.3)` (spring-back with overshoot)
- **Strength**: 0.2-0.4 (subtle), 0.5+ (dramatic)
- **Radius**: 80-150px from element center

### Hover/Focus/Active States

| State | Effect | Notes |
|-------|--------|-------|
| Rest | Natural position | No transform |
| Mouse in radius | Translates toward cursor | Smooth follow |
| Mouse leave | Springs back to center | Elastic ease |
| Focus-visible | Standard focus ring, no magnetic effect | Keyboard does not trigger magnetic |
| Active | Slight scale-down (0.95) | Press feedback |

### prefers-reduced-motion Fallback

Disable the magnetic effect entirely. The button stays in its natural position. Keep the hover color/glow effect and the active press scale.

### Implementation Notes

- Use `gsap.quickTo()` for smoother tracking with less overhead than repeated `gsap.to()` calls:
  ```javascript
  const xTo = gsap.quickTo(button, 'x', { duration: 0.3, ease: 'power2.out' });
  const yTo = gsap.quickTo(button, 'y', { duration: 0.3, ease: 'power2.out' });
  ```
- Only activate on `@media (hover: hover)`. Touch devices should not have magnetic effects.
- The elastic return on `mouseleave` is what makes this feel physical. Without it, the button just slides back flatly.
- Apply to CTAs, nav links, and other important interactive elements. Do not apply to every link on the page.

---

## cursor-spotlight

**Complexity**: L
**Performance cost**: 1
**Dependencies**: js + css

### Description

A radial gradient follows the cursor position, creating a spotlight or glow effect on the page. The gradient is rendered via CSS custom properties updated by JavaScript. Common as a background effect on dark pages.

### CSS Properties to Animate

```css
.spotlight-area {
  --mx: 50%;
  --my: 50%;
  background: radial-gradient(
    600px circle at var(--mx) var(--my),
    oklch(0.5 0.1 250 / 0.15),
    transparent 40%
  );
}
```

### JavaScript Pattern

```javascript
const area = document.querySelector('.spotlight-area');
area.addEventListener('mousemove', (e) => {
  const rect = area.getBoundingClientRect();
  area.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
  area.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
});
```

### Timing Values

No transition on the custom properties -- the gradient should track the cursor in real-time. If smoothing is desired, use `requestAnimationFrame` with lerp:
```javascript
currentX += (targetX - currentX) * 0.1; // lerp factor 0.1
currentY += (targetY - currentY) * 0.1;
```

### Hover/Focus/Active States

Not state-based -- the spotlight is a continuous effect while the cursor is within the area. On `mouseleave`, fade the gradient opacity to 0 (transition: `opacity 0.5s`). The area element toggles `--spotlight-opacity: 0` -> `1`.

### prefers-reduced-motion Fallback

The cursor-following behavior is not motion-sensitive (it tracks user-initiated input). However, if the gradient size is large or animated, reduce the gradient radius or make it static (centered).

### Implementation Notes

- The CSS custom property approach is more performant than moving a DOM element -- no layout or paint, just composite.
- For card grids, apply the spotlight per-card (each card tracks the cursor relative to itself). This creates a "light passing over cards" effect.
- Gradient size (600px in the example) should scale with the section. Larger areas need larger gradients.
- On pages with multiple spotlight areas, only activate the one the cursor is currently over.

---

## text-gradient-hover

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

Text changes from a solid color to a gradient fill (or vice versa) on hover. The gradient is applied via `background-clip: text` and the transition is achieved by animating `background-position` or `background-size`.

### CSS Properties to Animate

```css
.gradient-text {
  background: linear-gradient(
    90deg,
    var(--color-fg-section) 0%,
    var(--color-fg-section) 50%,
    var(--color-accent) 50%,
    oklch(0.8 0.15 300) 100%
  );
  background-size: 200% 100%;
  background-position: 0% 0%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  transition: background-position var(--duration-hover) var(--ease-standard);
}

.gradient-text:hover {
  background-position: -100% 0%;
}
```

### Timing Values

- **Hover on**: 400ms, `ease-out` (gradual reveal)
- **Hover off**: 600ms, `ease-in-out` (slow return)

### Hover/Focus/Active States

| State | Effect | Notes |
|-------|--------|-------|
| Rest | Solid text color (first half of gradient) | Clean default |
| Hover | Gradient slides in | Color shift via background-position |
| Focus-visible | Gradient + underline (focus indicator) | Dual indication |

### prefers-reduced-motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .gradient-text:hover {
    background-position: -100% 0%;
    transition: none;
  }
}
```

Instant color change, no sliding animation.

### Implementation Notes

- `background-clip: text` + `color: transparent` is the foundation. Without both, the gradient is not visible.
- The "double-wide background" trick (200% width, shift position) is the standard approach for animating gradients on text.
- Works on headings, links, and display text. Avoid on body copy -- it is too distracting for continuous reading.
- Safari requires `-webkit-background-clip: text` (still prefixed in 2026).

---

## underline-draw

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

A decorative underline that draws in from left on hover and draws out to the right (or reverses direction) on hover-off. Replaces the browser's default underline with a controlled, animated version.

### CSS Properties to Animate

```css
.draw-link {
  text-decoration: none;
  position: relative;
}

.draw-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform var(--duration-hover) var(--ease-standard);
}

.draw-link:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

### Timing Values

- **Draw in**: 300ms, `ease-out`
- **Draw out**: 300ms, `ease-in` (exits to opposite side due to `transform-origin` swap)
- **Line thickness**: 1-2px (subtle), 3-4px (bold/brutalist)

### Hover/Focus/Active States

| State | Effect | Notes |
|-------|--------|-------|
| Rest | No underline visible | `scaleX(0)` |
| Hover | Underline draws in from left | `scaleX(1)` with origin left |
| Hover-off | Underline draws out to right | `scaleX(0)` with origin right |
| Focus-visible | Underline visible + focus outline | Persistent underline for keyboard |

### prefers-reduced-motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .draw-link::after {
    transition: none;
  }
  .draw-link:hover::after,
  .draw-link:focus-visible::after {
    transform: scaleX(1);
  }
}
```

Underline appears instantly on hover/focus.

### Implementation Notes

- The `transform-origin` swap between `right` (rest) and `left` (hover) creates the directional draw-in/draw-out effect. This is the key technique.
- For bi-directional draw (in from center, out to edges): use `transform-origin: center` and `scaleX(0)` -> `scaleX(1)`.
- Works best on nav links, in-text links, and footer links. Not suitable for links within body paragraphs (too many underlines animating on hover).
- Thickness should match the design's border weight. Brutalist = 3-4px. Minimalist = 1px.

---

## button-ripple

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css + js (minimal)

### Description

A Material Design-inspired ripple that emanates from the click point on a button. A circle expands from where the user clicked and fades out. Provides satisfying click feedback.

### CSS Properties to Animate

```css
.ripple-btn {
  position: relative;
  overflow: hidden;
}

.ripple-btn__effect {
  position: absolute;
  border-radius: 50%;
  background: oklch(1 0 0 / 0.3);
  transform: scale(0);
  animation: ripple 600ms linear forwards;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
```

### JavaScript Pattern

```javascript
button.addEventListener('click', (e) => {
  const ripple = document.createElement('span');
  ripple.classList.add('ripple-btn__effect');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  button.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});
```

### Timing Values

- **Expand**: 600ms, `linear` (constant speed expansion)
- **Fade**: opacity goes from 0.3 to 0 during the expansion
- **Size**: 4x the button's largest dimension

### prefers-reduced-motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .ripple-btn__effect {
    animation: none;
    display: none;
  }
}
```

Remove the ripple entirely. Keep other button states (color change on active) for feedback.

### Implementation Notes

- The ripple originates from the click coordinates, not the button center. This is what makes it feel physical.
- `overflow: hidden` on the button clips the ripple to the button bounds.
- Clean up: remove the ripple span after animation ends to avoid DOM bloat on rapid clicking.
- For dark backgrounds, use a white ripple (`oklch(1 0 0 / 0.3)`). For light backgrounds, use a dark ripple (`oklch(0 0 0 / 0.1)`).

---

## focus-ring

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description

A custom focus indicator that replaces the browser default. Appears only on keyboard navigation (`:focus-visible`), not on mouse click. Uses a colored ring with offset, matching the design's accent color.

### CSS Properties to Animate

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
  border-radius: var(--radius-interactive);
}

/* Animated focus ring */
.focus-animated:focus-visible {
  outline: 2px solid transparent;
  box-shadow: 0 0 0 0px var(--color-focus);
  animation: focus-ring 200ms var(--ease-standard) forwards;
}

@keyframes focus-ring {
  to {
    box-shadow: 0 0 0 3px var(--color-focus);
  }
}
```

### Timing Values

- **Appear**: 200ms, `ease-out`
- **Disappear**: instant (focus lost = ring gone, no lingering)
- **Ring width**: 2-3px
- **Offset**: 2-4px from element edge

### prefers-reduced-motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .focus-animated:focus-visible {
    animation: none;
    box-shadow: 0 0 0 3px var(--color-focus);
  }
}
```

Ring appears instantly, no animation.

### Implementation Notes

- `:focus-visible` is the correct selector. `:focus` shows on mouse click too, which clutters the UI.
- `outline` is the safest focus indicator -- it does not affect layout. `box-shadow` is an alternative when `outline` does not support `border-radius`.
- Never remove focus indicators without providing a custom replacement. `outline: none` without a substitute is an accessibility violation.
- The focus ring color should have at least 3:1 contrast against the background.
- Test with keyboard navigation: Tab through all interactive elements and verify the ring is visible and correctly positioned.
- This is the one micro-interaction that MUST remain even with `prefers-reduced-motion: reduce`. Focus indicators are navigational, not decorative.

---

## image-reveal

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap | css

### Description

Images reveal with a clip-path or overlay animation when they enter the viewport. The image starts hidden and a shaped mask (rectangle wipe, circle expand, or polygon) animates to reveal the full image.

### CSS Properties to Animate

**Clip-path wipe** (CSS or GSAP):
```css
.reveal-img {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal-img.is-visible {
  clip-path: inset(0 0 0 0);
}
```

**Circle expand**:
```css
.reveal-img {
  clip-path: circle(0% at 50% 50%);
  transition: clip-path 1s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal-img.is-visible {
  clip-path: circle(75% at 50% 50%);
}
```

**Scale + overflow** (Ken Burns entry):
```css
.reveal-container {
  overflow: hidden;
}
.reveal-img {
  transform: scale(1.2);
  transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal-img.is-visible {
  transform: scale(1);
}
```

### Timing Values

- **Clip-path wipe**: 0.8-1.0s, `power3.out`
- **Circle expand**: 1.0-1.2s, `power3.out`
- **Scale + overflow**: 1.2-1.5s, `power2.out` (slower for cinematic feel)
- **Trigger**: IntersectionObserver threshold 0.2 or ScrollTrigger `start: "top 85%"`

### prefers-reduced-motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .reveal-img {
    clip-path: none;
    transform: none;
    opacity: 1;
    transition: none;
  }
}
```

Images visible immediately, no reveal animation.

### Implementation Notes

- `clip-path` animation is increasingly GPU-accelerated in modern browsers but verify on target browsers.
- The clip-path wipe direction should match the reading direction or the scroll direction for natural feel.
- Combine with a colored overlay that wipes first (curtain reveal) for a two-phase effect: color block enters, color block exits revealing image.
- For portfolio grids, alternate reveal directions (left, right, bottom) across items.
- `loading="lazy"` on images below the fold. The reveal animation masks the image loading delay.

---

## counter-tick

**Complexity**: L
**Performance cost**: 1
**Dependencies**: gsap | js

### Description

Numbers animate by scrolling through digits like a mechanical counter (odometer/ticker). Each digit column scrolls vertically to land on the correct number. More visually interesting than a simple counter-up.

### HTML Structure

```html
<span class="ticker" data-value="247">
  <span class="ticker__digit" aria-hidden="true">
    <span class="ticker__column">0123456789</span>
  </span>
  <span class="ticker__digit" aria-hidden="true">
    <span class="ticker__column">0123456789</span>
  </span>
  <span class="ticker__digit" aria-hidden="true">
    <span class="ticker__column">0123456789</span>
  </span>
  <span class="sr-only">247</span>
</span>
```

### CSS Properties to Animate

```css
.ticker__digit {
  display: inline-block;
  overflow: hidden;
  height: 1em;
  line-height: 1;
}

.ticker__column {
  display: block;
  /* Each digit character stacked vertically, column scrolls via translateY */
  /* translateY controlled by JS to land on the correct digit */
}
```

GSAP animates `translateY` on each `.ticker__column` to position the correct digit in view: `y: -(digitValue * lineHeight)`.

### Timing Values

- **Duration**: 1.5-2.5s total
- **Stagger**: 150-200ms between digit columns (rightmost digit finishes last, or leftmost -- aesthetic choice)
- **Ease**: `power3.out` (decelerates like a real counter wheel)

### prefers-reduced-motion Fallback

Show the final number immediately. No digit scrolling. The `sr-only` span provides the accessible value regardless.

### Implementation Notes

- Each digit column contains "0123456789" as a vertical stack. `overflow: hidden` on the parent shows only one character at a time. `translateY` scrolls to the correct digit.
- The visual digit spans are `aria-hidden="true"`. A `sr-only` span contains the actual number for screen readers.
- `font-variant-numeric: tabular-nums` is essential for equal-width digits.
- For numbers with commas, separators are static characters between digit columns.
- Trigger on viewport entry (IntersectionObserver or ScrollTrigger), fire once.

### Alternative: Simple Counter-Up

For simpler counting (number incrementing without the odometer visual), use GSAP's `snap` on `textContent`:
```javascript
gsap.from(element, {
  textContent: 0,
  duration: 2,
  snap: { textContent: 1 },
  ease: 'power2.out',
  scrollTrigger: { trigger: element, start: 'top 80%' }
});
```

Or CSS-only with `@property`:
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
.counter::after { content: counter(num); }
```

The CSS-only approach works in Chromium and Safari 15.4+. GSAP is the cross-browser fallback.

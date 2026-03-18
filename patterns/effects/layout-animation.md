# Layout Animation (GSAP Flip)

GSAP's Flip plugin automates the FLIP (First, Last, Invert, Play) technique for animating between layout states. When an element changes position, size, or parent in the DOM, Flip captures the before/after states and creates a smooth animation between them. Free since GSAP v3.13.

### Shared CSS Contract

```
--duration-flip          Flip animation duration (0.5-0.8s)
--ease-flip              Flip easing (power2.inOut)
```

---

## flip-layout

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-flip

### Description

Animate elements between different layout positions — grid to list view, reordering filtered items, expanding a card to full-screen, or reparenting an element from one container to another.

### Implementation

```javascript
gsap.registerPlugin(Flip);

// 1. Capture current state
const state = Flip.getState('.card');

// 2. Make DOM/CSS changes
container.classList.toggle('grid-view');
// or: move element to new parent
// newParent.appendChild(element);

// 3. Animate from old state to new state
Flip.from(state, {
  duration: 0.6,
  ease: 'power2.inOut',
  stagger: 0.05,
  absolute: true,  // use position:absolute during animation
  onEnter: elements => gsap.fromTo(elements, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.4 }),
  onLeave: elements => gsap.to(elements, { opacity: 0, scale: 0, duration: 0.3 }),
});
```

### Use Cases
- Grid ↔ list view toggle
- Filter/sort animations (items rearrange smoothly)
- Card expand to detail view
- Tab content transitions
- Shared element transitions (before View Transitions API)
- Drag-and-drop reordering

### Animation Choreography

1. User clicks filter/toggle button
2. `Flip.getState()` captures every target element's position, size, opacity
3. DOM changes happen instantly (CSS class toggle, element reparenting)
4. `Flip.from()` reads the new state and creates tweens from old → new
5. Elements glide to their new positions over 0.5-0.8s
6. New items fade+scale in, removed items fade+scale out

### Accessibility
- `prefers-reduced-motion: reduce`: Layout changes happen instantly, no animation
- Announce layout change to screen readers: `aria-live="polite"` on the container
- Filter results count should be announced: "Showing 6 of 12 items"

### Implementation Notes
- `absolute: true` prevents layout thrashing during animation by pulling elements out of flow
- `stagger: 0.05` creates a wave effect when many elements move simultaneously
- `Flip.fit()` can match one element's position/size to another without reparenting
- Combine with ScrollTrigger for scroll-driven layout transitions
- Works with any CSS layout: grid, flexbox, absolute positioning

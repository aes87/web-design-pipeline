# SVG Animation

SVG animation brings vector graphics to life — morphing shapes between states, drawing paths progressively, and animating SVG attributes. GSAP's MorphSVG and DrawSVG plugins (free since v3.13) are the primary tools.

### Shared CSS Contract

```
--color-svg-stroke       SVG stroke color (from accent or foreground token)
--color-svg-fill         SVG fill color
--duration-svg           SVG animation duration (0.8-1.5s)
--ease-svg               SVG animation easing (power2.inOut)
```

### Shared Rules

- All SVG animations respect `prefers-reduced-motion: reduce` — show final state without animation
- SVGs used decoratively: `aria-hidden="true"` and `role="img"`
- SVGs with meaningful content: descriptive `<title>` and `<desc>` elements
- `pathLength="1"` on paths enables normalized dash-offset animation (0 to 1)

---

## morph-svg

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap + gsap-morphsvg

### Description

Smoothly morph one SVG shape into another. MorphSVG handles mismatched point counts, different path structures, and even morphing between `<circle>`, `<rect>`, `<polygon>` and `<path>` elements.

### Implementation

```javascript
gsap.registerPlugin(MorphSVGPlugin);

// Morph between two paths
gsap.to('#shape-start', {
  morphSVG: '#shape-end',
  duration: 1.2,
  ease: 'power2.inOut',
});

// Morph to a path string
gsap.to('#icon', {
  morphSVG: 'M10,50 C20,30 40,30 50,50 C60,70 80,70 90,50',
  duration: 0.8,
  ease: 'power3.out',
});

// Control morphing behavior
gsap.to('#shape', {
  morphSVG: {
    shape: '#target',
    shapeIndex: 'auto', // or a number to control point mapping
    type: 'rotational', // 'rotational' or 'linear'
    origin: '50% 50%',  // rotation origin for rotational type
  },
  duration: 1,
});
```

### Use Cases
- Icon state transitions (hamburger ↔ close, play ↔ pause)
- Logo animations on page load
- Interactive shape morphing on hover or scroll
- Data visualization transitions between chart states

### Accessibility
- `prefers-reduced-motion: reduce`: Show target shape immediately, no morph
- Add `aria-label` describing the current state for interactive morphs

---

## draw-svg

**Complexity**: L
**Performance cost**: 1
**Dependencies**: gsap + gsap-drawsvg

### Description

Animate SVG strokes as if being drawn with a pen. DrawSVG manipulates `stroke-dashoffset` and `stroke-dasharray` to progressively reveal or hide paths. Works on any SVG element with a stroke.

### Implementation

```javascript
gsap.registerPlugin(DrawSVGPlugin);

// Draw path from 0% to 100%
gsap.from('.draw-path', {
  drawSVG: 0,         // start at 0% drawn
  duration: 2,
  ease: 'power2.inOut',
});

// Draw from center outward
gsap.from('.draw-path', {
  drawSVG: '50% 50%', // middle point, expands outward
  duration: 1.5,
});

// Partial draw (draw from 20% to 80%)
gsap.to('.draw-path', {
  drawSVG: '20% 80%',
  duration: 1,
});

// Scroll-driven path drawing
gsap.from('.draw-path', {
  drawSVG: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '.draw-section',
    start: 'top center',
    end: 'bottom center',
    scrub: 1,
  }
});
```

### Use Cases
- Logo reveal on page load
- Timeline/roadmap path drawing on scroll
- Signature animation
- Illustration progressive reveal
- Connection lines between elements

### Accessibility
- `prefers-reduced-motion: reduce`: Show fully drawn paths immediately
- Decorative path drawing: `aria-hidden="true"` on the SVG

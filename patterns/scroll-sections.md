# Scroll-Driven Section Patterns

Scroll-driven patterns use scroll position to control animation progress, pin elements, or trigger reveals. These are the narrative backbone of award-winning sites — they turn scrolling into storytelling.

**Base stack**: Lenis (smooth scroll, 3KB) + GSAP ScrollTrigger. CSS `animation-timeline` for progressive enhancement where supported.

---

## Pin and Reveal

**Complexity**: M | **Cost**: 2 | **Deps**: gsap + scrolltrigger

### Description
A section pins in place while content within it animates — text reveals, images swap, progress indicators advance. The user scrolls through "chapters" within a fixed viewport.

### Implementation
```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.pin-section',
    start: 'top top',
    end: '+=300%',     // 3x viewport height of scroll distance
    pin: true,
    scrub: 1,          // smooth scrubbing
  },
});

tl.from('.pin-section__step-1', { opacity: 0, y: 40 })
  .from('.pin-section__step-2', { opacity: 0, y: 40 }, '+=0.2')
  .from('.pin-section__step-3', { opacity: 0, y: 40 }, '+=0.2');
```

### CSS Contract
- `--duration-*` not used (scroll-driven timing)
- `--ease-*` not used (scrub uses scroll position)
- Container needs explicit height or `min-height`

### Notes
- `end: '+=300%'` means the section is pinned for 3 viewport heights of scrolling
- `scrub: 1` adds 1 second of smoothing to the scrub
- Use `anticipatePin: 1` to prevent a jump when pinning starts

---

## Horizontal Scroll

**Complexity**: M | **Cost**: 2 | **Deps**: gsap + scrolltrigger

### Description
Vertical scrolling drives horizontal movement of a wide content strip. Used for portfolios, timelines, and galleries.

### Implementation
```javascript
const container = document.querySelector('.hscroll');
const strip = document.querySelector('.hscroll__strip');
const totalWidth = strip.scrollWidth - container.offsetWidth;

gsap.to(strip, {
  x: -totalWidth,
  ease: 'none',
  scrollTrigger: {
    trigger: container,
    start: 'top top',
    end: () => `+=${totalWidth}`,
    pin: true,
    scrub: 1,
    invalidateOnRefresh: true, // recalculate on resize
  },
});
```

### HTML Structure
```html
<section class="hscroll">
  <div class="hscroll__strip">
    <article class="hscroll__panel">Panel 1</article>
    <article class="hscroll__panel">Panel 2</article>
    <article class="hscroll__panel">Panel 3</article>
  </div>
</section>
```

### CSS
```css
.hscroll { overflow: hidden; }
.hscroll__strip { display: flex; width: max-content; }
.hscroll__panel { width: 100vw; flex-shrink: 0; }
```

---

## Sticky Stack

**Complexity**: M | **Cost**: 2 | **Deps**: gsap + scrolltrigger

### Description
Cards stack on top of each other as you scroll. Each card has `position: sticky` with increasing `top` values. Optional: earlier cards scale down slightly.

### CSS Implementation (No JS Required)
```css
.stack-card {
  position: sticky;
  top: calc(var(--card-index) * 40px + 80px);
  height: 70vh;
  border-radius: var(--radius-lg);
  transition: transform 0.3s;
}
```

### GSAP Enhancement (Scale-Down)
```javascript
document.querySelectorAll('.stack-card').forEach((card, i) => {
  gsap.to(card, {
    scale: 0.9 + (i * 0.02),
    opacity: 0.5,
    scrollTrigger: {
      trigger: card,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
});
```

### Notes
- Set `--card-index` via inline style or CSS counter: `style="--card-index: 0"`
- Works well for 3-6 cards. More than 6 feels tedious.
- Cards need enough scroll distance between them — use padding on the container.

---

## Parallax Layers

**Complexity**: M | **Cost**: 2 | **Deps**: gsap + scrolltrigger

### Description
Multiple elements move at different speeds relative to scroll, creating depth. Background moves slowly, foreground moves faster (or vice versa).

### Implementation
```javascript
gsap.utils.toArray('[data-parallax]').forEach(el => {
  const speed = parseFloat(el.dataset.parallax || '0.5');
  gsap.to(el, {
    yPercent: speed * -30,
    ease: 'none',
    scrollTrigger: {
      trigger: el.closest('section'),
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
});
```

### HTML Usage
```html
<section class="parallax-section">
  <img data-parallax="0.3" src="bg.jpg" class="parallax-bg" alt="">
  <h2 data-parallax="0.8">Headline</h2>
</section>
```

### CSS Scroll-Timeline Alternative
```css
@supports (animation-timeline: scroll()) {
  .parallax-bg {
    animation: parallax-shift linear both;
    animation-timeline: view();
    animation-range: entry 0% exit 100%;
  }
  @keyframes parallax-shift {
    from { transform: translateY(-15%); }
    to { transform: translateY(15%); }
  }
}
```

---

## Zoom Tunnel

**Complexity**: H | **Cost**: 3 | **Deps**: gsap + scrolltrigger OR three.js

### Description
Camera zooms into content as you scroll — elements scale up and fly past. Creates a "diving into" effect. Can be CSS-based (2D) or Three.js (true 3D).

### CSS Implementation (2D)
```javascript
gsap.to('.zoom-target', {
  scale: 10,
  opacity: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '.zoom-section',
    start: 'top top',
    end: '+=200%',
    pin: true,
    scrub: true,
  },
});
```

### Notes
- Use `transform-origin: center center` for symmetric zoom
- Layer multiple elements at different z-depths for parallax zoom
- 3D version: animate Three.js camera `position.z` driven by scroll progress

---

## Chapter Snap

**Complexity**: M | **Cost**: 2 | **Deps**: gsap + scrolltrigger

### Description
Full-viewport sections snap into place as you scroll. Each section fills the screen. Smooth transitions between chapters.

### CSS Implementation (No JS)
```css
.chapter-container {
  scroll-snap-type: y mandatory;
  overflow-y: auto;
  height: 100vh;
}
.chapter {
  scroll-snap-align: start;
  height: 100vh;
}
```

### GSAP Enhancement
```javascript
// Add entrance animations per chapter
document.querySelectorAll('.chapter').forEach(chapter => {
  gsap.from(chapter.querySelectorAll('.animate-in'), {
    y: 40, opacity: 0,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: chapter,
      start: 'top 80%',
    },
  });
});
```

---

## Progress Driven

**Complexity**: L | **Cost**: 1 | **Deps**: css-scroll-timeline OR gsap

### Description
An element's property (width, fill, rotation) is directly tied to scroll percentage. Used for progress bars, circular indicators, and fill effects.

### CSS-Only Implementation
```css
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--color-accent-primary);
  transform-origin: left;
  animation: progress-fill linear both;
  animation-timeline: scroll();
}

@keyframes progress-fill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

### Accessibility
- Progress indicators should have `role="progressbar"` and `aria-valuenow` if they convey meaningful progress
- Decorative progress indicators: `aria-hidden="true"`

---

## Batch Reveal

**Complexity**: L | **Cost**: 1 | **Deps**: gsap + scrolltrigger

### Description
Groups of elements (grid items, list items) animate in together when their container enters the viewport. Uses `ScrollTrigger.batch()` for efficient handling of many elements.

### Implementation
```javascript
ScrollTrigger.batch('.batch-item', {
  onEnter: (elements) => {
    gsap.from(elements, {
      y: 30,
      opacity: 0,
      stagger: 0.05,
      duration: 0.6,
      ease: 'power2.out',
    });
  },
  start: 'top 85%',
  once: true, // only trigger once
});
```

### Notes
- `ScrollTrigger.batch()` is much more efficient than individual triggers for 20+ elements
- `once: true` prevents re-animation on scroll back up
- Stagger 0.03-0.08s between items. Max total stagger ~0.6s to avoid long waits.
- Great for card grids, feature lists, team member grids

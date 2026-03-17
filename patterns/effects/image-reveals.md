# Image & Media Reveal Patterns

Techniques for revealing images and media elements with visual impact. These patterns control how visual content enters the viewport or responds to interaction.

---

## Clip-Path Wipe

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css OR gsap

### Description
Image reveals by animating `clip-path: inset()` from fully clipped to fully visible. The wipe direction (left-to-right, top-to-bottom, center-out) creates a curtain-like reveal.

### HTML Structure
```html
<figure class="reveal-wipe">
  <img src="image.jpg" alt="Description" loading="lazy">
</figure>
```

### CSS Contract
- `--duration-slow` — reveal duration
- `--ease-entrance` — easing curve

### Animation Choreography
1. Initial state: `clip-path: inset(0 100% 0 0)` (fully hidden from right)
2. On trigger: animate to `clip-path: inset(0 0 0 0)` (fully visible)
3. Duration: `--duration-slow` (500ms)
4. Directions: `inset(0 100% 0 0)` = left-to-right, `inset(100% 0 0 0)` = top-to-bottom, `inset(0 50% 0 50%)` = center-out

### CSS Implementation
```css
.reveal-wipe img {
  clip-path: inset(0 100% 0 0);
  transition: clip-path var(--duration-slow) var(--ease-entrance);
}
.reveal-wipe.is-visible img {
  clip-path: inset(0 0 0 0);
}
```

### Accessibility
- Image must have descriptive `alt` text
- Content is still in the DOM when clipped (screen readers see it immediately)
- `prefers-reduced-motion`: skip clip animation, show immediately

---

## Circle Expand

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css OR gsap

### Description
Image reveals from a small circle expanding to fill the frame. Creates a spotlight or portal effect.

### Animation Choreography
1. Initial: `clip-path: circle(0% at 50% 50%)`
2. Trigger: animate to `clip-path: circle(75% at 50% 50%)`
3. The center point can be positioned at the cursor location for interactive reveals

### CSS Implementation
```css
.reveal-circle img {
  clip-path: circle(0% at 50% 50%);
  transition: clip-path var(--duration-dramatic) var(--ease-dramatic);
}
.reveal-circle.is-visible img {
  clip-path: circle(75% at 50% 50%);
}
```

---

## Curtain Reveal

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap

### Description
A colored overlay panel slides away to reveal the image underneath. Two-step: overlay slides in, image appears, overlay slides out the other side.

### HTML Structure
```html
<figure class="reveal-curtain">
  <div class="reveal-curtain__overlay"></div>
  <img src="image.jpg" alt="Description" loading="lazy">
</figure>
```

### Animation Choreography (GSAP Timeline)
1. Overlay starts off-screen left: `transform: scaleX(0); transform-origin: left`
2. Phase 1: Overlay slides in (scaleX 0 → 1), duration 400ms
3. Image opacity flips from 0 to 1 (instant, while overlay covers)
4. Phase 2: Overlay slides out (transform-origin switches to right, scaleX 1 → 0), duration 400ms

### Accessibility
- Overlay is decorative (`aria-hidden="true"`)
- Image has `alt` text
- Reduced motion: show image immediately, no overlay animation

---

## Scale Overflow

**Complexity**: L
**Performance cost**: 1
**Dependencies**: css

### Description
Image starts slightly zoomed in and scales down to normal size on reveal. Container uses `overflow: hidden` to mask the edges during scale.

### CSS Implementation
```css
.reveal-scale {
  overflow: hidden;
}
.reveal-scale img {
  transform: scale(1.15);
  transition: transform var(--duration-dramatic) var(--ease-dramatic);
}
.reveal-scale.is-visible img {
  transform: scale(1);
}
```

---

## Parallax Image

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap + scrolltrigger

### Description
Image moves at a different speed than surrounding content as you scroll, creating a depth illusion. Container clips the overflow.

### Implementation Notes
```javascript
gsap.to('.parallax-img', {
  yPercent: -20,
  ease: 'none',
  scrollTrigger: {
    trigger: '.parallax-container',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
});
```

- Image should be ~120-130% taller than its container to prevent gaps
- Use `will-change: transform` during scroll, remove after
- `object-fit: cover` on the image for cropping

---

## SVG Mask Reveal

**Complexity**: M
**Performance cost**: 2
**Dependencies**: svg + gsap

### Description
An SVG shape (blob, circle, custom path) is used as a mask. The mask animates (scales, morphs, or draws) to reveal the image.

### HTML Structure
```html
<div class="reveal-mask">
  <svg class="reveal-mask__svg" viewBox="0 0 100 100">
    <defs>
      <mask id="reveal-mask-1">
        <circle cx="50" cy="50" r="0" fill="white" class="mask-shape"/>
      </mask>
    </defs>
  </svg>
  <img src="image.jpg" alt="Description" style="mask: url(#reveal-mask-1)">
</div>
```

### Animation Choreography
GSAP animates the SVG mask shape's `r` attribute from 0 to 70+. For blob reveals, animate the `d` path attribute using MorphSVG.

---

## Scroll-Scrubbed Video

**Complexity**: H
**Performance cost**: 3
**Dependencies**: canvas + gsap

### Description
Video playback position is tied to scroll position. The Apple product page pattern — a video (or image sequence) that plays as you scroll.

### Implementation Approaches

**Approach A: Image sequence on canvas**
```javascript
const frameCount = 120;
const canvas = document.querySelector('.video-canvas');
const ctx = canvas.getContext('2d');
const images = [];

// Preload frames
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = `frames/frame-${String(i).padStart(3, '0')}.jpg`;
  images.push(img);
}

gsap.to({ frame: 0 }, {
  frame: frameCount - 1,
  snap: 'frame',
  ease: 'none',
  scrollTrigger: {
    trigger: '.video-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    pin: true,
  },
  onUpdate: function() {
    const idx = Math.round(this.targets()[0].frame);
    ctx.drawImage(images[idx], 0, 0, canvas.width, canvas.height);
  },
});
```

**Approach B: HTML5 video currentTime**
```javascript
const video = document.querySelector('.scroll-video');
gsap.to(video, {
  currentTime: video.duration,
  ease: 'none',
  scrollTrigger: {
    trigger: '.video-section',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
  },
});
```

### Performance Notes
- Image sequence: preload all frames (memory cost ~50-200MB for 120 frames)
- Use WebP/AVIF for smaller frame files
- Video currentTime: simpler but less smooth (video decode isn't frame-accurate everywhere)
- Canvas approach gives 60fps if frames are pre-decoded

### Accessibility
- Provide a text summary of what the video shows
- Consider a play/pause button for users who want to watch at normal speed
- `prefers-reduced-motion`: show a static frame, disable scroll scrubbing

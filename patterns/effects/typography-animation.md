# Typography Animation Patterns

Text animation techniques for headlines, body copy reveals, and kinetic typography. Typography animation is the single most impactful technique in award-winning web design — it transforms static text into a narrative device.

---

## Split Text Reveal (GSAP SplitText)

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap + gsap-splittext

### Description
Text is split into characters, words, or lines, then each piece animates in with staggered timing. The core technique behind most award-winning text animations.

### Split Modes

**Character split** — Most dramatic. Best for short headlines (1-5 words).
```javascript
const split = new SplitText('.hero__headline', { type: 'chars' });
gsap.from(split.chars, {
  y: 40,
  opacity: 0,
  duration: 0.6,
  stagger: 0.03,
  ease: 'power3.out',
});
```

**Word split** — Balanced impact and readability. Best for headlines (5-15 words).
```javascript
const split = new SplitText('.hero__headline', { type: 'words' });
gsap.from(split.words, {
  y: 30,
  opacity: 0,
  duration: 0.8,
  stagger: 0.06,
  ease: 'power2.out',
});
```

**Line split** — Subtle, elegant. Best for paragraphs and longer text.
```javascript
const split = new SplitText('.intro__text', { type: 'lines' });
gsap.from(split.lines, {
  y: 20,
  opacity: 0,
  duration: 0.6,
  stagger: 0.1,
  ease: 'power2.out',
});
```

### HTML Structure
```html
<h1 class="hero__headline" data-split="words">
  Design is how it works.
</h1>
```

SplitText wraps each unit in a `<div>` with inline styles. The original text is preserved for screen readers.

### Timing by Aesthetic

| Aesthetic | Split | Stagger | Duration | Ease |
|-----------|-------|---------|----------|------|
| dark-luxury | words | 80ms | 0.8s | power3.out |
| editorial | lines | 100ms | 0.6s | power2.out |
| brutalist | chars | 20ms | 0.3s | none (linear) |
| japanese-minimalism | words | 120ms | 1.0s | power2.out |
| cyberpunk | chars | 15ms | 0.2s | power1.out |

### Accessibility
- SplitText preserves the original text in the DOM — screen readers read it normally
- `prefers-reduced-motion`: skip the staggered animation, fade the whole element in at once
- Never split text that users need to read quickly (error messages, warnings)

---

## Clip-Path Text Mask

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap

### Description
Text reveals by animating `clip-path` on each line or word, creating a "wipe" effect where text slides into view from behind an invisible mask.

### CSS + GSAP Implementation
```css
.text-clip-reveal span {
  display: inline-block;
  clip-path: inset(0 100% 0 0);
}
```

```javascript
const split = new SplitText('.text-clip-reveal', { type: 'words' });
// Wrap each word's div in a mask container for overflow clipping
split.words.forEach(word => {
  word.style.clipPath = 'inset(0 100% 0 0)';
});

gsap.to(split.words, {
  clipPath: 'inset(0 0% 0 0)',
  duration: 0.6,
  stagger: 0.05,
  ease: 'power3.out',
});
```

### Variant: Translate + Clip
Combine translateY with clip-path for text that slides up into view from below a baseline mask:
```javascript
gsap.from(split.lines, {
  y: '100%',
  clipPath: 'inset(100% 0 0 0)',
  duration: 0.8,
  stagger: 0.1,
  ease: 'power3.out',
});
```

---

## Blur-In Effect

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap

### Description
Text starts blurred and sharpens into focus. Creates a cinematic, dreamlike entrance.

### Implementation
```javascript
gsap.from('.blur-reveal', {
  filter: 'blur(12px)',
  opacity: 0,
  y: 20,
  duration: 1.2,
  ease: 'power2.out',
});
```

### Performance Notes
- `filter: blur()` is GPU-accelerated but expensive during animation
- Don't blur large blocks of text — use on headlines only
- Animate `blur(12px)` → `blur(0px)`, not the reverse (browser can cache the sharp state)
- `prefers-reduced-motion`: simple opacity fade, no blur

---

## Variable Font Animation

**Complexity**: M
**Performance cost**: 1
**Dependencies**: css OR gsap

### Description
Animate variable font axes (weight, width, slant, optical size, custom axes) for smooth typographic morphing. Requires a variable font.

### CSS Implementation (Weight Shift)
```css
@property --font-weight {
  syntax: '<number>';
  initial-value: 100;
  inherits: false;
}

.weight-animate {
  font-family: 'Inter Variable', sans-serif;
  font-variation-settings: 'wght' var(--font-weight);
  transition: --font-weight 0.6s var(--ease-standard);
}

.weight-animate:hover {
  --font-weight: 900;
}
```

### GSAP Implementation (Multi-Axis)
```javascript
gsap.to('.morph-text', {
  fontVariationSettings: '"wght" 900, "wdth" 125',
  duration: 1,
  ease: 'power2.inOut',
});
```

### Popular Variable Font Axes
- `wght` — Weight (100-900)
- `wdth` — Width (75-125)
- `slnt` — Slant (-15 to 0)
- `opsz` — Optical size (8-144)
- `GRAD` — Grade (custom)

---

## Kinetic Typography

**Complexity**: H
**Performance cost**: 2
**Dependencies**: gsap + gsap-splittext

### Description
Large-scale text animation where characters have independent physics-like motion — bouncing, rotating, scaling, with overlapping timing. Used for immersive hero sections and brand statements.

### Implementation Pattern
```javascript
const split = new SplitText('.kinetic-headline', { type: 'chars' });

const tl = gsap.timeline({ defaults: { ease: 'elastic.out(1, 0.5)' } });

tl.from(split.chars, {
  y: gsap.utils.random(-100, 100, true), // random Y per char
  rotation: gsap.utils.random(-30, 30, true),
  scale: 0,
  opacity: 0,
  duration: 1.2,
  stagger: {
    each: 0.04,
    from: 'center', // animate from center outward
  },
});
```

### Choreography Variants

**Cascade** — Characters fall in from top, one by one
```javascript
gsap.from(split.chars, {
  y: -80, opacity: 0, rotation: -10,
  stagger: { each: 0.03, from: 'start' },
  ease: 'bounce.out', duration: 0.8,
});
```

**Scramble** — Characters randomize before settling (typewriter/decoder effect)
```javascript
gsap.from(split.chars, {
  textContent: () => String.fromCharCode(Math.random() * 26 + 65),
  duration: 0.5,
  stagger: 0.03,
  snap: { textContent: 1 },
});
// Or use GSAP's ScrambleText plugin for built-in scramble
```

**Wave** — Characters oscillate in a sine wave pattern
```javascript
split.chars.forEach((char, i) => {
  gsap.from(char, {
    y: Math.sin(i * 0.5) * 40,
    opacity: 0,
    duration: 0.6,
    delay: i * 0.03,
    ease: 'power2.out',
  });
});
```

### Accessibility
- Kinetic text must settle into a readable final state within 2 seconds
- `prefers-reduced-motion`: show final state immediately, no character animation
- Ensure the text is fully readable after animation completes (no residual transforms)
- Never use kinetic typography for instructional or navigational text

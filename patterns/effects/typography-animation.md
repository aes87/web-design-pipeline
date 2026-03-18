# Typography Animation

Typography is the primary visual element in most award-winning web designs. Animated text is not decoration -- it is the hero. The way text enters, transforms, and responds to interaction communicates brand personality more than any other element.

GSAP SplitText is the primary tool. It splits HTML text into individual spans (per character, word, or line) without breaking semantics, then those spans become individually animatable targets. CSS `clip-path`, `@property`, and variable font features provide complementary techniques.

### Shared CSS Contract

```
--font-display           Display/headline typeface (must be loaded before splitting)
--font-size-display      Display text size (clamp responsive)
--font-weight-display    Display text weight
--line-height-display    Display text line-height (1.0-1.2 for large text)
--letter-spacing-display Letter spacing
--color-fg-hero          Text color
--color-accent           Accent/gradient color
--ease-dramatic          Slow expressive easing (power3.out / cubic-bezier(0.16, 1, 0.3, 1))
--ease-entrance          Standard entrance (power2.out)
--duration-reveal        Per-unit reveal duration (0.6-1.0s)
--stagger-char           Per-character stagger (0.02-0.04s)
--stagger-word           Per-word stagger (0.06-0.1s)
--stagger-line           Per-line stagger (0.1-0.15s)
```

### Font Loading Requirement

SplitText calculates line breaks based on rendered dimensions. Splitting before fonts load produces incorrect line breaks. Always wait:

```javascript
document.fonts.ready.then(() => {
  initTextAnimations();
});
```

Or use `document.fonts.load('1em "Display Font"').then(...)` for specific fonts.

### SplitText Basics

```javascript
const split = new SplitText('.hero__headline', {
  type: 'words,chars',  // 'chars', 'words', 'lines', or combinations
  charsClass: 'char',
  wordsClass: 'word',
  linesClass: 'line',
  mask: 'lines',         // built-in overflow:hidden mask on line wrappers
});

// Animate
gsap.from(split.words, {
  y: '100%',
  opacity: 0,
  stagger: 0.08,
  duration: 0.8,
  ease: 'power3.out',
});

// Cleanup on page leave or resize
split.revert(); // restores original HTML
```

### SplitText v3.13 Features (Rewrite)

SplitText was completely rewritten in GSAP v3.13 with ~14 new features and 50% smaller file size (~7KB):

**`autoSplit: true`**: Uses `ResizeObserver` + `document.fonts` to automatically revert and re-split when fonts load or the container resizes. Replaces the manual "Responsive Re-Split" pattern above:

```javascript
// Old approach: manual resize handler
// New approach: autoSplit handles everything
const split = new SplitText('.hero__headline', {
  type: 'words,chars',
  mask: 'lines',
  autoSplit: true, // auto re-splits on resize and font load
});
```

**`deepSlice`**: Correctly handles nested elements (`<strong>`, `<em>`, `<a>`) that span multiple lines by cloning and restructuring DOM. No more broken nested tags when splitting by lines.

**`Intl.Segmenter()`**: Correct splitting of complex emojis and international text (CJK, Arabic, Devanagari). Replaces the broken `.split("")` approach.

**Built-in masking**: The `mask` option adds overflow-hidden wrappers automatically for clean reveal effects without manual wrapper divs:
```javascript
const split = new SplitText('.headline', {
  type: 'words',
  mask: 'words', // each word gets overflow:hidden wrapper
});
// Words sliding up from below the mask line — clean reveal
gsap.from(split.words, { y: '100%', stagger: 0.08, duration: 0.8 });
```

**Screen reader accessibility**: Automatic ARIA attributes ensure split text remains accessible.

**Standalone usage**: SplitText can work independently from GSAP core for text splitting without animation.

### Responsive Re-Split

Line breaks change at different viewport widths. Re-split on resize:

```javascript
let split;
function initSplit() {
  if (split) split.revert();
  split = new SplitText('.hero__headline', { type: 'lines', mask: 'lines' });
  gsap.from(split.lines, { y: '100%', stagger: 0.1, duration: 0.8, ease: 'power3.out' });
}

// Debounced resize handler
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initSplit, 300);
});

document.fonts.ready.then(initSplit);
```

### Shared Accessibility Rules

- SplitText preserves the original text content in the DOM. Screen readers read the text normally -- the wrapping spans are invisible to assistive technology.
- `prefers-reduced-motion: reduce`: Skip SplitText entirely. Show text at full opacity in its final position. No animation.
- Do not split more than ~500 characters simultaneously. Beyond that, DOM overhead and animation performance degrade.
- Text must be readable in source order without JavaScript. The unsplit text is the fallback.

---

## Character Reveal (Stagger Chars)

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap + gsap-splittext

### Description

Each character animates individually with a stagger, creating a typewriter-like or cascading entrance. The most granular text animation -- use for short headlines (under 30 characters) where the individual character motion adds emphasis.

### Animation Choreography

**Slide-up from below** (masked):
```javascript
const split = new SplitText('.headline', { type: 'chars', mask: 'chars' });
gsap.from(split.chars, {
  y: '100%',
  stagger: 0.03,
  duration: 0.6,
  ease: 'power3.out',
});
```

**Fade + blur**:
```javascript
const split = new SplitText('.headline', { type: 'chars' });
gsap.from(split.chars, {
  opacity: 0,
  filter: 'blur(10px)',
  stagger: 0.03,
  duration: 0.5,
  ease: 'power2.out',
});
```

**Scale bounce**:
```javascript
const split = new SplitText('.headline', { type: 'chars' });
gsap.from(split.chars, {
  scale: 0,
  stagger: 0.04,
  duration: 0.6,
  ease: 'elastic.out(1, 0.5)',
});
```

**Rotation from below**:
```javascript
const split = new SplitText('.headline', { type: 'chars' });
gsap.from(split.chars, {
  rotationX: -90,
  y: 20,
  opacity: 0,
  stagger: 0.03,
  duration: 0.8,
  ease: 'power3.out',
  transformOrigin: 'bottom center',
});
```

### Timing by Aesthetic

| Aesthetic | Stagger | Duration | Ease | Style |
|-----------|---------|----------|------|-------|
| `dark-luxury` | 0.04s | 0.8s | `power3.out` | Slide-up, masked |
| `cyberpunk` | 0.02s | 0.4s | `power1.out` | Fade+blur, fast |
| `editorial` | 0.05s | 1.0s | `power2.out` | Slide-up, slow |
| `organic` | 0.04s | 0.7s | `elastic.out(1, 0.5)` | Scale bounce |
| `brutalist` | 0.02s | 0.3s | `none` (linear) | Hard cut, no ease |
| `japanese-minimalism` | 0.06s | 1.2s | `power2.inOut` | Fade only, very slow |

### Implementation Notes

- Cap stagger formula: `stagger = min(0.04, 1.5 / charCount)`. For 50 characters at 0.03s stagger, total time is 1.5s -- any longer feels sluggish.
- Character animations look best with monospace or geometric sans-serif fonts where each character has consistent width.
- For long text, split by words instead. Character-level animation on body paragraphs is excessive.

---

## Word Reveal (Stagger Words)

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap + gsap-splittext

### Description

Words animate as units with stagger. The default and most versatile text animation -- works for any headline length. Reads naturally because words are the cognitive unit humans process.

### Animation Choreography

**Slide-up with mask** (most common award-winning pattern):
```javascript
const split = new SplitText('.headline', { type: 'words', mask: 'words' });
gsap.from(split.words, {
  y: '100%',
  stagger: 0.08,
  duration: 0.8,
  ease: 'power3.out',
});
```

The `mask: 'words'` option adds `overflow: hidden` wrappers around each word automatically. Words slide up from below the mask line, creating a clean reveal without visible translation from off-screen.

**Fade + translateY** (softer entrance):
```javascript
const split = new SplitText('.headline', { type: 'words' });
gsap.from(split.words, {
  y: 30,
  opacity: 0,
  stagger: 0.08,
  duration: 0.6,
  ease: 'power2.out',
});
```

### Timing by Aesthetic

| Aesthetic | Stagger | Duration | Ease | Style |
|-----------|---------|----------|------|-------|
| `dark-luxury` | 0.1s | 1.0s | `power3.out` | Masked slide-up |
| `editorial` | 0.08s | 0.8s | `power3.out` | Masked slide-up |
| `minimalist` | 0.12s | 0.6s | `power2.out` | Simple fade |
| `corporate-clean` | 0.06s | 0.5s | `power2.out` | Fade + translateY |
| `immersive` | 0.15s | 1.2s | `power3.out` | Masked slide-up, slow |

### Implementation Notes

- Word-level is the sweet spot for most use cases. It reads naturally and works for headlines of any length (5-20 words).
- The masked slide-up is the single most iconic animation pattern in award-winning web design. If only one text animation is used, this is it.
- Combine with scroll-trigger for below-fold headings: trigger on viewport entry, play once.

---

## Line Reveal (Stagger Lines)

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap + gsap-splittext

### Description

Text splits into lines (based on actual rendered line breaks), and each line animates as a unit. Best for multi-line paragraphs or headlines where word-level stagger would be too granular.

### Animation Choreography

**Masked slide-up per line**:
```javascript
const split = new SplitText('.headline', { type: 'lines', mask: 'lines' });
gsap.from(split.lines, {
  y: '100%',
  stagger: 0.12,
  duration: 0.8,
  ease: 'power3.out',
});
```

**Fade + rotate per line** (editorial feel):
```javascript
const split = new SplitText('.text-block', { type: 'lines' });
gsap.from(split.lines, {
  opacity: 0,
  y: 20,
  rotateZ: 1, // subtle tilt
  stagger: 0.1,
  duration: 0.7,
  ease: 'power2.out',
});
```

### Implementation Notes

- Line detection depends on the rendered layout -- different viewport widths produce different line breaks. Always re-split on resize.
- `mask: 'lines'` creates overflow-hidden wrappers per line for clean slide-up reveals.
- Line-level works well for body text and longer paragraphs (where word-level stagger would take too long).
- Combine: split `type: 'lines,words'`, animate lines first (stagger), then words within each line (smaller stagger).

---

## Clip-Path Text Mask

**Complexity**: M
**Performance cost**: 1
**Dependencies**: css | gsap

### Description

Text is revealed by animating a `clip-path` on the text container. A rectangular or custom-shaped mask wipes across the text, revealing it progressively. Unlike SplitText reveals, this keeps the text as a single element -- no splitting required.

### CSS Implementation

```css
.clip-text {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.clip-text.is-visible {
  clip-path: inset(0 0 0 0);
}
```

### GSAP Implementation

```javascript
gsap.from('.clip-text', {
  clipPath: 'inset(0 100% 0 0)',
  duration: 1.2,
  ease: 'power3.inOut',
  scrollTrigger: {
    trigger: '.clip-text',
    start: 'top 80%',
  }
});
```

### Variations

| Clip direction | `clip-path` from | `clip-path` to |
|---------------|------------------|----------------|
| Left to right | `inset(0 100% 0 0)` | `inset(0 0 0 0)` |
| Right to left | `inset(0 0 0 100%)` | `inset(0 0 0 0)` |
| Top to bottom | `inset(0 0 100% 0)` | `inset(0 0 0 0)` |
| Bottom to top | `inset(100% 0 0 0)` | `inset(0 0 0 0)` |
| Center out | `inset(0 50% 0 50%)` | `inset(0 0 0 0)` |
| Circle expand | `circle(0% at 50% 50%)` | `circle(100% at 50% 50%)` |

### Timing Values

- **Duration**: 0.8-1.2s
- **Ease**: `power3.inOut` (smooth acceleration and deceleration)
- **Delay**: often paired with a sequence (image wipes first, text follows)

### Accessibility

- `prefers-reduced-motion: reduce`: `clip-path: none`. Text visible immediately.

### Implementation Notes

- `clip-path` on text is GPU-accelerated in modern browsers and performs well.
- This approach does not require SplitText -- it works on any element. Good for paragraphs, pull quotes, or any block of text.
- Combine with a colored pseudo-element that wipes across first (curtain effect), then the clip-path reveals the text underneath.

---

## Variable Font Animation

**Complexity**: H
**Performance cost**: 2
**Dependencies**: css + @property | gsap

### Description

Variable fonts have animatable axes: `font-weight` (wght), `font-width` (wdth), `font-stretch`, `font-style`, and custom axes. Animating these on hover, scroll, or during page entrance creates organic, living typography. Requires a variable font file.

### CSS Implementation

```css
@property --font-wght {
  syntax: "<number>";
  inherits: false;
  initial-value: 400;
}

.variable-text {
  font-family: 'Inter Variable', sans-serif;
  font-variation-settings: 'wght' var(--font-wght);
  transition: --font-wght 0.6s var(--ease-standard);
}

.variable-text:hover {
  --font-wght: 900;
}
```

### Scroll-Driven Weight Shift

```css
@keyframes weight-shift {
  from { --font-wght: 100; }
  to { --font-wght: 900; }
}

.variable-text {
  font-variation-settings: 'wght' var(--font-wght);
  animation: weight-shift linear both;
  animation-timeline: view();
  animation-range: entry 20% entry 80%;
}
```

### Per-Character Variable Font Animation

```javascript
const split = new SplitText('.variable-headline', { type: 'chars' });

// Weight wave: each character animates weight in a staggered wave
split.chars.forEach((char, i) => {
  gsap.to(char, {
    fontWeight: 900,
    duration: 1,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: -1,
    delay: i * 0.1,
  });
});
```

### Cursor Proximity Weight

```javascript
const chars = document.querySelectorAll('.char');
document.addEventListener('mousemove', (e) => {
  chars.forEach(char => {
    const rect = char.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
    const weight = gsap.utils.mapRange(0, 200, 900, 400, Math.min(dist, 200));
    gsap.to(char, { fontWeight: weight, duration: 0.3, ease: 'power2.out' });
  });
});
```

### Timing by Aesthetic

| Aesthetic | Axis | Animation | Notes |
|-----------|------|-----------|-------|
| `dark-luxury` | wght 300->700 | Slow entrance, 1.5s | Elegant weight shift |
| `brutalist` | wght 100->900 | Instant, no transition | Dramatic toggle |
| `organic` | wght + wdth | Wave, cursor proximity | Living, responsive feel |
| `editorial` | wght 400->700 | Scroll-driven | Weight increases as you read |
| `cyberpunk` | wght + slnt | Glitch-like rapid switching | Random axis values on interval |

### Accessibility

- `prefers-reduced-motion: reduce`: Show text at its final weight. No animation of font axes.
- Variable font animations do not affect readability if the text settles at a legible weight.
- Continuous wave animations should be optional (triggered by hover, not permanent).

### Implementation Notes

- **Font file required**: The font must be a variable font file (.woff2 with variation axes). Not all fonts have `wdth` or custom axes -- check the font documentation.
- **`@property` required**: To animate `--font-wght` with CSS transitions, it must be registered via `@property`. Without registration, the transition snaps instead of interpolating.
- **Performance**: `font-variation-settings` changes trigger text re-layout. Animating it on many elements simultaneously (like per-character cursor proximity) can be expensive. Use `will-change: contents` on the container.
- **Common variable fonts for web**: Inter Variable, Roboto Flex, Source Sans Variable, Climate Crisis (experimental axes), Recursive.
- Animate `font-weight` directly (not `font-variation-settings`) when only the weight axis is needed -- it is better supported and simpler.

### Recommended Variable Fonts for Web (2025-2026)

| Font | Axes | Style | Source |
|------|------|-------|--------|
| **Inter Variable** | wght (100-900) | Screen-optimized UI sans | Google Fonts |
| **Roboto Flex** | wght, wdth, opsz, GRAD | Versatile sans, many axes | Google Fonts |
| **Source Sans Variable** | wght, ital | Reliable body text sans | Google Fonts |
| **Climate Crisis** | YEAR (experimental) | Display, year-based axis | Google Fonts |
| **Recursive** | wght, slnt, CASL, CRSV, MONO | Mono/sans, 5 axes | Google Fonts |
| **Fraunces** | wght, opsz, SOFT, WONK | Display serif, fun axes | Google Fonts |

### Advanced: Multi-Axis Animation

Animate multiple variable font axes simultaneously for expressive effects:

```javascript
// Combine weight + width + slant on scroll
gsap.to('.multi-axis-text', {
  fontWeight: 900,
  fontStretch: '125%',
  fontStyle: 'oblique 12deg',
  ease: 'none',
  scrollTrigger: {
    trigger: '.multi-axis-section',
    start: 'top center',
    end: 'bottom center',
    scrub: 1,
  }
});
```

### CSS Scroll-Driven Variable Font Animation

```css
@property --font-wght {
  syntax: "<number>";
  inherits: false;
  initial-value: 400;
}

.scroll-weight-text {
  font-variation-settings: 'wght' var(--font-wght);
  animation: weight-scroll linear both;
  animation-timeline: view();
  animation-range: entry 20% entry 80%;
}

@keyframes weight-scroll {
  from { --font-wght: 100; }
  to { --font-wght: 900; }
}
```

---

## Kinetic Typography

**Complexity**: H
**Performance cost**: 2
**Dependencies**: gsap + gsap-splittext + gsap-scrolltrigger

### Description

Large display text that moves, transforms, and rearranges on scroll or interaction. Characters spread apart, rotate individually, follow curves, or rearrange into new layouts. This is the most expressive text animation, used for brand statements and immersive experiences.

### Scroll-Driven Letter Spacing

```javascript
gsap.to('.kinetic-text', {
  letterSpacing: '0.5em',
  ease: 'none',
  scrollTrigger: {
    trigger: '.kinetic-section',
    start: 'top center',
    end: 'bottom center',
    scrub: 1,
  }
});
```

### Per-Character Rotation on Scroll

```javascript
const split = new SplitText('.kinetic-text', { type: 'chars' });
split.chars.forEach((char, i) => {
  gsap.to(char, {
    rotation: 360,
    ease: 'none',
    scrollTrigger: {
      trigger: '.kinetic-section',
      start: 'top center',
      end: 'bottom center',
      scrub: true,
    }
  });
});
```

### Horizontal Scrolling Text Marquee

```html
<div class="marquee" aria-hidden="true">
  <div class="marquee__track">
    <span class="marquee__text">BRAND STATEMENT &mdash; </span>
    <span class="marquee__text">BRAND STATEMENT &mdash; </span>
    <span class="marquee__text">BRAND STATEMENT &mdash; </span>
  </div>
</div>
```

```css
.marquee {
  overflow: hidden;
  white-space: nowrap;
}

.marquee__track {
  display: inline-flex;
  animation: marquee 20s linear infinite;
}

@keyframes marquee {
  to { transform: translateX(-33.33%); }
}
```

The text is repeated 3x. The animation translates by -33.33% (one repetition), then loops -- creating the illusion of infinite scrolling.

### Stroke/Fill Text

```css
.stroke-text {
  -webkit-text-stroke: 2px var(--color-fg-hero);
  color: transparent;
  transition: color 0.8s var(--ease-dramatic);
}

.stroke-text.is-filled {
  color: var(--color-fg-hero);
}
```

Scroll-driven: animate from stroke-only to filled on scroll progress:

```javascript
gsap.to('.stroke-text', {
  color: 'var(--color-fg-hero)',
  ease: 'none',
  scrollTrigger: {
    trigger: '.stroke-text',
    start: 'top 70%',
    end: 'top 30%',
    scrub: true,
  }
});
```

### Text Along a Path (SVG)

```html
<svg viewBox="0 0 800 200" class="path-text">
  <path id="textPath" d="M 0 150 Q 200 50 400 150 Q 600 250 800 150" fill="none" />
  <text>
    <textPath href="#textPath" class="path-text__content">
      Text that follows a curved path
    </textPath>
  </text>
</svg>
```

Animate `startOffset` with GSAP to scroll text along the path:
```javascript
gsap.to('.path-text__content', {
  attr: { startOffset: '100%' },
  ease: 'none',
  scrollTrigger: {
    trigger: '.path-text',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1,
  }
});
```

### Timing by Aesthetic

| Aesthetic | Pattern | Notes |
|-----------|---------|-------|
| `dark-luxury` | Slow stroke-to-fill on scroll | Dramatic, reveals gradually |
| `brutalist` | Per-char random rotation, no ease | Intentionally chaotic |
| `editorial` | Marquee with serif typeface | Classic editorial device |
| `immersive` | Full kinetic (letter-spacing + rotation on scroll) | Total text transformation |
| `japanese-minimalism` | Minimal: slow fade with wide tracking | Restraint as expression |
| `cyberpunk` | Glitch marquee with `font-variation-settings` jitter | Digital instability |

### Accessibility

- `prefers-reduced-motion: reduce`: All kinetic text is static. Show at final state. Marquees stop.
- Marquees: `aria-hidden="true"` if the text is repeated/decorative. If the marquee contains meaningful content, include a static version elsewhere in the DOM.
- Kinetic text should enhance, not replace, readable content. The same message should be accessible without animation.

### Implementation Notes

- Kinetic typography is the most visually impactful but also the highest risk for overdoing it. One kinetic section per page is usually enough.
- Large font sizes (80-200px+) are required for kinetic effects to read well. Small text in motion is just noise.
- For marquees, use `will-change: transform` on the track. CSS animation is more efficient than GSAP for simple linear translation.
- Stroke text (`-webkit-text-stroke`) has some cross-browser rendering differences. Test on Safari and Firefox.
- Scroll-driven kinetic typography works best in the `immersive` aesthetic where the entire page is a narrative experience.

---

## Blur-In Effect

**Complexity**: M
**Performance cost**: 2
**Dependencies**: gsap + gsap-splittext | css

### Description

Text materializes from a blurred state to sharp focus. Each word or character starts fully blurred and transparent, then resolves to clear, readable text. Creates a dreamlike entrance that works especially well with `dark-luxury`, `glassmorphism`, and `japanese-minimalism` aesthetics.

### GSAP Implementation

```javascript
const split = new SplitText('.blur-headline', { type: 'words' });
gsap.from(split.words, {
  opacity: 0,
  filter: 'blur(12px)',
  stagger: 0.1,
  duration: 0.8,
  ease: 'power2.out',
});
```

### CSS-Only Implementation

```css
.blur-text {
  opacity: 0;
  filter: blur(12px);
  transition:
    opacity 0.8s var(--ease-entrance),
    filter 0.8s var(--ease-entrance);
}

.blur-text.is-visible {
  opacity: 1;
  filter: blur(0);
}
```

For stagger without JS (limited):
```css
.blur-text span:nth-child(1) { transition-delay: 0ms; }
.blur-text span:nth-child(2) { transition-delay: 80ms; }
.blur-text span:nth-child(3) { transition-delay: 160ms; }
/* ... */
```

### Timing Values

| Aesthetic | Blur amount | Duration | Stagger | Ease |
|-----------|------------|----------|---------|------|
| `dark-luxury` | 12px | 1.0s | 0.12s | `power3.out` |
| `glassmorphism` | 20px | 1.2s | 0.1s | `power2.out` |
| `japanese-minimalism` | 8px | 1.5s | 0.15s | `power2.inOut` |
| `editorial` | 6px | 0.6s | 0.08s | `power2.out` |
| `cyberpunk` | 15px | 0.4s | 0.03s | `power1.out` |

### Accessibility

- `prefers-reduced-motion: reduce`: Text appears at full opacity and zero blur immediately. No transition.
- The blur is purely decorative. Text in the DOM is always accessible to screen readers regardless of filter state.

### Implementation Notes

- `filter: blur()` is partially GPU-accelerated in modern browsers. Performance is acceptable for text elements but can be expensive on large images.
- Blur amount: 8-15px is the sweet spot. Less than 5px is barely noticeable. More than 20px takes too long to resolve and feels sluggish.
- Combine blur-in with translateY for a compound entrance: `filter: blur(12px); opacity: 0; y: 20` -> `filter: blur(0); opacity: 1; y: 0`.
- The CSS-only version requires pre-split markup (each word in a `<span>`). SplitText automates this.
- For `glassmorphism`, combine the blur-in text with a `backdrop-filter: blur()` container for a cohesive blurred-glass aesthetic.

---

## Text Scramble/Decode

**Complexity**: M
**Performance cost**: 1
**Dependencies**: gsap (TextPlugin) | js

### Description

Characters start as random symbols and resolve to the correct text, letter by letter. Creates a "decoding" or "hacking" effect. Pairs well with `cyberpunk`, `retro-futurism`, and tech aesthetics.

### GSAP TextPlugin Implementation

```javascript
gsap.to('.scramble-text', {
  duration: 2,
  text: {
    value: 'The decoded message',
    newClass: 'resolved',
    delimiter: '',
    speed: 0.5,
    scrambleText: {
      chars: '01!@#$%&*',
      revealDelay: 0.5,
      tweenLength: true,
    }
  },
  ease: 'none',
});
```

### Vanilla JS Implementation

```javascript
function scrambleText(element, finalText, duration = 2000) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  const frames = duration / 16; // ~60fps
  const textLength = finalText.length;
  let frame = 0;

  const interval = setInterval(() => {
    const progress = frame / frames;
    const resolved = Math.floor(progress * textLength);

    let display = '';
    for (let i = 0; i < textLength; i++) {
      if (i < resolved) {
        display += finalText[i];
      } else {
        display += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    element.textContent = display;
    frame++;

    if (frame > frames) {
      clearInterval(interval);
      element.textContent = finalText;
    }
  }, 16);
}
```

### Timing Values

- **Total duration**: 1.5-3s (depends on text length)
- **Character resolution**: left-to-right, 1-2 characters per 50ms
- **Scramble character set**: match the aesthetic (`01` for cyberpunk, `!@#` for hacker, latin chars for editorial)
- **Trigger**: on viewport entry or after a delay

### Accessibility

- `prefers-reduced-motion: reduce`: Show final text immediately. No scramble animation.
- The element's `textContent` changes rapidly during animation. Add `aria-label` with the final text to prevent screen readers from reading intermediate states.
- Alternatively, use a separate `sr-only` element with the final text and `aria-hidden="true"` on the animated element.

### Implementation Notes

- The GSAP TextPlugin `scrambleText` feature handles all the complexity (character replacement, reveal timing, delimiter handling). Prefer it over custom implementations.
- Monospace fonts make the scramble effect more convincing because character widths do not change.
- For proportional fonts, use `font-variant-numeric: tabular-nums` and keep scramble characters similar in width to the final characters.
- The scramble effect works best on short text (headlines, numbers, labels). On long paragraphs, it is unreadable and annoying.

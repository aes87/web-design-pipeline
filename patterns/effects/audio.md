# Audio & Sound Design

Sound design adds a multi-sensory dimension to web experiences. Audio cues reinforce interactions, ambient sound creates atmosphere, and spatial audio adds depth to 3D scenes. Sound is a differentiator on award-winning sites — few use it, but those that do create memorable experiences.

**Critical rule**: All audio MUST be opt-in (user-initiated). Browser autoplay policies prevent audio from playing without user interaction. Never autoplay sound.

### Shared CSS Contract

```
--audio-enabled          Boolean: whether the user has opted into audio
```

### Shared Rules

- Audio is ALWAYS opt-in — provide a visible mute/unmute toggle
- Initial state: muted. User must explicitly enable sound.
- `prefers-reduced-motion: reduce`: Consider muting audio by default (sound can contribute to vestibular discomfort in some users)
- Provide visual feedback for every audio-triggered event (never rely on sound alone)
- Keep audio files small: prefer Web Audio API synthesis over large audio files
- Spatial audio must degrade gracefully to stereo or mono

---

## ambient-audio

**Complexity**: M
**Performance cost**: 1
**Dependencies**: web-audio-api

### Description

Background ambient sound that creates atmosphere — low drones, nature sounds, abstract textures. Loops seamlessly, responds to scroll position (volume/filtering), and can crossfade between sections.

### Implementation

```javascript
class AmbientAudio {
  constructor() {
    this.ctx = null; // Lazy init on user interaction
    this.enabled = false;
  }

  async init() {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(this.ctx.destination);
  }

  async loadTrack(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    this.audioBuffer = await this.ctx.decodeAudioData(buffer);
  }

  play() {
    if (!this.ctx) return;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.loop = true;
    this.source.connect(this.gainNode);
    this.source.start();
    // Fade in
    this.gainNode.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 1);
    this.enabled = true;
  }

  setVolume(value) {
    if (!this.ctx) return;
    this.gainNode.gain.linearRampToValueAtTime(
      value, this.ctx.currentTime + 0.1
    );
  }

  stop() {
    if (!this.source) return;
    this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    setTimeout(() => this.source?.stop(), 500);
    this.enabled = false;
  }
}

// Usage
const ambient = new AmbientAudio();

// Init on first user interaction (required by browsers)
document.querySelector('.audio-toggle').addEventListener('click', async () => {
  if (!ambient.ctx) {
    await ambient.init();
    await ambient.loadTrack('assets/ambient-loop.mp3');
  }
  ambient.enabled ? ambient.stop() : ambient.play();
});

// Scroll-driven volume
window.addEventListener('scroll', () => {
  if (!ambient.enabled) return;
  const progress = window.scrollY / document.body.scrollHeight;
  ambient.setVolume(0.3 - progress * 0.2); // Fade out as user scrolls
});
```

### Audio Toggle UI

```html
<button class="audio-toggle" aria-label="Toggle sound" aria-pressed="false">
  <svg class="audio-toggle__icon" aria-hidden="true"><!-- speaker icon --></svg>
</button>
```

The toggle must be visible, accessible, and clearly indicate the current state.

### Accessibility

- Audio is muted by default — user must opt in
- Toggle button has `aria-pressed` state and `aria-label`
- Visual feedback accompanies every sound event
- `prefers-reduced-motion: reduce`: Consider keeping audio disabled by default

---

## interaction-sounds

**Complexity**: L
**Performance cost**: 1
**Dependencies**: web-audio-api

### Description

Short, subtle sound effects triggered by user interactions — clicks, hovers, page transitions. Synthesized with Web Audio API oscillators (no audio file needed) for instant response and tiny footprint.

### Implementation

```javascript
class InteractionSounds {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    this.ctx = new AudioContext();
  }

  // Synthesize a short click/tap sound
  playClick() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Synthesize a hover sound (higher, softer)
  playHover() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Synthesize a transition whoosh
  playTransition() {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
}
```

### Use Cases
- Button click confirmation
- Navigation hover feedback
- Page transition accompaniment
- Form submission success/error
- Scroll milestone (chapter change in snap-scroll sections)

### Accessibility
- All sounds are opt-in (muted by default)
- Every sound has a corresponding visual feedback
- Sound durations are under 300ms (non-disruptive)
- No sound on `prefers-reduced-motion: reduce`

---

## spatial-audio

**Complexity**: H
**Performance cost**: 2
**Dependencies**: web-audio-api + three.js (optional)

### Description

3D positional audio where sounds appear to come from specific locations in the scene. Combined with Three.js 3D visuals, spatial audio creates immersive environments. Sounds pan left/right, fade with distance, and change character based on listener orientation.

### Implementation

```javascript
// Web Audio API spatial audio
const ctx = new AudioContext();
const listener = ctx.listener;

// Position the listener (matches camera position in 3D scene)
listener.positionX.value = 0;
listener.positionY.value = 0;
listener.positionZ.value = 0;

// Create a spatial audio source
const panner = ctx.createPanner();
panner.panningModel = 'HRTF';         // Head-related transfer function
panner.distanceModel = 'inverse';
panner.refDistance = 1;
panner.maxDistance = 100;
panner.rolloffFactor = 1;
panner.coneInnerAngle = 360;

// Position the sound source in 3D space
panner.positionX.value = 5;   // 5 units to the right
panner.positionY.value = 0;
panner.positionZ.value = -3;  // 3 units ahead

// Connect: source → panner → destination
source.connect(panner).connect(ctx.destination);

// Update listener position on scroll/interaction
function updateListenerPosition(x, y, z) {
  listener.positionX.linearRampToValueAtTime(x, ctx.currentTime + 0.1);
  listener.positionY.linearRampToValueAtTime(y, ctx.currentTime + 0.1);
  listener.positionZ.linearRampToValueAtTime(z, ctx.currentTime + 0.1);
}
```

### Three.js Integration

```javascript
// Three.js AudioListener attaches to the camera
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

// Create positional audio in the 3D scene
const sound = new THREE.PositionalAudio(audioListener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('assets/ambient.mp3', (buffer) => {
  sound.setBuffer(buffer);
  sound.setRefDistance(10);
  sound.setLoop(true);
  sound.play();
});

// Attach to a 3D object — sound follows the object's position
mesh.add(sound);
```

### Use Cases
- 3D portfolio with ambient sounds positioned at each project
- Interactive environments with sound sources at scene locations
- Audio-reactive 3D visualizers (Three.js + Web Audio API analyzer)
- Virtual exhibition/gallery spaces with spatial narration

### Accessibility
- All spatial audio is opt-in
- Provide fallback stereo/mono for devices without spatial audio support
- Visual indicators show sound source positions
- Transcript or text alternative for narrated spatial audio

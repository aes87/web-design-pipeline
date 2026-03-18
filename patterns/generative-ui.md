# Generative UI (Future Pattern)

Generative UI is an emerging pattern where the interface restructures itself in real-time based on user intent, behavior, or AI inference. Instead of static layouts, the page adapts its structure, content, and navigation per user.

**Status**: Emerging. Google and Vercel both ship Generative UI primitives (2025-2026). This pattern is documented for future pipeline phases when dynamic/personalized sites are in scope.

**Current pipeline scope**: The web-design-pipeline generates static HTML/CSS/JS. Generative UI requires a runtime (server or client-side AI). This pattern documents the architectural direction for Phase 5+.

---

## Concepts

### Machine Experience (MX) Design

Design for AI systems as primary consumers alongside humans:
- Semantic HTML with clear hierarchical structure (AI can parse and summarize)
- Structured data (`schema.org`, JSON-LD) for AI discovery
- Content designed for extraction and recomposition by AI search engines
- Meaningful heading hierarchy, landmark roles, and descriptive link text

### Adaptive Layouts

Layouts that restructure based on user profile or behavior:
- First-time visitor: guided onboarding flow, expanded hero, feature highlights
- Returning visitor: compressed hero, direct access to key actions, personalized content order
- Mobile user: simplified layout, touch-optimized interactions, reduced animation complexity
- High-engagement user: advanced features surfaced, deeper content accessible

### AI-Driven Personalization Levels

| Level | What Adapts | Runtime Required |
|-------|-------------|-----------------|
| 0. Static | Nothing | None (current pipeline) |
| 1. Token-level | Colors, fonts, spacing via CSS custom properties | CSS class toggle |
| 2. Content-level | Headlines, CTAs, images swap per segment | Lightweight JS |
| 3. Layout-level | Section order, grid structure, component variants | Server or edge function |
| 4. Generative | Entire page structure generated per user intent | AI runtime (Vercel AI SDK, etc.) |

### Implementation Path for This Pipeline

**Level 0 (current)**: Static HTML/CSS/JS from briefs. No personalization.

**Level 1 (achievable now)**: Generate multiple CSS token sets in `tokens.json`. JavaScript detects user preference (time of day, locale, referrer) and swaps the `:root` token set:

```javascript
// Example: time-based theme
const hour = new Date().getHours();
const theme = hour >= 18 || hour < 6 ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', theme);
```

```css
:root[data-theme="dark"] {
  --color-bg-base: oklch(0.13 0.01 260);
  --color-fg-base: oklch(0.95 0.01 90);
}
:root[data-theme="light"] {
  --color-bg-base: oklch(0.98 0.01 90);
  --color-fg-base: oklch(0.13 0.01 260);
}
```

**Level 2+**: Requires a server runtime. Outside current pipeline scope. Document as Phase 5+ goal.

---

## Accessibility Considerations

- Personalization must not remove accessibility features
- User must be able to override AI-driven layout changes
- Reduced motion preferences must persist across personalization variants
- Screen reader experience must be consistent regardless of personalization level
- WCAG AA compliance applies to ALL generated variants, not just the default

---

## References

- [Generative UI — Google Research](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/)
- [Vercel AI SDK — Generative UI](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces)
- [Machine Experience Design — Index.dev](https://www.index.dev/blog/web-design-trends)

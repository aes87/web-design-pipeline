import { readFile, writeFile } from 'node:fs/promises';

/**
 * Parse a YAML-like brief and generate CSS custom properties.
 * This is a lightweight parser for the subset of YAML used in design briefs.
 * For full YAML support, add js-yaml as a dependency.
 *
 * @param {Object} brief - parsed brief object
 * @returns {string} CSS :root block with custom properties
 */
export function generateCSS(brief) {
  const lines = [':root {'];

  // Colors
  if (brief.color?.palette) {
    lines.push('  /* Colors */');
    flattenTokens(brief.color.palette, 'color', lines);
  }

  // Typography
  if (brief.typography) {
    lines.push('');
    lines.push('  /* Typography */');
    if (brief.typography.fonts) {
      for (const [role, font] of Object.entries(brief.typography.fonts)) {
        const stack = font.fallback
          ? `'${font.family}', ${font.fallback}`
          : `'${font.family}', sans-serif`;
        lines.push(`  --font-${role}: ${stack};`);
      }
    }

    // Type scale from ratio
    if (brief.typography.scale?.method === 'ratio') {
      const base = brief.typography.scale.base_size || '1rem';
      const ratio = brief.typography.scale.ratio || 1.25;
      const baseNum = parseFloat(base);
      const unit = base.replace(/[\d.]/g, '') || 'rem';

      for (let step = -1; step <= 6; step++) {
        const size = baseNum * Math.pow(ratio, step);
        const name = step < 0 ? `text-sm` : `text-${step === 0 ? 'base' : `${step}`}`;
        lines.push(`  --${name}: ${round(size)}${unit};`);
      }
    }
  }

  // Spacing
  if (brief.layout?.spacing_scale) {
    lines.push('');
    lines.push('  /* Spacing */');
    const scale = brief.layout.spacing_scale;
    if (scale.method === 'ratio') {
      const base = parseFloat(scale.base || '0.5');
      const ratio = scale.ratio || 2;
      const names = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      for (let i = 0; i < names.length; i++) {
        const value = base * Math.pow(ratio, i - 2);
        lines.push(`  --space-${names[i]}: ${round(value)}rem;`);
      }
    }
  }

  // Layout
  if (brief.layout?.grid) {
    lines.push('');
    lines.push('  /* Layout */');
    if (brief.layout.grid.max_width) {
      lines.push(`  --grid-max-width: ${brief.layout.grid.max_width};`);
    }
    if (brief.layout.grid.gutter) {
      lines.push(`  --grid-gutter: ${brief.layout.grid.gutter};`);
    }
    if (brief.layout.grid.margin) {
      lines.push(`  --grid-margin: ${brief.layout.grid.margin};`);
    }
  }

  // Motion
  if (brief.motion) {
    lines.push('');
    lines.push('  /* Motion */');

    if (brief.motion.easing) {
      for (const [name, curve] of Object.entries(brief.motion.easing)) {
        if (Array.isArray(curve)) {
          lines.push(`  --ease-${name}: cubic-bezier(${curve.join(', ')});`);
        }
      }
    }

    if (brief.motion.duration) {
      for (const [name, value] of Object.entries(brief.motion.duration)) {
        lines.push(`  --duration-${name}: ${value};`);
      }
    }

    if (brief.motion.choreography?.stagger_delay) {
      lines.push(`  --stagger-delay: ${brief.motion.choreography.stagger_delay};`);
    }
  }

  // Effects — Shadows
  if (brief.effects?.shadows?.levels) {
    lines.push('');
    lines.push('  /* Shadows */');
    for (const [name, values] of Object.entries(brief.effects.shadows.levels)) {
      if (Array.isArray(values)) {
        lines.push(`  --shadow-${name}: ${values.join(', ')};`);
      }
    }
  }

  // Effects — Borders
  if (brief.effects?.borders?.radius) {
    lines.push('');
    lines.push('  /* Borders */');
    for (const [name, value] of Object.entries(brief.effects.borders.radius)) {
      lines.push(`  --radius-${name}: ${value};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate W3C DTCG format tokens JSON from a brief.
 * @param {Object} brief - parsed brief object
 * @returns {Object} W3C DTCG tokens
 */
export function generateDTCG(brief) {
  const tokens = {};

  // Colors
  if (brief.color?.palette) {
    tokens.color = { $description: 'Color tokens' };
    flattenDTCG(brief.color.palette, tokens.color);
  }

  // Typography
  if (brief.typography?.fonts) {
    tokens.typography = { $description: 'Typography tokens' };
    for (const [role, font] of Object.entries(brief.typography.fonts)) {
      tokens.typography[role] = {
        $type: 'fontFamily',
        $value: font.fallback
          ? `${font.family}, ${font.fallback}`
          : font.family,
      };
    }
  }

  // Motion
  if (brief.motion?.easing) {
    tokens.motion = { $description: 'Motion tokens', easing: {}, duration: {} };
    for (const [name, curve] of Object.entries(brief.motion.easing)) {
      if (Array.isArray(curve)) {
        tokens.motion.easing[name] = { $type: 'cubicBezier', $value: curve };
      }
    }
    if (brief.motion.duration) {
      for (const [name, value] of Object.entries(brief.motion.duration)) {
        const ms = parseInt(value);
        tokens.motion.duration[name] = {
          $type: 'duration',
          $value: { value: ms, unit: 'ms' },
        };
      }
    }
  }

  return tokens;
}

/** Flatten nested color objects into CSS custom property lines. */
function flattenTokens(obj, prefix, lines, depth = 0) {
  for (const [key, value] of Object.entries(obj)) {
    const propName = `${prefix}-${key}`;
    if (typeof value === 'string') {
      lines.push(`  --${propName}: ${value};`);
    } else if (typeof value === 'object' && value !== null) {
      flattenTokens(value, propName, lines, depth + 1);
    }
  }
}

/** Flatten nested objects into W3C DTCG color tokens. */
function flattenDTCG(obj, target) {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      target[key] = { $type: 'color', $value: value };
    } else if (typeof value === 'object' && value !== null) {
      target[key] = {};
      flattenDTCG(value, target[key]);
    }
  }
}

function round(n, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

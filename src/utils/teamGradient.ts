import { Colors } from '@/constants/theme';

// Current design ceiling for dark/typical team colors — unchanged from
// before, most teams' colors are dark enough that this alone already keeps
// Colors.text legible on top.
const MAX_ALPHA = 0.6;
// Never wash a color out further than this — even a pathologically bright
// team color should still read as "that team's color," not a flat surface.
const MIN_ALPHA = 0.35;
// Composite background luminance ceiling that keeps Colors.text (near-white,
// relative luminance ~0.877) at >=4.5:1 contrast on top, per the WCAG
// contrast formula — with a small safety margin below the exact boundary.
const MAX_BG_LUMINANCE = 0.15;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

const BACKGROUND_RGB = hexToRgb(Colors.background);

function compositeLuminance(colorRgb: [number, number, number], alpha: number): number {
  const blended: [number, number, number] = [
    alpha * colorRgb[0] + (1 - alpha) * BACKGROUND_RGB[0],
    alpha * colorRgb[1] + (1 - alpha) * BACKGROUND_RGB[1],
    alpha * colorRgb[2] + (1 - alpha) * BACKGROUND_RGB[2],
  ];
  return relativeLuminance(blended);
}

// Binary search rather than solving analytically — the sRGB linearization
// curve is piecewise, so there's no closed form worth deriving for what's
// only ever called once per team color, not per frame.
function safeAlpha(colorRgb: [number, number, number]): number {
  if (compositeLuminance(colorRgb, MAX_ALPHA) <= MAX_BG_LUMINANCE) return MAX_ALPHA;
  let lo = MIN_ALPHA;
  let hi = MAX_ALPHA;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (compositeLuminance(colorRgb, mid) <= MAX_BG_LUMINANCE) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * A color wash over a card's own dark base rather than the raw brand color
 * at full strength — bold enough to read as "that team's color" while
 * keeping near-white text on top legible. The alpha is solved per-color
 * rather than fixed: a flat 60% wash left bright colors (yellows, light
 * blues) compositing to a background too light for white text to hold
 * 4.5:1 contrast — live-computed and confirmed sub-4.5:1 for a bright gold
 * team color — so darker colors keep the original look and only bright ones
 * get dialed back. Falls back to the app's own dark surface for a team with
 * no color on record, so the gradient degrades to a plain card rather than
 * transparent.
 */
export function teamGradientColor(color: string | null): string {
  if (!color) return Colors.surfaceRaised;
  const alpha = safeAlpha(hexToRgb(color));
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${alphaHex}`;
}

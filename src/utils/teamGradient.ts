import { Colors } from '@/constants/theme';

/**
 * ~60% alpha wash over a card's own dark base rather than the raw brand
 * color at full strength — bold enough to read as "that team's color" while
 * keeping near-white text on top legible against brighter team colors (e.g.
 * a bright yellow) instead of full-saturation color behind white text.
 * Falls back to the app's own dark surface for a team with no color on
 * record, so the gradient degrades to a plain card rather than transparent.
 */
export function teamGradientColor(color: string | null): string {
  return color ? `${color}99` : Colors.surfaceRaised;
}

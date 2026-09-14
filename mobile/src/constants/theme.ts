/**
 * Backwards-compatible bridge re-exporting from the centralized theme system.
 */
export * from '../theme';
import { COLORS as THEME_COLORS } from '../theme/colors';

// Ensure any existing code expecting accent / slate tokens has seamless aliases
export const COLORS = {
  ...THEME_COLORS,
  accent: THEME_COLORS.secondary,
  accentDark: THEME_COLORS.secondaryDark,
  accentLight: THEME_COLORS.secondaryLight,
  accentSurface: THEME_COLORS.secondarySurface,
  accentHover: THEME_COLORS.secondaryHover,
  accentGlow: THEME_COLORS.secondaryGlow,
};

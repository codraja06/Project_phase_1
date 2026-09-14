/**
 * CivicTrack Design System — Spacing Scale
 *
 * 4px grid system. Every spacing value is a multiple of 4.
 * Named semantically for consistent usage.
 */

export const SPACING = {
  /** 2px — hairline gaps, icon padding */
  '2xs': 2,
  /** 4px — tight internal spacing */
  xs: 4,
  /** 6px — between inline elements */
  sm: 6,
  /** 8px — default internal padding */
  md: 8,
  /** 12px — card internal spacing */
  lg: 12,
  /** 16px — section padding */
  xl: 16,
  /** 20px — generous internal spacing */
  '2xl': 20,
  /** 24px — section gaps, card padding */
  '3xl': 24,
  /** 32px — major section separation */
  '4xl': 32,
  /** 40px — hero spacing */
  '5xl': 40,
  /** 48px — page-level vertical spacing */
  '6xl': 48,
  /** 64px — large section breaks */
  '7xl': 64,
  /** 80px — maximum spacing */
  '8xl': 80,

  // Semantic aliases
  /** 16px */
  screenPadding: 16,
  /** 12px — gap between cards in a grid */
  cardGap: 12,
  /** 16px — padding inside a card */
  cardPadding: 16,
  /** 8px — gap between items in a list */
  listGap: 8,
  /** 48px — minimum touch target size */
  touchTarget: 48,
};

export type SpacingTokens = typeof SPACING;

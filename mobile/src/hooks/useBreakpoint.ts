import { useWindowDimensions } from 'react-native';

/**
 * Breakpoint system — consistent across the entire app.
 *
 * Mobile  : < 768px   → bottom tab bar, single column
 * Tablet  : 768–1023px → bottom tab bar, single/two column
 * Desktop : ≥ 1024px  → left sidebar, multi-column layouts
 */
export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

export interface BreakpointResult {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** true for tablet OR desktop — useful for column layout decisions */
  isWide: boolean;
}

export function useBreakpoint(): BreakpointResult {
  const { width } = useWindowDimensions();

  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isWide = !isMobile; // tablet or desktop

  return { width, isMobile, isTablet, isDesktop, isWide };
}

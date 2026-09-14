import { Dimensions } from 'react-native';
import { COLORS } from './colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const IS_TABLET = SCREEN_WIDTH >= 768;
export const IS_SMALL_PHONE = SCREEN_WIDTH < 360;

export const TYPOGRAPHY = {
  h1: {
    fontSize: IS_TABLET ? 28 : 24,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    lineHeight: IS_TABLET ? 36 : 32,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: IS_TABLET ? 22 : 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    lineHeight: IS_TABLET ? 28 : 26,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    lineHeight: IS_TABLET ? 24 : 22,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: IS_TABLET ? 15 : 14,
    fontWeight: '400' as const,
    color: COLORS.textPrimary,
    lineHeight: IS_TABLET ? 22 : 20,
  },
  bodyBold: {
    fontSize: IS_TABLET ? 15 : 14,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    lineHeight: IS_TABLET ? 22 : 20,
  },
  caption: {
    fontSize: IS_TABLET ? 13 : 12,
    fontWeight: '500' as const,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
};

/**
 * TVK Flag-Inspired Civic Design System Color Palette
 * Deep Crimson Red (#B71C1C), Golden Yellow (#FFC107), Near-Black (#1A1A1A), Warm Neutrals
 */

export const COLORS = {
  // Primary: Deep Crimson Red (Flag inspired)
  primary: '#B71C1C',
  primaryDark: '#8E0000',
  primaryDeep: '#660000',
  primaryLight: '#FFEBEE',
  primarySurface: '#FFCDD2',
  primaryHover: '#8E0000',
  primaryGlow: 'rgba(183, 28, 28, 0.22)',

  // Secondary / Accent: Golden Yellow (Flag inspired)
  secondary: '#FFC107',
  secondaryDark: '#FFA000',
  secondaryDeep: '#FF8F00',
  secondaryLight: '#FFFDE7',
  secondarySurface: '#FFF9C4',
  secondaryHover: '#FFA000',
  secondaryGlow: 'rgba(255, 193, 7, 0.28)',

  // Authority Command Accents (Red header & crisp operational highlights)
  authorityPrimary: '#B71C1C',
  authorityDark: '#8E0000',
  authorityLight: '#FFEBEE',
  authoritySurface: '#FFCDD2',
  authorityGlow: 'rgba(183, 28, 28, 0.20)',

  // Supporting Slate & Neutrals
  darkCharcoal: '#1A1A1A',
  slateDark: '#27272A',
  slateMedium: '#52525B',
  slateMuted: '#71717A',
  slateLight: '#A1A1AA',

  // Backgrounds & Clean Surfaces (Off-white / Warm Neutral)
  background: '#FDFBF7',
  backgroundNeutral: '#F7F6F2',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#FAF9F6',
  cardBorder: '#E4E4E7',

  // Typography Hierarchy
  textPrimary: '#1A1A1A',
  textSecondary: '#52525B',
  textMuted: '#71717A',
  textInverse: '#FFFFFF',
  textLink: '#B71C1C',

  // Structural Borders & Dividers
  border: '#E4E4E7',
  borderLight: '#F4F4F5',
  borderStrong: '#D4D4D8',
  borderMaroon: '#FFCDD2',
  borderYellow: '#FDE047',
  divider: '#E4E4E7',

  // Status Treatment (Semantically Clear per Master Prompt Section 15)
  // Pending = Amber/Orange, In Progress = Blue, Resolved = Green, Error = Red
  pending: '#D97706',          // Golden Amber / Yellow
  pendingLight: '#FEF3C7',
  pendingDark: '#B45309',
  pendingBorder: '#FDE68A',

  inProgress: '#2563EB',       // Modern Royal Blue for In Progress
  inProgressLight: '#EFF6FF',
  inProgressDark: '#1D4ED8',
  inProgressBorder: '#BFDBFE',

  resolved: '#10B981',         // Neutral Civic Green for Resolved
  resolvedLight: '#ECFDF5',
  resolvedDark: '#059669',
  resolvedBorder: '#A7F3D0',

  rejected: '#71717A',         // Slate Gray
  rejectedLight: '#F4F4F5',
  rejectedDark: '#3F3F46',
  rejectedBorder: '#E4E4E7',

  // Alerts & Severity
  error: '#B71C1C',
  errorLight: '#FFEBEE',
  errorDark: '#8E0000',
  errorBorder: '#FFCDD2',

  warning: '#FFC107',
  warningLight: '#FFF9C4',
  warningDark: '#FFA000',

  success: '#10B981',
  successLight: '#ECFDF5',
  successDark: '#059669',
  successBorder: '#A7F3D0',

  info: '#B71C1C',
  infoLight: '#FFEBEE',

  // AI Overlay YOLO Bounding Box (Golden Yellow & Red HUD)
  overlayBox: '#FFC107',
  overlayBoxBg: 'rgba(255, 193, 7, 0.18)',
  overlayBoxBorder: '#FFC107',
  overlayBoxMaroon: '#B71C1C',
};

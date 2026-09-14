import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { BORDER_RADIUS } from '../theme/radius';
import { SHADOWS } from '../theme/index';
import { SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { usePressAnimation } from '../hooks/useAnimations';

interface StatCardProps {
  label: string;
  count: number;
  type: 'total' | 'pending' | 'inProgress' | 'resolved' | 'urgent' | 'today';
  onPress?: () => void;
  isTablet?: boolean;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const StatCard: React.FC<StatCardProps> = ({
  label,
  count,
  type,
  onPress,
  isTablet = false,
  index = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isWeb = Platform.OS === 'web';
  const { onPressIn, onPressOut, animatedStyle: pressStyle } = usePressAnimation(0.95);

  let countColor = COLORS.textPrimary;
  let iconName: keyof typeof Ionicons.glyphMap = 'documents-outline';
  let iconBg = COLORS.backgroundNeutral;
  let iconColor = COLORS.slateDark;
  let borderColor = COLORS.border;

  switch (type) {
    case 'total':
      countColor = COLORS.primary;
      iconName = 'stats-chart-outline';
      iconBg = COLORS.primaryLight;
      iconColor = COLORS.primary;
      borderColor = COLORS.border;
      break;
    case 'pending':
      countColor = COLORS.pendingDark;
      iconName = 'time-outline';
      iconBg = COLORS.pendingLight;
      iconColor = COLORS.pending;
      borderColor = COLORS.pendingBorder;
      break;
    case 'inProgress':
      countColor = COLORS.inProgressDark;
      iconName = 'construct-outline';
      iconBg = COLORS.inProgressLight;
      iconColor = COLORS.inProgress;
      borderColor = COLORS.inProgressBorder;
      break;
    case 'resolved':
      countColor = COLORS.resolvedDark;
      iconName = 'checkmark-circle-outline';
      iconBg = COLORS.resolvedLight;
      iconColor = COLORS.resolved;
      borderColor = COLORS.resolvedBorder;
      break;
    case 'urgent':
      countColor = COLORS.error;
      iconName = 'flame-outline';
      iconBg = COLORS.errorLight;
      iconColor = COLORS.error;
      borderColor = COLORS.errorBorder;
      break;
    case 'today':
      countColor = COLORS.secondaryDeep;
      iconName = 'today-outline';
      iconBg = COLORS.secondaryLight;
      iconColor = COLORS.secondaryDark;
      borderColor = COLORS.secondarySurface;
      break;
  }

  const content = (
    <View style={styles.contentContainer}>
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={[styles.typeIndicator, { backgroundColor: countColor }]} />
      </View>

      <View style={styles.metricContainer}>
        <Text style={[styles.count, { color: countColor }]}>{count}</Text>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );

  const cardStyle = [
    styles.card,
    { borderColor: isHovered ? countColor : borderColor },
    isTablet && styles.cardTablet,
    isHovered && isWeb && (styles.cardHovered as any),
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        entering={FadeInDown.delay(index * 50).duration(400)}
        style={[cardStyle, pressStyle]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${count}`}
        {...({
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        } as any)}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      style={cardStyle}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${count}`}
    >
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer' as any,
      transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)' as any,
    } : {}),
  },
  cardTablet: {
    width: '23.5%',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
  },
  cardHovered: {
    ...SHADOWS.cardHover,
    transform: [{ translateY: -2 }],
  },
  contentContainer: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
  metricContainer: {
    width: '100%',
  },
  count: {
    ...TYPOGRAPHY.kpiNumber,
    marginBottom: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});

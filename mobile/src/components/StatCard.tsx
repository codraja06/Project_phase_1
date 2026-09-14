import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface StatCardProps {
  label: string;
  count: number;
  type: 'total' | 'pending' | 'inProgress' | 'resolved' | 'urgent' | 'today';
  onPress?: () => void;
  isTablet?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  count,
  type,
  onPress,
  isTablet = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  let countColor = COLORS.textPrimary;
  let iconName: keyof typeof Ionicons.glyphMap = 'documents-outline';
  let iconBg = '#F1F5F9';
  let iconColor = COLORS.slateDark;
  let borderColor = COLORS.border;

  switch (type) {
    case 'total':
      countColor = COLORS.secondary;
      iconName = 'stats-chart-outline';
      iconBg = '#F1F5F9';
      iconColor = COLORS.secondary;
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
      countColor = COLORS.accentDark;
      iconName = 'today-outline';
      iconBg = COLORS.accentLight;
      iconColor = COLORS.accentDark;
      borderColor = COLORS.accentSurface;
      break;
  }

  const content = (
    <View style={styles.contentContainer}>
      {/* Top row: Icon Badge & Subtle Type Indicator */}
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={[styles.typeIndicator, { backgroundColor: countColor }]} />
      </View>

      {/* Count & Label */}
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
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${count}`}
        {...({
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        } as any)}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={cardStyle}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${count}`}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...SHADOWS.card,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer' as any,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' as any,
    } : {}),
  },
  cardTablet: {
    width: '23.5%',
    paddingVertical: 20,
    paddingHorizontal: 18,
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
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  metricContainer: {
    width: '100%',
  },
  count: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 4,
    lineHeight: 34,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },
});

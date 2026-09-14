import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
  return (
    <View
      style={[
        styles.cardBase,
        variant === 'elevated' && styles.cardElevated,
        variant === 'outlined' && styles.cardOutlined,
        variant === 'flat' && styles.cardFlat,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardElevated: {
    ...SHADOWS.card,
  },
  cardOutlined: {
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
  },
  cardFlat: {
    backgroundColor: COLORS.surface,
    borderColor: 'transparent',
  },
});

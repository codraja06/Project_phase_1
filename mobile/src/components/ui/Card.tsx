import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable, Platform } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { BORDER_RADIUS } from '../../theme/radius';
import { SPACING } from '../../theme/spacing';
import { SHADOWS } from '../..//theme/index'; // Import from existing theme/index which we'll keep
import { usePressAnimation, useAnimatedEntry } from '../../hooks/useAnimations';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  interactive?: boolean;
  delayMs?: number;
  animateEntry?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  onPress, 
  interactive = false,
  delayMs = 0,
  animateEntry = false
}) => {
  const isPressable = onPress !== undefined || interactive;
  
  // Use our shared press animation hook
  const { onPressIn, onPressOut, animatedStyle: pressStyle } = usePressAnimation(0.98);
  
  // Optional entry animation
  const entryStyle = useAnimatedEntry(delayMs);

  if (isPressable) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed, hovered }: any) => [
          styles.card,
          animateEntry && entryStyle,
          pressStyle,
          style,
          pressed && styles.pressed,
          hovered && styles.hovered,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={[styles.card, animateEntry && entryStyle, style]}>
      {children}
    </Animated.View>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);

export const CardContent: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

export const CardFooter: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.footer, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
    overflow: 'hidden',
  },
  header: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  content: {
    padding: SPACING.xl,
  },
  footer: {
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.9,
    backgroundColor: COLORS.cardHover,
  },
  hovered: {
    backgroundColor: COLORS.cardHover,
  }
});

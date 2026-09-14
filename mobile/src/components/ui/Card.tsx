import React, { useRef } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Animated, Pressable, Platform } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  interactive?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: React.FC<CardProps> = ({ children, style, onPress, interactive = false }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const isPressable = onPress !== undefined || interactive;

  const handlePressIn = () => {
    if (!isPressable) return;
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: Platform.OS !== 'web',
      speed: 20,
      bounciness: 5,
    }).start();
  };

  const handlePressOut = () => {
    if (!isPressable) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 20,
      bounciness: 5,
    }).start();
  };

  if (isPressable) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }: any) => [
          styles.card,
          { transform: [{ scale }] },
          style,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={[styles.card, style]}>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  content: {
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});

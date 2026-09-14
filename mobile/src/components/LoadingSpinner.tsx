import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING } from '../theme/spacing';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message, 
  size = 36 
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1 // Infinite repeat
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: Math.max(3, size / 10),
            borderTopColor: COLORS.primary,
            borderRightColor: COLORS.primarySurface,
            borderBottomColor: COLORS.primarySurface,
            borderLeftColor: COLORS.primarySurface,
          },
          animatedStyle,
        ]}
      />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['3xl'],
    backgroundColor: COLORS.background,
  },
  spinner: {
    backgroundColor: 'transparent',
  },
  text: {
    ...TYPOGRAPHY.bodyBold,
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
  },
});

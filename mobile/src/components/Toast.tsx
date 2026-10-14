import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { BORDER_RADIUS } from '../theme/radius';
import { SHADOWS } from '../theme/index';
import { SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  onDismiss,
  duration = 3500,
}) => {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  let bg = COLORS.surface;
  let borderColor = COLORS.border;
  let iconColor = COLORS.successDark;
  let iconName: keyof typeof Ionicons.glyphMap = 'checkmark-circle';

  if (type === 'error') {
    borderColor = COLORS.errorBorder;
    iconColor = COLORS.error;
    iconName = 'alert-circle';
    bg = COLORS.errorLight;
  } else if (type === 'info') {
    borderColor = COLORS.inProgressBorder;
    iconColor = COLORS.inProgress;
    iconName = 'information-circle';
    bg = COLORS.inProgressLight;
  } else {
    borderColor = COLORS.successBorder;
    iconColor = COLORS.successDark;
    iconName = 'checkmark-circle';
    bg = COLORS.successLight;
  }

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15).stiffness(150)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.toastContainer,
        {
          top: insets.top + 16,
          borderColor,
          backgroundColor: bg,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Ionicons name={iconName} size={22} color={iconColor} style={{ marginRight: SPACING.md }} />
      <Text style={styles.toastMessage}>
        {message}
      </Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={onDismiss} style={styles.closeBtn} activeOpacity={0.7}>
        <Ionicons name="close" size={20} color={COLORS.slateMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 54, // Avoid safe area
    left: SPACING.xl,
    right: SPACING.xl,
    maxWidth: 500,
    alignSelf: 'center',
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    ...SHADOWS.elevated,
  },
  toastMessage: {
    flex: 1,
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    marginLeft: SPACING.md,
    padding: SPACING.xs,
  },
});

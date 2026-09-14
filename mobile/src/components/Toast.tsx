import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

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
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  let bg = '#FFFFFF';
  let borderColor = COLORS.border;
  let iconColor = COLORS.successDark;
  let iconName: keyof typeof Ionicons.glyphMap = 'checkmark-circle';

  if (type === 'error') {
    borderColor = COLORS.errorBorder;
    iconColor = COLORS.error;
    iconName = 'alert-circle';
  } else if (type === 'info') {
    borderColor = COLORS.inProgressBorder;
    iconColor = COLORS.inProgress;
    iconName = 'information-circle';
  } else {
    borderColor = COLORS.successBorder;
    iconColor = COLORS.successDark;
    iconName = 'checkmark-circle';
  }

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          borderColor,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Ionicons name={iconName} size={22} color={iconColor} style={{ marginRight: 10 }} />
      <Text style={styles.toastMessage} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={hideToast} style={styles.closeBtn} activeOpacity={0.7}>
        <Ionicons name="close" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 48,
    left: 20,
    right: 20,
    maxWidth: 500,
    alignSelf: 'center',
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    ...SHADOWS.cardHover,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  closeBtn: {
    marginLeft: 10,
    padding: 4,
  },
});

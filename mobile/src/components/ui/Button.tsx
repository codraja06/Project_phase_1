import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  children,
  accessibilityLabel,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  const getContainerStyle = (pressed: boolean, hovered: boolean): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDER_RADIUS.md,
      ...(Platform.OS === 'web' ? { cursor: 'pointer' as any, transition: 'background-color 0.2s ease' as any } : {}),
    };

    // Size variations
    if (size === 'default') {
      base.paddingHorizontal = 16;
      base.paddingVertical = 12;
      base.minHeight = 44;
    } else if (size === 'sm') {
      base.paddingHorizontal = 12;
      base.paddingVertical = 8;
      base.minHeight = 36;
    } else if (size === 'lg') {
      base.paddingHorizontal = 32;
      base.paddingVertical = 16;
      base.minHeight = 56;
    } else if (size === 'icon') {
      base.padding = 12;
      base.minHeight = 44;
      base.minWidth = 44;
    }

    // Variant variations
    switch (variant) {
      case 'default':
        base.backgroundColor = hovered || pressed ? COLORS.primaryHover : COLORS.primary;
        break;
      case 'destructive':
        base.backgroundColor = hovered || pressed ? COLORS.errorDark : COLORS.error;
        break;
      case 'outline':
        base.backgroundColor = hovered || pressed ? COLORS.surface : 'transparent';
        base.borderWidth = 1;
        base.borderColor = COLORS.borderStrong;
        break;
      case 'secondary':
        base.backgroundColor = hovered || pressed ? COLORS.borderStrong : COLORS.borderLight;
        break;
      case 'ghost':
        base.backgroundColor = hovered || pressed ? COLORS.borderLight : 'transparent';
        break;
      case 'link':
        base.backgroundColor = 'transparent';
        break;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
      fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14,
      textAlign: 'center',
    };

    switch (variant) {
      case 'default':
      case 'destructive':
        base.color = '#FFFFFF';
        break;
      case 'outline':
      case 'ghost':
      case 'secondary':
        base.color = COLORS.textPrimary;
        break;
      case 'link':
        base.color = COLORS.primary;
        base.textDecorationLine = 'underline';
        break;
    }

    return base;
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed, hovered }: any) => [
          getContainerStyle(pressed, hovered),
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'default' || variant === 'destructive' ? '#FFFFFF' : COLORS.primary}
            style={styles.spinner}
          />
        ) : (
          <>
            {icon && icon}
            {title && (
              <Text style={[getTextStyle(), textStyle, icon ? { marginLeft: 8 } : null]}>
                {title}
              </Text>
            )}
            {children}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' as any } : {}),
  },
  spinner: {
    marginVertical: 2,
  },
});

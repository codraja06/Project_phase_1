import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  inputStyle?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  isPassword,
  secureTextEntry,
  style,
  inputStyle,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const shouldSecure = isPassword || secureTextEntry;
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
          isFocused && isWeb && (styles.webFocusHalo as any),
          Boolean(error) && isWeb && (styles.webErrorHalo as any),
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={19}
            color={error ? COLORS.error : isFocused ? COLORS.primary : COLORS.slateMedium}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            leftIcon ? { paddingLeft: 0 } : {},
            shouldSecure ? { paddingRight: 40 } : {},
            isWeb ? ({ outline: 'none' } as any) : {},
            style,
            inputStyle,
          ]}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={shouldSecure && !showPassword}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          accessibilityLabel={label}
          {...props}
        />

        {shouldSecure && (
          <TouchableOpacity
            style={styles.rightIconBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={COLORS.slateMedium}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={COLORS.error} style={{ marginRight: 5 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

export const PasswordInput: React.FC<Omit<InputProps, 'isPassword'>> = (props) => (
  <Input {...props} isPassword leftIcon="lock-closed-outline" />
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 48,
    paddingHorizontal: 14,
    position: 'relative',
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.18s ease-in-out' as any,
    } : {}),
  },
  inputFocused: {
    borderColor: COLORS.secondary, // Golden Yellow focused border
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFFBFB',
  },
  webFocusHalo: {
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 0 3.5px rgba(255, 193, 7, 0.28)' } as any) : {}),
  },
  webErrorHalo: {
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 0 3.5px rgba(220, 38, 38, 0.14)' } as any) : {}),
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    minHeight: 44,
  },
  rightIconBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
});

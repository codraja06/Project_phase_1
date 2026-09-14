import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { BORDER_RADIUS } from '../theme/radius';
import { SHADOWS } from '../theme/index';
import { SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search complaints...',
  onClear,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        isFocused && isWeb && (styles.webFocusHalo as any),
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={isFocused ? COLORS.primary : COLORS.slateMuted}
        style={styles.searchIcon}
      />
      <TextInput
        style={[
          styles.input,
          isWeb ? ({ outline: 'none' } as any) : {},
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value.length > 0 && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
          <TouchableOpacity
            onPress={() => {
              onChangeText('');
              onClear?.();
            }}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear search text"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.slateMuted} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.2s ease' as any,
    } : {}),
  },
  containerFocused: {
    borderColor: COLORS.primary,
  },
  webFocusHalo: {
    ...(Platform.OS === 'web' ? ({ boxShadow: `0 0 0 3px ${COLORS.primaryGlow}` } as any) : {}),
  },
  searchIcon: {
    marginRight: SPACING.md,
    marginLeft: SPACING.xs,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.input,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  clearBtn: {
    padding: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

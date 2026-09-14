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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

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
        size={19}
        color={isFocused ? COLORS.primary : COLORS.slateMedium}
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
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearBtn}
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    ...SHADOWS.sm,
    ...(Platform.OS === 'web' ? {
      transition: 'all 0.18s ease-in-out' as any,
    } : {}),
  },
  containerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  webFocusHalo: {
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.16)' } as any) : {}),
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

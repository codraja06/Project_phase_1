import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isSelected,
  onPress,
  count,
  style,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isSelected ? styles.chipSelected : styles.chipUnselected,
        isHovered && !isSelected && (styles.chipHovered as any),
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      {...({
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      } as any)}
    >
      <Text
        style={[
          styles.label,
          isSelected ? styles.labelSelected : styles.labelUnselected,
        ]}
      >
        {label}
      </Text>
      {count !== undefined && (
        <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
          <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface FilterChipGroupProps {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  options,
  selectedValue,
  onSelect,
  containerStyle,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.groupContainer, containerStyle]}
    >
      {options.map((opt) => (
        <FilterChip
          key={opt.value}
          label={opt.label}
          count={opt.count}
          isSelected={selectedValue === opt.value}
          onPress={() => onSelect(opt.value)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    minHeight: 36,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer' as any,
      transition: 'all 0.18s ease-in-out' as any,
    } : {}),
  },
  chipSelected: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    ...SHADOWS.sm,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipHovered: {
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  labelSelected: {
    color: '#1A1A1A', // Dark text on yellow per Requirement 7
    fontWeight: '800',
  },
  labelUnselected: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  countBadge: {
    marginLeft: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BORDER_RADIUS.full,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  countTextSelected: {
    color: '#1A1A1A',
  },
});

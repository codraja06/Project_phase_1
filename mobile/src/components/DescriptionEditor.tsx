import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface DescriptionEditorProps {
  category: string;
  customCategory?: string;
  description: string;
  onChangeDescription: (text: string) => void;
  address?: string;
  error?: string;
}

export const getDefaultDescription = (category: string, address?: string): string => {
  const locSuffix = address ? ` near ${address}` : ' at the selected location';
  switch (category) {
    case 'pothole':
      return `A pothole has been detected on the road${locSuffix}.`;
    case 'road_damage':
      return `Road damage has been detected${locSuffix}.`;
    case 'garbage':
      return `Uncollected garbage accumulation reported${locSuffix}.`;
    case 'garbage_overflow':
      return `An overflowing garbage bin has been detected${locSuffix}.`;
    case 'broken_streetlight':
      return `A broken or non-functional streetlight has been reported${locSuffix}.`;
    case 'drainage_problem':
    case 'drainage':
      return `A drainage problem causing water stagnation has been detected${locSuffix}.`;
    case 'water_leakage':
      return `A municipal water pipeline leakage has been observed${locSuffix}.`;
    case 'dead_animal':
      return `A deceased animal requiring sanitation clearance has been reported${locSuffix}.`;
    case 'broken_tree':
      return `A fallen or broken tree hazard obstructing public space has been reported${locSuffix}.`;
    default:
      return `A civic infrastructure issue has been reported${locSuffix}.`;
  }
};

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  category,
  customCategory,
  description,
  onChangeDescription,
  address,
  error,
}) => {
  // When category changes, if description is empty, populate with generated template
  useEffect(() => {
    if (!description || description.trim() === '') {
      const generated = getDefaultDescription(category, address);
      onChangeDescription(generated);
    }
  }, [category, address]);

  const handleResetToTemplate = () => {
    const generated = getDefaultDescription(category, address);
    onChangeDescription(generated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.labelWrapper}>
          <Text style={styles.label}>Complaint Description</Text>
          <View style={styles.autoBadge}>
            <Ionicons name="sparkles" size={11} color={COLORS.secondaryDark} style={{ marginRight: 3 }} />
            <Text style={styles.autoBadgeText}>Auto-Generated (Editable)</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleResetToTemplate}
          accessibilityRole="button"
          accessibilityLabel="Reset description template"
          style={styles.resetBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.resetBtnText}>Reset Template</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helperText}>
        You can freely modify or add specific landmarks and details to this description.
      </Text>

      <View style={[styles.inputWrapper, !!error && styles.inputWrapperError]}>
        <TextInput
          style={styles.textArea}
          accessibilityLabel="Complaint description"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={onChangeDescription}
          placeholder="Describe defect details, landmarks, or severity..."
          placeholderTextColor={COLORS.textMuted}
          textAlignVertical="top"
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondaryDark,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...SHADOWS.sm,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
    minHeight: 90,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
    marginTop: 4,
  },
});

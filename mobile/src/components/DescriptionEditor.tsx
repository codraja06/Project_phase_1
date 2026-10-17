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
  const location = address?.trim().replace(/[.,;]+$/, '');
  const locSuffix = location ? ` at ${location}` : ' at the selected location';
  switch (category) {
    case 'pothole':
      return `I would like to report a pothole${locSuffix}. Please inspect the affected road surface and arrange the necessary repairs.`;
    case 'road_damage':
      return `I would like to report damage to the road surface${locSuffix}. Please assess its condition and arrange appropriate maintenance or repairs.`;
    case 'garbage':
      return `I would like to report an accumulation of uncollected waste${locSuffix}. Please arrange waste collection and cleaning of the affected area.`;
    case 'garbage_overflow':
      return `I would like to report an overflowing waste bin${locSuffix}. Please arrange collection of the waste and cleaning of the surrounding area.`;
    case 'broken_streetlight':
      return `I would like to report a damaged or non-functioning streetlight${locSuffix}. Please inspect the lighting equipment and arrange the necessary repairs.`;
    case 'drainage_problem':
    case 'drainage':
      return `I would like to report a drainage issue${locSuffix}. Please inspect the drainage system and carry out the necessary cleaning or repairs.`;
    case 'water_leakage':
      return `I would like to report a water leak${locSuffix}. Please identify the source of the leak and arrange the necessary repairs.`;
    case 'dead_animal':
      return `I would like to report a deceased animal${locSuffix}. Please arrange safe removal and appropriate cleaning of the affected area.`;
    case 'broken_tree':
      return `I would like to report a fallen or damaged tree${locSuffix}. Please assess its condition and arrange safe removal or maintenance as appropriate.`;
    default:
      return `I would like to report a civic maintenance issue${locSuffix}. Please review the details provided and arrange an inspection and appropriate action.`;
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
            <Text style={styles.autoBadgeText}>Suggested Draft</Text>
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
        Review this draft before submitting. Add the nearest landmark, the observed condition, and any relevant details.
      </Text>

      <View style={[styles.inputWrapper, !!error && styles.inputWrapperError]}>
        <TextInput
          style={styles.textArea}
          accessibilityLabel="Complaint description"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={onChangeDescription}
          placeholder="Describe the issue, its location, and the action requested."
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

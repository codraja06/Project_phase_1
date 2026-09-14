import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface LocationCardProps {
  address: string;
  latitude: number;
  longitude: number;
  onRefreshLocation?: () => void;
  loading?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  address,
  latitude,
  longitude,
  onRefreshLocation,
  loading = false,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name="location" size={20} color={COLORS.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>DISPATCH GPS LOCATION</Text>
        <Text style={styles.addressText} numberOfLines={2}>
          {address || 'Fetching device GPS coordinates...'}
        </Text>
        <Text style={styles.coordsText}>
          {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
        </Text>
      </View>

      {onRefreshLocation && (
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefreshLocation}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh-outline"
            size={18}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  coordsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundNeutral,
    marginLeft: 8,
  },
});

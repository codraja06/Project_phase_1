import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

interface MapLocationPickerProps {
  latitude: number;
  longitude: number;
  address?: string;
  onSelectLocation?: (lat: number, lng: number) => void;
  onUseCurrentLocation?: () => void;
  interactive?: boolean;
  height?: number;
  showCard?: boolean;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  latitude,
  longitude,
  address,
  onSelectLocation,
  onUseCurrentLocation,
  interactive = true,
  height = 240,
  showCard = true,
}) => {
  const lat = latitude || 12.9716;
  const lng = longitude || 77.5946;

  // ─── WEB: Use OpenStreetMap embed iframe ──────────────────────────────────
  if (Platform.OS === 'web') {
    const bbox = `${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}`;
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

    return (
      <View style={styles.outerContainer}>
        <View style={[styles.mapContainer, { height }]}>
          <iframe
            src={mapSrc}
            style={{ width: '100%', height: '100%', border: 'none' } as any}
            title="Civic Issue Location"
          />
          {/* Visual radar radius circle & pin center graphic */}
          <View style={styles.radarCenter} pointerEvents="none">
            <View style={styles.radarCircle} />
          </View>
        </View>

        {showCard && (
          <View style={styles.locationCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.locationHeader}>Current Location</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {address || 'Fetching device address...'}
              </Text>
              <Text style={styles.coordsText}>
                Lat: {lat.toFixed(4)} Long: {lng.toFixed(4)}
              </Text>
            </View>
          </View>
        )}

        {onUseCurrentLocation && (
          <TouchableOpacity
            style={styles.useCurrentBtn}
            onPress={onUseCurrentLocation}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Use Current Location"
          >
            <Ionicons name="locate-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.useCurrentText}>Use Current Location</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ─── NATIVE: Use react-native-maps ────────────────────────────────────────
  let MapView: any = null;
  let Marker: any = null;
  let Circle: any = null;
  let PROVIDER_DEFAULT: any = null;

  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Circle = maps.Circle;
    PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
  } catch (e) {}

  if (!MapView) {
    return (
      <View style={styles.outerContainer}>
        <View style={[styles.mapContainer, { height }, styles.fallbackContainer]}>
          <Ionicons name="map-outline" size={42} color={COLORS.primary} />
          <Text style={styles.fallbackTitle}>GPS Coordinates Pinned</Text>
          <Text style={styles.coordsText}>
            Lat: {lat.toFixed(4)} Long: {lng.toFixed(4)}
          </Text>
        </View>

        {showCard && (
          <View style={styles.locationCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.locationHeader}>Current Location</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {address || 'Location recorded'}
              </Text>
              <Text style={styles.coordsText}>
                Lat: {lat.toFixed(4)} Long: {lng.toFixed(4)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  const initialRegion = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  const handleMapPress = (e: any) => {
    if (interactive && onSelectLocation) {
      const { latitude: clickLat, longitude: clickLng } = e.nativeEvent.coordinate;
      onSelectLocation(clickLat, clickLng);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.mapContainer, { height }]}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={initialRegion}
          region={{
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onPress={handleMapPress}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
        >
          {Circle && (
            <Circle
              center={{ latitude: lat, longitude: lng }}
              radius={70}
              fillColor="rgba(183, 28, 28, 0.12)"
              strokeColor="#FFC107"
              strokeWidth={2}
            />
          )}
          <Marker
            coordinate={{ latitude: lat, longitude: lng }}
            title="Issue Location"
            description={address || 'Location coordinates'}
            pinColor={COLORS.primary}
          >
            <View style={styles.redYellowPinMarker}>
              <View style={styles.pinOuterYellowRing}>
                <View style={styles.pinInnerRedCircle}>
                  <Ionicons name="location" size={16} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </Marker>
        </MapView>
      </View>

      {showCard && (
        <View style={styles.locationCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.locationHeader}>Current Location</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {address || 'Fetching device address...'}
            </Text>
            <Text style={styles.coordsText}>
              Lat: {lat.toFixed(4)} Long: {lng.toFixed(4)}
            </Text>
          </View>
        </View>
      )}

      {onUseCurrentLocation && (
        <TouchableOpacity
          style={styles.useCurrentBtn}
          onPress={onUseCurrentLocation}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Use Current Location"
        >
          <Ionicons name="locate-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.useCurrentText}>Use Current Location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginBottom: 14,
  },
  mapContainer: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    ...SHADOWS.card,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  radarCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.4)',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
    ...SHADOWS.card,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  locationHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  useCurrentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    marginTop: 10,
    ...SHADOWS.card,
  },
  useCurrentText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  redYellowPinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOuterYellowRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFC107', // Golden Yellow outline
    borderWidth: 2,
    borderColor: '#FFA000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  pinInnerRedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary, // Crimson Red
    alignItems: 'center',
    justifyContent: 'center',
  },
});

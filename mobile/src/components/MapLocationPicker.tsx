import React, { useState } from 'react';
import { Input } from './Input';
import { Button } from './ui/Button';
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
  const lat = Number.isFinite(latitude) ? latitude : 12.9716;
  const lng = Number.isFinite(longitude) ? longitude : 77.5946;
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [coordinateError, setCoordinateError] = useState('');

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

        {interactive && onSelectLocation && <View style={{ marginTop: 16 }}>
          <Text style={{ marginBottom: 12 }}>Enter exact coordinates to set the incident pin, or use your current location.</Text>
          <Input label="Incident latitude" value={manualLat} onChangeText={setManualLat} keyboardType="numbers-and-punctuation" placeholder="-90 to 90" />
          <Input label="Incident longitude" value={manualLng} onChangeText={setManualLng} keyboardType="numbers-and-punctuation" placeholder="-180 to 180" />
          {!!coordinateError && <Text accessibilityRole="alert" style={{ color: COLORS.error, marginBottom: 12 }}>{coordinateError}</Text>}
          <Button title="Set incident location" variant="outline" onPress={() => {
            const newLat = Number(manualLat), newLng = Number(manualLng);
            if (!manualLat.trim() || !manualLng.trim() || !Number.isFinite(newLat) || !Number.isFinite(newLng) || Math.abs(newLat) > 90 || Math.abs(newLng) > 180) { setCoordinateError('Enter a valid latitude and longitude.'); return; }
            setCoordinateError(''); onSelectLocation(newLat, newLng);
          }} />
        </View>}
        {interactive && onSelectLocation && <View style={{ marginTop: 16 }}>
          <Text style={{ marginBottom: 12 }}>Enter exact coordinates to set the incident pin, or use your current location.</Text>
          <Input label="Incident latitude" value={manualLat} onChangeText={setManualLat} keyboardType="numbers-and-punctuation" placeholder="-90 to 90" />
          <Input label="Incident longitude" value={manualLng} onChangeText={setManualLng} keyboardType="numbers-and-punctuation" placeholder="-180 to 180" />
          {!!coordinateError && <Text accessibilityRole="alert" style={{ color: COLORS.error, marginBottom: 12 }}>{coordinateError}</Text>}
          <Button title="Set incident location" variant="outline" onPress={() => {
            const newLat = Number(manualLat), newLng = Number(manualLng);
            if (!manualLat.trim() || !manualLng.trim() || !Number.isFinite(newLat) || !Number.isFinite(newLng) || Math.abs(newLat) > 90 || Math.abs(newLng) > 180) { setCoordinateError('Enter a valid latitude and longitude.'); return; }
            setCoordinateError(''); onSelectLocation(newLat, newLng);
          }} />
        </View>}
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
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.3)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }
    }),
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

import { Platform } from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
}

const DEFAULT_TIMEOUT_MS = 15000;

function getLocationTimeout(): number {
  const envTimeout = process.env.EXPO_PUBLIC_LOCATION_TIMEOUT;
  if (envTimeout) {
    const parsed = parseInt(envTimeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_TIMEOUT_MS;
}

/**
 * Reverse geocodes coordinates into a readable civic address.
 * Primary: Native device geocoder (Android/iOS).
 * Fallback: OpenStreetMap Nominatim reverse geocoding API.
 */
async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const fallbackStr = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;

  // On Native: Attempt native OS geocoder first
  if (Platform.OS !== 'web') {
    try {
      const Location = require('expo-location');
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const parts = [
          item.name,
          item.street,
          item.district || item.subregion,
          item.city,
          item.postalCode,
        ].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    } catch {
      // Continue to OpenStreetMap Nominatim fallback
    }
  }

  // Fallback to OpenStreetMap Nominatim
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CivicTrack-Mobile/1.0 (civictrack@swaccha.local)',
        },
        signal: controller.signal,
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch {
    // Return fallback coords string
  } finally {
    if (timer) clearTimeout(timer);
  }

  return fallbackStr;
}

export const locationService = {
  getLocationTimeout,

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    }

    try {
      const Location = require('expo-location');
      const current = await Location.getForegroundPermissionsAsync();
      if (current.status === 'granted') {
        return true;
      }
      const requested = await Location.requestForegroundPermissionsAsync();
      return requested.status === 'granted';
    } catch {
      return false;
    }
  },

  async getCurrentLocation(): Promise<LocationCoordinates> {
    const timeoutMs = getLocationTimeout();

    // ── Web Implementation ───────────────────────────────────────────────────
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is unavailable. Please enter coordinates manually.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const address = await reverseGeocode(latitude, longitude);
            resolve({ latitude, longitude, address });
          },
          (err) => {
            reject(
              new Error(
                err.code === 1
                  ? 'Location permission denied. Please allow location access or enter coordinates manually.'
                  : err.code === 2
                  ? 'Position unavailable. Please verify GPS is enabled or enter coordinates manually.'
                  : `Location request timed out after ${timeoutMs / 1000}s. Please retry or enter coordinates manually.`
              )
            );
          },
          { timeout: timeoutMs, enableHighAccuracy: true }
        );
      });
    }

    // ── Native iOS / Android Implementation ──────────────────────────────────
    const Location = require('expo-location');

    // 1. Check if location services (GPS hardware) are enabled
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        throw new Error('Device location (GPS) is turned off. Please enable location services in device settings.');
      }
    } catch (err: any) {
      if (err.message?.includes('turned off')) {
        throw err;
      }
      // If service check fails for another reason, continue to attempt permission
    }

    // 2. Request Foreground Location Permission
    const granted = await this.requestPermissions();
    if (!granted) {
      throw new Error(
        'Location permission denied. Please allow location access in your device settings or enter coordinates manually.'
      );
    }

    // 3. Acquire location with timeout race and fallback to last known location
    let location: any = null;
    let positionTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const positionPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise((_, reject) => {
        positionTimer = setTimeout(
          () =>
            reject(
              new Error(
                `GPS fix timed out after ${timeoutMs / 1000} seconds. Please check satellite visibility or enter coordinates manually.`
              )
            ),
          timeoutMs
        );
      });

      location = await Promise.race([positionPromise, timeoutPromise]);
    } catch (error: any) {
      // If current position fails or times out, attempt last known position as fallback
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          location = lastKnown;
        } else {
          throw error;
        }
      } catch {
        throw error;
      }
    } finally {
      if (positionTimer) clearTimeout(positionTimer);
    }

    if (!location || !location.coords) {
      throw new Error('Unable to retrieve device GPS coordinates. Please enter coordinates manually.');
    }

    const { latitude, longitude } = location.coords;
    const address = await reverseGeocode(latitude, longitude);

    return { latitude, longitude, address };
  },

  reverseGeocode,
};

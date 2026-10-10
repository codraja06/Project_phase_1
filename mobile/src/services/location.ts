import { Platform } from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
}

// Web-safe location service
export const locationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    }
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation(): Promise<LocationCoordinates> {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is unavailable. Enter the incident coordinates manually.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            let address = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;

            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await res.json();
              if (data && data.display_name) {
                address = data.display_name;
              }
            } catch (e) {
              // Use raw coords as fallback
            }

            resolve({ latitude, longitude, address });
          },
          (err) => {
            reject(new Error(`GPS unavailable: ${err.message}. Enter the incident coordinates manually.`));
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }

    // Native iOS / Android
    const Location = require('expo-location');
    const granted = await this.requestPermissions();
    if (!granted) {
      throw new Error('Location permission denied. Please enable location permissions.');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;
    let address = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;

    try {
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
          address = parts.join(', ');
        }
      }
    } catch (e) {
      console.warn('Reverse geocoding failed, using raw coordinates:', e);
    }

    return { latitude, longitude, address };
  },
};

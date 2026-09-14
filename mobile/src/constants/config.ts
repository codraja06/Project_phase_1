import { Platform } from 'react-native';

// Intelligent host resolution for Web, Android Emulator, iOS Simulator, and Physical Devices
const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('YOUR_LAN_IP')) {
    return envUrl;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:5000/api`;
    }
    return 'http://127.0.0.1:5000/api';
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://127.0.0.1:5000/api';
};

export const API_BASE_URL = getBaseUrl();

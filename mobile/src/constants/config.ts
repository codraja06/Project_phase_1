import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const DEFAULT_LAN_URL = 'http://192.168.29.44:5000/api';

// Intelligent host resolution for Web, Physical Devices (LAN/Tunnel), and Emulators
export const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || (Constants.expoConfig?.extra?.apiUrl as string);

  if (
    envUrl &&
    !envUrl.includes('YOUR_LAN_IP') &&
    !envUrl.includes('YOUR_COMPUTER_LAN_IP') &&
    !envUrl.includes('trycloudflare.com')
  ) {
    return envUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }
    return DEFAULT_LAN_URL;
  }

  // 1. Dynamic host resolution from Expo development server (Expo Go)
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    if (isIpv4 && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000/api`;
    }
  }

  // 2. Fallback for physical devices and standalone APKs
  return DEFAULT_LAN_URL;
};

export const API_BASE_URL = getBaseUrl();

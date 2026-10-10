import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Intelligent host resolution for Web, Physical Devices (LAN/Tunnel), and Emulators
const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl && !envUrl.includes('YOUR_LAN_IP')) return envUrl.replace(/\/$/, '');

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }
    return envUrl && !envUrl.includes('YOUR_LAN_IP') ? envUrl : 'http://127.0.0.1:5000/api';
  }

  // 1. Dynamic host resolution from Expo development server
  // When running Expo Go, Constants.expoConfig?.hostUri contains the IP:Port of the dev machine
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

  // 2. Environment variable if explicitly defined and not a loopback address on device
  if (envUrl && !envUrl.includes('YOUR_LAN_IP') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 3. Known WiFi LAN IP of this development machine
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://127.0.0.1:5000/api';
};

export const API_BASE_URL = getBaseUrl();

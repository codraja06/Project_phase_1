import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Civic Track',
  slug: 'civic-issue-detection',
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL || config.extra?.apiUrl || 'http://192.168.29.44:5000/api',
    mapProvider: process.env.EXPO_PUBLIC_MAP_PROVIDER || 'osm',
  },
  android: {
    ...config.android,
    softwareKeyboardLayoutMode: 'resize',
  },
});

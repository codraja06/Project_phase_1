// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add web platform support
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Resolve react-native-maps to a stub on web to prevent bundler crash
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (
      moduleName === 'react-native-maps' ||
      moduleName.startsWith('react-native-maps/')
    ) {
      return {
        type: 'empty',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

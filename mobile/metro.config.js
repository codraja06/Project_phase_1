// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add web platform support
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

module.exports = config;

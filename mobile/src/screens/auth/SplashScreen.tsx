import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { COLORS } from '../../constants/theme';
import { CivicTrackLogo } from '../../components/CivicTrackLogo';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('CitizenLogin');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Flag-Inspired Banded Background (Red - Yellow - Red proportions) */}
      <View style={styles.topBand} />
      <View style={styles.middleBand} />
      <View style={styles.bottomBand} />

      {/* Floating Center Brand Card */}
      <View style={styles.contentCard}>
        <View style={styles.logoBadgeContainer}>
          <CivicTrackLogo size="lg" showText={false} />
        </View>

        <Text style={styles.appName}>CivicTrack</Text>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>SMART CIVIC RESOLUTION</Text>
        </View>

        <Text style={styles.tagline}>Cleaner Cities • Brighter Tomorrows</Text>

        <View style={styles.pillarsRow}>
          <Text style={styles.pillarText}>REPORT</Text>
          <Text style={styles.pillarDot}>•</Text>
          <Text style={styles.pillarText}>DETECT</Text>
          <Text style={styles.pillarDot}>•</Text>
          <Text style={styles.pillarText}>RESOLVE</Text>
        </View>

        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 24 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '33.33%',
    backgroundColor: COLORS.primary, // Deep Crimson Red
  },
  middleBand: {
    position: 'absolute',
    top: '33.33%',
    left: 0,
    right: 0,
    height: '33.34%',
    backgroundColor: COLORS.secondary, // Golden Yellow
  },
  bottomBand: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '33.33%',
    backgroundColor: COLORS.primary, // Deep Crimson Red
  },
  contentCard: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#FEF08A',
  },
  logoBadgeContainer: {
    marginBottom: 8,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  badgePill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primarySurface,
    marginBottom: 10,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  pillarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pillarText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
  },
  pillarDot: {
    fontSize: 12,
    color: COLORS.secondaryDark,
    marginHorizontal: 8,
    fontWeight: '900',
  },
});

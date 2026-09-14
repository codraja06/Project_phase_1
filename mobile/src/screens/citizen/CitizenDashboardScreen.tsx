import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { complaintApi } from '../../api/complaintApi';
import { Complaint, ComplaintStats } from '../../types/complaint';
import { COLORS, BORDER_RADIUS, SHADOWS, LAYOUT } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ComplaintCard } from '../../components/ComplaintCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const CitizenDashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { isDesktop, width } = useBreakpoint();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await complaintApi.getMyComplaints();
      setRecentComplaints(res.complaints.slice(0, 5));
      setStats(res.stats);
    } catch (error) {
      console.error('Failed to fetch citizen dashboard complaints:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading Citizen Dashboard..." />;
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Citizen';

  // Desktop vs Mobile responsive styles applied below
  const contentStyle = isDesktop ? styles.desktopContent : styles.mobileContent;

  const statCardResponsiveStyle = isDesktop
    ? styles.statCardDesktop
    : width < 300
    ? styles.statCardMobileFull
    : styles.statCardGrid2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFBF7" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={contentStyle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Top Bar / Header */}
          <View style={isDesktop ? styles.desktopHeader : styles.mobileHeader}>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.greetingSub}>{getGreeting()}</Text>
                <Badge label="Verified Citizen" variant="outline" />
              </View>
              <Text style={styles.greetingName}>{firstName} 👋</Text>
              <Text style={styles.greetingTagline}>
                Help keep your neighborhood clean, safe, and well-maintained.
              </Text>
            </View>
            <View style={styles.topControls}>
              {!isDesktop && (
                <TouchableOpacity
                  style={styles.avatarBtn}
                  onPress={() => navigation.navigate('CitizenProfile')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person" size={20} color={COLORS.primaryDark} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
                {stats.pending > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content Layout */}
          <View style={isDesktop ? styles.desktopBody : styles.mobileBody}>
            {/* Left Column / Top Stack */}
            <View style={isDesktop ? styles.desktopLeftCol : styles.mobileLeftCol}>
              {/* Primary Bento: Report CTA */}
              <Card interactive onPress={() => navigation.navigate('ReportIssue')} style={styles.heroCard}>
                <CardContent style={styles.heroContent}>
                  <View style={styles.heroTextRow}>
                    <View style={styles.heroIconCircle}>
                      <Ionicons name="camera" size={24} color={COLORS.secondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroTitle}>Civic Hazard Detected?</Text>
                      <Text style={styles.heroSubtitle}>Instant YOLOv8 AI vision analysis & GPS location tag.</Text>
                    </View>
                  </View>
                  <Button
                    title="REPORT AN ISSUE NOW"
                    onPress={() => navigation.navigate('ReportIssue')}
                    variant="default"
                    icon={<Ionicons name="add-circle" size={20} color="#FFFFFF" />}
                    style={styles.heroBtn}
                  />
                </CardContent>
              </Card>

              {/* Secondary Bentos: Action Row */}
              <View style={styles.bentoActionRow}>
                <Card interactive onPress={() => navigation.navigate('ComplaintHistory', { filter: 'all' })} style={styles.bentoCard}>
                  <CardContent style={styles.bentoContent}>
                    <View style={[styles.bentoIcon, { backgroundColor: COLORS.primaryLight }]}>
                      <Ionicons name="document-text" size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.bentoTitle}>My Reports</Text>
                    <Text style={styles.bentoSub}>{stats.total} Total</Text>
                  </CardContent>
                </Card>

                <Card interactive onPress={() => navigation.navigate('ComplaintHistory', { filter: 'pending' })} style={styles.bentoCard}>
                  <CardContent style={styles.bentoContent}>
                    <View style={[styles.bentoIcon, { backgroundColor: COLORS.pendingLight }]}>
                      <Ionicons name="location" size={20} color={COLORS.pending} />
                    </View>
                    <Text style={styles.bentoTitle}>Nearby Issues</Text>
                    <Text style={styles.bentoSub}>{stats.pending} Active</Text>
                  </CardContent>
                </Card>

                <Card interactive onPress={() => navigation.navigate('Notifications')} style={styles.bentoCard}>
                  <CardContent style={styles.bentoContent}>
                    <View style={[styles.bentoIcon, { backgroundColor: COLORS.inProgressLight }]}>
                      <Ionicons name="notifications" size={20} color={COLORS.inProgress} />
                    </View>
                    <Text style={styles.bentoTitle}>Notifications</Text>
                    <Text style={styles.bentoSub}>{stats.inProgress > 0 ? `${stats.inProgress} Live` : 'Alerts'}</Text>
                  </CardContent>
                </Card>
              </View>

              {/* Quick Category Chips */}
              <View style={styles.quickChipsSection}>
                <Text style={styles.sectionTitle}>QUICK ISSUE CATEGORIES</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsContainer}>
                  {[
                    { id: 'pothole', label: 'Pothole', icon: 'car-outline' },
                    { id: 'road_damage', label: 'Road Damage', icon: 'warning-outline' },
                    { id: 'garbage', label: 'Garbage', icon: 'trash-outline' },
                    { id: 'garbage_overflow', label: 'Garbage Overflow', icon: 'trash' },
                    { id: 'street_light', label: 'Streetlight', icon: 'bulb-outline' },
                    { id: 'drainage_problem', label: 'Drainage', icon: 'water-outline' },
                    { id: 'water_leakage', label: 'Water Leak', icon: 'rainy-outline' },
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.quickChip}
                      onPress={() => navigation.navigate('ReportIssue', { initialCategory: cat.id })}
                      activeOpacity={0.75}
                    >
                      <Ionicons name={cat.icon as any} size={15} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
                      <Text style={styles.quickChipText}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Stats Grid */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Activity Overview</Text>
              </View>
              <View style={styles.statsGrid}>
                {[
                  { label: 'Total Complaints', count: stats.total, color: COLORS.textPrimary, filter: 'all' },
                  { label: 'Pending', count: stats.pending, color: COLORS.pending, filter: 'pending' },
                  { label: 'In Progress', count: stats.inProgress, color: COLORS.inProgress, filter: 'in_progress' },
                  { label: 'Resolved', count: stats.resolved, color: COLORS.resolved, filter: 'resolved' },
                ].map((stat, i) => (
                  <Card key={i} interactive onPress={() => navigation.navigate('ComplaintHistory', { filter: stat.filter })} style={statCardResponsiveStyle}>
                    <CardContent style={styles.statContent}>
                      <Text numberOfLines={1} style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
                      <Text numberOfLines={2} style={styles.statLabel}>{stat.label}</Text>
                    </CardContent>
                  </Card>
                ))}
              </View>
            </View>

            {/* Right Column / Bottom Stack */}
            <View style={isDesktop ? styles.desktopRightCol : styles.mobileRightCol}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Incidents</Text>
                <Button variant="link" title="See All →" onPress={() => navigation.navigate('ComplaintHistory', { filter: 'all' })} />
              </View>

              {recentComplaints.length > 0 ? (
                recentComplaints.map((item) => (
                  <ComplaintCard
                    key={item._id}
                    complaint={item}
                    onPress={() => (navigation as any).navigate('ComplaintDetail', { complaintId: item._id })}
                  />
                ))
              ) : (
                <Card style={styles.emptyCard}>
                  <CardContent style={styles.emptyContent}>
                    <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>No complaints reported yet</Text>
                    <Text style={styles.emptySub}>
                      Spot a pothole, garbage, or road damage? Tap above to submit your first report.
                    </Text>
                  </CardContent>
                </Card>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundNeutral,
  },
  container: {
    flex: 1,
  },
  desktopContent: {
    padding: 40,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mobileContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingSub: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginRight: 12,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  greetingTagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  desktopBody: {
    flexDirection: 'row',
    gap: 40,
  },
  mobileBody: {
    flexDirection: 'column',
    gap: 24,
  },
  desktopLeftCol: {
    flex: 1,
    maxWidth: 600,
  },
  mobileLeftCol: {
    width: '100%',
  },
  desktopRightCol: {
    flex: 1,
  },
  mobileRightCol: {
    width: '100%',
  },
  heroCard: {
    backgroundColor: '#0F172A', // Deep Charcoal/Dark for contrast
    borderColor: '#1E293B',
    marginBottom: 20,
  },
  heroContent: {
    padding: 24,
  },
  heroTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  heroBtn: {
    width: '100%',
  },
  bentoActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Glass effect
  },
  bentoContent: {
    padding: 16,
    alignItems: 'center',
  },
  bentoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bentoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  bentoSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  quickChipsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickChipsContainer: {
    paddingRight: 16,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.sm,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statCardDesktop: {
    flexBasis: Platform.OS === 'web' ? ('calc(25% - 9px)' as any) : '22%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  statCardGrid2: {
    flexBasis: Platform.OS === 'web' ? ('calc(50% - 6px)' as any) : '47%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  statCardMobileFull: {
    width: '100%',
    flexBasis: '100%',
    flexGrow: 1,
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  statContent: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  statCount: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    ...(Platform.OS === 'web' ? ({
      wordBreak: 'normal',
      overflowWrap: 'normal',
      whiteSpace: 'normal',
    } as any) : {}),
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

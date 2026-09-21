import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeIn, ZoomIn, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { complaintApi } from '../../api/complaintApi';
import { Complaint, ComplaintStats } from '../../types/complaint';
import { COLORS } from '../../theme/colors';
import { BORDER_RADIUS } from '../../theme/radius';
import { SHADOWS } from '../../theme/index';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
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

  const renderRightColContent = () => (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Incidents</Text>
        <Button variant="link" title="See All →" onPress={() => navigation.navigate('ComplaintHistory', { filter: 'all' })} />
      </View>

      {recentComplaints.length > 0 ? (
        recentComplaints.map((item, index) => (
          <Animated.View key={item._id} entering={FadeInUp.delay(900 + (index * 100))}>
            <ComplaintCard
              complaint={item}
              onPress={() => (navigation as any).navigate('ComplaintDetail', { complaintId: item._id })}
            />
          </Animated.View>
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
    </>
  );

  const dashboardContent = (
    <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
      {/* Top Bar / Header */}
      <View style={isDesktop ? styles.desktopHeader : styles.mobileHeader}>
        <View>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.badgeRow}>
            <Text style={styles.greetingSub}>{getGreeting()}</Text>
            <Badge label="Verified Citizen" variant="outline" />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(200)} style={styles.greetingName}>{firstName} 👋</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300)} style={styles.greetingTagline}>
            Help keep your neighborhood clean, safe, and well-maintained.
          </Animated.Text>
        </View>
        <Animated.View entering={FadeInDown.delay(400)} style={styles.topControls}>
          {isDesktop && (
            <View style={styles.headerSearch}>
              <Ionicons name="search" size={16} color={COLORS.textMuted} />
              <Text style={styles.headerSearchText}>Search complaints, locations...</Text>
            </View>
          )}
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
          {isDesktop && (
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('CitizenProfile')}
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={20} color={COLORS.primaryDark} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* Main Content Layout */}
      <View style={isDesktop ? styles.desktopBody : styles.mobileBody}>
        {/* Left Column / Top Stack */}
        <View style={isDesktop ? styles.desktopLeftCol : styles.mobileLeftCol}>
          {/* Compact Hero: Report CTA */}
          <Animated.View entering={ZoomIn.duration(600).springify().damping(15)}>
            <Card interactive onPress={() => navigation.navigate('ReportIssue')} style={styles.compactHeroCard}>
              <CardContent style={styles.compactHeroContent}>
                <View style={styles.compactHeroIconCircle}>
                  <Ionicons name="camera" size={28} color={COLORS.primary} />
                </View>
                <View style={styles.compactHeroTextContainer}>
                  <Text style={styles.compactHeroTitle}>Report an Issue</Text>
                  <Text style={styles.compactHeroSubtitle}>Take a photo, let AI detect the issue, add location and submit.</Text>
                </View>
                <Button
                  title="Report an Issue"
                  onPress={() => navigation.navigate('ReportIssue')}
                  variant="default"
                  icon={<Ionicons name="add-circle" size={18} color="#FFFFFF" />}
                  style={styles.compactHeroBtn}
                />
              </CardContent>
            </Card>
          </Animated.View>

          {/* Secondary Bentos: Action Row */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.bentoActionRow}>
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
          </Animated.View>

          {/* Quick Issue Categories */}
          <Animated.View entering={FadeInUp.delay(600)} style={styles.quickCategorySection}>
            <Text style={styles.sectionTitle}>QUICK ISSUE CATEGORIES</Text>
            <View style={styles.quickCategoryGrid}>
              {[
                { id: 'pothole', label: 'Pothole', icon: 'car-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
                { id: 'road_damage', label: 'Road Damage', icon: 'warning-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
                { id: 'garbage', label: 'Garbage', icon: 'trash-outline', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
                { id: 'garbage_overflow', label: 'Garbage Overflow', icon: 'water-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.quickCategoryCard}
                  onPress={() => navigation.navigate('ReportIssue', { initialCategory: cat.id })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickCategoryIconBox, { backgroundColor: cat.bg }]}>
                    <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                  </View>
                  <Text style={styles.quickCategoryText}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Stats Grid */}
          <Animated.View entering={FadeInUp.delay(700)}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Activity Overview</Text>
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>Last 30 Days</Text>
                <Ionicons name="chevron-down" size={12} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
            <View style={styles.statsGrid}>
              {[
                { label: 'Total Complaints', count: stats.total, color: COLORS.primary, bg: COLORS.primaryLight, icon: 'document-text-outline', filter: 'all' },
                { label: 'Pending', count: stats.pending, color: COLORS.pending, bg: COLORS.pendingLight, icon: 'time-outline', filter: 'pending' },
                { label: 'In Progress', count: stats.inProgress, color: COLORS.inProgress, bg: COLORS.inProgressLight, icon: 'construct-outline', filter: 'in_progress' },
                { label: 'Resolved', count: stats.resolved, color: COLORS.resolved, bg: COLORS.resolvedLight, icon: 'checkmark-circle-outline', filter: 'resolved' },
              ].map((stat, i) => (
                <Card key={i} interactive onPress={() => navigation.navigate('ComplaintHistory', { filter: stat.filter })} style={statCardResponsiveStyle}>
                  <CardContent style={styles.statContent}>
                    <View style={styles.statHeader}>
                      <View style={[styles.statIconWrapper, { backgroundColor: stat.bg }]}>
                        <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                      </View>
                    </View>
                    <Text numberOfLines={1} style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
                    <Text numberOfLines={1} style={styles.statLabel}>{stat.label}</Text>
                  </CardContent>
                </Card>
              ))}
            </View>
          </Animated.View>

          {/* Bottom Community Banner */}
          <Animated.View entering={FadeInUp.delay(800)} style={styles.communityBanner}>
            <View style={styles.communityBannerContent}>
              <View style={styles.communityBannerTextCol}>
                <Text style={styles.communityBannerTitle}>Cleaner Neighborhoods{'\n'}Stronger Communities</Text>
                <Text style={styles.communityBannerSub}>Report • Track • Create Change</Text>
              </View>
              <Ionicons name="leaf" size={48} color="rgba(16, 185, 129, 0.2)" style={styles.communityBannerIcon} />
            </View>
          </Animated.View>
        </View>

        {/* Right Column / Bottom Stack */}
        {isDesktop ? (
          <Animated.View entering={FadeInUp.delay(800)} style={styles.desktopRightColWrapper}>
            <ScrollView
              style={styles.desktopRightColScroll}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.desktopRightColScrollContent}
            >
              {renderRightColContent()}
            </ScrollView>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(800)} style={styles.mobileRightCol}>
            {renderRightColContent()}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );

  if (isDesktop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundNeutral} />
        <View style={[styles.container, styles.desktopFixedContainer]}>
          {dashboardContent}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundNeutral} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.mobileContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {dashboardContent}
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
  desktopFixedContainer: {
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    overflow: 'hidden',
    padding: SPACING['3xl'],
    paddingTop: SPACING['3xl'],
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  desktopContent: {
    padding: SPACING['7xl'],
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mobileContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING['7xl'],
  },
  desktopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING['3xl'],
  },
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING['3xl'],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  greetingSub: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textSecondary,
    marginRight: SPACING.lg,
  },
  greetingName: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  greetingTagline: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
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
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondary,
  },
  desktopBody: {
    flexDirection: 'row',
    gap: SPACING['5xl'],
    flex: 1,
    overflow: 'hidden',
  },
  mobileBody: {
    flexDirection: 'column',
    gap: SPACING['3xl'],
  },
  desktopLeftCol: {
    flex: 1,
    maxWidth: 600,
  },
  mobileLeftCol: {
    width: '100%',
  },
  desktopRightColWrapper: {
    flex: 1,
    height: '100%',
  },
  desktopRightColScroll: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  desktopRightColScrollContent: {
    paddingBottom: SPACING['7xl'],
  },
  mobileRightCol: {
    width: '100%',
  },
  compactHeroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    marginBottom: SPACING['2xl'],
    ...SHADOWS.sm,
  },
  compactHeroContent: {
    padding: SPACING.xl,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  compactHeroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactHeroTextContainer: {
    flex: 1,
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
  },
  compactHeroTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  compactHeroSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: Platform.OS === 'web' ? 'left' : 'center',
  },
  compactHeroBtn: {
    width: Platform.OS === 'web' ? 'auto' : '100%',
    minWidth: 180,
  },
  bentoActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    marginBottom: SPACING['3xl'],
  },
  bentoCard: {
    flexBasis: Platform.OS === 'web' ? ('calc(33.33% - 16px)' as any) : '30%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Glass effect
  },
  bentoContent: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  bentoIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  bentoTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  bentoSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  quickCategorySection: {
    marginBottom: SPACING['3xl'],
  },
  sectionTitle: {
    ...TYPOGRAPHY.overline,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  quickCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  quickCategoryCard: {
    flexBasis: Platform.OS === 'web' ? ('calc(25% - 12px)' as any) : '47%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 130,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  quickCategoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickCategoryText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterDropdownText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  headerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minWidth: 260,
  },
  headerSearchText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
  communityBanner: {
    marginTop: SPACING.xl,
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    overflow: 'hidden',
  },
  communityBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING['3xl'],
  },
  communityBannerTextCol: {
    flex: 1,
    zIndex: 1,
  },
  communityBannerTitle: {
    ...TYPOGRAPHY.h4,
    color: '#064E3B',
    marginBottom: SPACING.xs,
    lineHeight: 26,
  },
  communityBannerSub: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  communityBannerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    transform: [{ rotate: '-15deg' }, { scale: 2.5 }],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    marginBottom: SPACING['3xl'],
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
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: 110,
  },
  statHeader: {
    marginBottom: SPACING.sm,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: {
    ...TYPOGRAPHY.h2,
    marginBottom: 2,
    textAlign: 'left',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'left',
    ...(Platform.OS === 'web' ? ({
      wordBreak: 'normal',
      overflowWrap: 'normal',
      whiteSpace: 'nowrap',
    } as any) : {}),
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
  emptyContent: {
    padding: SPACING['4xl'],
    alignItems: 'center',
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  emptySub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

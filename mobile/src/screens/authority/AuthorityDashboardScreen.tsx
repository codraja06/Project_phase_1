import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,

  StatusBar,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { authorityApi } from '../../api/authorityApi';
import { Complaint, ComplaintStats } from '../../types/complaint';
import { COLORS } from '../../theme/colors';
import { BORDER_RADIUS } from '../../theme/radius';
import { SHADOWS } from '../../theme/index';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useMobileMenu } from '../../contexts/MobileMenuContext';
import { ComplaintCard } from '../../components/ComplaintCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { AuthorityMobileHeader } from '../../components/AuthorityMobileHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const FILTER_PILLS = [
  { id: 'all', label: 'All Activity' },
  { id: 'urgent', label: 'Urgent / High' },
  { id: 'pothole', label: 'Potholes' },
  { id: 'garbage', label: 'Garbage' },
  { id: 'water', label: 'Water / Drain' },
  { id: 'streetlight', label: 'Streetlights' },
];

export const AuthorityDashboardScreen = ({ navigation }: any) => {
  const { isDesktop, isTablet, isWide, isMobile, width } = useBreakpoint();
  const { toggleMenu } = useMobileMenu();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
    today: 0,
    categoryStats: {},
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true); setError('');
      const res = await authorityApi.getAllComplaints();
      const list = res.complaints || [];
      setAllComplaints(list);
      setStats(res.stats || {
        total: list.length,
        pending: list.filter((c: Complaint) => (c.status || '').toLowerCase() === 'pending').length,
        inProgress: list.filter((c: Complaint) => (c.status || '').toLowerCase().includes('progress')).length,
        resolved: list.filter((c: Complaint) => (c.status || '').toLowerCase() === 'resolved').length,
        highPriority: list.filter((c: Complaint) => c.priority === 'high' || c.priority === 'urgent').length,
        today: 0,
      });
    } catch (error) {
      setError((error as Error).message || 'Reports are unavailable.');
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

  const displayedComplaints = useMemo(() => {
    let filtered = allComplaints;
    if (activeFilter === 'urgent') {
      filtered = filtered.filter(
        (c) => c.priority === 'urgent' || c.priority === 'high'
      );
    } else if (activeFilter === 'pothole') {
      filtered = filtered.filter(
        (c) => (c.category || '').toLowerCase().includes('pothole') || (c.category || '').toLowerCase().includes('road')
      );
    } else if (activeFilter === 'garbage') {
      filtered = filtered.filter((c) => (c.category || '').toLowerCase().includes('garbage'));
    } else if (activeFilter === 'water') {
      filtered = filtered.filter(
        (c) => (c.category || '').toLowerCase().includes('water') || (c.category || '').toLowerCase().includes('drain')
      );
    } else if (activeFilter === 'streetlight') {
      filtered = filtered.filter((c) => (c.category || '').toLowerCase().includes('light'));
    }
    return filtered.filter(c => `${c.title} ${c.complaintId || c._id} ${c.address}`.toLowerCase().includes(search.trim().toLowerCase()));
  }, [allComplaints, activeFilter, search]);

  const categoryCounts = useMemo(() => {
    let pothole = 0; let garbage = 0; let water = 0; let streetlight = 0;
    allComplaints.forEach((c) => {
      const cat = (c.category || '').toLowerCase();
      if (cat.includes('pothole') || cat.includes('road')) pothole++;
      else if (cat.includes('garbage')) garbage++;
      else if (cat.includes('water') || cat.includes('drain')) water++;
      else if (cat.includes('light')) streetlight++;
    });
    return { pothole, garbage, water, streetlight };
  }, [allComplaints]);

  const durations = allComplaints.filter(c => c.status === 'Resolved' && c.resolvedAt && Date.parse(c.resolvedAt) >= Date.parse(c.createdAt)).map(c => (Date.parse(c.resolvedAt!) - Date.parse(c.createdAt)) / 3600000);
  const average = durations.length ? `${(durations.reduce((a,b) => a+b,0) / durations.length).toFixed(1)}h` : '—';
  const verifiedPct = allComplaints.length ? `${Math.round(allComplaints.filter(c => c.verified).length / allComplaints.length * 100)}%` : '—';
  if (error) return <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}><Text accessibilityRole="alert">{error}</Text><Button title="Retry" onPress={fetchDashboardData} /></View>;

  if (loading && !refreshing) {
    return <LoadingSpinner message="Initializing Command Center..." />;
  }

  // ─── Responsive padding ─────────────────────────────────────────────────────
  const screenPadding = isMobile ? (width < 360 ? 12 : 16) : isTablet ? 20 : 24;
  // KPI grid: 2 columns on mobile, 3 on tablet, 6 on desktop
  const kpiColumns = isMobile ? 2 : 3;
  const kpiGap = isMobile ? (width < 360 ? 8 : 12) : 12;

  const KPI_DATA = [
    { label: 'Total Incidents', count: stats.total, filter: 'all', color: '#C91C24', icon: 'layers' as const },
    { label: 'Pending Triage', count: stats.pending, filter: 'pending', color: '#F59E0B', icon: 'time' as const },
    { label: 'Under Repair', count: stats.inProgress, filter: 'in_progress', color: '#3B82F6', icon: 'construct' as const },
    { label: 'Resolved', count: stats.resolved, filter: 'resolved', color: '#10B981', icon: 'checkmark-circle' as const },
    { label: 'High Priority', count: stats.highPriority || 0, filter: 'urgent', color: '#C91C24', icon: 'alert-circle' as const },
    { label: "Today's Intake", count: stats.today || 0, filter: 'today', color: '#8B5CF6', icon: 'calendar' as const },
  ];

  if (!isDesktop) {
    return (
      <View style={s.safeAreaMobile}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={{ flex: 1, backgroundColor: COLORS.backgroundNeutral }}>
          <AuthorityMobileHeader
            title="Command Center"
            subtitle="Triage & dispatch hub"
            rightNode={
              <TouchableOpacity style={s.mobileHeaderIcon} accessibilityLabel="Notifications" accessibilityRole="button" onPress={() => navigation.navigate('AuthorityNotifications')}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />

              </TouchableOpacity>
            }
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: screenPadding, paddingBottom: 120 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38BDF8']} tintColor="#38BDF8" />}
          >
            {/* Operational KPIs */}
            <Text style={[s.sectionLabel, { marginTop: 16, marginBottom: 12, color: COLORS.textSecondary }]}>OPERATIONAL KPIs</Text>
            <View style={[s.kpiGrid, { gap: kpiGap }]}>
              {KPI_DATA.map((stat, i) => (
                <Card key={i} interactive onPress={() => navigation.navigate('AllComplaints', { filter: stat.filter })}
                  style={[s.kpiCard, { flexBasis: isMobile ? (width < 360 ? '46%' : '47%') : `${(100 / kpiColumns) - 2}%` }]}>
                  <View style={s.kpiContent}>
                    <View style={[s.kpiIconCircle, { backgroundColor: `${stat.color}15`, marginBottom: 8 }]}>
                      <Ionicons name={stat.icon} size={width < 360 ? 16 : 18} color={stat.color} />
                    </View>
                    <Text style={[s.kpiCount, { fontSize: width < 360 ? 18 : 22 }]}>{stat.count}</Text>
                    <Text style={s.kpiLabel} numberOfLines={1}>{stat.label}</Text>
                  </View>
                </Card>
              ))}
            </View>

            {/* SLA Card */}
            <Card style={[s.slaCard, { marginTop: 16 }]}>
              <CardContent style={{ padding: 16 }}>
                <View style={s.slaHeader}>
                  <Text style={s.slaTitle}>Resolution & Verification</Text>
                  <Text style={s.slaBadge}>Service data</Text>
                </View>
                <View style={s.slaMetrics}>
                  <View style={s.slaMetric}>
                    <Text style={s.slaMetricVal}>{average}</Text>
                    <Text style={s.slaMetricLabel}>Avg</Text>
                  </View>
                  <View style={s.slaDivider} />
                  <View style={s.slaMetric}>
                    <Text style={s.slaMetricVal}>—</Text>
                    <Text style={s.slaMetricLabel}>SLA unavailable</Text>
                  </View>
                  <View style={s.slaDivider} />
                  <View style={s.slaMetric}>
                    <Text style={[s.slaMetricVal, { color: COLORS.resolved }]}>{verifiedPct}</Text>
                    <Text style={s.slaMetricLabel}>Verified</Text>
                  </View>
                </View>
                {/* Incident Distribution Mobile */}
                <Text style={s.distTitle}>INCIDENT DISTRIBUTION</Text>
                {[
                  { label: 'Potholes', count: categoryCounts.pothole, color: COLORS.error },
                  { label: 'Garbage', count: categoryCounts.garbage, color: COLORS.pending },
                  { label: 'Streetlight', count: categoryCounts.streetlight, color: COLORS.info },
                ].map((cat, i) => (
                  <View key={i} style={s.distRow}>
                    <Text style={s.distLabel}>{cat.label}: {cat.count}</Text>
                    <View style={s.distBarBg}>
                      <View style={[s.distBarFill, { width: `${stats.total ? Math.min(100, Math.round((cat.count / stats.total) * 100)) : 0}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* Banner */}
            <View style={[s.banner, { marginTop: 12 }]}>
              <Text style={s.bannerTitle}>Cleaner Neighborhoods</Text>
              <Text style={s.bannerSub}>REPORT • TRACK • RESOLVE</Text>
            </View>

            {/* Incident Queue */}
            <View style={{ marginTop: 24 }}>
              <View style={s.queueHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.queueTitle}>Incident Queue</Text>
                  <Text style={s.queueSub}>Live reports from citizens.</Text>
                </View>
                <Button variant="link" title="View All →" onPress={() => navigation.navigate('AllComplaints')} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }} contentContainerStyle={{ gap: 6 }}>
                {FILTER_PILLS.map((pill) => (
                  <TouchableOpacity key={pill.id} style={[s.filterPill, activeFilter === pill.id && s.filterPillActive]} onPress={() => setActiveFilter(pill.id)}>
                    <Text style={[s.filterPillText, activeFilter === pill.id && s.filterPillTextActive]}>
                      {pill.label}{pill.id === 'all' ? ` (${displayedComplaints.length})` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ display: 'flex', flexDirection: 'column' }}>
                {displayedComplaints.length > 0 ? displayedComplaints.map((item, index) => (
                  <Animated.View key={item._id} entering={FadeInUp.delay(200 + Math.min(index * 50, 500))}>
                    <ComplaintCard complaint={item} showCitizenInfo={true} onPress={() => navigation.navigate('AuthorityComplaintDetail', { complaintId: item._id })} style={{ marginBottom: 10, borderRadius: 12 }} />
                  </Animated.View>
                )) : (
                  <View style={s.emptyState}>
                    <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.textMuted} />
                    <Text style={s.emptyTitle}>No matching incidents</Text>
                    <Text style={s.emptySub}>Queue is clear for this category.</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {isDesktop ? (
        // ─── Desktop/Tablet: fixed container ────────────────────────────────
        <View style={s.desktopFixedContainer}>
          <View style={[s.scrollContent, { padding: screenPadding, flex: 1, display: 'flex', flexDirection: 'column' }]}>
            {/* Header */}
            <View style={s.headerBar}>
              <View style={{ flex: 1 }}>
                <View style={{ marginBottom: 6 }}>
                  <Badge label="MUNICIPAL OPS" variant="secondary" icon={<Ionicons name="shield-checkmark" size={12} color={COLORS.textPrimary} />} />
                </View>
                <Text style={s.headerTitle}>Command Center</Text>
                <Text style={s.headerSubtitle}>Real-time triage and resolution dispatch hub.</Text>
              </View>
              <View style={s.headerActions}>
                <View style={s.headerSearch}>
                  <Ionicons name="search" size={16} color={COLORS.slateMuted} />
                  <TextInput
                    style={s.headerSearchInput}
                    value={search}
                    onChangeText={setSearch}
                    accessibilityLabel="Search incidents"
                    placeholder="Search incidents..."
                    placeholderTextColor={COLORS.slateMuted}
                  />
                </View>
                <TouchableOpacity style={s.headerIconBtn} accessibilityLabel="Notifications" accessibilityRole="button" onPress={() => navigation.navigate('AuthorityNotifications')}>
                  <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />

                </TouchableOpacity>
                <TouchableOpacity style={s.avatarBtn} accessibilityRole="button" accessibilityLabel="Officer profile" onPress={() => navigation.navigate('AuthorityProfile')}>
                  <Ionicons name="person" size={18} color={COLORS.primaryDark} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Desktop body: two columns */}
            <View style={[s.desktopBody, { flex: 1, minHeight: 0 }]}>
              {/* Left column */}
              <View style={s.desktopLeftCol}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* KPI Section */}
                <View style={s.sectionHeaderRow}>
                  <Text style={s.sectionLabel}>OPERATIONAL KPIs</Text>
                </View>
                <View style={[s.kpiGrid, { gap: 12 }]}>
                  {KPI_DATA.map((stat, i) => (
                    <Card key={i} interactive onPress={() => navigation.navigate('AllComplaints', { filter: stat.filter })}
                      style={[s.kpiCard, { flexBasis: `${(100 / kpiColumns) - 2}%` }]}>
                      <View style={s.kpiContent}>
                        <View style={[s.kpiIconCircle, { backgroundColor: `${stat.color}15` }]}>
                          <Ionicons name={stat.icon} size={18} color={stat.color} />
                        </View>
                        <Text style={s.kpiCount}>{stat.count}</Text>
                        <Text style={s.kpiLabel} numberOfLines={1}>{stat.label}</Text>
                      </View>
                    </Card>
                  ))}
                </View>

                {/* SLA Card */}
                <Card style={s.slaCard}>
                  <CardContent style={{ padding: SPACING.xl }}>
                    <View style={s.slaHeader}>
                      <Text style={s.slaTitle}>Resolution & Verification</Text>
                      <Text style={s.slaBadge}>Service data</Text>
                    </View>
                    <View style={s.slaMetrics}>
                      <View style={s.slaMetric}>
                        <Text style={s.slaMetricVal}>{average}</Text>
                        <Text style={s.slaMetricLabel}>Avg Resolution</Text>
                      </View>
                      <View style={s.slaDivider} />
                      <View style={s.slaMetric}>
                        <Text style={s.slaMetricVal}>—</Text>
                        <Text style={s.slaMetricLabel}>SLA unavailable</Text>
                      </View>
                      <View style={s.slaDivider} />
                      <View style={s.slaMetric}>
                        <Text style={[s.slaMetricVal, { color: COLORS.resolved }]}>{verifiedPct}</Text>
                        <Text style={s.slaMetricLabel}>Verified</Text>
                      </View>
                    </View>
                    {/* Incident Distribution */}
                    <Text style={s.distTitle}>INCIDENT DISTRIBUTION</Text>
                    {[
                      { label: 'Potholes', count: categoryCounts.pothole, color: COLORS.error },
                      { label: 'Garbage', count: categoryCounts.garbage, color: COLORS.pending },
                      { label: 'Streetlight', count: categoryCounts.streetlight, color: COLORS.info },
                    ].map((cat, i) => (
                      <View key={i} style={s.distRow}>
                        <Text style={s.distLabel}>{cat.label}: {cat.count}</Text>
                        <View style={s.distBarBg}>
                          <View style={[s.distBarFill, { width: `${stats.total ? Math.min(100, Math.round((cat.count / stats.total) * 100)) : 0}%`, backgroundColor: cat.color }]} />
                        </View>
                      </View>
                    ))}
                  </CardContent>
                </Card>

                {/* Banner */}
                <View style={s.banner}>
                  <Text style={s.bannerTitle}>Cleaner Neighborhoods • Stronger Communities</Text>
                  <Text style={s.bannerSub}>REPORT • TRACK • RESOLVE</Text>
                </View>
                </ScrollView>
              </View>

              {/* Right column — Incident Queue */}
              <View style={[s.desktopRightCol, { flex: 1, display: 'flex', flexDirection: 'column' }]}>
                <View style={s.queueHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.queueTitle}>Incident Queue</Text>
                    <Text style={s.queueSub}>Live incident reports from citizens.</Text>
                  </View>
                  <Button variant="link" title="Manage Queue →" onPress={() => navigation.navigate('AllComplaints')} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }} contentContainerStyle={{ gap: 6 }}>
                  {FILTER_PILLS.map((pill) => (
                    <TouchableOpacity key={pill.id} style={[s.filterPill, activeFilter === pill.id && s.filterPillActive]} onPress={() => setActiveFilter(pill.id)}>
                      <Text style={[s.filterPillText, activeFilter === pill.id && s.filterPillTextActive]}>
                        {pill.label}{pill.id === 'all' ? ` (${displayedComplaints.length})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
                  {displayedComplaints.length > 0 ? displayedComplaints.map((item, index) => (
                    <Animated.View key={item._id} entering={FadeInUp.delay(200 + Math.min(index * 50, 500))}>
                      <ComplaintCard complaint={item} showCitizenInfo={true} onPress={() => navigation.navigate('AuthorityComplaintDetail', { complaintId: item._id })} style={{ marginBottom: 10, borderRadius: 12 }} />
                    </Animated.View>
                  )) : (
                    <View style={s.emptyState}>
                      <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.textMuted} />
                      <Text style={s.emptyTitle}>No matching incidents</Text>
                      <Text style={s.emptySub}>Queue is clear for this category.</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  safeAreaMobile: { flex: 1, backgroundColor: COLORS.backgroundNeutral },
  desktopFixedContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundNeutral,
    ...(Platform.OS === 'web' ? { height: '100dvh' as any, overflow: 'hidden' as any } : {}),
  },
  scrollContent: {
    maxWidth: 1920,
    alignSelf: 'center' as any,
    width: '100%',
  },

  // ─── Header (Desktop) ─────────────────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 24,
    ...SHADOWS.card,
  },
  headerTitle: { ...TYPOGRAPHY.h2, color: '#F8FAFC', marginBottom: 2, letterSpacing: -0.5 },
  headerSubtitle: { ...TYPOGRAPHY.bodySmall, color: '#94A3B8' },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  headerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 220,
  },
  headerSearchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: '#F8FAFC',
    marginLeft: 8,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 10, right: 10,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  avatarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },

  // ─── Mobile Header ─────────────────────────────────────────────────────────
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  mobileHeaderTitle: { ...TYPOGRAPHY.h4, color: '#F8FAFC', fontSize: 17 },
  mobileHeaderSub: { ...TYPOGRAPHY.caption, color: '#94A3B8', fontSize: 12 },
  mobileHeaderIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  // ─── Desktop Body ──────────────────────────────────────────────────────────
  desktopBody: {
    flexDirection: 'row',
    gap: 24,
    flex: 1,
  },
  desktopLeftCol: { flex: 0.45 },
  desktopRightCol: {
    flex: 0.55,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.card,
  },

  // ─── Section Header ────────────────────────────────────────────────────────
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  sectionLabel: { ...TYPOGRAPHY.overline, letterSpacing: 0.5 },

  // ─── KPI Grid (mobile-first: 2 columns) ───────────────────────────────────
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  kpiContent: {
    padding: 12,
    minHeight: 90,
  },
  kpiIconCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  kpiCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },

  // ─── SLA Card ──────────────────────────────────────────────────────────────
  slaCard: { backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: 16, marginBottom: 16 },
  slaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  slaTitle: { flex: 1, marginRight: 8, ...TYPOGRAPHY.h4, color: '#F8FAFC' },
  slaBadge: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', color: '#94A3B8' },
  slaMetrics: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slaMetric: { flex: 1, alignItems: 'center' },
  slaMetricVal: { ...TYPOGRAPHY.h3, color: '#F8FAFC', marginBottom: 4 },
  slaMetricLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: '#94A3B8' },
  slaDivider: { width: 1, height: 30, backgroundColor: '#334155' },

  // ─── Distribution ──────────────────────────────────────────────────────────
  distTitle: { ...TYPOGRAPHY.overline, color: '#94A3B8', letterSpacing: 0.5, marginBottom: 10 },
  distRow: { marginBottom: 6 },
  distLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: '#E2E8F0', marginBottom: 4 },
  distBarBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  distBarFill: { height: '100%', borderRadius: 3 },

  // ─── Banner ────────────────────────────────────────────────────────────────
  banner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 'auto' as any,
  },
  bannerTitle: { ...TYPOGRAPHY.bodyBold, color: '#064E3B', marginBottom: 2 },
  bannerSub: { ...TYPOGRAPHY.caption, fontWeight: '800', color: '#047857', letterSpacing: 0.5 },

  // ─── Queue ─────────────────────────────────────────────────────────────────
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  queueTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginBottom: 2 },
  queueSub: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },

  // ─── Filters ───────────────────────────────────────────────────────────────
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterPillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  filterPillText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', color: COLORS.textSecondary },
  filterPillTextActive: { color: '#FFFFFF' },

  // ─── Empty ─────────────────────────────────────────────────────────────────
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.borderLight,
  },
  emptyTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.textPrimary, marginTop: 12, marginBottom: 4 },
  emptySub: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textAlign: 'center' },
});

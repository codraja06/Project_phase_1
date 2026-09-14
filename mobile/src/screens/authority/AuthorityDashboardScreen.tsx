import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { authorityApi } from '../../api/authorityApi';
import { Complaint, ComplaintStats } from '../../types/complaint';
import { COLORS, BORDER_RADIUS, SHADOWS, LAYOUT } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ComplaintCard } from '../../components/ComplaintCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
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
  const { isDesktop, isTablet, width } = useBreakpoint();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
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
      setLoading(true);
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
      console.error('Failed to load authority dashboard data:', error);
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
        (c) => c.priority === 'urgent' || c.priority === 'high' || (c.category || '').toLowerCase().includes('pothole')
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
    return filtered.slice(0, 8);
  }, [allComplaints, activeFilter]);

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

  if (loading && !refreshing) {
    return <LoadingSpinner message="Initializing Command Center..." />;
  }

  const contentStyle = isDesktop ? styles.desktopContent : styles.mobileContent;

  const statCardResponsiveStyle = isDesktop || isTablet
    ? styles.statCardGrid3
    : width < 300
    ? styles.statCardMobileFull
    : styles.statCardGrid2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={contentStyle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38BDF8']} tintColor="#38BDF8" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={isDesktop ? styles.desktopHeader : styles.mobileHeader}>
          <View>
            <View style={styles.badgeRow}>
              <Badge label="MUNICIPAL OPS" variant="secondary" icon={<Ionicons name="shield" size={12} color={COLORS.textPrimary} />} />
            </View>
            <Text style={styles.headerTitle}>Command Center</Text>
            <Text style={styles.headerSubtitle}>Real-time triage and resolution dispatch hub.</Text>
          </View>
          <View style={styles.topControls}>
            <Button variant="secondary" icon={<Ionicons name="bar-chart-outline" size={20} color={COLORS.textPrimary} />} title={isDesktop ? "Analytics" : undefined} onPress={() => navigation.navigate('AuthorityAnalytics')} />
            <Button variant="default" icon={<Ionicons name="map-outline" size={20} color="#FFFFFF" />} title={isDesktop ? "GIS Map" : undefined} onPress={() => navigation.navigate('AuthorityMap')} />
          </View>
        </View>

        <View style={isDesktop ? styles.desktopBody : styles.mobileBody}>
          <View style={isDesktop ? styles.desktopLeftCol : styles.mobileLeftCol}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>OPERATIONAL KPIs</Text>
            </View>
            <View style={styles.statsGrid}>
              {[
                { label: 'Total Incidents', count: stats.total, filter: 'all', color: COLORS.textPrimary },
                { label: 'Pending Triage', count: stats.pending, filter: 'pending', color: COLORS.pending },
                { label: 'Under Repair', count: stats.inProgress, filter: 'in_progress', color: COLORS.inProgress },
                { label: 'Immediate / Resolved', count: stats.resolved, filter: 'resolved', color: COLORS.resolved },
                { label: 'High Priority', count: stats.highPriority || 0, filter: 'urgent', color: COLORS.error },
                { label: 'Today\'s Intake', count: stats.today || 0, filter: 'all', color: COLORS.textPrimary },
              ].map((stat, i) => (
                <Card key={i} interactive onPress={() => navigation.navigate('AllComplaints', { filter: stat.filter })} style={statCardResponsiveStyle}>
                  <CardContent style={styles.statContent}>
                    <Text numberOfLines={1} style={[styles.statCount, { color: stat.color }]}>{stat.count}</Text>
                    <Text numberOfLines={2} style={styles.statLabel}>{stat.label}</Text>
                  </CardContent>
                </Card>
              ))}
            </View>

            <Card style={styles.opsIntelCard}>
              <CardContent style={styles.opsContent}>
                <View style={styles.opsHeader}>
                  <Badge label="SLA VELOCITY" variant="warning" icon={<Ionicons name="speedometer" size={12} color="#FFFFFF" />} />
                  <Text style={styles.opsSlaText}>87% On-Time SLA</Text>
                </View>

                <View style={styles.opsMetricsRow}>
                  <View style={styles.opsMetric}>
                    <Text style={styles.opsMetricVal}>~24.5h</Text>
                    <Text style={styles.opsMetricLabel}>Avg Resolution</Text>
                  </View>
                  <View style={styles.opsDivider} />
                  <View style={styles.opsMetric}>
                    <Text style={styles.opsMetricVal}>&lt; 48h</Text>
                    <Text style={styles.opsMetricLabel}>City Target</Text>
                  </View>
                  <View style={styles.opsDivider} />
                  <View style={styles.opsMetric}>
                    <Text style={[styles.opsMetricVal, { color: COLORS.resolved }]}>94%</Text>
                    <Text style={styles.opsMetricLabel}>Triage Rate</Text>
                  </View>
                </View>

                <View style={styles.catDistSection}>
                  <Text style={styles.catDistTitle}>INCIDENT DISTRIBUTION</Text>
                  <View style={styles.catDistRow}>
                    <View style={styles.catDistItem}>
                      <Text style={styles.catDistLabel}>Potholes: {categoryCounts.pothole}</Text>
                      <View style={styles.catDistBarBg}>
                        <View style={[styles.catDistBarFill, { width: `${stats.total ? Math.min(100, Math.round((categoryCounts.pothole / stats.total) * 100)) : 0}%`, backgroundColor: COLORS.error }]} />
                      </View>
                    </View>
                    <View style={styles.catDistItem}>
                      <Text style={styles.catDistLabel}>Garbage: {categoryCounts.garbage}</Text>
                      <View style={styles.catDistBarBg}>
                        <View style={[styles.catDistBarFill, { width: `${stats.total ? Math.min(100, Math.round((categoryCounts.garbage / stats.total) * 100)) : 0}%`, backgroundColor: COLORS.pending }]} />
                      </View>
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>

          <View style={isDesktop ? styles.desktopRightCol : styles.mobileRightCol}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>INCIDENT QUEUE</Text>
              <Button variant="link" title="Manage Queue →" onPress={() => navigation.navigate('AllComplaints')} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
              {FILTER_PILLS.map((pill) => {
                const isSelected = activeFilter === pill.id;
                return (
                  <TouchableOpacity
                    key={pill.id}
                    style={[styles.filterPill, isSelected && styles.filterPillActive]}
                    onPress={() => setActiveFilter(pill.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>{pill.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {displayedComplaints.length > 0 ? (
              displayedComplaints.map((item) => (
                <ComplaintCard
                  key={item._id}
                  complaint={item}
                  showCitizenInfo={true}
                  onPress={() => navigation.navigate('AuthorityComplaintDetail', { complaintId: item._id })}
                />
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <CardContent style={styles.emptyContent}>
                  <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.textMuted} />
                  <Text style={styles.emptyTitle}>No matching incidents</Text>
                  <Text style={styles.emptySub}>Queue is clear for this category.</Text>
                </CardContent>
              </Card>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  desktopContent: { padding: 40, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  mobileContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  desktopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, backgroundColor: '#0F172A', padding: 32, borderRadius: BORDER_RADIUS.lg, ...SHADOWS.card },
  mobileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, backgroundColor: '#0F172A', padding: 20, borderRadius: BORDER_RADIUS.md, ...SHADOWS.card },
  badgeRow: { marginBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#F8FAFC', marginBottom: 4, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#94A3B8' },
  topControls: { flexDirection: 'row', gap: 12 },
  desktopBody: { flexDirection: 'row', gap: 32 },
  mobileBody: { flexDirection: 'column', gap: 24 },
  desktopLeftCol: { flex: 1, maxWidth: 500 },
  mobileLeftCol: { width: '100%' },
  desktopRightCol: { flex: 1 },
  mobileRightCol: { width: '100%' },
  sectionHeader: { marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.5 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statCardGrid3: {
    flexBasis: Platform.OS === 'web' ? ('calc(33.333% - 8px)' as any) : '31%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  statCardGrid2: {
    flexBasis: Platform.OS === 'web' ? ('calc(50% - 6px)' as any) : '47%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  statCardMobileFull: {
    width: '100%',
    flexBasis: '100%',
    flexGrow: 1,
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  statContent: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
    minHeight: 88,
  },
  statCount: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    lineHeight: 16,
    ...(Platform.OS === 'web' ? ({
      wordBreak: 'normal',
      overflowWrap: 'normal',
      whiteSpace: 'normal',
    } as any) : {}),
  },
  opsIntelCard: { backgroundColor: '#1E293B', borderColor: '#334155' },
  opsContent: { padding: 20 },
  opsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  opsSlaText: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  opsMetricsRow: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: BORDER_RADIUS.md, paddingVertical: 16, paddingHorizontal: 12, marginBottom: 20, justifyContent: 'space-between', alignItems: 'center' },
  opsMetric: { flex: 1, alignItems: 'center' },
  opsMetricVal: { fontSize: 18, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  opsMetricLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  opsDivider: { width: 1, height: 30, backgroundColor: '#334155' },
  catDistSection: { marginTop: 8 },
  catDistTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 12 },
  catDistRow: { flexDirection: 'row', gap: 16 },
  catDistItem: { flex: 1 },
  catDistLabel: { fontSize: 12, fontWeight: '600', color: '#E2E8F0', marginBottom: 6 },
  catDistBarBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  catDistBarFill: { height: '100%', borderRadius: 3 },
  filterScroll: { marginBottom: 16, flexGrow: 0 },
  filterContainer: { gap: 8, paddingBottom: 4 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm },
  filterPillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterPillTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.borderLight },
  emptyContent: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});

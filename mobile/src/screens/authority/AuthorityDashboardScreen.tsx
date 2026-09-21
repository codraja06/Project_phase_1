import React, { useState, useMemo, useCallback } from 'react';
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
  TextInput,
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
import { ComplaintCard } from '../../components/ComplaintCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
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
  const { isDesktop, isTablet, isWide, width } = useBreakpoint();
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
    return filtered; // Do not slice so we can scroll
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

  const statCardResponsiveStyle = isWide
    ? (width < 1100 ? styles.statCardGrid2 : styles.statCardGrid3)
    : width < 300
    ? styles.statCardMobileFull
    : styles.statCardGrid2;

  const dashboardContent = (
    <Animated.View entering={FadeIn.duration(400)} style={styles.dashboardWrapper}>
      {/* Header */}
      <View style={styles.headerContainer}>
         <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
               <Badge label="MUNICIPAL OPS" variant="secondary" icon={<Ionicons name="shield-checkmark" size={12} color={COLORS.textPrimary} />} />
            </View>
            <Text style={styles.headerTitle}>Command Center</Text>
            <Text style={styles.headerSubtitle}>Real-time triage and resolution dispatch hub.</Text>
         </View>
         <View style={styles.headerRight}>
            {isDesktop && (
               <View style={styles.headerSearchWrapper}>
                  <Ionicons name="search" size={16} color={COLORS.slateMuted} />
                  <TextInput 
                     style={styles.headerSearchInput} 
                     placeholder="Search incidents, locations, or citizens..."
                     placeholderTextColor={COLORS.slateMuted}
                  />
               </View>
            )}
            <Button variant="secondary" icon={<Ionicons name="bar-chart-outline" size={18} color={COLORS.textPrimary} />} title={isDesktop ? "Analytics" : undefined} onPress={() => navigation.navigate('AuthorityAnalytics')} />
            <Button variant="default" icon={<Ionicons name="map-outline" size={18} color="#FFFFFF" />} title={isDesktop ? "GIS Map" : undefined} onPress={() => navigation.navigate('AuthorityMap')} />
            <TouchableOpacity style={styles.bellBtn} accessibilityLabel="Notifications">
               <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
               <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn}>
               <Ionicons name="person" size={18} color={COLORS.primaryDark} />
            </TouchableOpacity>
         </View>
      </View>

      {/* Main Grid */}
      <View style={isWide ? styles.desktopBody : styles.mobileBody}>
         {/* Left Column */}
         <View style={isWide ? styles.desktopLeftCol : styles.mobileLeftCol}>
             <View style={styles.sectionHeaderRow}>
               <Text style={styles.sectionTitle}>OPERATIONAL KPIs</Text>
               <TouchableOpacity style={styles.filterDropdown}>
                  <Text style={styles.filterDropdownText}>Last 30 Days</Text>
                  <Ionicons name="chevron-down" size={12} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
               </TouchableOpacity>
             </View>
             
             <View style={styles.statsGrid}>
               {[
                 { label: 'Total Incidents', count: stats.total, filter: 'all', color: '#C91C24', icon: 'layers' },
                 { label: 'Pending Triage', count: stats.pending, filter: 'pending', color: '#F59E0B', icon: 'time' },
                 { label: 'Under Repair', count: stats.inProgress, filter: 'in_progress', color: '#3B82F6', icon: 'construct' },
                 { label: 'Resolved', count: stats.resolved, filter: 'resolved', color: '#10B981', icon: 'checkmark-circle' },
                 { label: 'High Priority', count: stats.highPriority || 0, filter: 'urgent', color: '#C91C24', icon: 'alert-circle' },
                 { label: 'Today\'s Intake', count: stats.today || 0, filter: 'all', color: '#8B5CF6', icon: 'calendar' },
               ].map((stat, i) => (
                 <Card key={i} interactive onPress={() => navigation.navigate('AllComplaints', { filter: stat.filter })} style={[statCardResponsiveStyle, styles.kpiCardHover]}>
                   <View style={styles.statContent}>
                     <View style={styles.statIconContainer}>
                        <View style={[styles.statIconCircle, { backgroundColor: `${stat.color}15` }]}>
                          <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                        </View>
                     </View>
                     <Text numberOfLines={1} style={styles.statCount}>{stat.count}</Text>
                     <Text numberOfLines={1} style={styles.statLabel}>{stat.label}</Text>
                   </View>
                 </Card>
               ))}
             </View>

             <Card style={styles.opsIntelCard}>
               <CardContent style={styles.opsContent}>
                 <View style={styles.opsHeader}>
                   <Text style={styles.opsTitle}>SLA & Operational Performance</Text>
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
                     <View style={styles.catDistItem}>
                       <Text style={styles.catDistLabel}>Streetlight: {categoryCounts.streetlight}</Text>
                       <View style={styles.catDistBarBg}>
                         <View style={[styles.catDistBarFill, { width: `${stats.total ? Math.min(100, Math.round((categoryCounts.streetlight / stats.total) * 100)) : 0}%`, backgroundColor: COLORS.info }]} />
                       </View>
                     </View>
                   </View>
                 </View>
               </CardContent>
             </Card>

             <Animated.View style={styles.communityBanner}>
               <View style={styles.communityBannerContent}>
                 <View style={styles.communityBannerTextCol}>
                   <Text style={styles.communityBannerTitle}>Cleaner Neighborhoods • Stronger Communities</Text>
                   <Text style={styles.communityBannerSub}>REPORT • TRACK • RESOLVE</Text>
                 </View>
                 <Ionicons name="leaf" size={40} color="rgba(16, 185, 129, 0.2)" style={styles.communityBannerIcon} />
               </View>
             </Animated.View>
         </View>

         {/* Right Column (Incident Queue) */}
         <View style={isWide ? styles.desktopRightCol : styles.mobileRightCol}>
             <View style={styles.queueHeaderContainer}>
                <View style={styles.queueHeaderTitleBox}>
                   <Text style={styles.queueHeaderTitle}>Incident Queue</Text>
                   <Text style={styles.queueHeaderSubtitle}>Live incident reports from citizens across the city.</Text>
                </View>
                <Button variant="link" title="Manage Queue →" onPress={() => navigation.navigate('AllComplaints')} />
             </View>

             <View style={styles.filterScrollWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
                  {FILTER_PILLS.map((pill) => {
                    const isSelected = activeFilter === pill.id;
                    const count = pill.id === 'all' ? displayedComplaints.length : undefined; 
                    return (
                      <TouchableOpacity
                        key={pill.id}
                        style={[styles.filterPill, isSelected && styles.filterPillActive]}
                        onPress={() => setActiveFilter(pill.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                           {pill.label} {count !== undefined ? `(${count})` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
             </View>

             <View style={styles.incidentListContainer}>
                <ScrollView 
                   showsVerticalScrollIndicator={true}
                   style={styles.incidentListScroll}
                   contentContainerStyle={styles.incidentListScrollContent}
                >
                  {displayedComplaints.length > 0 ? (
                    displayedComplaints.map((item, index) => (
                      <Animated.View key={item._id} entering={FadeInUp.delay(300 + Math.min(index * 50, 500))}>
                        <ComplaintCard
                          complaint={item}
                          showCitizenInfo={true}
                          onPress={() => navigation.navigate('AuthorityComplaintDetail', { complaintId: item._id })}
                          style={styles.compactComplaintCard}
                        />
                      </Animated.View>
                    ))
                  ) : (
                    <Animated.View entering={FadeInUp.delay(300)}>
                      <Card style={styles.emptyCard}>
                        <CardContent style={styles.emptyContent}>
                          <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.textMuted} />
                          <Text style={styles.emptyTitle}>No matching incidents</Text>
                          <Text style={styles.emptySub}>Queue is clear for this category.</Text>
                        </CardContent>
                      </Card>
                    </Animated.View>
                  )}
                </ScrollView>
             </View>
         </View>
      </View>
    </Animated.View>
  );

  if (isWide) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.desktopFixedContainer}>
          {dashboardContent}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.mobileContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38BDF8']} tintColor="#38BDF8" />
        }
        showsVerticalScrollIndicator={false}
      >
        {dashboardContent}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1, backgroundColor: COLORS.backgroundNeutral },
  desktopFixedContainer: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundNeutral,
  },
  dashboardWrapper: {
    flex: 1,
    padding: SPACING['3xl'],
    maxWidth: 1920,
    alignSelf: 'center',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  mobileContent: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING['5xl'] },
  
  // Header
  headerContainer: { 
     flexDirection: 'row', 
     justifyContent: 'space-between', 
     alignItems: 'center', 
     marginBottom: SPACING['3xl'], 
     backgroundColor: '#0F172A', 
     paddingHorizontal: SPACING['3xl'], 
     paddingVertical: SPACING.xl,
     borderRadius: BORDER_RADIUS.lg, 
     minHeight: 90,
     ...SHADOWS.card 
  },
  headerLeft: {
     flex: 1,
  },
  badgeRow: { marginBottom: 6 },
  headerTitle: { ...TYPOGRAPHY.h2, color: '#F8FAFC', marginBottom: 2, letterSpacing: -0.5 },
  headerSubtitle: { ...TYPOGRAPHY.bodySmall, color: '#94A3B8' },
  headerRight: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  headerSearchWrapper: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#1E293B',
     paddingHorizontal: SPACING.lg,
     height: 38,
     borderRadius: BORDER_RADIUS.full,
     borderWidth: 1,
     borderColor: '#334155',
     minWidth: 280,
     marginRight: SPACING.md,
  },
  headerSearchInput: {
     flex: 1,
     ...TYPOGRAPHY.bodySmall,
     color: '#F8FAFC',
     marginLeft: SPACING.sm,
     ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  bellBtn: {
     width: 38,
     height: 38,
     borderRadius: BORDER_RADIUS.full,
     backgroundColor: '#1E293B',
     borderWidth: 1,
     borderColor: '#334155',
     alignItems: 'center',
     justifyContent: 'center',
     ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  notificationDot: {
     position: 'absolute',
     top: 10,
     right: 10,
     width: 6,
     height: 6,
     borderRadius: BORDER_RADIUS.full,
     backgroundColor: COLORS.error,
  },
  avatarBtn: {
     width: 38,
     height: 38,
     borderRadius: BORDER_RADIUS.full,
     backgroundColor: COLORS.primaryLight,
     borderWidth: 1,
     borderColor: COLORS.primarySurface,
     alignItems: 'center',
     justifyContent: 'center',
     ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },

  // Body Layout
  desktopBody: { 
     flexDirection: 'row', 
     gap: SPACING['3xl'], 
     flex: 1, 
     overflow: 'hidden' 
  },
  mobileBody: { flexDirection: 'column', gap: SPACING['3xl'] },
  desktopLeftCol: { 
     flex: 0.45, 
     display: 'flex',
     flexDirection: 'column',
  },
  mobileLeftCol: { width: '100%' },
  desktopRightCol: { 
     flex: 0.55,
     display: 'flex',
     flexDirection: 'column',
     backgroundColor: '#FFFFFF',
     borderRadius: BORDER_RADIUS.xl,
     padding: SPACING['2xl'],
     ...SHADOWS.card,
  },
  mobileRightCol: { width: '100%' },
  
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.overline, color: COLORS.textSecondary, letterSpacing: 0.5 },
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

  // KPI Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: SPACING.xl,
  },
  statCardGrid3: {
    flexBasis: Platform.OS === 'web' ? ('calc(33.333% - 11px)' as any) : '31%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statCardGrid2: { flexBasis: Platform.OS === 'web' ? ('calc(50% - 8px)' as any) : '47%', flexGrow: 1, flexShrink: 0, minWidth: 130, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  statCardMobileFull: { width: '100%', flexBasis: '100%', flexGrow: 1, flexShrink: 0, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  kpiCardHover: Platform.OS === 'web' ? ({
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
      borderColor: '#D1D5DB'
    }
  } as any) : {},
  statContent: {
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  statIconContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: {
    ...TYPOGRAPHY.h2,
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    ...(Platform.OS === 'web' ? ({
      wordBreak: 'normal',
      overflowWrap: 'normal',
      whiteSpace: 'normal',
    } as any) : {}),
  },

  // SLA Card
  opsIntelCard: { backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: 16, marginBottom: SPACING.lg },
  opsContent: { padding: SPACING.xl },
  opsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  opsTitle: { ...TYPOGRAPHY.h4, color: '#F8FAFC' },
  opsSlaText: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', color: '#94A3B8' },
  opsMetricsRow: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.md, marginBottom: SPACING.xl, justifyContent: 'space-between', alignItems: 'center' },
  opsMetric: { flex: 1, alignItems: 'center' },
  opsMetricVal: { ...TYPOGRAPHY.h3, color: '#F8FAFC', marginBottom: SPACING.xs },
  opsMetricLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: '#94A3B8' },
  opsDivider: { width: 1, height: 30, backgroundColor: '#334155' },
  catDistSection: { marginTop: 4 },
  catDistTitle: { ...TYPOGRAPHY.overline, color: '#94A3B8', letterSpacing: 0.5, marginBottom: SPACING.md },
  catDistRow: { flexDirection: 'row', gap: SPACING.lg },
  catDistItem: { flex: 1 },
  catDistLabel: { ...TYPOGRAPHY.caption, fontWeight: '600', color: '#E2E8F0', marginBottom: SPACING.xs },
  catDistBarBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  catDistBarFill: { height: '100%', borderRadius: 3 },

  // Banner
  communityBanner: {
    marginTop: 'auto',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    overflow: 'hidden',
  },
  communityBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  communityBannerTextCol: {
    flex: 1,
    zIndex: 1,
  },
  communityBannerTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: '#064E3B',
    marginBottom: 2,
  },
  communityBannerSub: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  communityBannerIcon: {
    position: 'absolute',
    right: 10,
    bottom: -10,
    transform: [{ rotate: '-15deg' }],
  },

  // Incident Queue Area
  queueHeaderContainer: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
     marginBottom: SPACING.md,
  },
  queueHeaderTitleBox: {
     flex: 1,
  },
  queueHeaderTitle: {
     ...TYPOGRAPHY.h3,
     color: COLORS.textPrimary,
     marginBottom: 2,
  },
  queueHeaderSubtitle: {
     ...TYPOGRAPHY.bodySmall,
     color: COLORS.textSecondary,
  },
  filterScrollWrapper: {
     marginBottom: SPACING.lg,
  },
  filterScroll: { flexGrow: 0 },
  filterContainer: { gap: SPACING.sm, paddingBottom: SPACING.xs },
  filterPill: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: COLORS.borderLight },
  filterPillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  filterPillText: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', color: COLORS.textSecondary },
  filterPillTextActive: { color: '#FFFFFF' },

  // Scrollable Incident List
  incidentListContainer: {
     flex: 1,
     display: 'flex',
     flexDirection: 'column',
  },
  incidentListScroll: {
     flex: 1,
     paddingRight: SPACING.sm,
  },
  incidentListScrollContent: {
     paddingBottom: SPACING['4xl'],
  },
  compactComplaintCard: {
     padding: 0,
     marginBottom: SPACING.md,
     borderRadius: 14,
  },

  // Empty State
  emptyCard: { backgroundColor: '#FFFFFF', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.borderLight, borderRadius: 16 },
  emptyContent: { padding: SPACING['5xl'], alignItems: 'center' },
  emptyTitle: { ...TYPOGRAPHY.bodyBold, color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.xs },
  emptySub: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textAlign: 'center' },
});

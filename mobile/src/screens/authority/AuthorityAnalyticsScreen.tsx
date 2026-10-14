import { SafeAreaView } from 'react-native-safe-area-context';
import { useComplaintSummary } from '../../hooks/useComplaintSummary';
import { Button } from '../../components/ui/Button';
import { RequestError } from '../../components/RequestError';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { BORDER_RADIUS } from '../../theme/radius';
import { SHADOWS } from '../../theme/index';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useMobileMenu } from '../../contexts/MobileMenuContext';

import { AuthorityMobileHeader } from '../../components/AuthorityMobileHeader';

export const AuthorityAnalyticsScreen = ({ navigation }: any) => {
  const { toggleMenu } = useMobileMenu();
  const { isDesktop, isWide } = useBreakpoint();
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');
  const { complaints, loading, error, refresh } = useComplaintSummary('officer');
  const reports = complaints.filter(c => timeframe === 'all' || Date.parse(c.createdAt) >= Date.now() - (timeframe === '7d' ? 7 : 30) * 86400000);
  const resolved = reports.filter(c => c.status === 'Resolved');
  const durations = resolved.filter(c => c.resolvedAt && Date.parse(c.resolvedAt) >= Date.parse(c.createdAt)).map(c => (Date.parse(c.resolvedAt!) - Date.parse(c.createdAt)) / 3600000);
  const average = durations.length ? `${(durations.reduce((a,b) => a+b,0) / durations.length).toFixed(1)} hrs` : 'Not available';
  const categories = Object.entries(reports.reduce<Record<string,number>>((counts,c) => { const name = c.category || 'other'; counts[name] = (counts[name] || 0)+1; return counts; },{})).map(([name,count]) => ({ name: name.replace(/_/g,' '), count, pct: Math.round(count / reports.length * 100), color: COLORS.primary }));
  const wards: { name: string; active: number; resolved: number; risk: string }[] = [];
  const onRefresh = refresh;

  const renderHeader = () => {
    if (isDesktop) {
      return (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.desktopHeaderBar}>
          <View>
            <View style={styles.desktopHeaderTag}>
              <Text style={styles.desktopHeaderTagText}>OPERATIONS INTELLIGENCE</Text>
            </View>
            <Text style={styles.desktopHeaderTitle}>Municipal Analytics</Text>
          </View>
          <View style={styles.timeframeRow}>
            {(['7d', '30d', 'all'] as const).map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[styles.tfBtn, timeframe === tf && styles.tfBtnActive]}
                onPress={() => setTimeframe(tf)}
              >
                <Text style={[styles.tfBtnText, timeframe === tf && styles.tfBtnTextActive]}>
                  {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'All Time'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      );
    }

    return (
      <View>
        <AuthorityMobileHeader title="Municipal Analytics" />
      </View>
    );
  };

  if (error) return <View style={styles.safeArea}>{renderHeader()}<RequestError message={error} onRetry={refresh} /></View>;

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle={isDesktop ? "dark-content" : "light-content"} backgroundColor={isDesktop ? COLORS.background : "#0F172A"} />

      {renderHeader()}

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          isWide && styles.scrollContentDesktop,
        ]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {!isDesktop && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.mobileTimeframeRow, { paddingHorizontal: 0, paddingBottom: SPACING.lg }]}>
            {(['7d', '30d', 'all'] as const).map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[styles.mobileTfBtn, timeframe === tf && styles.mobileTfBtnActive, { borderColor: COLORS.borderLight }]}
                onPress={() => setTimeframe(tf)}
              >
                <Text style={[styles.mobileTfBtnText, timeframe === tf && styles.mobileTfBtnTextActive, timeframe !== tf && { color: COLORS.textSecondary }]}>
                  {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'All Time'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <View style={styles.mainWrapper}>
          {!!error && (
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color={COLORS.error} style={{ marginRight: SPACING.sm }} />
              <Text style={styles.errorText}>{error}</Text>
              <Button title="Retry" variant="outline" size="sm" onPress={refresh} style={{ marginLeft: 'auto' }} />
            </View>
          )}
          {!loading && !error && !reports.length && (
            <View style={styles.emptyCard}>
              <Ionicons name="stats-chart-outline" size={36} color={COLORS.textMuted} style={{ marginBottom: SPACING.sm }} />
              <Text style={styles.emptyTitle}>No reports in this period</Text>
              <Text style={styles.emptySubtitle}>Try selecting a broader timeframe to see municipal trends.</Text>
            </View>
          )}
          {/* Executive KPI Row */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiIcon}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.kpiValue}>{average}</Text>
              <Text style={styles.kpiLabel}>Avg Resolution Velocity</Text>
              <View style={styles.kpiTrend}>

                <Text style={styles.kpiTrendText}>From resolved timestamps</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="flame-outline" size={20} color={COLORS.error} />
              </View>
              <Text style={[styles.kpiValue, { color: COLORS.error }]}>{reports.filter(c => c.priority === 'urgent' || c.priority === 'high').length}</Text>
              <Text style={styles.kpiLabel}>High Priority Incidents</Text>
              <View style={styles.kpiTrend}>
                <Ionicons name="information-circle-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.kpiTrendText}>Selected reporting period</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people-outline" size={20} color="#2563EB" />
              </View>
              <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{resolved.length}</Text>
              <Text style={styles.kpiLabel}>Resolved Incidents</Text>
              <View style={styles.kpiTrend}>
                <Text style={[styles.kpiTrendText, { color: '#4B5563' }]}>Current recorded status</Text>
              </View>
            </View>
          </Animated.View>

          <View style={[isDesktop ? { flexDirection: 'row', gap: SPACING.lg } : {}, { marginBottom: SPACING.lg }]}>
            {/* Category Distribution Card */}
            <Animated.View entering={FadeInUp.delay(200)} style={[styles.card, isDesktop && { flex: 1, marginBottom: 0 }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="pie-chart-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>Incident Category Distribution</Text>
              </View>

              <View style={styles.categoryList}>
                {categories.map((cat, index) => (
                  <Animated.View entering={ZoomIn.delay(300 + index * 50)} key={cat.name} style={styles.catItem}>
                    <View style={styles.catMetaRow}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catCount}>
                        {cat.count} reports ({cat.pct}%)
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <Animated.View
                        style={[
                          styles.progressBarFill,
                          { width: `${cat.pct}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Priority Severity Breakdown */}
            <Animated.View entering={FadeInUp.delay(400)} style={[styles.card, isDesktop && { flex: 1, marginBottom: 0 }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>Priority Severity Matrix</Text>
              </View>

              <View style={styles.priorityGrid}>
                <View style={[styles.priorityPill, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
                  <Text style={[styles.priorityPillNum, { color: '#DC2626' }]}>{reports.filter(c => c.priority === 'urgent').length}</Text>
                  <Text style={styles.priorityPillLabel}>Urgent (P1)</Text>
                </View>

                <View style={[styles.priorityPill, { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' }]}>
                  <Text style={[styles.priorityPillNum, { color: '#D97706' }]}>{reports.filter(c => c.priority === 'high').length}</Text>
                  <Text style={styles.priorityPillLabel}>High (P2)</Text>
                </View>

                <View style={[styles.priorityPill, { borderColor: '#FEF08A', backgroundColor: '#FEFCE8' }]}>
                  <Text style={[styles.priorityPillNum, { color: '#854D0E' }]}>{reports.filter(c => c.priority === 'medium').length}</Text>
                  <Text style={styles.priorityPillLabel}>Medium (P3)</Text>
                </View>

                <View style={[styles.priorityPill, { borderColor: '#E4E4E7', backgroundColor: '#FAFAFA' }]}>
                  <Text style={[styles.priorityPillNum, { color: '#52525B' }]}>{reports.filter(c => c.priority === 'low').length}</Text>
                  <Text style={styles.priorityPillLabel}>Routine (P4)</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Regional Risk & Ward Table */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="map-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Ward Incident Concentration</Text>
            </View>

            <Text style={{ color: COLORS.textSecondary, lineHeight: 22 }}>Ward assignments and service deadlines are not recorded in the current data. Ward risk and SLA metrics are unavailable.</Text>
            <View style={styles.wardTable}>
              <View style={styles.wardTableHeader}>
                <Text style={[styles.wardCol, { flex: 2 }]}>WARD / DISTRICT</Text>
                <Text style={[styles.wardCol, { textAlign: 'center' }]}>ACTIVE</Text>
                <Text style={[styles.wardCol, { textAlign: 'center' }]}>CLEARED</Text>
                <Text style={[styles.wardCol, { textAlign: 'right' }]}>RISK</Text>
              </View>

              {wards.map((w) => (
                <View key={w.name} style={styles.wardRow}>
                  <Text style={[styles.wardName, { flex: 2 }]} numberOfLines={1}>
                    {w.name}
                  </Text>
                  <Text style={[styles.wardVal, { textAlign: 'center' }]}>{w.active}</Text>
                  <Text style={[styles.wardVal, { textAlign: 'center', color: '#059669' }]}>
                    {w.resolved}
                  </Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View
                      style={[
                        styles.riskBadge,
                        w.risk === 'High'
                          ? styles.riskHigh
                          : w.risk === 'Medium'
                          ? styles.riskMedium
                          : styles.riskLow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.riskText,
                          w.risk === 'High'
                            ? styles.riskTextHigh
                            : w.risk === 'Medium'
                            ? styles.riskTextMedium
                            : styles.riskTextLow,
                        ]}
                      >
                        {w.risk}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundNeutral,
  },

  // Desktop Header
  desktopHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['3xl'],
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
  },
  desktopHeaderTag: {
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs,
    marginBottom: 4,
  },
  desktopHeaderTagText: {
    ...TYPOGRAPHY.overline,
    color: COLORS.primary,
  },
  desktopHeaderTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tfBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundNeutral,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tfBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tfBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tfBtnTextActive: {
    color: '#FFFFFF',
  },

  // Mobile Header
  mobileHeaderBar: {
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? SPACING.md : SPACING.lg,
    paddingBottom: SPACING.md,
  },
  mobileHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  mobileBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: SPACING.md,
  },
  mobileHeaderTitle: {
    ...TYPOGRAPHY.h3,
    color: '#FFFFFF',
  },
  mobileTimeframeRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  mobileTfBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mobileTfBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  mobileTfBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  mobileTfBtnTextActive: {
    color: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundNeutral,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 96,
  },
  scrollContentDesktop: {
    padding: SPACING['4xl'],
    paddingBottom: SPACING['6xl'],
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: { ...TYPOGRAPHY.caption, color: COLORS.errorDark, fontWeight: '600', flex: 1 },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: SPACING['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: 4, textAlign: 'center' },
  emptySubtitle: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, textAlign: 'center' },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: 0,
    flexBasis: 140,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  kpiValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  kpiLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kpiTrendText: {
    flexShrink: 1,
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: '#059669',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    flexShrink: 1,
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  categoryList: {
    gap: SPACING.md,
  },
  catItem: {
    width: '100%',
  },
  catMetaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  catCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.backgroundNeutral,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  priorityPill: {
    flex: 1,
    minWidth: 0,
    flexBasis: '45%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
  },
  priorityPillNum: {
    ...TYPOGRAPHY.h3,
    marginBottom: 2,
  },
  priorityPillLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  wardTable: {
    width: '100%',
  },
  wardTableHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  wardCol: {
    flex: 1,
    ...TYPOGRAPHY.overline,
    color: COLORS.textMuted,
  },
  wardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  wardName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  wardVal: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  riskHigh: {
    backgroundColor: '#FEF2F2',
  },
  riskMedium: {
    backgroundColor: '#FEFCE8',
  },
  riskLow: {
    backgroundColor: '#ECFDF5',
  },
  riskText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
  },
  riskTextHigh: {
    color: '#DC2626',
  },
  riskTextMedium: {
    color: '#D97706',
  },
  riskTextLow: {
    color: '#059669',
  },
});

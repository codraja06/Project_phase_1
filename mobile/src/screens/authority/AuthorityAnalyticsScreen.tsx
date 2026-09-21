import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
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

export const AuthorityAnalyticsScreen = ({ navigation }: any) => {
  const { isWide } = useBreakpoint();
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');
  const [stats, setStats] = useState({
    total: 28,
    pending: 9,
    inProgress: 11,
    resolved: 8,
    highPriority: 6,
    avgResolutionHours: 18.4,
  });

  const categories = [
    { name: 'Pothole Defect', count: 12, pct: 42, color: COLORS.primary },
    { name: 'Road Damage', count: 6, pct: 21, color: COLORS.secondary },
    { name: 'Garbage Overflow', count: 5, pct: 18, color: '#059669' },
    { name: 'Broken Streetlight', count: 3, pct: 11, color: '#2563EB' },
    { name: 'Drainage Issue', count: 2, pct: 8, color: '#D97706' },
  ];

  const wards = [
    { name: 'Ward 14 • Metro Central', active: 11, resolved: 5, risk: 'High' },
    { name: 'Ward 08 • North Suburbs', active: 6, resolved: 8, risk: 'Medium' },
    { name: 'Ward 22 • East Industrial', active: 2, resolved: 6, risk: 'Low' },
    { name: 'Ward 03 • South Extension', active: 1, resolved: 4, risk: 'Low' },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Screen Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View>
            <View style={styles.headerTag}>
              <Text style={styles.headerTagText}>OPERATIONS INTELLIGENCE</Text>
            </View>
            <Text style={styles.headerTitle}>Municipal Analytics</Text>
          </View>
        </View>

        {/* Timeframe selector */}
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          isWide && styles.scrollContentDesktop,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          {/* Executive KPI Row */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiIcon}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.kpiValue}>18.4 hrs</Text>
              <Text style={styles.kpiLabel}>Avg Resolution Velocity</Text>
              <View style={styles.kpiTrend}>
                <Ionicons name="arrow-up" size={11} color="#059669" />
                <Text style={styles.kpiTrendText}>+22% this week</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="flame-outline" size={20} color={COLORS.error} />
              </View>
              <Text style={[styles.kpiValue, { color: COLORS.error }]}>94.2%</Text>
              <Text style={styles.kpiLabel}>Critical SLA Adherence</Text>
              <View style={styles.kpiTrend}>
                <Ionicons name="checkmark-circle" size={11} color="#059669" />
                <Text style={styles.kpiTrendText}>Within 24h target</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people-outline" size={20} color="#2563EB" />
              </View>
              <Text style={[styles.kpiValue, { color: '#2563EB' }]}>88%</Text>
              <Text style={styles.kpiLabel}>Field Officer Utilization</Text>
              <View style={styles.kpiTrend}>
                <Text style={[styles.kpiTrendText, { color: '#4B5563' }]}>6 Active Units</Text>
              </View>
            </View>
          </Animated.View>

          {/* Category Distribution Card */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
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
          <Animated.View entering={FadeInUp.delay(400)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Priority Severity Matrix</Text>
            </View>

            <View style={styles.priorityGrid}>
              <View style={[styles.priorityPill, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.priorityPillNum, { color: '#DC2626' }]}>4</Text>
                <Text style={styles.priorityPillLabel}>Urgent (P1)</Text>
              </View>

              <View style={[styles.priorityPill, { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' }]}>
                <Text style={[styles.priorityPillNum, { color: '#D97706' }]}>8</Text>
                <Text style={styles.priorityPillLabel}>High (P2)</Text>
              </View>

              <View style={[styles.priorityPill, { borderColor: '#FEF08A', backgroundColor: '#FEFCE8' }]}>
                <Text style={[styles.priorityPillNum, { color: '#854D0E' }]}>11</Text>
                <Text style={styles.priorityPillLabel}>Medium (P3)</Text>
              </View>

              <View style={[styles.priorityPill, { borderColor: '#E4E4E7', backgroundColor: '#FAFAFA' }]}>
                <Text style={[styles.priorityPillNum, { color: '#52525B' }]}>5</Text>
                <Text style={styles.priorityPillLabel}>Routine (P4)</Text>
              </View>
            </View>
          </Animated.View>

          {/* Regional Risk & Ward Table */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="map-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Ward Incident Concentration</Text>
            </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    marginRight: SPACING.md,
  },
  headerTag: {
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs,
    marginBottom: 4,
  },
  headerTagText: {
    ...TYPOGRAPHY.overline,
    color: COLORS.primary,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
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
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundNeutral,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['5xl'],
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
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
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
    flexDirection: 'row',
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
    gap: SPACING.sm,
  },
  priorityPill: {
    flex: 1,
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

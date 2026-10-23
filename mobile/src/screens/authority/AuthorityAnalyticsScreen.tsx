import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useComplaintSummary } from '../../hooks/useComplaintSummary';
import { Button } from '../../components/ui/Button';
import { RequestError } from '../../components/RequestError';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { AuthorityMobileHeader } from '../../components/AuthorityMobileHeader';
import { COLORS } from '../../theme/colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { exportOperationsAnalytics, AnalyticsFormat, AnalyticsPeriod } from '../../services/analyticsExport';

const periodLabels = { '7d': '7 Days', '30d': '30 Days', all: 'All Time' };
const reportingLabels = { '7d': 'Last 7 days', '30d': 'Last 30 days', all: 'All time' };
const categoryLabel = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export const AuthorityAnalyticsScreen = (_props: any) => {
  const { isDesktop, isWide } = useBreakpoint();
  const [timeframe, setTimeframe] = useState<AnalyticsPeriod>('7d');
  const [exporting, setExporting] = useState<AnalyticsFormat | null>(null);
  const [exportError, setExportError] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const { complaints, loading, error, refresh } = useComplaintSummary('officer');
  const cutoff = Date.now() - (timeframe === '7d' ? 7 : 30) * 86400000;
  const reports = complaints.filter(complaint => timeframe === 'all' || Date.parse(complaint.createdAt) >= cutoff);
  const resolved = reports.filter(complaint => complaint.status === 'Resolved');
  const highPriority = reports.filter(complaint => complaint.priority === 'high' || complaint.priority === 'urgent').length;
  const durations = resolved.filter(complaint => complaint.resolvedAt && Date.parse(complaint.resolvedAt) >= Date.parse(complaint.createdAt))
    .map(complaint => (Date.parse(complaint.resolvedAt!) - Date.parse(complaint.createdAt)) / 3600000);
  const average = durations.length ? `${(durations.reduce((sum, hours) => sum + hours, 0) / durations.length).toFixed(1)} hrs` : '—';
  const resolutionRate = reports.length ? Math.round(resolved.length / reports.length * 100) : 0;
  const categories = Object.entries(reports.reduce<Record<string, number>>((counts, complaint) => {
    const category = complaint.category || 'other'; counts[category] = (counts[category] || 0) + 1; return counts;
  }, {})).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name: categoryLabel(name), count, percentage: reports.length ? count / reports.length * 100 : 0 }));
  const statuses = [
    { label: 'Pending', color: COLORS.pending, count: reports.filter(complaint => complaint.status === 'Pending').length },
    { label: 'In Progress', color: COLORS.inProgress, count: reports.filter(complaint => complaint.status === 'In Progress').length },
    { label: 'Resolved', color: COLORS.resolved, count: resolved.length },
    ...(reports.some(complaint => complaint.status === 'Rejected') ? [{ label: 'Rejected', color: COLORS.textMuted, count: reports.filter(complaint => complaint.status === 'Rejected').length }] : []),
  ];
  const priorities = [
    { key: 'urgent', label: 'Urgent', code: 'P1', color: COLORS.error },
    { key: 'high', label: 'High', code: 'P2', color: COLORS.secondaryDark },
    { key: 'medium', label: 'Medium', code: 'P3', color: COLORS.textSecondary },
    { key: 'low', label: 'Routine', code: 'P4', color: COLORS.textMuted },
  ];
  const metrics = [
    { label: 'Total incidents', value: String(reports.length), note: 'Created in this period', icon: 'documents-outline' as const },
    { label: 'Resolved incidents', value: String(resolved.length), note: 'Current recorded status', icon: 'checkmark-circle-outline' as const },
    { label: 'High priority incidents', value: String(highPriority), note: 'High and urgent priorities', icon: 'flag-outline' as const },
    { label: 'Average resolution time', value: average, note: durations.length ? `Based on ${durations.length} resolved incident${durations.length === 1 ? '' : 's'}` : 'No valid resolution timestamps', icon: 'time-outline' as const },
  ];

  const changePeriod = (period: AnalyticsPeriod) => { setTimeframe(period); setExportError(''); setExportMessage(''); };
  const exportReport = async (format: AnalyticsFormat) => {
    if (exporting) return;
    setExporting(format); setExportError(''); setExportMessage('');
    try {
      await exportOperationsAnalytics(timeframe, format);
      setExportMessage(Platform.OS === 'web' ? 'Download started. Check your browser downloads.' : 'Export prepared. Use the share options to save or send the file.');
    } catch (failure) {
      setExportError((failure as Error).message || 'Unable to export operations data. Please try again.');
    } finally { setExporting(null); }
  };

  const renderPeriodControls = () => (
    <View style={styles.periodControls}>
      {(['7d', '30d', 'all'] as const).map(period => (
        <TouchableOpacity key={period} accessibilityRole="button" accessibilityLabel={periodLabels[period]} accessibilityState={{ selected: timeframe === period }} aria-pressed={timeframe === period}
          style={[styles.periodButton, timeframe === period && styles.periodSelected]} onPress={() => changePeriod(period)} activeOpacity={0.8}>
          <Text style={[styles.periodText, timeframe === period && styles.periodTextSelected]}>{periodLabels[period]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const header = isDesktop ? (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.headingCopy}>
          <Text style={styles.pageTitle}>Municipal Analytics</Text>
          <Text style={styles.subtitle}>Track incident volumes, resolution performance and operational priorities.</Text>
        </View>
        {renderPeriodControls()}
      </View>
    </View>
  ) : <AuthorityMobileHeader title="Municipal Analytics" />;

  if (error) return <View style={styles.screen}>{header}<RequestError message={error} onRetry={refresh} /></View>;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={isDesktop ? 'dark-content' : 'light-content'} backgroundColor={isDesktop ? COLORS.surface : '#0F172A'} />
      {header}
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[COLORS.primary]} />} contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopPadding]}>
        <View style={styles.content}>
          {!isDesktop && <View style={styles.mobilePeriod}><Text style={styles.subtitle}>Reporting period</Text>{renderPeriodControls()}</View>}
          <View style={styles.sectionHeading}>
            <View style={styles.overviewCopy}><Text style={styles.sectionTitle}>Operations overview</Text><Text style={styles.subtitle}>{reportingLabels[timeframe]} · Based on incident creation date</Text></View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh analytics" disabled={loading} onPress={refresh} style={styles.refreshButton}>
              <Ionicons name="refresh-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.refreshText}>{loading ? 'Refreshing…' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          {loading && !complaints.length ? <LoadingSpinner message="Loading operations data…" /> : <>
            {!reports.length && <View style={styles.emptyState}><Ionicons name="stats-chart-outline" size={24} color={COLORS.textMuted} /><View style={styles.flexCopy}><Text style={styles.emptyTitle}>No reports in this period</Text><Text style={styles.subtitle}>Choose a broader reporting period to view incident activity.</Text></View></View>}
            <View style={styles.metricsRow}>
              {metrics.map(metric => <View key={metric.label} style={[styles.metric, { flexBasis: isWide ? '22%' : '46%' }]}>
                <View style={styles.metricHeader}><Text style={styles.metricLabel}>{metric.label}</Text><Ionicons name={metric.icon} size={18} color={COLORS.textMuted} /></View>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricNote}>{metric.note}</Text>
              </View>)}
            </View>

            <View style={styles.exportPanel}>
              <View style={styles.exportRow}>
                <View style={styles.exportCopy}><Text style={styles.exportTitle}>Export operations data</Text><Text style={styles.subtitle}>Download {reportingLabels[timeframe].toLowerCase()} as an Excel report or Power BI dataset.</Text></View>
                <View style={styles.exportButtons}>
                  <Button title="Excel (.xlsx)" accessibilityLabel="Export Excel workbook" variant="outline" onPress={() => void exportReport('xlsx')} loading={exporting === 'xlsx'} disabled={loading || !!exporting} />
                  <Button title="Power BI (.csv)" accessibilityLabel="Export Power BI CSV" variant="outline" onPress={() => void exportReport('csv')} loading={exporting === 'csv'} disabled={loading || !!exporting} />
                </View>
              </View>
              {!!exportError && <Text accessibilityRole="alert" style={styles.exportError}>{exportError}</Text>}
              {!!exportMessage && <Text accessibilityLiveRegion="polite" style={styles.subtitle}>{exportMessage}</Text>}
            </View>

            <View style={[styles.analysisRow, isWide && styles.analysisWide]}>
              <View style={[styles.card, isWide && styles.chartColumn]}>
                <View style={styles.cardHeading}><Text style={styles.sectionTitle}>Incident categories</Text><Text style={styles.cardMeta}>{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</Text></View>
                <Text style={styles.subtitle}>Share of incidents in the selected period</Text>
                <View style={styles.categoryList}>
                  {categories.length ? categories.map(category => <View key={category.name} style={styles.categoryRow}>
                    <View style={styles.categoryMeta}><Text style={styles.categoryName}>{category.name}</Text><Text style={styles.categoryCount}>{category.count} · {Math.round(category.percentage)}%</Text></View>
                    <View style={styles.track}><View style={[styles.categoryFill, { width: `${category.percentage}%` }]} /></View>
                  </View>) : <Text style={styles.noData}>Category data will appear when incidents are reported.</Text>}
                </View>
              </View>
              <View style={[styles.card, isWide && styles.chartColumn]}>
                <View style={styles.cardHeading}><Text style={styles.sectionTitle}>Complaint status</Text><Text style={styles.cardMeta}>Current status</Text></View>
                <Text style={styles.subtitle}>Progress of incidents created in this period</Text>
                <View style={styles.statusList}>
                  {statuses.map(status => <View key={status.label} style={styles.statusRow}><View style={[styles.statusDot, { backgroundColor: status.color }]} /><Text style={styles.statusLabel}>{status.label}</Text><Text style={styles.statusNumber}>{status.count}</Text><Text style={styles.statusPercentage}>{reports.length ? Math.round(status.count / reports.length * 100) : 0}%</Text></View>)}
                </View>
                <View style={styles.resolutionRow}><Text style={styles.subtitle}>Resolution rate</Text><Text style={styles.resolutionValue}>{reports.length ? `${resolutionRate}%` : '—'}</Text></View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeading}><Text style={styles.sectionTitle}>Priority distribution</Text><Text style={styles.cardMeta}>Recorded priority</Text></View>
              <Text style={styles.subtitle}>Incidents grouped by their assigned priority</Text>
              <View style={styles.priorityRow}>
                {priorities.map(priority => <View key={priority.key} style={styles.priorityItem}><View style={styles.priorityLabelRow}><View style={[styles.statusDot, { backgroundColor: priority.color }]} /><Text style={styles.priorityLabel}>{priority.label}</Text><Text style={styles.priorityCode}>{priority.code}</Text></View><Text style={styles.priorityValue}>{reports.filter(complaint => complaint.priority === priority.key).length}</Text></View>)}
                {reports.some(complaint => !priorities.some(priority => priority.key === complaint.priority)) && <View style={styles.priorityItem}><Text style={styles.priorityLabel}>Unspecified</Text><Text style={styles.priorityValue}>{reports.filter(complaint => !priorities.some(priority => priority.key === complaint.priority)).length}</Text></View>}
              </View>
            </View>
            <View style={styles.dataNote}><Ionicons name="information-circle-outline" size={18} color={COLORS.textMuted} /><Text style={styles.dataNoteText}>Ward-level analysis and service-level compliance are unavailable because ward assignments and service deadlines are not recorded. Resolution time uses completed incidents with valid timestamps.</Text></View>
          </>}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, minWidth: 0, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, paddingHorizontal: 24 },
  headerInner: { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingVertical: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  headingCopy: { flex: 1, minWidth: 260, gap: 6 },
  pageTitle: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5, color: COLORS.textPrimary },
  subtitle: { fontSize: 12, lineHeight: 19, color: COLORS.textMuted },
  periodControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 4, borderRadius: 10, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.backgroundNeutral, alignSelf: 'flex-start' },
  periodButton: { minHeight: 40, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', borderRadius: 7 },
  periodSelected: { backgroundColor: COLORS.surface },
  periodText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  periodTextSelected: { color: COLORS.primaryDark, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  desktopPadding: { padding: 24, paddingBottom: 40 },
  content: { width: '100%', maxWidth: 1280, alignSelf: 'center', gap: 20 },
  mobilePeriod: { gap: 8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  overviewCopy: { gap: 4, flexShrink: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '600', lineHeight: 22, color: COLORS.textPrimary, flexShrink: 1 },
  refreshButton: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  refreshText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flexGrow: 1, minWidth: 0, backgroundColor: COLORS.surface, padding: 20, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 12, gap: 10 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  metricLabel: { fontSize: 12, lineHeight: 18, fontWeight: '500', color: COLORS.textSecondary, flex: 1 },
  metricValue: { fontSize: 30, lineHeight: 38, letterSpacing: -0.7, fontWeight: '700', color: COLORS.textPrimary },
  metricNote: { fontSize: 11, lineHeight: 17, color: COLORS.textMuted },
  exportPanel: { borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 12, padding: 20, gap: 12, backgroundColor: COLORS.surface },
  exportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  exportCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 280, gap: 4 },
  exportTitle: { fontSize: 14, lineHeight: 21, fontWeight: '600', color: COLORS.textPrimary },
  exportButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exportError: { fontSize: 13, lineHeight: 20, color: COLORS.error },
  analysisRow: { gap: 20 },
  analysisWide: { flexDirection: 'row', alignItems: 'stretch' },
  chartColumn: { flex: 1, minWidth: 0 },
  card: { backgroundColor: COLORS.surface, padding: 24, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 12 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  cardMeta: { fontSize: 11, lineHeight: 18, color: COLORS.textMuted },
  categoryList: { gap: 20, marginTop: 24 },
  categoryRow: { gap: 8 },
  categoryMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  categoryName: { fontSize: 13, lineHeight: 20, fontWeight: '500', color: COLORS.textSecondary, flexShrink: 1 },
  categoryCount: { fontSize: 12, lineHeight: 20, color: COLORS.textMuted },
  track: { height: 6, borderRadius: 3, backgroundColor: COLORS.backgroundNeutral, overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.primary },
  noData: { fontSize: 13, lineHeight: 22, color: COLORS.textMuted, paddingVertical: 12 },
  statusList: { marginTop: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  statusNumber: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  statusPercentage: { fontSize: 12, color: COLORS.textMuted, width: 42, textAlign: 'right' },
  resolutionRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resolutionValue: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  priorityRow: { marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  priorityItem: { flex: 1, minWidth: 0, flexBasis: 130, padding: 16, gap: 10, borderRadius: 8, backgroundColor: COLORS.background },
  priorityLabelRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  priorityLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  priorityCode: { fontSize: 10, color: COLORS.textMuted },
  priorityValue: { fontSize: 24, lineHeight: 30, fontWeight: '600', color: COLORS.textPrimary },
  emptyState: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 12, backgroundColor: COLORS.surface },
  flexCopy: { flex: 1, minWidth: 0, gap: 4 },
  emptyTitle: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: COLORS.textPrimary },
  dataNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 4, paddingVertical: 4 },
  dataNoteText: { flex: 1, fontSize: 12, lineHeight: 20, color: COLORS.textMuted },
});

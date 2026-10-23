import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapSurface } from '../../components/MapSurface';
import { RequestError } from '../../components/RequestError';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { AuthorityMobileHeader } from '../../components/AuthorityMobileHeader';
import { authorityApi } from '../../api/authorityApi';
import { Complaint } from '../../types/complaint';
import { COLORS } from '../../theme/colors';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const hasCoordinates = (complaint: Complaint) => Number.isFinite(complaint.latitude) && Number.isFinite(complaint.longitude) && Math.abs(complaint.latitude) <= 90 && Math.abs(complaint.longitude) <= 180;
const normalizeStatus = (status: string) => (status || '').toLowerCase().trim().replace(/\s+/g, '_');

export const AuthorityMapScreen = ({ navigation }: any) => {
  const { isDesktop, height } = useBreakpoint();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchMapComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const result = await authorityApi.getAllComplaints();
      const records = result.complaints || [];
      setComplaints(records);
      setSelectedComplaint(records.find(hasCoordinates) || null);
    } catch (error) {
      setLoadError((error as Error).message || 'Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void fetchMapComplaints(); }, [fetchMapComplaints]));
  const pinned = complaints.filter(hasCoordinates);
  const filtered = pinned.filter(complaint => statusFilter === 'all' || normalizeStatus(complaint.status) === statusFilter);
  useEffect(() => {
    if (!filtered.some(complaint => complaint._id === selectedComplaint?._id)) setSelectedComplaint(filtered[0] || null);
  }, [complaints, statusFilter, selectedComplaint?._id]);

  const filterOptions = [
    { label: 'All Pinned', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
  ];
  const inspect = (complaint: Complaint) => navigation.navigate('AuthorityComplaintDetail', { complaintId: complaint._id });

  if (loadError) return <RequestError message={loadError} onRetry={fetchMapComplaints} />;
  if (loading) return <LoadingSpinner message="Mapping municipal incidents..." />;

  const renderFilters = () => (
    <View style={styles.filterRow}>
      {filterOptions.map(option => {
        const selected = option.value === statusFilter;
        const count = option.value === 'all' ? pinned.length : pinned.filter(complaint => normalizeStatus(complaint.status) === option.value).length;
        return (
          <TouchableOpacity key={option.value} accessibilityRole="button" accessibilityLabel={`${option.label}, ${count} incidents`} accessibilityState={{ selected }} aria-pressed={selected}
            onPress={() => setStatusFilter(option.value)} style={[styles.filter, selected && styles.filterSelected]} activeOpacity={0.8}>
            <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{option.label}</Text>
            <Text style={[styles.filterCount, selected && styles.filterCountSelected]}>{count}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSelected = () => selectedComplaint && (
    <View style={styles.selectedCard} testID="selected-map-incident">
      <View style={styles.selectedMeta}>
        <Text style={styles.eyebrow}>Selected incident</Text>
        <StatusBadge status={selectedComplaint.status} size="sm" />
      </View>
      <Text style={styles.selectedTitle}>{selectedComplaint.title}</Text>
      <Text style={styles.reference}>{selectedComplaint.complaintId}</Text>
      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={17} color={COLORS.textMuted} />
        <Text style={styles.selectedAddress}>{selectedComplaint.address || 'GPS coordinates recorded'}</Text>
      </View>
      <Text style={styles.coordinates}>{selectedComplaint.latitude.toFixed(5)}, {selectedComplaint.longitude.toFixed(5)}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Inspect Dossier" style={styles.inspectButton} onPress={() => inspect(selectedComplaint)} activeOpacity={0.8}>
        <Text style={styles.inspectText}>Inspect Dossier</Text>
        <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: Complaint }) => {
    const selected = selectedComplaint?._id === item._id;
    return (
      <View style={[styles.incidentRow, selected && styles.incidentRowSelected]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Preview incident ${item.complaintId}`} accessibilityState={{ selected }} aria-pressed={selected}
          style={styles.incidentPreview} onPress={() => setSelectedComplaint(item)} activeOpacity={0.8}>
          <View style={styles.rowHeading}>
            <Text style={styles.reference}>{item.complaintId}</Text>
            {selected && <Text style={styles.selectedLabel}>On map</Text>}
          </View>
          <Text style={styles.incidentTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.incidentAddress} numberOfLines={2}>{item.address || 'GPS coordinates recorded'}</Text>
          <View style={styles.rowStatus}><StatusBadge status={item.status} size="sm" /></View>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open incident ${item.complaintId}`} style={styles.openButton} onPress={() => inspect(item)}>
          <Ionicons name="arrow-forward" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="map-outline" size={30} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>No incidents to display</Text>
      <Text style={styles.helper}>No reports with valid coordinates match this filter.</Text>
      {statusFilter !== 'all' && <TouchableOpacity accessibilityRole="button" style={styles.resetButton} onPress={() => setStatusFilter('all')}><Text style={styles.resetText}>Show all incidents</Text></TouchableOpacity>}
    </View>
  );

  const renderMap = () => (
    <View style={styles.mapContainer}>
      {selectedComplaint ? <MapSurface latitude={selectedComplaint.latitude} longitude={selectedComplaint.longitude} interactive
        pins={filtered.map(complaint => ({ id: complaint._id, latitude: complaint.latitude, longitude: complaint.longitude, title: complaint.title, address: complaint.address }))}
        onSelectPin={id => setSelectedComplaint(filtered.find(complaint => complaint._id === id) || null)} /> : renderEmpty()}
    </View>
  );

  const listHeading = <View style={styles.listHeading}><Text style={styles.sectionTitle}>Incident list</Text><Text style={styles.resultCount}>{filtered.length} shown</Text></View>;

  if (isDesktop) return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.pageHeader}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.pageTitle}>Incident Map</Text>
            <Text style={styles.helper}>Locate reported issues and review their progress.</Text>
          </View>
          <View style={styles.totalBadge}><Ionicons name="location-outline" size={16} color={COLORS.primary} /><Text style={styles.totalText}>{pinned.length} pinned incident{pinned.length === 1 ? '' : 's'}</Text></View>
        </View>
        {renderFilters()}
      </View>
      <View style={styles.desktopBody}>
        <View style={styles.desktopPanel}>
          <FlatList data={filtered} keyExtractor={item => item._id} renderItem={renderItem} style={styles.list}
            ListHeaderComponent={<>{renderSelected()}{listHeading}</>} ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent} />
        </View>
        <View style={styles.mapPanel}>
          <View style={styles.mapToolbar}>
            <View style={styles.mapToolbarTitle}><Ionicons name="map-outline" size={17} color={COLORS.primary} /><Text style={styles.sectionTitle}>Map view</Text></View>
            <Text style={styles.mapHint}>Select a pin or an incident to focus the map</Text>
          </View>
          {renderMap()}
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <View style={styles.screen}>
      <AuthorityMobileHeader title="Incident Map" />
      <ScrollView contentContainerStyle={styles.mobileContent}>
        <View style={styles.mobileIntro}><Text style={styles.helper}>Locate reported issues and review their progress.</Text>{renderFilters()}</View>
        <View style={[styles.mobileMap, { height: Math.max(260, Math.min(height * 0.42, 440)) }]}>{renderMap()}</View>
        {renderSelected()}
        <View style={styles.mobileList}>{listHeading}{filtered.length ? filtered.map(item => <View key={item._id}>{renderItem({ item })}</View>) : renderEmpty()}</View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, minWidth: 0, backgroundColor: COLORS.background },
  pageHeader: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 20 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  headingCopy: { gap: 6, flexShrink: 1 },
  pageTitle: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5, color: COLORS.textPrimary },
  helper: { fontSize: 13, lineHeight: 20, color: COLORS.textMuted },
  totalBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  totalText: { fontSize: 12, fontWeight: '600', color: COLORS.primaryDark },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, minHeight: 44, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 8, backgroundColor: COLORS.surface },
  filterSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  filterText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  filterTextSelected: { color: COLORS.primaryDark, fontWeight: '700' },
  filterCount: { fontSize: 11, fontWeight: '600', minWidth: 22, textAlign: 'center', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, color: COLORS.textMuted, backgroundColor: COLORS.backgroundNeutral },
  filterCountSelected: { backgroundColor: COLORS.primarySurface, color: COLORS.primaryDark },
  desktopBody: { flex: 1, minHeight: 0, flexDirection: 'row', padding: 20, gap: 20 },
  desktopPanel: { width: 340, maxWidth: '42%', minHeight: 0, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 12, overflow: 'hidden' },
  list: { flex: 1 },
  listContent: { paddingBottom: 12 },
  selectedCard: { padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 10 },
  selectedMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: COLORS.textMuted },
  selectedTitle: { fontSize: 18, fontWeight: '700', lineHeight: 25, color: COLORS.textPrimary },
  reference: { fontSize: 11, lineHeight: 16, fontWeight: '600', color: COLORS.textMuted },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  selectedAddress: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 20, color: COLORS.textSecondary },
  coordinates: { fontSize: 11, lineHeight: 16, color: COLORS.textMuted, paddingLeft: 23 },
  inspectButton: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, marginTop: 4 },
  inspectText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 16, backgroundColor: COLORS.background },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  resultCount: { fontSize: 12, color: COLORS.textMuted },
  incidentRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, borderLeftWidth: 3, borderLeftColor: 'transparent', paddingRight: 4 },
  incidentRowSelected: { borderLeftColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  incidentPreview: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 16, gap: 6 },
  rowHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  selectedLabel: { fontSize: 10, fontWeight: '600', color: COLORS.primaryDark },
  incidentTitle: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: COLORS.textPrimary },
  incidentAddress: { fontSize: 12, lineHeight: 18, color: COLORS.textMuted },
  rowStatus: { alignItems: 'flex-start', marginTop: 2 },
  openButton: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  mapPanel: { flex: 1, minWidth: 0, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.surface },
  mapToolbar: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  mapToolbarTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapHint: { fontSize: 12, lineHeight: 18, color: COLORS.textMuted, flexShrink: 1 },
  mapContainer: { flex: 1, minHeight: 200, width: '100%', overflow: 'hidden', backgroundColor: COLORS.backgroundNeutral },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  resetButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  resetText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  mobileContent: { paddingBottom: Platform.OS === 'ios' ? 48 : 24 },
  mobileIntro: { padding: 16, gap: 16 },
  mobileMap: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: 16 },
  mobileList: { marginTop: 16, backgroundColor: COLORS.surface },
});

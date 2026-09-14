import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authorityApi } from '../../api/authorityApi';
import { Complaint } from '../../types/complaint';
import { COLORS, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { StatusBadge } from '../../components/StatusBadge';
import { FilterChipGroup } from '../../components/FilterChip';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AuthorityMapScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMapComplaints();
  }, []);

  const fetchMapComplaints = async () => {
    try {
      setLoading(true);
      const res = await authorityApi.getAllComplaints();
      setComplaints(res.complaints || []);
      if (res.complaints && res.complaints.length > 0) {
        setSelectedComplaint(res.complaints[0]);
      }
    } catch (error) {
      console.error('Failed to load map complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (statusFilter === 'all') return true;
    const s = (c.status || '').toLowerCase().replace(' ', '_');
    return s === statusFilter;
  });

  const filterOptions = [
    { label: 'All Pinned', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
  ];

  if (loading) {
    return <LoadingSpinner message="Mapping municipal incidents..." />;
  }

  const centerLat = selectedComplaint ? selectedComplaint.latitude : 12.9716;
  const centerLng = selectedComplaint ? selectedComplaint.longitude : 77.5946;

  // ─── Web OpenStreetMap embed ───────────────────────────────────────────────
  const renderWebMap = () => {
    const bbox = `${centerLng - 0.015},${centerLat - 0.015},${centerLng + 0.015},${centerLat + 0.015}`;
    const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${centerLat},${centerLng}`;
    return (
      <View style={styles.mapContainer}>
        <iframe
          src={mapSrc}
          style={{ width: '100%', height: '100%', border: 'none' } as any}
          title="City Complaints Map"
        />
      </View>
    );
  };

  // ─── Native React Native Maps ──────────────────────────────────────────────
  const renderNativeMap = () => {
    let MapView: any = null;
    let Marker: any = null;
    let PROVIDER_DEFAULT: any = null;
    try {
      const maps = require('react-native-maps');
      MapView = maps.default;
      Marker = maps.Marker;
      PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
    } catch (e) {}

    if (!MapView) {
      return (
        <View style={[styles.mapContainer, styles.fallbackMap]}>
          <Ionicons name="map-outline" size={48} color={COLORS.primary} />
          <Text style={styles.fallbackTitle}>
            {filtered.length} Geographic Incidents Mapped
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          region={{
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
        >
          {filtered.map((item) => {
            return (
              <Marker
                key={item._id}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                title={item.title}
                description={item.address}
                pinColor={COLORS.primary}
                onPress={() => setSelectedComplaint(item)}
              >
                <View style={styles.redYellowPinMarker}>
                  <View style={styles.pinOuterYellowRing}>
                    <View style={styles.pinInnerRedCircle}>
                      <Ionicons name="location" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
              </Marker>
            );
          })}
        </MapView>
      </View>
    );
  };

  // ─── Complaint list item (used in the desktop side panel) ─────────────────
  const renderSidePanelItem = ({ item }: { item: Complaint }) => {
    const isSelected = selectedComplaint?._id === item._id;
    const norm = (item.status || '').toLowerCase();
    const accentColor =
      norm === 'resolved'
        ? COLORS.resolved
        : norm.includes('progress')
        ? COLORS.inProgress
        : COLORS.pending;

    return (
      <TouchableOpacity
        style={[styles.panelItem, isSelected && styles.panelItemSelected]}
        onPress={() => setSelectedComplaint(item)}
        activeOpacity={0.75}
      >
        <View
          style={[styles.panelAccentBar, { backgroundColor: accentColor }]}
        />
        <View style={styles.panelItemContent}>
          <Text style={styles.panelItemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.panelItemAddress} numberOfLines={1}>
            {item.address || 'GPS coordinates logged'}
          </Text>
          <StatusBadge status={item.status} size="sm" />
        </View>
        <TouchableOpacity
          style={styles.panelItemArrow}
          onPress={() =>
            navigation.navigate('AuthorityComplaintDetail', { complaintId: item._id })
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-forward-circle-outline" size={20} color={COLORS.accent} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ─── Desktop Layout: side panel left + map right ───────────────────────────
  if (isDesktop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Desktop top bar */}
        <View style={styles.desktopTopBar}>
          <Text style={styles.desktopTopBarTitle}>Incident Map</Text>
          <FilterChipGroup
            options={filterOptions}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            containerStyle={styles.desktopFilterContainer}
          />
        </View>

        {/* Desktop body: panel + map */}
        <View style={styles.desktopBody}>
          {/* Left panel — scrollable complaints list */}
          <View style={styles.desktopPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderTitle}>
                {filtered.length} Incident{filtered.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.panelHeaderSub}>Tap to preview on map</Text>
            </View>

            {filtered.length === 0 ? (
              <View style={styles.panelEmpty}>
                <Ionicons name="map-outline" size={36} color={COLORS.textMuted} />
                <Text style={styles.panelEmptyText}>No incidents match the filter</Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item._id}
                renderItem={renderSidePanelItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.panelListContent}
              />
            )}

            {/* Selected complaint detail in panel footer */}
            {selectedComplaint && (
              <View style={styles.panelFooter}>
                <View style={styles.panelFooterInfo}>
                  <Text style={styles.panelFooterTitle} numberOfLines={1}>
                    {selectedComplaint.title}
                  </Text>
                  <Text style={styles.panelFooterAddr} numberOfLines={1}>
                    {selectedComplaint.address}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.panelFooterBtn}
                  onPress={() =>
                    navigation.navigate('AuthorityComplaintDetail', {
                      complaintId: selectedComplaint._id,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.panelFooterBtnText}>Inspect</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Right — Map */}
          <View style={styles.desktopMapArea}>
            {Platform.OS === 'web' ? renderWebMap() : renderNativeMap()}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Mobile / Tablet — original stacked layout ─────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('AuthorityDashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Map</Text>
      </View>

      <View style={styles.container}>
        <FilterChipGroup
          options={filterOptions}
          selectedValue={statusFilter}
          onSelect={setStatusFilter}
          containerStyle={styles.filterBar}
        />

        {Platform.OS === 'web' ? renderWebMap() : renderNativeMap()}

        {selectedComplaint ? (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {selectedComplaint.title}
                </Text>
                <Text style={styles.previewAddress} numberOfLines={1}>
                  {selectedComplaint.address}
                </Text>
              </View>
              <StatusBadge status={selectedComplaint.status} size="sm" />
            </View>
            <TouchableOpacity
              style={styles.inspectBtn}
              onPress={() =>
                navigation.navigate('AuthorityComplaintDetail', {
                  complaintId: selectedComplaint._id,
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.inspectBtnText}>Inspect Complaint Dossier</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#FFFFFF"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Desktop ──────────────────────────────────────────────────────────────────
  desktopTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  desktopTopBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  desktopFilterContainer: {
    paddingBottom: 0,
    paddingTop: 0,
  },
  desktopBody: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopPanel: {
    width: 360,
    flexShrink: 0,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
  },
  panelHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  panelHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  panelHeaderSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  panelListContent: {
    paddingVertical: 8,
  },
  panelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    minHeight: 64,
  },
  panelItemSelected: {
    backgroundColor: '#F8FAFC',
  },
  panelAccentBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
    flexShrink: 0,
  },
  panelItemContent: {
    flex: 1,
    minWidth: 0,
  },
  panelItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  panelItemAddress: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  panelItemArrow: {
    paddingLeft: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  panelEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  panelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#FAFAFA',
    gap: 10,
  },
  panelFooterInfo: {
    flex: 1,
    minWidth: 0,
  },
  panelFooterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  panelFooterAddr: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  panelFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 44,
    ...SHADOWS.button,
  },
  panelFooterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  desktopMapArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  // ── Mobile / Tablet ───────────────────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F1F5F9',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fallbackMap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    ...SHADOWS.elevated,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  previewAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.button,
  },
  inspectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  redYellowPinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOuterYellowRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFC107', // Golden Yellow outline
    borderWidth: 2,
    borderColor: '#FFA000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  pinInnerRedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary, // Crimson Red
    alignItems: 'center',
    justifyContent: 'center',
  },
});

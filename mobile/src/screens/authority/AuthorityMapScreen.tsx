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
import Animated, { FadeInDown, FadeInUp, ZoomIn, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { authorityApi } from '../../api/authorityApi';
import { Complaint } from '../../types/complaint';
import { COLORS } from '../../theme/colors';
import { BORDER_RADIUS } from '../../theme/radius';
import { SHADOWS } from '../../theme/index';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
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
      <Animated.View entering={FadeInUp.delay(200)} style={styles.mapContainer}>
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
          {filtered.map((item, index) => {
            return (
              <Marker
                key={item._id}
                coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                title={item.title}
                description={item.address}
                onPress={() => setSelectedComplaint(item)}
              >
                <Animated.View entering={ZoomIn.delay(300 + (index % 10) * 50)} style={styles.redYellowPinMarker}>
                  <View style={styles.pinOuterYellowRing}>
                    <View style={styles.pinInnerRedCircle}>
                      <Ionicons name="location" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </Animated.View>
              </Marker>
            );
          })}
        </MapView>
      </Animated.View>
    );
  };

  // ─── Complaint list item (used in the desktop side panel) ─────────────────
  const renderSidePanelItem = ({ item, index }: { item: Complaint, index: number }) => {
    const isSelected = selectedComplaint?._id === item._id;
    const norm = (item.status || '').toLowerCase();
    const accentColor =
      norm === 'resolved'
        ? COLORS.resolved
        : norm.includes('progress')
        ? COLORS.inProgress
        : COLORS.pending;

    return (
      <Animated.View entering={FadeInRight.delay(index * 50)}>
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
            <Ionicons name="arrow-forward-circle-outline" size={20} color={COLORS.secondary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ─── Desktop Layout: side panel left + map right ───────────────────────────
  if (isDesktop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        {/* Desktop top bar */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.desktopTopBar}>
          <Text style={styles.desktopTopBarTitle}>Incident Map</Text>
          <FilterChipGroup
            options={filterOptions}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            containerStyle={styles.desktopFilterContainer}
          />
        </Animated.View>

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
              <Animated.View entering={FadeInUp.duration(300)} style={styles.panelFooter}>
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
              </Animated.View>
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('AuthorityDashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Map</Text>
      </Animated.View>

      <View style={styles.container}>
        <FilterChipGroup
          options={filterOptions}
          selectedValue={statusFilter}
          onSelect={setStatusFilter}
          containerStyle={styles.filterBar}
        />

        {Platform.OS === 'web' ? renderWebMap() : renderNativeMap()}

        {selectedComplaint ? (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.previewCard}>
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
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Desktop ──────────────────────────────────────────────────────────────────
  desktopTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['3xl'],
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
  },
  desktopTopBarTitle: {
    ...TYPOGRAPHY.h4,
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
    borderRightColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
    flexDirection: 'column',
  },
  panelHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  panelHeaderTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  panelHeaderSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  panelListContent: {
    paddingVertical: SPACING.sm,
  },
  panelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    minHeight: 64,
  },
  panelItemSelected: {
    backgroundColor: COLORS.backgroundNeutral,
  },
  panelAccentBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  panelItemContent: {
    flex: 1,
    minWidth: 0,
  },
  panelItemTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  panelItemAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  panelItemArrow: {
    paddingLeft: SPACING.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['4xl'],
  },
  panelEmptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  panelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.backgroundNeutral,
    gap: SPACING.sm,
  },
  panelFooterInfo: {
    flex: 1,
    minWidth: 0,
  },
  panelFooterTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  panelFooterAddr: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  panelFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 44,
    ...SHADOWS.button,
  },
  panelFooterBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  desktopMapArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundNeutral,
  },

  // ── Mobile / Tablet ───────────────────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginRight: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.backgroundNeutral,
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
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'],
    ...SHADOWS.elevated,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  previewTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  previewAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.button,
  },
  inspectBtnText: {
    ...TYPOGRAPHY.bodySmall,
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

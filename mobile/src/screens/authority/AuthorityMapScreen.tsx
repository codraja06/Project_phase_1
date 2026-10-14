import { MapSurface } from '../../components/MapSurface';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RequestError } from '../../components/RequestError';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
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
import { useMobileMenu } from '../../contexts/MobileMenuContext';
import { StatusBadge } from '../../components/StatusBadge';
import { FilterChipGroup } from '../../components/FilterChip';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { AuthorityMobileHeader } from '../../components/AuthorityMobileHeader';

export const AuthorityMapScreen = ({ navigation }: any) => {
  const { toggleMenu } = useMobileMenu();
  const { isDesktop, width, height } = useBreakpoint();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useFocusEffect(useCallback(() => { void fetchMapComplaints(); }, []));

  const fetchMapComplaints = async () => {
    try {
      setLoading(true); setLoadError('');
      const res = await authorityApi.getAllComplaints();
      setComplaints(res.complaints || []);
      if (res.complaints && res.complaints.length > 0) {
        setSelectedComplaint(res.complaints[0]);
      }
    } catch (error) {
      setLoadError((error as Error).message || 'Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude) || Math.abs(c.latitude) > 90 || Math.abs(c.longitude) > 180) return false;
    if (statusFilter === 'all') return true;
    const s = (c.status || '').toLowerCase().replace(' ', '_');
    return s === statusFilter;
  });

  useEffect(() => {
    if (!filtered.some(c => c._id === selectedComplaint?._id)) setSelectedComplaint(filtered[0] || null);
  }, [complaints, statusFilter, selectedComplaint?._id]);

  const filterOptions = [
    { label: 'All Pinned', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
  ];

  if (loadError) return <RequestError message={loadError} onRetry={fetchMapComplaints} />;

  if (loading) {
    return <LoadingSpinner message="Mapping municipal incidents..." />;
  }

  const centerLat = selectedComplaint ? selectedComplaint.latitude : 12.9716;
  const centerLng = selectedComplaint ? selectedComplaint.longitude : 77.5946;

  const renderMap = () => <View style={styles.mapContainer}>{selectedComplaint ? <MapSurface latitude={centerLat} longitude={centerLng} interactive pins={filtered.map(c => ({ id: c._id, latitude: c.latitude, longitude: c.longitude, title: c.title, address: c.address }))} onSelectPin={id => setSelectedComplaint(filtered.find(c => c._id === id) || null)} /> : <View style={styles.fallbackMap}><Text>No reports with valid coordinates match this filter.</Text></View>}</View>;

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
            {renderMap()}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Mobile / Tablet — original stacked layout ─────────────────────────────
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <AuthorityMobileHeader title="Incident Map" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.filterSection}>
          <FilterChipGroup
            options={filterOptions}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            containerStyle={styles.filterBar}
          />
        </View>

        <View style={{ height: Math.max(260, Math.min(height * 0.45, 500)) }}>{renderMap()}</View>
        {filtered.map((item,index) => <View key={item._id}>{renderSidePanelItem({item,index})}</View>)}

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
              <Text style={styles.inspectBtnText}>Inspect Dossier</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#FFFFFF"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
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
    paddingTop: Platform.OS === 'ios' ? SPACING.md : SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: '#0F172A',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    display: 'flex',
    flexDirection: 'column',
  },
  filterSection: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
    width: '100%',
    backgroundColor: COLORS.backgroundNeutral,
    overflow: 'hidden',
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
    paddingBottom: Platform.OS === 'ios' ? SPACING['4xl'] : SPACING['3xl'],
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
    backgroundColor: '#FFC107',
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

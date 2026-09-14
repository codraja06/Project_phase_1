import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { complaintApi } from '../../api/complaintApi';
import { Complaint } from '../../types/complaint';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { ComplaintCard } from '../../components/ComplaintCard';
import { SearchBar } from '../../components/SearchBar';
import { FilterChipGroup } from '../../components/FilterChip';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const ComplaintHistoryScreen = ({ navigation, route }: any) => {
  const { isDesktop } = useBreakpoint();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(route?.params?.filter || 'all');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintApi.getMyComplaints();
      setComplaints(res.complaints || []);
    } catch (error) {
      console.error('Failed to load complaint history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (route?.params?.filter) {
        setStatusFilter(route.params.filter);
      }
      fetchComplaints();
    }, [route?.params?.filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'all') {
        const norm = (c.status || '').toLowerCase().replace(' ', '_');
        if (norm !== statusFilter) return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesCode = (c.complaintId || '').toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        const matchesCat = c.category?.toLowerCase().includes(q);
        const matchesAddr = c.address?.toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle && !matchesDesc && !matchesCat && !matchesAddr) return false;
      }
      return true;
    });
  }, [complaints, statusFilter, searchQuery]);

  const filterOptions = [
    { label: 'All Reports', value: 'all', count: complaints.length },
    {
      label: 'Pending',
      value: 'pending',
      count: complaints.filter((c) => (c.status || '').toLowerCase() === 'pending').length,
    },
    {
      label: 'In Progress',
      value: 'in_progress',
      count: complaints.filter((c) => (c.status || '').toLowerCase().includes('progress')).length,
    },
    {
      label: 'Resolved',
      value: 'resolved',
      count: complaints.filter((c) => (c.status || '').toLowerCase() === 'resolved').length,
    },
  ];

  const EmptyComponent = (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="documents-outline" size={40} color={COLORS.slateMedium} />
      </View>
      <Text style={styles.emptyTitle}>
        {complaints.length === 0 ? 'No complaints yet' : 'No complaints found'}
      </Text>
      <Text style={styles.emptySub}>
        {complaints.length === 0
          ? 'Your reported civic issues will appear here.'
          : searchQuery
          ? 'No incident reports match your current search criteria.'
          : 'You have not submitted any complaints in this status category.'}
      </Text>
      {complaints.length === 0 && (
        <TouchableOpacity
          style={styles.emptyReportBtn}
          onPress={() => navigation.navigate('ReportIssue')}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.emptyReportBtnText}>Report an Issue</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Desktop Layout: wide container + two-column card grid ───────────────
  if (isDesktop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Desktop Header */}
        <View style={styles.desktopHeader}>
          <View style={styles.desktopHeaderLeft}>
            <Text style={styles.desktopTitle}>My Complaints</Text>
            <Text style={styles.desktopSubtitle}>
              Showing {filteredComplaints.length} of {complaints.length} registered reports
            </Text>
          </View>
          <View style={styles.desktopControls}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by ID, title, location or category..."
              style={styles.desktopSearch}
            />
          </View>
        </View>

        {/* Desktop Filter Bar */}
        <View style={styles.desktopFilterBar}>
          <FilterChipGroup
            options={filterOptions}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
            containerStyle={styles.desktopFilterChips}
          />
        </View>

        {loading && !refreshing ? (
          <LoadingSpinner message="Loading your community reports..." />
        ) : (
          <FlatList
            data={filteredComplaints}
            keyExtractor={(item) => item._id}
            numColumns={2}
            key="desktop-2col"
            columnWrapperStyle={styles.desktopColumnWrapper}
            renderItem={({ item }) => (
              <View style={styles.desktopCardWrapper}>
                <ComplaintCard
                  complaint={item}
                  onPress={() =>
                    (navigation as any).navigate('ComplaintDetail', { complaintId: item._id })
                  }
                />
              </View>
            )}
            contentContainerStyle={styles.desktopListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={EmptyComponent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    );
  }

  // ─── Mobile / Tablet Single Column Layout ─────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('CitizenDashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Complaints</Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{filteredComplaints.length}</Text>
        </View>
      </View>

      {/* Search & Filter Header */}
      <View style={styles.filterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search reports..."
          style={styles.searchBar}
        />
        <FilterChipGroup
          options={filterOptions}
          selectedValue={statusFilter}
          onSelect={setStatusFilter}
          containerStyle={styles.filterChips}
        />
      </View>

      {loading && !refreshing ? (
        <LoadingSpinner message="Loading complaints..." />
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ComplaintCard
              complaint={item}
              onPress={() =>
                (navigation as any).navigate('ComplaintDetail', { complaintId: item._id })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={EmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Desktop Styles
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    paddingTop: 32,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  desktopHeaderLeft: {
    flex: 1,
  },
  desktopTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  desktopSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  desktopControls: {
    width: 380,
  },
  desktopSearch: {
    marginBottom: 0,
  },
  desktopFilterBar: {
    paddingHorizontal: 36,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.borderLight,
  },
  desktopFilterChips: {
    paddingVertical: 4,
  },
  desktopListContent: {
    paddingHorizontal: 36,
    paddingTop: 20,
    paddingBottom: 48,
  },
  desktopColumnWrapper: {
    gap: 16,
  },
  desktopCardWrapper: {
    flex: 1,
    maxWidth: '50%',
  },

  // Mobile Styles
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  countPill: {
    marginLeft: 'auto',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderMaroon,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  searchBar: {
    marginBottom: 8,
  },
  filterChips: {
    paddingVertical: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginTop: 20,
    ...SHADOWS.card,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 16,
  },
  emptyReportBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

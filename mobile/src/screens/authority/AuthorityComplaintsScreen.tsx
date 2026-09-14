import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { authorityApi } from '../../api/authorityApi';
import { Complaint } from '../../types/complaint';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { SearchBar } from '../../components/SearchBar';
import { FilterChipGroup } from '../../components/FilterChip';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Toast } from '../../components/Toast';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const formatCategory = (cat?: string) => {
  if (!cat) return 'Unspecified';
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// ─── Desktop Administrative Table Row Component ──────────────────────────────
interface TableRowProps {
  complaint: Complaint;
  onPress: () => void;
  onVerify: (complaint: Complaint) => void;
  onReject: (complaint: Complaint) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const DesktopComplaintRow: React.FC<TableRowProps> = ({
  complaint,
  onPress,
  onVerify,
  onReject,
  isSelected,
  onToggleSelect,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  const citizenObj = complaint.createdBy || complaint.citizenId;
  const citizenName =
    typeof citizenObj === 'object' && citizenObj
      ? (citizenObj as any).name || 'Citizen'
      : 'Citizen';
  const citizenContact =
    typeof citizenObj === 'object' && citizenObj
      ? (citizenObj as any).phone || (citizenObj as any).email || ''
      : '';

  const complaintCode = complaint.complaintId || `#CIV${complaint._id.slice(-5).toUpperCase()}`;
  const priority = complaint.priority || 'medium';
  const isHighPriority = priority === 'urgent' || priority === 'high';
  const isVerified = Boolean(complaint.verified);

  const aiLabel = complaint.aiClass
    ? formatCategory(complaint.aiClass)
    : complaint.boundingBoxes && complaint.boundingBoxes.length > 0
    ? formatCategory((complaint.boundingBoxes[0] as any).className || (complaint.boundingBoxes[0] as any).label)
    : 'None';

  const userCategoryLabel = complaint.customCategory
    ? complaint.customCategory
    : formatCategory(complaint.category);

  return (
    <View
      style={[
        styles.tableRow,
        isSelected && styles.tableRowSelected,
        isHovered && isWeb && (styles.tableRowHovered as any),
      ]}
      {...({
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      } as any)}
    >
      <TouchableOpacity onPress={onToggleSelect} style={styles.tableCheckboxBtn} activeOpacity={0.8}>
        <Ionicons
          name={isSelected ? 'checkbox' : 'square-outline'}
          size={18}
          color={isSelected ? '#0F172A' : COLORS.textMuted}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.tableThumbWrapper}>
        <View style={styles.tableThumb}>
          {complaint.imageUrl && !imgError ? (
            <Image
              source={{ uri: complaint.imageUrl }}
              style={styles.tableThumbImg}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={styles.tableThumbPlaceholder}>
              <Ionicons name="image-outline" size={20} color={COLORS.textMuted} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tableColTitle} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.civRow}>
          <Text style={styles.complaintCodeText}>{complaintCode}</Text>
          {isHighPriority && <Badge label="URGENT" variant="destructive" />}
          {isVerified ? (
            <Badge label="VERIFIED" variant="default" icon={<Ionicons name="shield-checkmark" size={10} color="#FFF" />} />
          ) : (
            <Badge label="UNVERIFIED" variant="outline" />
          )}
        </View>
        <Text style={styles.tableTitle} numberOfLines={1}>
          {complaint.title}
        </Text>
      </TouchableOpacity>

      <View style={styles.tableColComparison}>
        <View style={styles.catCompareItem}>
          <Text style={styles.catCompareKey}>AI</Text>
          <Text style={styles.catCompareVal} numberOfLines={1}>{aiLabel}</Text>
        </View>
        <View style={styles.catCompareItem}>
          <Text style={styles.catCompareKey}>USER</Text>
          <Text style={styles.catCompareVal} numberOfLines={1}>{userCategoryLabel}</Text>
        </View>
      </View>

      <View style={styles.tableColCitizen}>
        <Text style={styles.tableCitizenName} numberOfLines={1}>
          {citizenName}
        </Text>
        {citizenContact ? (
          <Text style={styles.tableCitizenContact} numberOfLines={1}>
            {citizenContact}
          </Text>
        ) : null}
      </View>

      <View style={styles.tableColDate}>
        <Text style={styles.tableDate}>{formattedDate}</Text>
      </View>

      <View style={styles.tableColStatus}>
        <StatusBadge status={complaint.status} size="sm" />
      </View>

      <View style={styles.tableColActions}>
        {!isVerified && (
          <Button title="Verify" variant="outline" onPress={() => onVerify(complaint)} size="sm" style={{ marginRight: 8, height: 32, paddingHorizontal: 8 }} />
        )}
        <Button variant="ghost" onPress={() => onReject(complaint)} size="sm" style={{ width: 32, height: 32, paddingHorizontal: 0, marginRight: 4 }} icon={<Ionicons name="trash-outline" size={16} color={COLORS.error} />} />
        <Button variant="ghost" onPress={onPress} size="sm" style={{ width: 32, height: 32, paddingHorizontal: 0 }} icon={<Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />} />
      </View>
    </View>
  );
};

// ─── Mobile Administrative Complaint Card ────────────────────────────────────
interface MobileCardProps {
  complaint: Complaint;
  onPress: () => void;
  onVerify: (complaint: Complaint) => void;
  onReject: (complaint: Complaint) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const MobileAuthorityCard: React.FC<MobileCardProps> = ({
  complaint,
  onPress,
  onVerify,
  onReject,
  isSelected,
  onToggleSelect,
}) => {
  const [imgError, setImgError] = useState(false);

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const citizenObj = complaint.createdBy || complaint.citizenId;
  const citizenName =
    typeof citizenObj === 'object' && citizenObj
      ? (citizenObj as any).name || 'Citizen'
      : 'Citizen';
  const citizenContact =
    typeof citizenObj === 'object' && citizenObj
      ? (citizenObj as any).phone || (citizenObj as any).email || ''
      : '';

  const complaintCode = complaint.complaintId || `#CIV${complaint._id.slice(-5).toUpperCase()}`;
  const priority = complaint.priority || 'medium';
  const isHighPriority = priority === 'urgent' || priority === 'high';
  const isVerified = Boolean(complaint.verified);

  const aiLabel = complaint.aiClass
    ? formatCategory(complaint.aiClass)
    : complaint.boundingBoxes && complaint.boundingBoxes.length > 0
    ? formatCategory((complaint.boundingBoxes[0] as any).className || (complaint.boundingBoxes[0] as any).label)
    : 'None detected';

  const userCategoryLabel = complaint.customCategory
    ? `${complaint.customCategory} (Custom)`
    : formatCategory(complaint.category);

  return (
    <Card style={[styles.mobileCard, isSelected && styles.mobileCardSelected]}>
      <CardContent style={{ padding: 16 }}>
        <View style={styles.mobileCardHeader}>
          <View style={styles.mobileCardHeaderLeft}>
            <TouchableOpacity onPress={onToggleSelect} style={styles.mobileCheckboxBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={20} color={isSelected ? '#0F172A' : COLORS.textMuted} />
            </TouchableOpacity>
            <Text style={styles.complaintCodeText}>{complaintCode}</Text>
            {isHighPriority && <Badge label="HIGH" variant="destructive" />}
            {isVerified ? <Badge label="VERIFIED" variant="default" /> : <Badge label="UNVERIFIED" variant="outline" />}
          </View>
          <StatusBadge status={complaint.status} size="sm" />
        </View>

        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.mobileCardBody}>
          {complaint.imageUrl && !imgError ? (
            <Image source={{ uri: complaint.imageUrl }} style={styles.mobileCardImg} resizeMode="cover" onError={() => setImgError(true)} />
          ) : (
            <View style={styles.mobileCardImgPlaceholder}>
              <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
            </View>
          )}

          <View style={styles.mobileCardContent}>
            <Text style={styles.mobileCardTitle} numberOfLines={2}>{complaint.title}</Text>
            <Text style={styles.mobileCardLocation} numberOfLines={1}>📍 {complaint.address || 'GPS Coordinates logged'}</Text>
            <Text style={styles.mobileCardCitizen} numberOfLines={1}>👤 {citizenName} {citizenContact ? `(${citizenContact})` : ''}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.mobileCompareBanner}>
          <View style={styles.mobileCompareCol}>
            <Text style={styles.mobileCompareLabel}>AI PREDICTION</Text>
            <Text style={styles.mobileCompareValue} numberOfLines={1}>{aiLabel}</Text>
          </View>
          <View style={styles.mobileCompareDivider} />
          <View style={styles.mobileCompareCol}>
            <Text style={styles.mobileCompareLabel}>USER CATEGORY</Text>
            <Text style={styles.mobileCompareValue} numberOfLines={1}>{userCategoryLabel}</Text>
          </View>
        </View>

        <View style={styles.mobileCardFooter}>
          <Text style={styles.mobileCardDate}>{formattedDate}</Text>
          <View style={styles.mobileActionGroup}>
            {!isVerified && (
              <Button title="Verify" variant="outline" onPress={() => onVerify(complaint)} size="sm" style={{ height: 32, paddingHorizontal: 8 }} />
            )}
            <Button variant="ghost" onPress={() => onReject(complaint)} size="sm" style={{ width: 32, height: 32, paddingHorizontal: 0 }} icon={<Ionicons name="trash-outline" size={14} color={COLORS.error} />} />
            <Button title="Dossier" variant="secondary" onPress={onPress} size="sm" style={{ height: 32 }} icon={<Ionicons name="chevron-forward" size={14} color={COLORS.textPrimary} />} />
          </View>
        </View>
      </CardContent>
    </Card>
  );
};

// ─── Main Screen Component ───────────────────────────────────────────────────
export const AuthorityComplaintsScreen = ({ navigation, route }: any) => {
  const { isDesktop } = useBreakpoint();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const initialFilter = route?.params?.filter || 'all';
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (route?.params?.filter) setStatusFilter(route.params.filter);
  }, [route?.params?.filter]);

  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.filter) setStatusFilter(route.params.filter);
      fetchComplaints();
    }, [route?.params?.filter])
  );

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await authorityApi.getAllComplaints();
      setComplaints(res.complaints || []);
    } catch (error) {
      console.error('Failed to fetch authority complaints:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const handleVerify = async (item: Complaint) => {
    try {
      const updated = await authorityApi.verifyComplaint(item._id);
      setComplaints((prev) => prev.map((c) => (c._id === item._id ? { ...c, verified: true } : c)));
      setToast({ visible: true, message: `Incident verified.`, type: 'success' });
    } catch (error: any) {
      setToast({ visible: true, message: error.message || 'Unable to verify complaint.', type: 'error' });
    }
  };

  const handleOpenReject = (item: Complaint) => {
    setSelectedComplaint(item);
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedComplaint) return;
    try {
      setActionLoading(true);
      await authorityApi.deleteComplaint(selectedComplaint._id);
      setComplaints((prev) => prev.filter((c) => c._id !== selectedComplaint._id));
      setRejectModalVisible(false);
      setSelectedComplaint(null);
      setToast({ visible: true, message: 'Complaint record purged successfully.', type: 'info' });
    } catch (error: any) {
      setToast({ visible: true, message: error.message || 'Unable to delete complaint.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter === 'urgent') {
        const isUrgent = c.priority === 'urgent' || c.priority === 'high';
        if (!isUrgent) return false;
      } else if (statusFilter !== 'all') {
        const s = (c.status || '').toLowerCase().replace(' ', '_');
        if (s !== statusFilter) return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesCode = (c.complaintId || '').toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        const matchesCat = c.category?.toLowerCase().includes(q);
        const matchesAddr = c.address?.toLowerCase().includes(q);
        const userObj = c.createdBy || c.citizenId;
        const matchesCitizen = typeof userObj === 'object' && (userObj as any)?.name?.toLowerCase()?.includes(q);
        if (!matchesCode && !matchesTitle && !matchesDesc && !matchesCat && !matchesAddr && !matchesCitizen) return false;
      }
      return true;
    });
  }, [complaints, statusFilter, searchQuery]);

  const statusOptions = [
    { label: 'All Incidents', value: 'all', count: complaints.length },
    { label: 'Pending', value: 'pending', count: complaints.filter((c) => (c.status || '').toLowerCase() === 'pending').length },
    { label: 'In Progress', value: 'in_progress', count: complaints.filter((c) => (c.status || '').toLowerCase().includes('progress')).length },
    { label: 'Resolved', value: 'resolved', count: complaints.filter((c) => (c.status || '').toLowerCase() === 'resolved').length },
    { label: '🔥 High Priority', value: 'urgent', count: complaints.filter((c) => c.priority === 'urgent' || c.priority === 'high').length },
  ];

  const EmptyComponent = (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="documents-outline" size={42} color={COLORS.slateMedium} />
      </View>
      <Text style={styles.emptyTitle}>No complaints found</Text>
      <Text style={styles.emptySub}>{searchQuery ? 'Try another search query' : 'No records match the selected status filter'}</Text>
    </View>
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredComplaints.length && filteredComplaints.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComplaints.map((c) => c._id));
    }
  };

  const handleBulkStatus = async (newStatus: 'In Progress' | 'Resolved') => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      await Promise.all(selectedIds.map((id) => authorityApi.updateComplaintStatus(id, newStatus)));
      setComplaints((prev) => prev.map((c) => (selectedIds.includes(c._id) ? { ...c, status: newStatus } : c)));
      setToast({ visible: true, message: `${selectedIds.length} complaints transitioned to ${newStatus}.`, type: 'success' });
      setSelectedIds([]);
    } catch (error: any) {
      setToast({ visible: true, message: error.message || 'Bulk status update failed.', type: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkVerify = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      await Promise.all(selectedIds.map((id) => authorityApi.verifyComplaint(id)));
      setComplaints((prev) => prev.map((c) => (selectedIds.includes(c._id) ? { ...c, verified: true } : c)));
      setToast({ visible: true, message: `${selectedIds.length} complaints officially verified.`, type: 'success' });
      setSelectedIds([]);
    } catch (error: any) {
      setToast({ visible: true, message: error.message || 'Bulk verification failed.', type: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const renderBulkBar = () => {
    if (filteredComplaints.length === 0) return null;
    return (
      <View style={styles.bulkToolbar}>
        <TouchableOpacity onPress={handleSelectAll} style={styles.bulkSelectAllBtn} activeOpacity={0.7}>
          <Ionicons
            name={selectedIds.length === filteredComplaints.length && filteredComplaints.length > 0 ? 'checkbox' : 'square-outline'}
            size={18}
            color={COLORS.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.bulkSelectAllText}>{selectedIds.length === 0 ? 'Select All' : `${selectedIds.length} Selected`}</Text>
        </TouchableOpacity>

        {selectedIds.length > 0 && (
          <View style={styles.bulkActionButtons}>
            <Button title="In Progress" variant="secondary" size="sm" onPress={() => handleBulkStatus('In Progress')} disabled={bulkLoading} style={{ height: 32 }} icon={<Ionicons name="time" size={14} />} />
            <Button title="Resolve" variant="default" size="sm" onPress={() => handleBulkStatus('Resolved')} disabled={bulkLoading} style={{ height: 32 }} icon={<Ionicons name="checkmark-circle" size={14} color="#FFF" />} />
            <Button title="Verify" variant="outline" size="sm" onPress={handleBulkVerify} disabled={bulkLoading} style={{ height: 32 }} icon={<Ionicons name="shield-checkmark" size={14} />} />
            <TouchableOpacity onPress={() => setSelectedIds([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ paddingLeft: 8 }}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isDesktop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

        <View style={styles.desktopHeader}>
          <View>
            <Text style={styles.desktopTitle}>Incident Registry</Text>
            <Text style={styles.desktopSubtitle}>Showing {filteredComplaints.length} of {complaints.length} civic issues</Text>
          </View>
          <View style={styles.desktopControls}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by ID, title, citizen..." style={styles.desktopSearch} />
          </View>
        </View>

        <View style={styles.desktopFilterBar}>
          <FilterChipGroup options={statusOptions} selectedValue={statusFilter} onSelect={setStatusFilter} containerStyle={styles.desktopFilterChips} />
        </View>

        {renderBulkBar()}

        <View style={styles.tableHeaderRow}>
          <View style={styles.tableCheckboxHeader}>
            <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.8}>
              <Ionicons name={selectedIds.length === filteredComplaints.length && filteredComplaints.length > 0 ? 'checkbox' : 'square-outline'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.tableThumbHeader}><Text style={styles.tableHeaderLabel}>IMAGE</Text></View>
          <View style={styles.tableColTitle}><Text style={styles.tableHeaderLabel}>DOSSIER & CODE</Text></View>
          <View style={styles.tableColComparison}><Text style={styles.tableHeaderLabel}>AI / USER CATEGORY</Text></View>
          <View style={styles.tableColCitizen}><Text style={styles.tableHeaderLabel}>CITIZEN CONTACT</Text></View>
          <View style={styles.tableColDate}><Text style={styles.tableHeaderLabel}>DATE</Text></View>
          <View style={styles.tableColStatus}><Text style={styles.tableHeaderLabel}>STATUS</Text></View>
          <View style={styles.tableColActionsHeader}><Text style={styles.tableHeaderLabel}>ACTIONS</Text></View>
        </View>

        {loading && !refreshing ? (
          <LoadingSpinner message="Loading municipal complaints registry..." />
        ) : (
          <FlatList
            data={filteredComplaints}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <DesktopComplaintRow
                complaint={item}
                isSelected={selectedIds.includes(item._id)}
                onToggleSelect={() => toggleSelect(item._id)}
                onPress={() => navigation.navigate('AuthorityComplaintDetail', { complaintId: item._id })}
                onVerify={handleVerify}
                onReject={handleOpenReject}
              />
            )}
            contentContainerStyle={styles.desktopListContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}
            ListEmptyComponent={EmptyComponent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <ConfirmationDialog visible={rejectModalVisible} title="Reject / Purge Incident" message={`Permanently remove '${selectedComplaint?.title || 'this complaint'}' from the database?`} confirmText="Purge Record" confirmVariant="danger" loading={actionLoading} onConfirm={handleConfirmReject} onCancel={() => { setRejectModalVisible(false); setSelectedComplaint(null); }} />
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaMobile}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('AuthorityDashboard')}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Registry</Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{filteredComplaints.length}</Text>
        </View>
      </View>

      <View style={styles.filterSection}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search incidents..." style={styles.searchBar} />
        <FilterChipGroup options={statusOptions} selectedValue={statusFilter} onSelect={setStatusFilter} containerStyle={styles.filterChips} />
      </View>

      {renderBulkBar()}

      {loading && !refreshing ? (
        <LoadingSpinner message="Loading incidents..." />
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <MobileAuthorityCard
              complaint={item}
              isSelected={selectedIds.includes(item._id)}
              onToggleSelect={() => toggleSelect(item._id)}
              onPress={() => navigation.navigate('AuthorityComplaintDetail', { complaintId: item._id })}
              onVerify={handleVerify}
              onReject={handleOpenReject}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}
          ListEmptyComponent={EmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ConfirmationDialog visible={rejectModalVisible} title="Purge Incident" message={`Remove '${selectedComplaint?.title || 'this complaint'}' from the database?`} confirmText="Purge Record" confirmVariant="danger" loading={actionLoading} onConfirm={handleConfirmReject} onCancel={() => { setRejectModalVisible(false); setSelectedComplaint(null); }} />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  safeAreaMobile: { flex: 1, backgroundColor: '#F8FAFC' },

  // ── Desktop Table ──────────────────────────────────────────────────────────
  desktopHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 36, paddingTop: 32, paddingBottom: 16, backgroundColor: '#F8FAFC' },
  desktopTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  desktopSubtitle: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', marginTop: 4 },
  desktopControls: { width: 380 },
  desktopSearch: { marginBottom: 0 },
  desktopFilterBar: { paddingHorizontal: 36, paddingBottom: 16, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  desktopFilterChips: { paddingVertical: 4 },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 36, paddingVertical: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  tableThumbHeader: { width: 44, marginRight: 14 },
  tableHeaderLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.6 },
  desktopListContent: { paddingHorizontal: 36, paddingTop: 12, paddingBottom: 48 },
  tableRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 16, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: 8, ...(Platform.OS === 'web' ? { transition: 'all 0.1s ease-in-out' as any } : {}) },
  tableRowHovered: { borderColor: COLORS.border, backgroundColor: '#F8FAFC' },
  tableThumbWrapper: { width: 44, marginRight: 14, alignItems: 'center' },
  tableThumb: { width: 44, height: 44, borderRadius: BORDER_RADIUS.sm, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  tableThumbImg: { width: '100%', height: '100%' },
  tableThumbPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  tableColTitle: { flex: 2, marginRight: 14 },
  civRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  complaintCodeText: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  tableTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  tableColComparison: { flex: 1.5, marginRight: 14, justifyContent: 'center' },
  catCompareItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  catCompareKey: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, width: 28 },
  catCompareVal: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  tableColCitizen: { flex: 1.3, marginRight: 14 },
  tableCitizenName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  tableCitizenContact: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  tableColDate: { width: 80, marginRight: 14 },
  tableDate: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  tableColStatus: { width: 105, marginRight: 14 },
  tableColActionsHeader: { width: 130 },
  tableColActions: { width: 130, flexDirection: 'row', alignItems: 'center' },
  
  // ── Mobile ────────────────────────────────────────────────────────────────
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 24, paddingBottom: 14, backgroundColor: '#0F172A' },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2, flex: 1 },
  countPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
  countPillText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  filterSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  searchBar: { marginBottom: 8 },
  filterChips: { paddingVertical: 4 },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 36 },
  mobileCard: { marginBottom: 12, padding: 0 },
  mobileCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  mobileCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  mobileCardBody: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  mobileCardImg: { width: 74, height: 74, borderRadius: BORDER_RADIUS.md },
  mobileCardImgPlaceholder: { width: 74, height: 74, borderRadius: BORDER_RADIUS.md, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  mobileCardContent: { flex: 1 },
  mobileCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  mobileCardLocation: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  mobileCardCitizen: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  mobileCompareBanner: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: BORDER_RADIUS.sm, padding: 8, marginTop: 12, borderWidth: 1, borderColor: COLORS.borderLight },
  mobileCompareCol: { flex: 1 },
  mobileCompareLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, marginBottom: 2, letterSpacing: 0.3 },
  mobileCompareValue: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary },
  mobileCompareDivider: { width: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 8 },
  mobileCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  mobileCardDate: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  mobileActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, marginTop: 20 },
  emptyIconCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  tableCheckboxBtn: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  tableCheckboxHeader: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  tableRowSelected: { backgroundColor: '#F1F5F9', borderColor: COLORS.border },
  mobileCheckboxBtn: { marginRight: 4, padding: 2 },
  mobileCardSelected: { borderColor: COLORS.border, backgroundColor: '#F8FAFC' },
  bulkToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  bulkSelectAllBtn: { flexDirection: 'row', alignItems: 'center' },
  bulkSelectAllText: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  bulkActionButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthorityStackParamList } from '../../types/navigation';
import { authorityApi } from '../../api/authorityApi';
import { Complaint } from '../../types/complaint';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { DetectionOverlay } from '../../components/DetectionOverlay';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ComplaintStatusTimeline } from '../../components/ComplaintStatusTimeline';
import { Toast } from '../../components/Toast';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

type Props = NativeStackScreenProps<AuthorityStackParamList, 'AuthorityComplaintDetail'>;

export const AuthorityDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { complaintId } = route.params;
  const { isDesktop } = useBreakpoint();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);

  // Modals
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'success' });

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authorityApi.getComplaintById(complaintId);
      setComplaint(data);
    } catch (error) {
      console.error('Failed to load authority complaint details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);
  useFocusEffect(useCallback(() => { fetchDetail(); }, [fetchDetail]));

  const onRefresh = () => { setRefreshing(true); fetchDetail(); };

  const handleUpdateStatus = async (newStatus: 'In Progress' | 'Resolved') => {
    try {
      setActionLoading(true);
      const updated = await authorityApi.updateComplaintStatus(complaintId, newStatus);
      setComplaint(updated);
      setProgressModalVisible(false);
      setResolveModalVisible(false);
      setToast({ visible: true, message: `Complaint marked as ${newStatus}`, type: 'success' });
    } catch (error: any) {
      setProgressModalVisible(false);
      setResolveModalVisible(false);
      setToast({ visible: true, message: 'Unable to update status.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyComplaint = async () => {
    try {
      setActionLoading(true);
      const updated = await authorityApi.verifyComplaint(complaintId);
      setComplaint(updated);
      setToast({ visible: true, message: 'Incident verified.', type: 'success' });
    } catch (error: any) {
      setToast({ visible: true, message: error.message || 'Unable to verify.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteComplaint = async () => {
    try {
      setActionLoading(true);
      await authorityApi.deleteComplaint(complaintId);
      setDeleteModalVisible(false);
      setToast({ visible: true, message: 'Complaint purged.', type: 'info' });
      setTimeout(() => navigation.goBack(), 1200);
    } catch (error: any) {
      setToast({ visible: true, message: error.message || 'Unable to delete.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !refreshing) return <LoadingSpinner message="Loading municipal dossier..." />;
  if (!complaint) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Dossier</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Complaint not found.</Text>
      </View>
    </SafeAreaView>
  );

  const normStatus = (complaint.status || '').toLowerCase();
  const isInProgress = normStatus === 'in progress' || normStatus === 'in_progress';
  const isResolved = normStatus === 'resolved';

  const userRef = complaint.createdBy || complaint.citizenId;
  const citizenName = typeof userRef === 'object' && userRef ? (userRef as any).name || 'Citizen' : 'Citizen';
  const citizenEmail = typeof userRef === 'object' && userRef ? (userRef as any).email : null;
  const citizenPhone = typeof userRef === 'object' && userRef ? (userRef as any).phone : null;

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const complaintCode = complaint.complaintId || `#CIV${complaint._id.slice(-5).toUpperCase()}`;
  const isVerified = Boolean(complaint.verified);
  const priority = complaint.priority || 'medium';

  const formatCategory = (cat?: string) => {
    if (!cat) return 'Unspecified';
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const aiLabel = complaint.aiClass ? formatCategory(complaint.aiClass) : complaint.boundingBoxes && complaint.boundingBoxes.length > 0 ? formatCategory((complaint.boundingBoxes[0] as any).className || (complaint.boundingBoxes[0] as any).label) : 'No hazard identified';
  const citizenCategoryLabel = complaint.customCategory ? `${complaint.customCategory} (Custom)` : formatCategory(complaint.category);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Dossier</Text>
        <Badge label={complaint.status.toUpperCase()} variant={isResolved ? 'success' : isInProgress ? 'default' : 'warning'} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={isDesktop ? styles.desktopScrollContent : styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38BDF8']} />}>
        {isDesktop ? (
          <View style={styles.desktopContainer}>
            {/* Left Column */}
            <View style={styles.desktopLeftCol}>
              <DetectionOverlay imageUri={complaint.imageUrl} detections={complaint.boundingBoxes || []} confidence={complaint.aiConfidence} height={380} />
              
              <Card style={{ marginTop: 16 }}>
                <CardContent>
                  <View style={styles.metaHeaderRow}><Ionicons name="person-circle" size={20} color={COLORS.accent} /><Text style={styles.metaCardTitle}> Reporting Citizen</Text></View>
                  <Text style={styles.citizenNameText}>{citizenName}</Text>
                  {citizenEmail && <Text style={styles.citizenEmailText}>✉ {citizenEmail}</Text>}
                  {citizenPhone && <Text style={styles.citizenPhoneText}>📞 {citizenPhone}</Text>}
                </CardContent>
              </Card>

              <Card style={{ marginTop: 16 }}>
                <CardContent>
                  <View style={styles.metaHeaderRow}><Ionicons name="location" size={20} color={COLORS.primary} /><Text style={styles.metaCardTitle}> Geographic Verification</Text></View>
                  <Text style={styles.locationText}>{complaint.address || 'Address registered with device GPS sensor'}</Text>
                  {complaint.latitude && complaint.longitude && <Text style={styles.coordsText}>Lat: {complaint.latitude.toFixed(5)}, Long: {complaint.longitude.toFixed(5)}</Text>}
                </CardContent>
              </Card>

              <Card style={{ marginTop: 16 }}>
                <CardContent>
                  <View style={styles.metaHeaderRow}><Ionicons name="git-network-outline" size={18} color={COLORS.textSecondary} /><Text style={styles.metaCardTitle}> Resolution Progress</Text></View>
                  <ComplaintStatusTimeline status={complaint.status} createdAt={complaint.createdAt} updatedAt={complaint.updatedAt} resolvedAt={complaint.resolvedAt} />
                </CardContent>
              </Card>
            </View>

            {/* Right Column */}
            <View style={styles.desktopRightCol}>
              <View style={styles.topBadgeRow}>
                <Text style={styles.complaintCode}>{complaintCode}</Text>
                <Badge label={`${priority.toUpperCase()} PRIORITY`} variant={(priority === 'urgent' || priority === 'high') ? 'destructive' : 'secondary'} />
                <Badge label={isVerified ? 'VERIFIED' : 'UNVERIFIED'} variant={isVerified ? 'success' : 'warning'} icon={<Ionicons name={isVerified ? "shield-checkmark" : "shield-outline"} size={10} color="#FFF" />} />
                <Text style={styles.dateText}>Reported {formattedDate}</Text>
              </View>

              <Text style={styles.title}>{complaint.title}</Text>

              <Card style={{ marginBottom: 16, backgroundColor: '#F8FAFC' }}>
                <CardContent style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareLabel}>AI PREDICTED</Text>
                    <Text style={styles.compareVal}>{aiLabel}</Text>
                    <Text style={styles.compareSub}>{complaint.aiConfidence ? `${Math.round(complaint.aiConfidence * 100)}% Confidence` : 'YOLOv8'}</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 16 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareLabel}>CITIZEN REPORTED</Text>
                    <Text style={styles.compareVal}>{citizenCategoryLabel}</Text>
                    <Text style={styles.compareSub}>{complaint.customCategory ? 'Custom' : 'Standard'}</Text>
                  </View>
                </CardContent>
              </Card>

              <View style={styles.descBlock}>
                <Text style={styles.descLabel}>NARRATIVE</Text>
                <Text style={styles.descriptionText}>{complaint.description || 'No description provided.'}</Text>
              </View>

              <View style={styles.actionsSection}>
                <Text style={styles.actionsSectionHeader}>MUNICIPAL ACTION PIPELINE</Text>
                {!isVerified && <Button title="Verify Incident" onPress={handleVerifyComplaint} variant="secondary" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                {!isInProgress && !isResolved && <Button title="Mark In Progress" onPress={() => setProgressModalVisible(true)} variant="default" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                {isInProgress && <Button title="Mark Resolved" onPress={() => setResolveModalVisible(true)} variant="default" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                {isResolved && <Button title="Resolved ✓" onPress={() => {}} variant="outline" size="lg" disabled style={styles.actionBtn} />}
                <Button title="Purge Record" onPress={() => setDeleteModalVisible(true)} variant="destructive" style={{ marginTop: 12 }} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.mainWrapper}>
            <DetectionOverlay imageUri={complaint.imageUrl} detections={complaint.boundingBoxes || []} confidence={complaint.aiConfidence} height={270} />
            
            <View style={styles.mobileContentPadding}>
              <View style={styles.topBadgeRowMobile}>
                <Text style={styles.complaintCode}>{complaintCode}</Text>
                <Badge label={`${priority.toUpperCase()}`} variant={(priority === 'urgent' || priority === 'high') ? 'destructive' : 'secondary'} />
                <Badge label={isVerified ? 'VERIFIED' : 'UNVERIFIED'} variant={isVerified ? 'success' : 'warning'} />
              </View>

              <Text style={styles.title}>{complaint.title}</Text>
              
              <Card style={{ marginBottom: 16, backgroundColor: '#F8FAFC' }}>
                <CardContent style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareLabel}>AI PREDICTED</Text>
                    <Text style={styles.compareVal}>{aiLabel}</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareLabel}>CITIZEN REPORTED</Text>
                    <Text style={styles.compareVal}>{citizenCategoryLabel}</Text>
                  </View>
                </CardContent>
              </Card>

              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={COLORS.accent} style={{ marginRight: 8, marginTop: 2 }} />
                <View>
                  <Text style={styles.infoLabel}>Citizen Contact</Text>
                  <Text style={styles.infoValue}>{citizenName}</Text>
                  {citizenEmail && <Text style={styles.infoSubValue}>{citizenEmail}</Text>}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
                <View>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{complaint.address || 'GPS coordinates logged'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Description</Text>
                  <Text style={styles.infoValue} numberOfLines={expandedDesc ? undefined : 3}>{complaint.description || 'No description provided.'}</Text>
                  {complaint.description && complaint.description.length > 80 && (
                    <TouchableOpacity onPress={() => setExpandedDesc(!expandedDesc)}><Text style={styles.readMoreText}>{expandedDesc ? 'Show Less' : 'Read More'}</Text></TouchableOpacity>
                  )}
                </View>
              </View>

              <Card style={{ marginTop: 16 }}>
                <CardContent>
                  <Text style={styles.metaCardTitle}>Resolution Pipeline</Text>
                  <ComplaintStatusTimeline status={complaint.status} createdAt={complaint.createdAt} updatedAt={complaint.updatedAt} resolvedAt={complaint.resolvedAt} />
                </CardContent>
              </Card>

              <View style={styles.actionsSection}>
                {!isVerified && <Button title="Verify Incident" onPress={handleVerifyComplaint} variant="secondary" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                {!isInProgress && !isResolved && <Button title="Mark In Progress" onPress={() => setProgressModalVisible(true)} variant="default" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                {isInProgress && <Button title="Mark Resolved" onPress={() => setResolveModalVisible(true)} variant="default" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                {isResolved && <Button title="Resolved ✓" onPress={() => {}} variant="outline" size="lg" disabled style={styles.actionBtn} />}
                <Button title="Purge Record" onPress={() => setDeleteModalVisible(true)} variant="destructive" style={{ marginTop: 12 }} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <ConfirmationDialog visible={progressModalVisible} title="Mark In Progress" message={`Dispatch municipal team to inspect and resolve '${complaint.title}'?`} confirmText="Confirm Dispatch" confirmVariant="info" loading={actionLoading} onConfirm={() => handleUpdateStatus('In Progress')} onCancel={() => setProgressModalVisible(false)} />
      <ConfirmationDialog visible={resolveModalVisible} title="Certify Resolution" message={`Confirm that work is completed and civic issue '${complaint.title}' is remediated?`} confirmText="Confirm Resolution" confirmVariant="primary" loading={actionLoading} onConfirm={() => handleUpdateStatus('Resolved')} onCancel={() => setResolveModalVisible(false)} />
      <ConfirmationDialog visible={deleteModalVisible} title="Purge Complaint" message={`Permanently remove '${complaint.title}' from the civic database?`} confirmText="Purge Record" confirmVariant="danger" loading={actionLoading} onConfirm={handleDeleteComplaint} onCancel={() => setDeleteModalVisible(false)} />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast(prev => ({ ...prev, visible: false }))} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, backgroundColor: '#0F172A' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', flex: 1 },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },
  desktopScrollContent: { padding: 40, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  desktopContainer: { flexDirection: 'row', gap: 32 },
  desktopLeftCol: { flex: 1 },
  desktopRightCol: { flex: 1.2 },
  mainWrapper: { width: '100%', alignSelf: 'center' },
  mobileContentPadding: { padding: 16 },
  metaHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaCardTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  citizenNameText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  citizenEmailText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  citizenPhoneText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  locationText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  coordsText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  topBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  topBadgeRowMobile: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 12, flexWrap: 'wrap' },
  complaintCode: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginRight: 4 },
  dateText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 'auto' },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 20, letterSpacing: -0.5 },
  compareLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, marginBottom: 4 },
  compareVal: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  compareSub: { fontSize: 12, color: COLORS.textSecondary },
  descBlock: { marginBottom: 24 },
  descLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 8 },
  descriptionText: { fontSize: 15, lineHeight: 24, color: COLORS.textPrimary },
  infoRow: { flexDirection: 'row', marginBottom: 16 },
  infoLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  infoSubValue: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  readMoreText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  actionsSection: { marginTop: 24, padding: 20, backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm },
  actionsSectionHeader: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 16, textAlign: 'center' },
  actionBtn: { marginBottom: 12 },
});

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
import { CitizenStackParamList } from '../../types/navigation';
import { complaintApi } from '../../api/complaintApi';
import { Complaint } from '../../types/complaint';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { DetectionOverlay } from '../../components/DetectionOverlay';
import { Timeline } from '../../components/Timeline';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatusBadge } from '../../components/StatusBadge';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { formatDate } from '../../utils/date';

type Props = NativeStackScreenProps<CitizenStackParamList, 'ComplaintDetail'>;

export const ComplaintDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { complaintId } = route.params;
  const { isDesktop } = useBreakpoint();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await complaintApi.getComplaintById(complaintId);
      setComplaint(data);
    } catch (error) {
      console.error('Failed to load complaint details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [complaintId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Fetching live complaint dossier..." />;
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complaint Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Complaint record not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryLabel = complaint.customCategory
    ? `${complaint.customCategory} (Custom)`
    : (complaint.category || 'Issue')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

  const formattedDate = formatDate(complaint.createdAt, true);
  const complaintCode = complaint.complaintId || `#CIV${complaint._id.slice(-5).toUpperCase()}`;
  const priority = complaint.priority || 'medium';
  const isHighPriority = priority === 'urgent' || priority === 'high';
  const isVerified = Boolean(complaint.verified);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Dossier</Text>
        <View style={styles.headerRightBadges}>
          <StatusBadge status={complaint.status} size="sm" />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={isDesktop ? styles.desktopScrollContent : styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isDesktop ? (
          /* Desktop Two-Column Layout */
          <View style={styles.desktopContainer}>
            {/* Left Column: Visual Media & Geographic Pin */}
            <View style={styles.desktopLeftCol}>
              <DetectionOverlay
                imageUri={complaint.imageUrl}
                detections={complaint.boundingBoxes || []}
                confidence={complaint.aiConfidence}
                height={380}
              />

              {/* Location Card */}
              <View style={styles.metaCard}>
                <View style={styles.locationHeaderRow}>
                  <Ionicons name="location" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.metaCardTitle}>Incident Location</Text>
                </View>
                <Text style={styles.locationText}>{complaint.address || 'Address logged via device GPS sensor'}</Text>
                {complaint.latitude && complaint.longitude && (
                  <Text style={styles.gpsCoordsText}>
                    GPS: {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
                  </Text>
                )}
              </View>
            </View>

            {/* Right Column: Information Dossier & Status Timeline */}
            <View style={styles.desktopRightCol}>
              <View style={styles.infoCard}>
                <View style={styles.codeDateRow}>
                  <Text style={styles.complaintCode}>{complaintCode}</Text>

                  {/* Priority Pill */}
                  <View style={[styles.priorityPill, isHighPriority ? styles.priorityHigh : styles.priorityNormal]}>
                    <Ionicons name="flame" size={11} color={isHighPriority ? COLORS.error : COLORS.accentDark} style={{ marginRight: 3 }} />
                    <Text style={[styles.priorityPillText, isHighPriority ? styles.priorityHighText : styles.priorityNormalText]}>
                      {priority.toUpperCase()} PRIORITY
                    </Text>
                  </View>

                  {/* Verification Pill */}
                  <View style={[styles.verifyPill, isVerified ? styles.verifiedBg : styles.unverifiedBg]}>
                    <Ionicons
                      name={isVerified ? "shield-checkmark" : "shield-outline"}
                      size={11}
                      color={isVerified ? COLORS.successDark : COLORS.pendingDark}
                      style={{ marginRight: 3 }}
                    />
                    <Text style={[styles.verifyPillText, { color: isVerified ? COLORS.successDark : COLORS.pendingDark }]}>
                      {isVerified ? 'VERIFIED' : 'PENDING VERIFICATION'}
                    </Text>
                  </View>

                  <Text style={styles.dateText}>{formattedDate}</Text>
                </View>

                <Text style={styles.title}>{complaint.title}</Text>

                {/* Tags Row */}
                <View style={styles.tagRow}>
                  <View style={styles.categoryTag}>
                    <Ionicons name="construct-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 5 }} />
                    <Text style={styles.categoryTagText}>{categoryLabel}</Text>
                  </View>

                  {complaint.aiConfidence > 0 && (
                    <View style={styles.confidenceTag}>
                      <Ionicons name="sparkles" size={13} color={COLORS.primaryDark} style={{ marginRight: 5 }} />
                      <Text style={styles.confidenceTagText}>
                        AI Confidence: {Math.round(complaint.aiConfidence * 100)}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                <View style={styles.descBlock}>
                  <Text style={styles.descLabel}>CITIZEN REPORT DETAILS</Text>
                  <Text style={styles.descriptionText}>
                    {complaint.description || 'No additional details provided with this report.'}
                  </Text>
                </View>

                {/* Live Status Timeline */}
                <Timeline
                  status={complaint.status}
                  verified={complaint.verified}
                  createdAt={complaint.createdAt}
                  updatedAt={complaint.updatedAt}
                  resolvedAt={complaint.resolvedAt}
                />
              </View>
            </View>
          </View>
        ) : (
          /* Mobile Stacked Layout */
          <View style={styles.mainWrapper}>
            {/* Issue Photo & YOLO Bounding Box Overlay */}
            <DetectionOverlay
              imageUri={complaint.imageUrl}
              detections={complaint.boundingBoxes || []}
              confidence={complaint.aiConfidence}
              height={270}
            />

            {/* Details Card */}
            <View style={styles.infoCard}>
              <View style={styles.codeDateRowMobile}>
                <Text style={styles.complaintCode}>{complaintCode}</Text>
                
                {/* Priority Pill */}
                <View style={[styles.priorityPill, isHighPriority ? styles.priorityHigh : styles.priorityNormal]}>
                  <Ionicons name="flame" size={10} color={isHighPriority ? COLORS.error : COLORS.accentDark} style={{ marginRight: 3 }} />
                  <Text style={[styles.priorityPillText, isHighPriority ? styles.priorityHighText : styles.priorityNormalText]}>
                    {priority.toUpperCase()}
                  </Text>
                </View>

                {/* Verification Pill */}
                <View style={[styles.verifyPill, isVerified ? styles.verifiedBg : styles.unverifiedBg]}>
                  <Ionicons
                    name={isVerified ? "shield-checkmark" : "shield-outline"}
                    size={10}
                    color={isVerified ? COLORS.successDark : COLORS.pendingDark}
                    style={{ marginRight: 3 }}
                  />
                  <Text style={[styles.verifyPillText, { color: isVerified ? COLORS.successDark : COLORS.pendingDark }]}>
                    {isVerified ? 'VERIFIED' : 'PENDING'}
                  </Text>
                </View>

                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>

              <Text style={styles.title}>{complaint.title}</Text>

              {/* Tags */}
              <View style={styles.tagRow}>
                <View style={styles.categoryTag}>
                  <Ionicons name="construct-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.categoryTagText}>{categoryLabel}</Text>
                </View>

                {complaint.aiConfidence > 0 && (
                  <View style={styles.confidenceTag}>
                    <Ionicons name="sparkles" size={12} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
                    <Text style={styles.confidenceTagText}>
                      {Math.round(complaint.aiConfidence * 100)}% Confidence
                    </Text>
                  </View>
                )}
              </View>

              {/* Location Row */}
              <View style={styles.locationRow}>
                <Ionicons name="location" size={18} color={COLORS.primary} style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {complaint.address || 'Address logged with GPS'}
                </Text>
              </View>

              {/* Description */}
              <View style={styles.descBlock}>
                <Text
                  style={styles.descriptionText}
                  numberOfLines={expandedDesc ? undefined : 3}
                >
                  {complaint.description || 'No description provided by citizen.'}
                </Text>
                {complaint.description && complaint.description.length > 80 && (
                  <TouchableOpacity onPress={() => setExpandedDesc(!expandedDesc)} style={styles.readMoreBtn}>
                    <Text style={styles.readMoreText}>
                      {expandedDesc ? 'Show Less' : 'Read More Details'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Live Status Timeline */}
              <Timeline
                status={complaint.status}
                verified={complaint.verified}
                createdAt={complaint.createdAt}
                updatedAt={complaint.updatedAt}
                resolvedAt={complaint.resolvedAt}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  headerRightBadges: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  desktopScrollContent: {
    padding: 36,
    paddingBottom: 48,
  },
  desktopContainer: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'flex-start',
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  desktopLeftCol: {
    flex: 1.1,
  },
  desktopRightCol: {
    flex: 1.2,
  },
  metaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
  },
  gpsCoordsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  infoCard: {
    marginTop: 16,
  },
  codeDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  codeDateRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  complaintCode: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BORDER_RADIUS.xs,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
  },
  priorityHigh: {
    backgroundColor: COLORS.errorLight,
    borderColor: COLORS.errorBorder,
  },
  priorityNormal: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  priorityHighText: {
    color: COLORS.error,
  },
  priorityNormalText: {
    color: COLORS.accentDark,
  },
  verifyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
  },
  verifiedBg: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.successBorder,
  },
  unverifiedBg: {
    backgroundColor: COLORS.pendingLight,
    borderColor: COLORS.pendingBorder,
  },
  verifyPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  confidenceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.borderMaroon,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  confidenceTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  descBlock: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  descLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  readMoreBtn: {
    marginTop: 6,
  },
  readMoreText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: '600',
    marginTop: 10,
  },
});

import { RequestError } from '../../components/RequestError';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { complaintApi } from '../../api/complaintApi';
import { Complaint } from '../../types/complaint';
import { COLORS } from '../../theme/colors';
import { BORDER_RADIUS } from '../../theme/radius';
import { SHADOWS } from '../../theme/index';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { NotificationItem, NotificationData } from '../../components/NotificationItem';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/date';

export const NotificationsScreen = ({ navigation }: any) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true); setLoadError('');
      const res = await complaintApi.getMyComplaints();
      const sorted = [...(res.complaints || [])].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setComplaints(sorted);
    } catch (error) {
      setLoadError((error as Error).message || 'Please check your connection and retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  if (loadError) return <RequestError message={loadError} onRetry={fetchComplaints} />;

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  // Convert complaints into structured notification alerts
  const notifications: NotificationData[] = complaints.map((c) => {
    const normStatus = (c.status || '').toLowerCase();
    const formattedDate = formatDate(c.updatedAt || c.createdAt, true);
    const complaintCode = c.complaintId || `#CIV${c._id.slice(-5).toUpperCase()}`;

    if (normStatus === 'rejected') return { id: `rejected-${c._id}`, title: `Complaint rejected: ${c.title}`, message: 'The complaint is recorded as rejected.', timestamp: formattedDate, type: 'alert', complaintId: c._id };
    if (normStatus === 'resolved') {
      return {
        id: `notif-${c._id}-resolved`,
        title: `Your complaint ${complaintCode} has been Resolved`,
        message: `${c.title} is recorded as resolved.`,
        timestamp: formattedDate,
        type: 'resolved',
        complaintId: c._id};
    } else if (normStatus === 'in progress' || normStatus === 'in_progress') {
      return {
        id: `notif-${c._id}-inprogress`,
        title: `Your complaint ${complaintCode} is now In Progress`,
        message: `Status changed to in progress for: ${c.title}`,
        timestamp: formattedDate,
        type: 'in_progress',
        complaintId: c._id};
    } else {
      return {
        id: `notif-${c._id}-received`,
        title: `Complaint ${complaintCode} registered`,
        message: `Incident '${c.title}' is queued for municipal inspection.`,
        timestamp: formattedDate,
        type: 'received',
        complaintId: c._id};
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Screen Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerBar}>
        <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel="Back"
          style={styles.backBtn}
          onPress={() => navigation.navigate('CitizenDashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </Animated.View>

      <View style={styles.container}>
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <Animated.View entering={FadeIn.delay(200)} style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>
                When your reported civic issues are verified, scheduled, or resolved, updates will appear here.
              </Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(100 + index * 50)}>
              <NotificationItem
                item={item}
                onPress={() => {
                  if (item.complaintId) {
                    (navigation as any).navigate('ComplaintDetail', { complaintId: item.complaintId });
                  }
                }}
              />
            </Animated.View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background},
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.background},
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.md},
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary},
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundNeutral},
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 96},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['6xl']},
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs},
  emptySub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280}});

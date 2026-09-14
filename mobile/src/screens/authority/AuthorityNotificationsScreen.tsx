import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { authorityApi } from '../../api/authorityApi';
import { Complaint } from '../../types/complaint';
import { COLORS } from '../../theme/colors';
import { BORDER_RADIUS } from '../../theme/radius';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { NotificationItem, NotificationData } from '../../components/NotificationItem';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AuthorityNotificationsScreen = ({ navigation }: any) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authorityApi.getAllComplaints();
      const sorted = [...(res.complaints || [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setComplaints(sorted);
    } catch (error) {
      console.error('Failed to load authority notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading municipal alerts..." />;
  }

  const notifications: NotificationData[] = complaints.map((c) => {
    const normStatus = (c.status || '').toLowerCase();
    const formattedDate = new Date(c.createdAt).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const citizenObj = c.createdBy || c.citizenId;
    const citizenName =
      typeof citizenObj === 'object' && citizenObj ? (citizenObj as any).name || 'Citizen' : 'Citizen';
      
    const priority = c.priority || 'medium';
    const isUrgent = priority === 'urgent' || priority === 'high';

    if (normStatus === 'pending') {
      return {
        id: `auth-notif-${c._id}`,
        title: isUrgent ? `URGENT Report: ${c.title}` : `New Report: ${c.title}`,
        message: `Submitted by ${citizenName} at ${c.address || 'location recorded'}. Requires review.`,
        timestamp: formattedDate,
        type: isUrgent ? 'alert' : 'system',
        isRead: false,
        complaintId: c._id,
      };
    } else if (normStatus.includes('progress')) {
      return {
        id: `auth-notif-${c._id}`,
        title: `Work in Progress: ${c.title}`,
        message: `Field team remediation underway.`,
        timestamp: formattedDate,
        type: 'in_progress',
        isRead: true,
        complaintId: c._id,
      };
    } else {
      return {
        id: `auth-notif-${c._id}`,
        title: `Issue Resolved: ${c.title}`,
        message: `Complaint verified and closed.`,
        timestamp: formattedDate,
        type: 'resolved',
        isRead: true,
        complaintId: c._id,
      };
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Screen Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('AuthorityDashboard')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Feed</Text>
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
            <Animated.View entering={ZoomIn.delay(200)} style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={44} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No incident alerts</Text>
              <Text style={styles.emptySub}>
                Incoming citizen submissions and status changes will be listed here.
              </Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(100 + index * 40)} layout={Layout.springify()}>
              <NotificationItem
                item={item}
                onPress={() => {
                  if (item.complaintId) {
                    navigation.navigate('AuthorityComplaintDetail', {
                      complaintId: item.complaintId,
                    });
                  }
                }}
              />
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: '#0F172A',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
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
    backgroundColor: COLORS.backgroundNeutral,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['5xl'],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['6xl'],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});

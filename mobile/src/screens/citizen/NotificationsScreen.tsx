import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { complaintApi } from '../../api/complaintApi';
import { Complaint } from '../../types/complaint';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
import { NotificationItem, NotificationData } from '../../components/NotificationItem';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/date';

export const NotificationsScreen = ({ navigation }: any) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintApi.getMyComplaints();
      const sorted = [...(res.complaints || [])].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setComplaints(sorted);
    } catch (error) {
      console.error('Failed to load notifications:', error);
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

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  // Convert complaints into structured notification alerts
  const notifications: NotificationData[] = complaints.map((c) => {
    const normStatus = (c.status || '').toLowerCase();
    const formattedDate = formatDate(c.updatedAt || c.createdAt, true);
    const complaintCode = c.complaintId || `#CIV${c._id.slice(-5).toUpperCase()}`;

    if (normStatus === 'resolved') {
      return {
        id: `notif-${c._id}-resolved`,
        title: `Your complaint ${complaintCode} has been Resolved`,
        message: `${c.title} has been successfully certified and resolved by municipal maintenance.`,
        timestamp: formattedDate,
        type: 'resolved',
        isRead: true,
        complaintId: c._id,
      };
    } else if (normStatus === 'in progress' || normStatus === 'in_progress') {
      return {
        id: `notif-${c._id}-inprogress`,
        title: `Your complaint ${complaintCode} is now In Progress`,
        message: `Field inspection and remediation crew dispatched for: ${c.title}`,
        timestamp: formattedDate,
        type: 'in_progress',
        isRead: false,
        complaintId: c._id,
      };
    } else {
      return {
        id: `notif-${c._id}-received`,
        title: `Complaint ${complaintCode} registered`,
        message: `Incident '${c.title}' is queued for municipal inspection.`,
        timestamp: formattedDate,
        type: 'received',
        isRead: true,
        complaintId: c._id,
      };
    }
  });

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
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

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
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>
                When your reported civic issues are verified, scheduled, or resolved, updates will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={() => {
                if (item.complaintId) {
                  (navigation as any).navigate('ComplaintDetail', { complaintId: item.complaintId });
                }
              }}
            />
          )}
        />
      </View>
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
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});

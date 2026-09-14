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
import { Ionicons } from '@expo/vector-icons';
import { authorityApi } from '../../api/authorityApi';
import { Complaint } from '../../types/complaint';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
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

    if (normStatus === 'pending') {
      return {
        id: `auth-notif-${c._id}`,
        title: `New Report: ${c.title}`,
        message: `Submitted by ${citizenName} at ${c.address || 'location recorded'}. Requires review.`,
        timestamp: formattedDate,
        type: 'alert',
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.authorityPrimary} />

      {/* Screen Header */}
      <View style={styles.headerBar}>
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
              <Text style={styles.emptyTitle}>No incident alerts</Text>
              <Text style={styles.emptySub}>
                Incoming citizen submissions and status changes will be listed here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
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
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.authorityPrimary,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: COLORS.authorityPrimary,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
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
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});

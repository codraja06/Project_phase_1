import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/authApi';
import { Input, PasswordInput } from '../../components/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export const ProfileScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();
  const { user, logout, updateUser } = useAuth();

  // Modals
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [notifSettingsVisible, setNotifSettingsVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Edit Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Notification Preferences State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      setUpdatingProfile(true);
      const updated = await authApi.updateProfile({ name, phone });
      updateUser(updated);
      setEditProfileVisible(false);
      Alert.alert('Profile Updated', 'Your profile details have been successfully saved.');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Failed to update profile details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Validation Error', 'Please enter both current and new passwords.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters.');
      return;
    }
    try {
      setUpdatingPassword(true);
      await authApi.changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setChangePasswordVisible(false);
      Alert.alert('Security Update', 'Your password has been changed successfully.');
    } catch (error: any) {
      Alert.alert('Password Change Failed', error.message || 'Incorrect current password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'CivicTrack Support & Helpline',
      'City Civic Care Helpline: 1800-CIVIC-CARE\nEmergency Triage: 112\nEmail: citizen-support@civictrack.city.gov\nAvailable Mon-Sat 8:00 AM - 8:00 PM'
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About CivicTrack',
      'CivicTrack v2.0.0\nAI-Powered Civic Issue Detection and Smart Complaint Management System.\nEmpowering citizens with YOLOv8 Computer Vision & direct municipal triage integration.'
    );
  };

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'CT';

  const menuSections = [
    {
      title: 'Account & Security',
      items: [
        {
          icon: 'create-outline' as const,
          iconBg: COLORS.primaryLight,
          iconColor: COLORS.primary,
          label: 'Edit Profile Information',
          sub: 'Update display name & contact number',
          onPress: () => {
            setName(user?.name || '');
            setPhone(user?.phone || '');
            setEditProfileVisible(true);
          },
        },
        {
          icon: 'lock-closed-outline' as const,
          iconBg: COLORS.primaryLight,
          iconColor: COLORS.primary,
          label: 'Password & Security',
          sub: 'Change password and secure login',
          onPress: () => setChangePasswordVisible(true),
        },
        {
          icon: 'notifications-outline' as const,
          iconBg: '#FEFCE8', // Yellow tint
          iconColor: COLORS.warning,
          label: 'Notification Preferences',
          sub: 'Manage push, email & SMS alerts',
          onPress: () => setNotifSettingsVisible(true),
        },
      ],
    },
    {
      title: 'Support & Info',
      items: [
        {
          icon: 'call-outline' as const,
          iconBg: COLORS.borderLight,
          iconColor: COLORS.textSecondary,
          label: 'City Hotline & Support',
          sub: '1800-CIVIC-CARE • 8AM - 8PM',
          onPress: handleHelpSupport,
        },
        {
          icon: 'information-circle-outline' as const,
          iconBg: COLORS.borderLight,
          iconColor: COLORS.textSecondary,
          label: 'About CivicTrack Platform',
          sub: 'Version 2.0.0 • AI-Driven Civic Tech',
          onPress: handleAbout,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={isDesktop ? styles.desktopContent : styles.mobileContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={isDesktop ? styles.desktopHeader : styles.mobileHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('CitizenDashboard')}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
        </View>

        {/* ── Compact Profile Header ──────────────────────────────────────────── */}
        <Card style={styles.profileHeaderCard}>
          <CardContent style={isDesktop ? styles.profileHeaderDesktop : styles.profileHeaderMobile}>
            <View style={styles.profileHeaderLeft}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{userInitials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'CivicTrack Citizen'}</Text>
                <View style={styles.badgeRow}>
                  <Badge label="VERIFIED CITIZEN" variant="outline" icon={<Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />} />
                  <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>
                <Text style={styles.profileLocality}>Ward 14 / Civic Zone</Text>
              </View>
            </View>
            <Button
              title="Edit Profile"
              variant="secondary"
              onPress={() => {
                setName(user?.name || '');
                setPhone(user?.phone || '');
                setEditProfileVisible(true);
              }}
              icon={<Ionicons name="create-outline" size={16} color={COLORS.textPrimary} />}
              style={isDesktop ? {} : { width: '100%' }}
            />
          </CardContent>
        </Card>

        {/* ── Compact Stat Cards ──────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Reports', value: '12', color: COLORS.primary },
            { label: 'Pending', value: '3', color: COLORS.pending },
            { label: 'In Progress', value: '1', color: COLORS.accent },
            { label: 'Resolved', value: '8', color: COLORS.resolved },
          ].map((stat, i) => (
            <Card key={i} style={isDesktop ? styles.statCardDesktop : styles.statCard}>
              <CardContent style={styles.statCardContent}>
                <Text numberOfLines={1} style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* ── Menu Sections ─────────────────────────────────────────────────── */}
        <View style={isDesktop ? styles.desktopMenuGrid : {}}>
          {menuSections.map((section) => (
            <View key={section.title} style={isDesktop ? styles.menuCol : { marginBottom: 24 }}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              <Card>
                <View style={{ paddingVertical: 8 }}>
                  {section.items.map((item, idx) => (
                    <View key={item.label}>
                      <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                        <View style={styles.menuLeft}>
                          <View style={[styles.menuIconBadge, { backgroundColor: item.iconBg }]}>
                            <Ionicons name={item.icon} size={18} color={item.iconColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Text style={styles.menuSub}>{item.sub}</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={COLORS.borderStrong} />
                      </TouchableOpacity>
                      {idx < section.items.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Danger Zone</Text>
        <Card style={{ borderColor: COLORS.errorBorder }}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setLogoutModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBadge, { backgroundColor: COLORS.errorLight }]}>
                <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: COLORS.error }]}>Sign Out</Text>
                <Text style={styles.menuSub}>End active citizen session</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.footerVersion}>CivicTrack v2.0.0 • AI-Powered Civic Management</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Full Display Name"
              value={name}
              onChangeText={setName}
              leftIcon="person-outline"
            />

            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              placeholder="+91 98765 43210"
            />

            <Button
              title="Save Changes"
              onPress={handleUpdateProfile}
              loading={updatingProfile}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={changePasswordVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Security Password</Text>
              <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <PasswordInput
              label="Current Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter current password"
            />

            <PasswordInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min 6 chars)"
              helperText="Must be at least 6 characters"
            />

            <Button
              title="Update Password"
              onPress={handleChangePassword}
              loading={updatingPassword}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>

      {/* Notification Preferences Modal */}
      <Modal visible={notifSettingsVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setNotifSettingsVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Push Notifications</Text>
                <Text style={styles.toggleSubtitle}>Instant alerts when status changes</Text>
              </View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: COLORS.borderStrong, true: COLORS.primary }} />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Email Digest</Text>
                <Text style={styles.toggleSubtitle}>Weekly municipal resolution summaries</Text>
              </View>
              <Switch value={emailAlertsEnabled} onValueChange={setEmailAlertsEnabled} trackColor={{ false: COLORS.borderStrong, true: COLORS.primary }} />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>SMS Priority Updates</Text>
                <Text style={styles.toggleSubtitle}>Direct SMS notifications for emergency hazards</Text>
              </View>
              <Switch value={smsAlertsEnabled} onValueChange={setSmsAlertsEnabled} trackColor={{ false: COLORS.borderStrong, true: COLORS.primary }} />
            </View>

            <Button
              title="Save Preferences"
              onPress={() => setNotifSettingsVisible(false)}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        visible={logoutModalVisible}
        title="Sign Out of CivicTrack"
        message="Are you sure you want to end your active session? You will be prompted to sign in when you reopen the app."
        confirmText="Sign Out"
        confirmVariant="danger"
        icon="log-out-outline"
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await logout();
        }}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  desktopContent: { padding: 40, maxWidth: 900, alignSelf: 'center', width: '100%' },
  mobileContent: { padding: 16, paddingBottom: 40 },
  desktopHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  mobileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight, marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  profileHeaderCard: { marginBottom: 24 },
  profileHeaderDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
  profileHeaderMobile: { flexDirection: 'column', padding: 20 },
  profileHeaderLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: Platform.OS === 'web' ? 0 : 16 },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  profileLocality: { fontSize: 13, color: COLORS.textMuted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  statCard: {
    flexBasis: Platform.OS === 'web' ? ('calc(50% - 6px)' as any) : '47%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 120,
    padding: 0,
  },
  statCardDesktop: {
    flexBasis: Platform.OS === 'web' ? ('calc(25% - 9px)' as any) : '22%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 120,
    padding: 0,
  },
  statCardContent: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  desktopMenuGrid: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  menuCol: { flex: 1 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}) },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  menuSub: { fontSize: 12, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 16 },
  footerVersion: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 32, marginBottom: 8, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 440, backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.lg, padding: 24, ...SHADOWS.floating },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  toggleSubtitle: { fontSize: 12, color: COLORS.textSecondary },
});

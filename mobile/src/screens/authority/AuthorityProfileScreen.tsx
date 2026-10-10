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
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/authApi';
import { Input, PasswordInput } from '../../components/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { COLORS } from '../../theme/colors';
import { BORDER_RADIUS } from '../../theme/radius';
import { SHADOWS } from '../../theme/index';
import { SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useMobileMenu } from '../../contexts/MobileMenuContext';
import { AuthorityMobileHeader } from '../../components/AuthorityMobileHeader';

export const AuthorityProfileScreen = ({ navigation }: any) => {
  const { toggleMenu } = useMobileMenu();
  const { isDesktop } = useBreakpoint();
  const { user, logout, updateUser } = useAuth();

  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      setUpdatingProfile(true);
      const updated = await authApi.updateProfile({ name, phone });
      updateUser(updated);
      setEditProfileVisible(false);
      Alert.alert('Officer Profile Updated', 'Department contact info updated.');
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Failed to update details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Validation Error', 'Please enter current and new passwords.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }
    try {
      setUpdatingPassword(true);
      await authApi.changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setChangePasswordVisible(false);
      Alert.alert('Security Update', 'Officer password changed successfully.');
    } catch (error: any) {
      Alert.alert('Password Change Failed', error.message || 'Incorrect current password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDispatchSupport = () => {
    Alert.alert(
      'Municipal Operations Dispatch',
      'Central Dispatch Desk: 1800-CITY-OPS\nInternal Ext: #4402\nIT & Model Monitoring: it-support@city.gov'
    );
  };

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'MO';

  const menuSections = [
    {
      title: 'Officer Credentials',
      items: [
        {
          icon: 'create-outline' as const,
          iconBg: COLORS.primaryLight,
          iconColor: COLORS.primary,
          label: 'Edit Officer Information',
          sub: 'Update department name & contact details',
          onPress: () => {
            setName(user?.name || '');
            setPhone(user?.phone || '');
            setEditProfileVisible(true);
          },
        },
        {
          icon: 'lock-closed-outline' as const,
          iconBg: COLORS.secondaryLight,
          iconColor: COLORS.secondary,
          label: 'Security Credentials',
          sub: 'Change officer authentication password',
          onPress: () => setChangePasswordVisible(true),
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          icon: 'call-outline' as const,
          iconBg: COLORS.backgroundNeutral,
          iconColor: COLORS.textSecondary,
          label: 'Operations Dispatch Desk',
          sub: '1800-CITY-OPS • Internal Ext: #4402',
          onPress: handleDispatchSupport,
        },
        {
          icon: 'analytics-outline' as const,
          iconBg: COLORS.primaryLight,
          iconColor: COLORS.primary,
          label: 'Analytics & Reporting',
          sub: 'Ward performance metrics and trend analysis',
          onPress: () => navigation.navigate('AuthorityAnalytics'),
        },
        {
          icon: 'map-outline' as const,
          iconBg: COLORS.secondaryLight,
          iconColor: COLORS.secondary,
          label: 'Geo-Incident Map',
          sub: 'Live GPS cluster heatmap of civic incidents',
          onPress: () => navigation.navigate('AuthorityMap'),
        },
      ],
    },
  ];

  return (
    <View style={isDesktop ? styles.safeArea : styles.safeAreaMobile}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" translucent={false} />

      {!isDesktop && (
        <AuthorityMobileHeader title="Officer Dossier" />
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={isDesktop ? styles.desktopContent : styles.mobileContent}
        showsVerticalScrollIndicator={false}
      >
        {isDesktop && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.desktopHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={toggleMenu}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Officer Dossier</Text>
          </Animated.View>
        )}

        {/* ── Compact Profile Header ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={styles.profileHeaderCard}>
            <CardContent style={isDesktop ? styles.profileHeaderDesktop : styles.profileHeaderMobile}>
              <View style={[styles.profileHeaderLeft, !isDesktop && { marginBottom: SPACING.lg }]}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user?.name || 'Municipal Officer'}</Text>
                  <View style={styles.badgeRow}>
                    <Badge label="MUNICIPAL AUTHORITY" variant="default" icon={<Ionicons name="shield-checkmark" size={10} color="#FFF" />} />
                    <Text style={styles.profileEmail}>{user?.email || 'officer@city.gov'}</Text>
                  </View>
                  <Text style={styles.profileLocality}>Department of Operations</Text>
                </View>
              </View>
              <Button
                title="Edit Dossier"
                variant="outline"
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
        </Animated.View>

        {/* ── Compact Stat Cards ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.statsGrid}>
          {[
            { label: 'Queue', value: '24', color: '#0F172A' },
            { label: 'Pending', value: '14', color: COLORS.pending },
            { label: 'Resolved', value: '8', color: COLORS.resolved },
            { label: 'High Priority', value: '2', color: COLORS.error },
          ].map((stat, i) => (
            <Card key={i} style={isDesktop ? styles.statCardDesktop : styles.statCard}>
              <CardContent style={styles.statCardContent}>
                <Text numberOfLines={1} style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
              </CardContent>
            </Card>
          ))}
        </Animated.View>

        {/* ── Menu Sections ─────────────────────────────────────────────────── */}
        <View style={isDesktop ? styles.desktopMenuGrid : {}}>
          {menuSections.map((section, sectionIdx) => (
            <Animated.View entering={FadeInUp.delay(300 + sectionIdx * 100)} key={section.title} style={isDesktop ? styles.menuCol : { marginBottom: SPACING.xl }}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              <Card>
                <View style={{ paddingVertical: SPACING.sm }}>
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
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(500)}>
          <Text style={styles.sectionHeader}>Session</Text>
          <Card style={{ borderColor: COLORS.errorBorder }}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setLogoutModalVisible(true)} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIconBadge, { backgroundColor: COLORS.errorLight }]}>
                  <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: COLORS.error }]}>End Operations Session</Text>
                  <Text style={styles.menuSub}>Sign out of municipal command portal</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.error} />
            </TouchableOpacity>
          </Card>

          <Text style={styles.footerVersion}>CivicTrack v2.0.0 • Operations Portal</Text>
        </Animated.View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Officer Details</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Officer Name"
              value={name}
              onChangeText={setName}
              leftIcon="person-outline"
            />
            <Input
              label="Department Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <Button
              title="Save Officer Details"
              onPress={handleUpdateProfile}
              variant="default"
              size="lg"
              loading={updatingProfile}
              style={{ marginTop: SPACING.sm }}
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
              label="Current Officer Password"
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <PasswordInput
              label="New Security Password"
              value={newPassword}
              onChangeText={setNewPassword}
              helperText="Minimum 6 characters"
            />

            <Button
              title="Update Credentials"
              onPress={handleChangePassword}
              variant="default"
              size="lg"
              loading={updatingPassword}
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        visible={logoutModalVisible}
        title="Sign Out of Operations"
        message="Are you sure you want to end your municipal operations session?"
        confirmText="Sign Out"
        confirmVariant="danger"
        icon="log-out-outline"
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await logout();
        }}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  safeAreaMobile: { flex: 1, backgroundColor: COLORS.backgroundNeutral },
  container: { flex: 1, backgroundColor: COLORS.backgroundNeutral },
  desktopContent: { padding: SPACING['5xl'], maxWidth: 900, alignSelf: 'center', width: '100%' },
  mobileContent: { padding: SPACING.lg, paddingBottom: SPACING['5xl'] },
  desktopHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING['4xl'], backgroundColor: '#0F172A', padding: SPACING.xl, borderRadius: BORDER_RADIUS.lg, ...SHADOWS.card },
  backBtn: { width: 38, height: 38, borderRadius: BORDER_RADIUS.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', marginRight: SPACING.md },
  headerTitle: { ...TYPOGRAPHY.h3, color: '#FFFFFF' },
  profileHeaderCard: { marginBottom: SPACING.xl },
  profileHeaderDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.xl },
  profileHeaderMobile: { flexDirection: 'column', padding: SPACING.lg },
  profileHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.lg },
  avatarText: { ...TYPOGRAPHY.h3, color: '#FFFFFF' },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4, flexWrap: 'wrap' },
  profileEmail: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '500' },
  profileLocality: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING['3xl'] },
  statCard: {
    flexBasis: Platform.OS === 'web' ? ('calc(50% - 6px)' as any) : '47%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 100,
    padding: 0,
  },
  statCardDesktop: {
    flexBasis: Platform.OS === 'web' ? ('calc(25% - 9px)' as any) : '22%',
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 120,
    padding: 0,
  },
  statCardContent: { padding: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  statValue: { ...TYPOGRAPHY.h3, marginBottom: 4 },
  statLabel: { ...TYPOGRAPHY.overline, color: COLORS.textMuted },
  desktopMenuGrid: { flexDirection: 'row', gap: SPACING['3xl'], marginBottom: SPACING['3xl'] },
  menuCol: { flex: 1 },
  sectionHeader: { ...TYPOGRAPHY.overline, color: COLORS.textMuted, marginBottom: SPACING.md, paddingHorizontal: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}) },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconBadge: { width: 36, height: 36, borderRadius: BORDER_RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  menuLabel: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  menuSub: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: SPACING.lg },
  footerVersion: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING['4xl'], marginBottom: SPACING.lg, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalContent: { width: '100%', maxWidth: 440, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, ...SHADOWS.floating },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
});

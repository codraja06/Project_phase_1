import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { authorityLoginSchema, AuthorityLoginForm } from '../../validation/schemas';
import { useAuth } from '../../hooks/useAuth';
import { Input, PasswordInput } from '../../components/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type Props = NativeStackScreenProps<AuthStackParamList, 'AuthorityLogin'>;

export const AuthorityLoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, loginWithGoogle, savedSession, resumeSavedSession, clearSavedSession } = useAuth();
  const { isDesktop } = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AuthorityLoginForm>({
    resolver: zodResolver(authorityLoginSchema),
    defaultValues: {
      email: savedSession?.user?.email || '',
      password: '',
    },
  });

  useEffect(() => {
    if (savedSession?.user?.email && (savedSession.user.role || '').toLowerCase() === 'authority') {
      setValue('email', savedSession.user.email);
    }
  }, [savedSession, setValue]);

  const onSubmit = async (data: AuthorityLoginForm) => {
    try {
      setErrorMessage(null);
      setLoading(true);
      await login(data, 'authority');
    } catch (error: any) {
      setErrorMessage(
        error.message || 'Municipal authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = async () => {
    try {
      setErrorMessage(null);
      setResumeLoading(true);
      await resumeSavedSession('authority');
    } catch (error: any) {
      setErrorMessage(error.message || 'Saved officer session expired. Please enter password.');
    } finally {
      setResumeLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage(null);
      setGoogleLoading(true);
      await loginWithGoogle('authority');
    } catch (error: any) {
      if (error.message && error.message.includes('cancelled')) {
        return;
      }
      setErrorMessage(
        error.message || 'Google officer authentication failed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillDemoOfficer = () => {
    setValue('email', 'officer@city.gov');
    setValue('password', 'password123');
    setErrorMessage(null);
  };

  const isOfficerSaved = savedSession?.user && (savedSession.user.role || '').toLowerCase() === 'authority';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isDesktop ? (
          <View style={styles.desktopContainer}>
            {/* Left Branding Side */}
            <View style={styles.brandingSide}>
              <View style={styles.brandingContent}>
                <Ionicons name="shield-checkmark" size={64} color={COLORS.primary} style={styles.brandingIcon} />
                <Text style={styles.brandingTitle}>Municipal Operations Command</Text>
                <Text style={styles.brandingSubtitle}>
                  Access jurisdictional triage, automated defect verification, and field dispatch workflows.
                </Text>
              </View>
              <View style={styles.brandingFooter}>
                <Text style={styles.brandingFooterText}>Secure 256-Bit TLS Connection • CivicTrack v2.0</Text>
              </View>
            </View>

            {/* Right Auth Side */}
            <ScrollView contentContainerStyle={styles.authSide}>
              <View style={styles.authWrapper}>
                <TouchableOpacity
                  style={styles.backBtnDesktop}
                  onPress={() => navigation.navigate('CitizenLogin')}
                >
                  <Ionicons name="chevron-back" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.backBtnTextDesktop}>Back to Citizen Portal</Text>
                </TouchableOpacity>

                <Text style={styles.authTitle}>Officer Sign In</Text>
                <Text style={styles.authSubtitle}>Authenticate to access the command center.</Text>

                {errorMessage && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                  </View>
                )}

                {isOfficerSaved && (
                  <Card style={styles.savedSessionCard}>
                    <CardContent style={styles.savedSessionContent}>
                      <View style={styles.savedAvatar}>
                        <Ionicons name="shield" size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.savedGreeting}>Remembered Officer Session</Text>
                        <Text style={styles.savedName} numberOfLines={1}>{savedSession.user.name || 'Municipal Officer'}</Text>
                        <Text style={styles.savedEmail} numberOfLines={1}>{savedSession.user.email}</Text>
                      </View>
                    </CardContent>
                    <View style={{ padding: 16, paddingTop: 0 }}>
                      <Button title={`Resume Officer Session`} onPress={handleResumeSession} loading={resumeLoading || loading} variant="default" style={{ marginBottom: 8 }} />
                      <Button title="Use another credential" onPress={clearSavedSession} variant="ghost" />
                    </View>
                  </Card>
                )}

                <Card>
                  <CardContent>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          label="Department Official Email"
                          placeholder="officer@city.gov"
                          value={value}
                          onChangeText={(text) => { onChange(text); if (errorMessage) setErrorMessage(null); }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          leftIcon="mail-outline"
                          error={errors.email?.message}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, value } }) => (
                        <PasswordInput
                          label="Officer Security Password"
                          placeholder="Enter security password"
                          value={value}
                          onChangeText={(text) => { onChange(text); if (errorMessage) setErrorMessage(null); }}
                          error={errors.password?.message}
                        />
                      )}
                    />

                    <Button title="Authenticate as Officer" onPress={handleSubmit(onSubmit)} loading={loading} variant="default" size="lg" style={{ marginTop: 8 }} />

                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <Button title="Continue with Google" onPress={handleGoogleLogin} loading={googleLoading || loading} variant="outline" size="lg" icon={<Ionicons name="logo-google" size={18} color="#EA4335" />} />
                  </CardContent>
                </Card>

                <TouchableOpacity onPress={fillDemoOfficer} style={styles.demoPillDesktop}>
                  <Ionicons name="flash" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.demoPillTextDesktop}>Auto-fill Demo Officer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.mobileContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mobileHeader}>
              <TouchableOpacity
                style={styles.backBtnMobile}
                onPress={() => navigation.navigate('CitizenLogin')}
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                <Text style={styles.backBtnTextMobile}>Citizen Portal</Text>
              </TouchableOpacity>

              <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} style={{ marginBottom: 16 }} />
              <Text style={styles.mobileTitle}>Operations Command</Text>
              <Text style={styles.mobileSubtitle}>Municipal authentication required.</Text>
            </View>

            <View style={styles.mobileBody}>
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {isOfficerSaved && (
                <Card style={styles.savedSessionCard}>
                  <CardContent style={styles.savedSessionContent}>
                    <View style={styles.savedAvatar}>
                      <Ionicons name="shield" size={20} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.savedGreeting}>Remembered Officer Session</Text>
                      <Text style={styles.savedName} numberOfLines={1}>{savedSession.user.name || 'Municipal Officer'}</Text>
                      <Text style={styles.savedEmail} numberOfLines={1}>{savedSession.user.email}</Text>
                    </View>
                  </CardContent>
                  <View style={{ padding: 16, paddingTop: 0 }}>
                    <Button title={`Resume Officer Session`} onPress={handleResumeSession} loading={resumeLoading || loading} variant="default" style={{ marginBottom: 8 }} />
                    <Button title="Use another credential" onPress={clearSavedSession} variant="ghost" />
                  </View>
                </Card>
              )}

              <Card>
                <CardContent>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Department Official Email"
                        placeholder="officer@city.gov"
                        value={value}
                        onChangeText={(text) => { onChange(text); if (errorMessage) setErrorMessage(null); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        leftIcon="mail-outline"
                        error={errors.email?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                      <PasswordInput
                        label="Officer Security Password"
                        placeholder="Enter security password"
                        value={value}
                        onChangeText={(text) => { onChange(text); if (errorMessage) setErrorMessage(null); }}
                        error={errors.password?.message}
                      />
                    )}
                  />

                  <Button title="Authenticate as Officer" onPress={handleSubmit(onSubmit)} loading={loading} variant="default" size="lg" style={{ marginTop: 8 }} />
                  
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Button title="Continue with Google" onPress={handleGoogleLogin} loading={googleLoading || loading} variant="outline" size="lg" icon={<Ionicons name="logo-google" size={18} color="#EA4335" />} />
                </CardContent>
              </Card>

              <TouchableOpacity onPress={fillDemoOfficer} style={styles.demoPillDesktop}>
                <Ionicons name="flash" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.demoPillTextDesktop}>Auto-fill Demo Officer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  // Desktop
  desktopContainer: { flex: 1, flexDirection: 'row' },
  brandingSide: { flex: 1.2, backgroundColor: '#0F172A', padding: 60, justifyContent: 'space-between' },
  brandingContent: { flex: 1, justifyContent: 'center' },
  brandingIcon: { marginBottom: 32 },
  brandingTitle: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, marginBottom: 16 },
  brandingSubtitle: { fontSize: 18, color: '#94A3B8', lineHeight: 28, maxWidth: 480 },
  brandingFooter: {},
  brandingFooterText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  authSide: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  authWrapper: { width: '100%', maxWidth: 460, paddingHorizontal: 24, paddingVertical: 40 },
  backBtnDesktop: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, alignSelf: 'flex-start' },
  backBtnTextDesktop: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginLeft: 4 },
  authTitle: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  authSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 32 },
  
  // Mobile
  mobileContainer: { flexGrow: 1, backgroundColor: '#F8FAFC' },
  mobileHeader: { backgroundColor: '#0F172A', padding: 24, paddingTop: Platform.OS === 'ios' ? 24 : 40, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  backBtnMobile: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  backBtnTextMobile: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  mobileTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 8 },
  mobileSubtitle: { fontSize: 14, color: '#94A3B8' },
  mobileBody: { padding: 20, marginTop: -20 },

  // Shared
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.errorLight, padding: 12, borderRadius: BORDER_RADIUS.md, marginBottom: 16, borderWidth: 1, borderColor: COLORS.errorBorder },
  errorBannerText: { color: COLORS.errorDark, fontSize: 13, flex: 1, fontWeight: '600' },
  savedSessionCard: { backgroundColor: '#F8FAFC', borderColor: COLORS.borderLight, marginBottom: 24 },
  savedSessionContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  savedAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  savedGreeting: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  savedName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  savedEmail: { fontSize: 12, color: COLORS.textSecondary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
  dividerText: { marginHorizontal: 12, color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  demoPillDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight, padding: 10, borderRadius: BORDER_RADIUS.md, marginTop: 24 },
  demoPillTextDesktop: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});

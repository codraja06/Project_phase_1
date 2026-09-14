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
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { citizenLoginSchema, CitizenLoginForm } from '../../validation/schemas';
import { useAuth } from '../../hooks/useAuth';
import { Input, PasswordInput } from '../../components/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { CivicTrackLogo } from '../../components/CivicTrackLogo';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type Props = NativeStackScreenProps<AuthStackParamList, 'CitizenLogin'>;

export const CitizenLoginScreen: React.FC<Props> = ({ navigation }) => {
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
  } = useForm<CitizenLoginForm>({
    resolver: zodResolver(citizenLoginSchema),
    defaultValues: {
      email: savedSession?.user?.email || '',
      password: '',
    },
  });

  useEffect(() => {
    if (savedSession?.user?.email) {
      setValue('email', savedSession.user.email);
    }
  }, [savedSession, setValue]);

  const onSubmit = async (data: CitizenLoginForm) => {
    try {
      setErrorMessage(null);
      setLoading(true);
      await login(data, 'citizen');
    } catch (error: any) {
      setErrorMessage(
        error.message || 'Unable to sign in. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = async () => {
    try {
      setErrorMessage(null);
      setResumeLoading(true);
      await resumeSavedSession('citizen');
    } catch (error: any) {
      setErrorMessage(error.message || 'Saved session expired. Please enter your password.');
    } finally {
      setResumeLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage(null);
      setGoogleLoading(true);
      await loginWithGoogle('citizen');
    } catch (error: any) {
      if (error.message && error.message.includes('cancelled')) {
        return;
      }
      setErrorMessage(
        error.message || 'Google authentication could not be completed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillDemoCitizen = () => {
    setValue('email', 'citizen@example.com');
    setValue('password', 'password123');
    setErrorMessage(null);
  };

  const isCitizenSaved = savedSession?.user && (savedSession.user.role || '').toLowerCase() === 'citizen';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isDesktop ? (
          <View style={styles.desktopContainer}>
            {/* Left Branding Side */}
            <View style={styles.brandingSide}>
              <View style={styles.brandingContent}>
                <View style={styles.logoWrapper}>
                  <CivicTrackLogo size="lg" showText={false} />
                </View>
                <Text style={styles.brandingTitle}>Civic Action Portal</Text>
                <Text style={styles.brandingSubtitle}>
                  Report hazards, track infrastructure fixes, and empower your neighborhood through intelligent civic participation.
                </Text>
              </View>
              <View style={styles.brandingFooter}>
                <Text style={styles.brandingFooterText}>City Resident Access • CivicTrack v2.0</Text>
              </View>
            </View>

            {/* Right Auth Side */}
            <ScrollView contentContainerStyle={styles.authSide}>
              <View style={styles.authWrapper}>
                <Text style={styles.authTitle}>Sign In</Text>
                <Text style={styles.authSubtitle}>Welcome back to CivicTrack.</Text>

                {errorMessage && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                  </View>
                )}

                {isCitizenSaved && (
                  <Card style={styles.savedSessionCard}>
                    <CardContent style={styles.savedSessionContent}>
                      <View style={styles.savedAvatar}>
                        <Text style={styles.savedAvatarText}>
                          {(savedSession.user.name || 'C').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.savedGreeting}>Remembered Session</Text>
                        <Text style={styles.savedName} numberOfLines={1}>{savedSession.user.name || 'Citizen User'}</Text>
                        <Text style={styles.savedEmail} numberOfLines={1}>{savedSession.user.email}</Text>
                      </View>
                    </CardContent>
                    <View style={{ padding: 16, paddingTop: 0 }}>
                      <Button title={`Continue as ${savedSession.user.name?.split(' ')[0] || 'Citizen'}`} onPress={handleResumeSession} loading={resumeLoading || loading} variant="default" style={{ marginBottom: 8 }} />
                      <Button title="Use another account" onPress={clearSavedSession} variant="ghost" />
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
                          label="Email Address"
                          placeholder="name@example.com"
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
                          label="Password"
                          placeholder="Enter your password"
                          value={value}
                          onChangeText={(text) => { onChange(text); if (errorMessage) setErrorMessage(null); }}
                          error={errors.password?.message}
                        />
                      )}
                    />

                    <TouchableOpacity style={styles.forgotBtn} onPress={() => Alert.alert('Reset Password', 'Instructions sent to email.')}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <Button title="Sign In" onPress={handleSubmit(onSubmit)} loading={loading} variant="default" size="lg" style={{ marginTop: 4 }} />

                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or continue with</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <Button title="Continue with Google" onPress={handleGoogleLogin} loading={googleLoading || loading} variant="outline" size="lg" icon={<Ionicons name="logo-google" size={18} color="#EA4335" />} />
                  </CardContent>
                </Card>

                <View style={styles.signUpRow}>
                  <Text style={styles.signUpText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('CitizenRegister')}>
                    <Text style={styles.signUpLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.altLoginRow}>
                  <TouchableOpacity onPress={fillDemoCitizen} style={styles.demoPillDesktop}>
                    <Ionicons name="flash" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.demoPillTextDesktop}>Auto-fill Demo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => navigation.navigate('AuthorityLogin')} style={styles.authoritySwitch}>
                    <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.authoritySwitchText}>Officer Portal →</Text>
                  </TouchableOpacity>
                </View>
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
              <View style={styles.logoWrapperMobile}>
                <CivicTrackLogo size="md" showText={false} />
              </View>
              <Text style={styles.mobileTitle}>CivicTrack</Text>
              <Text style={styles.mobileSubtitle}>Citizen Action Portal</Text>
            </View>

            <View style={styles.mobileBody}>
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {isCitizenSaved && (
                <Card style={styles.savedSessionCard}>
                  <CardContent style={styles.savedSessionContent}>
                    <View style={styles.savedAvatar}>
                      <Text style={styles.savedAvatarText}>
                        {(savedSession.user.name || 'C').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.savedGreeting}>Remembered Session</Text>
                      <Text style={styles.savedName} numberOfLines={1}>{savedSession.user.name || 'Citizen User'}</Text>
                      <Text style={styles.savedEmail} numberOfLines={1}>{savedSession.user.email}</Text>
                    </View>
                  </CardContent>
                  <View style={{ padding: 16, paddingTop: 0 }}>
                    <Button title={`Continue as ${savedSession.user.name?.split(' ')[0] || 'Citizen'}`} onPress={handleResumeSession} loading={resumeLoading || loading} variant="default" style={{ marginBottom: 8 }} />
                    <Button title="Use another account" onPress={clearSavedSession} variant="ghost" />
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
                        label="Email Address"
                        placeholder="name@example.com"
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
                        label="Password"
                        placeholder="Enter your password"
                        value={value}
                        onChangeText={(text) => { onChange(text); if (errorMessage) setErrorMessage(null); }}
                        error={errors.password?.message}
                      />
                    )}
                  />

                  <TouchableOpacity style={styles.forgotBtn} onPress={() => Alert.alert('Reset Password', 'Instructions sent to email.')}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  <Button title="Sign In" onPress={handleSubmit(onSubmit)} loading={loading} variant="default" size="lg" style={{ marginTop: 4 }} />
                  
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Button title="Continue with Google" onPress={handleGoogleLogin} loading={googleLoading || loading} variant="outline" size="lg" icon={<Ionicons name="logo-google" size={18} color="#EA4335" />} />
                </CardContent>
              </Card>

              <View style={styles.signUpRow}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('CitizenRegister')}>
                  <Text style={styles.signUpLink}>Create Account</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.altLoginRow}>
                <TouchableOpacity onPress={fillDemoCitizen} style={styles.demoPillDesktop}>
                  <Ionicons name="flash" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.demoPillTextDesktop}>Auto-fill Demo</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('AuthorityLogin')} style={styles.authoritySwitch}>
                  <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.authoritySwitchText}>Officer Portal →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  // Desktop
  desktopContainer: { flex: 1, flexDirection: 'row' },
  brandingSide: { flex: 1.2, backgroundColor: COLORS.primary, padding: 60, justifyContent: 'space-between' },
  brandingContent: { flex: 1, justifyContent: 'center' },
  logoWrapper: { marginBottom: 32 },
  brandingTitle: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, marginBottom: 16 },
  brandingSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 28, maxWidth: 480 },
  brandingFooter: {},
  brandingFooterText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600' },
  authSide: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  authWrapper: { width: '100%', maxWidth: 460, paddingHorizontal: 24, paddingVertical: 40 },
  authTitle: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  authSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 32 },
  
  // Mobile
  mobileContainer: { flexGrow: 1, backgroundColor: '#F8FAFC' },
  mobileHeader: { backgroundColor: COLORS.primary, padding: 24, paddingTop: Platform.OS === 'ios' ? 24 : 40, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, alignItems: 'center' },
  logoWrapperMobile: { marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 20 },
  mobileTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  mobileSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  mobileBody: { padding: 20, marginTop: -20 },

  // Shared
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.errorLight, padding: 12, borderRadius: BORDER_RADIUS.md, marginBottom: 16, borderWidth: 1, borderColor: COLORS.errorBorder },
  errorBannerText: { color: COLORS.errorDark, fontSize: 13, flex: 1, fontWeight: '600' },
  savedSessionCard: { backgroundColor: '#F8FAFC', borderColor: COLORS.borderLight, marginBottom: 24 },
  savedSessionContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  savedAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  savedAvatarText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  savedGreeting: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  savedName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  savedEmail: { fontSize: 12, color: COLORS.textSecondary },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 18, marginTop: -4 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
  dividerText: { marginHorizontal: 12, color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  signUpRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  signUpText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  signUpLink: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  altLoginRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  demoPillDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight, padding: 10, borderRadius: BORDER_RADIUS.md },
  demoPillTextDesktop: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  authoritySwitch: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  authoritySwitchText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
});

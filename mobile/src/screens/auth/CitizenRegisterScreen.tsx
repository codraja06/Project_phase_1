import React, { useState } from 'react';
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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { citizenRegisterSchema, CitizenRegisterForm } from '../../validation/schemas';
import { useAuth } from '../../hooks/useAuth';
import { Input, PasswordInput } from '../../components/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { CivicTrackLogo } from '../../components/CivicTrackLogo';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type Props = NativeStackScreenProps<AuthStackParamList, 'CitizenRegister'>;

export const CitizenRegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const { isDesktop } = useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CitizenRegisterForm>({
    resolver: zodResolver(citizenRegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: CitizenRegisterForm) => {
    try {
      setErrorMessage(null);
      setLoading(true);
      await register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'citizen',
      });
    } catch (error: any) {
      setErrorMessage(
        error.message || 'Registration failed. Please verify your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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
                <Text style={styles.brandingTitle}>Join CivicTrack</Text>
                <Text style={styles.brandingSubtitle}>
                  Create your citizen profile to report municipal defects and track resolution in real-time.
                </Text>
              </View>
              <View style={styles.brandingFooter}>
                <Text style={styles.brandingFooterText}>City Resident Access • CivicTrack v2.0</Text>
              </View>
            </View>

            {/* Right Auth Side */}
            <ScrollView contentContainerStyle={styles.authSide}>
              <View style={styles.authWrapper}>
                <TouchableOpacity
                  style={styles.backBtnDesktop}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="chevron-back" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.backBtnTextDesktop}>Back to Sign In</Text>
                </TouchableOpacity>
                <Text style={styles.authTitle}>Create Account</Text>
                <Text style={styles.authSubtitle}>Enter your details below to register.</Text>

                {errorMessage && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                    <Text style={styles.errorBannerText}>{errorMessage}</Text>
                  </View>
                )}

                <Card>
                  <CardContent>
                    <Controller
                      control={control}
                      name="name"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          label="Full Legal Name"
                          placeholder="Enter full name"
                          value={value}
                          onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
                          leftIcon="person-outline"
                          error={errors.name?.message}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          label="Email Address"
                          placeholder="name@example.com"
                          value={value}
                          onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
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
                      name="phone"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          label="Phone Number"
                          placeholder="+91 98765 43210"
                          value={value}
                          onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
                          keyboardType="phone-pad"
                          leftIcon="call-outline"
                          error={errors.phone?.message}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, value } }) => (
                        <PasswordInput
                          label="Security Password"
                          placeholder="At least 6 characters"
                          value={value}
                          onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
                          error={errors.password?.message}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onChange, value } }) => (
                        <PasswordInput
                          label="Confirm Password"
                          placeholder="Re-enter your password"
                          value={value}
                          onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
                          error={errors.confirmPassword?.message}
                        />
                      )}
                    />

                    <Button title="Complete Registration" onPress={handleSubmit(onSubmit)} loading={loading} variant="default" size="lg" style={{ marginTop: 8 }} />
                  </CardContent>
                </Card>

                <View style={styles.signInRow}>
                  <Text style={styles.signInText}>Already have an active account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('CitizenLogin')}>
                    <Text style={styles.signInLink}>Sign In</Text>
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
              <TouchableOpacity
                style={styles.backBtnMobile}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                <Text style={styles.backBtnTextMobile}>Sign In</Text>
              </TouchableOpacity>
              <View style={styles.logoWrapperMobile}>
                <CivicTrackLogo size="md" showText={false} />
              </View>
              <Text style={styles.mobileTitle}>Join CivicTrack</Text>
              <Text style={styles.mobileSubtitle}>Citizen Enrollment</Text>
            </View>

            <View style={styles.mobileBody}>
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              <Card>
                <CardContent>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Full Legal Name"
                        placeholder="Enter full name"
                        value={value}
                        onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
                        leftIcon="person-outline"
                        error={errors.name?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Email Address"
                        placeholder="name@example.com"
                        value={value}
                        onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
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
                    name="phone"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Phone Number"
                        placeholder="+91 98765 43210"
                        value={value}
                        onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
                        keyboardType="phone-pad"
                        leftIcon="call-outline"
                        error={errors.phone?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                      <PasswordInput
                        label="Security Password"
                        placeholder="At least 6 characters"
                        value={value}
                        onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
                        error={errors.password?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, value } }) => (
                      <PasswordInput
                        label="Confirm Password"
                        placeholder="Re-enter your password"
                        value={value}
                        onChangeText={(t) => { onChange(t); if (errorMessage) setErrorMessage(null); }}
                        error={errors.confirmPassword?.message}
                      />
                    )}
                  />

                  <Button title="Complete Registration" onPress={handleSubmit(onSubmit)} loading={loading} variant="default" size="lg" style={{ marginTop: 8 }} />
                </CardContent>
              </Card>

              <View style={styles.signInRow}>
                <Text style={styles.signInText}>Already have an active account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('CitizenLogin')}>
                  <Text style={styles.signInLink}>Sign In</Text>
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
  backBtnDesktop: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, alignSelf: 'flex-start' },
  backBtnTextDesktop: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginLeft: 4 },
  authTitle: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  authSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 32 },
  
  // Mobile
  mobileContainer: { flexGrow: 1, backgroundColor: '#F8FAFC' },
  mobileHeader: { backgroundColor: COLORS.primary, padding: 24, paddingTop: Platform.OS === 'ios' ? 24 : 40, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, alignItems: 'center' },
  backBtnMobile: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  backBtnTextMobile: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  logoWrapperMobile: { marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 20 },
  mobileTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  mobileSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  mobileBody: { padding: 20, marginTop: -20 },

  // Shared
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.errorLight, padding: 12, borderRadius: BORDER_RADIUS.md, marginBottom: 16, borderWidth: 1, borderColor: COLORS.errorBorder },
  errorBannerText: { color: COLORS.errorDark, fontSize: 13, flex: 1, fontWeight: '600' },
  signInRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  signInText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  signInLink: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
});

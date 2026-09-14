import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CitizenTabParamList } from '../../types/navigation';
import { aiApi } from '../../api/aiApi';
import { complaintApi } from '../../api/complaintApi';
import { locationService } from '../../services/location';
import { DetectionResult } from '../../types/ai';
import { Complaint } from '../../types/complaint';
import { ImagePickerCamera } from '../../components/ImagePickerCamera';
import { DetectionOverlay } from '../../components/DetectionOverlay';
import { MapLocationPicker } from '../../components/MapLocationPicker';
import { CategorySelector } from '../../components/CategorySelector';
import { DescriptionEditor, getDefaultDescription } from '../../components/DescriptionEditor';
import { LocationCard } from '../../components/LocationCard';
import { SuccessModal } from '../../components/SuccessModal';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useBreakpoint } from '../../hooks/useBreakpoint';

type Props = NativeStackScreenProps<CitizenTabParamList, 'ReportIssue'>;
type Step = 'capture' | 'ai_analysis' | 'location' | 'review';

export const ReportIssueScreen: React.FC<Props> = ({ navigation, route }) => {
  const { isDesktop } = useBreakpoint();
  const [currentStep, setCurrentStep] = useState<Step>('capture');

  // Form & Detection States
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [serverImageUrl, setServerImageUrl] = useState<string>('');
  const [detectingAI, setDetectingAI] = useState<boolean>(false);
  const [aiDetections, setAiDetections] = useState<DetectionResult[]>([]);
  const [aiConfidence, setAiConfidence] = useState<number>(0);
  const [aiDetectedClass, setAiDetectedClass] = useState<string>('');
  const [aiDetected, setAiDetected] = useState<boolean>(false);

  // Category & Description
  const [selectedCategory, setSelectedCategory] = useState<string>('pothole');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  // Location
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [address, setAddress] = useState<string>('Fetching device location...');
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  // Submission & Success Modal
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Animation for step transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchCurrentLocation();
    if (route.params?.initialCategory) {
      setSelectedCategory(route.params.initialCategory);
      setDescription(getDefaultDescription(route.params.initialCategory));
    }
  }, [route.params?.initialCategory]);

  const animateStepChange = (nextStep: Step) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true })
    ]).start();
    setTimeout(() => setCurrentStep(nextStep), 150);
  };

  const fetchCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const loc = await locationService.getCurrentLocation();
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      setAddress(loc.address);
    } catch (error: any) {
      console.warn('GPS location fetch error:', error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleImageSelected = async (uri: string) => {
    setLocalImageUri(uri);
    setAiDetections([]);
    setAiConfidence(0);
    setAiDetectedClass('');
    setAiDetected(false);
    setErrorMessage(null);
    animateStepChange('ai_analysis');

    try {
      setDetectingAI(true);
      const [detectRes, uploadUrl] = await Promise.all([
        aiApi.detectIssue(uri).catch((e) => {
          console.warn('AI detection service warning:', e.message);
          return { success: false, detections: [], message: e.message };
        }),
        aiApi.uploadImage(uri).catch(() => uri),
      ]);

      setServerImageUrl(uploadUrl || uri);

      if (detectRes && detectRes.detections && detectRes.detections.length > 0) {
        setAiDetections(detectRes.detections);
        const topDetection = detectRes.detections[0];
        setAiConfidence(topDetection.confidence);
        setAiDetectedClass(topDetection.className);
        setAiDetected(true);

        const mappedCategory = topDetection.className.toLowerCase().replace(/ /g, '_');
        setSelectedCategory(mappedCategory);
        const genTitle = `${topDetection.className.charAt(0).toUpperCase() + topDetection.className.slice(1)} Issue`;
        setTitle(genTitle);
        setDescription(getDefaultDescription(mappedCategory, address));
      } else {
        setAiDetected(false);
        setSelectedCategory('pothole');
        setTitle('Pothole Hazard Reported');
        setDescription(getDefaultDescription('pothole', address));
      }
    } catch (error: any) {
      setAiDetected(false);
      setSelectedCategory('pothole');
      setTitle('Civic Hazard Reported');
      setDescription(getDefaultDescription('pothole', address));
    } finally {
      setDetectingAI(false);
    }
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    const catLabel = cat.replace(/_/g, ' ').toUpperCase();
    setTitle(`${catLabel.charAt(0) + catLabel.slice(1).toLowerCase()} Hazard Reported`);
    setDescription(getDefaultDescription(cat, address));
  };

  const handleRetake = () => {
    setLocalImageUri(null);
    setServerImageUrl('');
    setAiDetections([]);
    setAiConfidence(0);
    setAiDetectedClass('');
    setAiDetected(false);
    setCustomCategory('');
    setDescription('');
    setTitle('');
    animateStepChange('capture');
  };

  const handleBackStep = () => {
    if (currentStep === 'ai_analysis') {
      handleRetake();
    } else if (currentStep === 'location') {
      animateStepChange('ai_analysis');
    } else if (currentStep === 'review') {
      animateStepChange('location');
    } else {
      navigation.navigate('CitizenDashboard');
    }
  };

  const handleSubmitComplaint = async () => {
    if (submitting) return;
    try {
      setErrorMessage(null);
      if (!localImageUri && !serverImageUrl) {
        setErrorMessage('An incident photo is required.');
        return;
      }
      if (!description || description.trim().length < 5) {
        setErrorMessage('Please provide a description of at least 5 characters.');
        return;
      }
      if (selectedCategory === 'other' && !customCategory.trim()) {
        setErrorMessage('Please specify the custom category for this issue.');
        return;
      }

      setSubmitting(true);
      const payload = {
        title: title || `${selectedCategory.replace(/_/g, ' ')} Reported`,
        description: description.trim(),
        category: selectedCategory,
        customCategory: selectedCategory === 'other' ? customCategory.trim() : '',
        imageUrl: serverImageUrl || localImageUri || '',
        aiDetected,
        aiClass: aiDetectedClass,
        aiConfidence,
        boundingBoxes: aiDetections,
        latitude,
        longitude,
        address,
        priority: aiConfidence > 0.85 ? 'high' : 'medium',
      };

      const result = await complaintApi.createComplaint(payload);
      setCreatedComplaint(result);
      setShowSuccessModal(true);
    } catch (error: any) {
      const err = error.message || 'Unable to register complaint. Please check your connection and try again.';
      setErrorMessage(err);
      Alert.alert('Complaint Registration Failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const stepList: { key: Step; label: string; num: number }[] = [
    { key: 'capture', label: 'Photo', num: 1 },
    { key: 'ai_analysis', label: 'AI Vision', num: 2 },
    { key: 'location', label: 'GPS Pin', num: 3 },
    { key: 'review', label: 'Submit', num: 4 },
  ];
  const currentStepIndex = stepList.findIndex((s) => s.key === currentStep);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFBF7" />

      {/* Screen Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackStep} activeOpacity={0.7} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerTitle}>
            {currentStep === 'capture' && 'Report Civic Hazard'}
            {currentStep === 'ai_analysis' && 'AI Defect Analysis'}
            {currentStep === 'location' && 'Confirm GPS Location'}
            {currentStep === 'review' && 'Review & Submit Report'}
          </Text>
        </View>
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepperContainer}>
        {stepList.map((step, idx) => {
          const isCurrent = currentStep === step.key;
          const isDone = idx < currentStepIndex;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepPill}>
                <View style={[styles.stepCircle, isCurrent && styles.stepCircleCurrent, isDone && styles.stepCircleDone]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepNumText, isCurrent && styles.stepNumTextCurrent]}>{step.num}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent, isDone && styles.stepLabelDone]}>
                  {step.label}
                </Text>
              </View>
              {idx < stepList.length - 1 && (
                <View style={[styles.stepLine, idx < currentStepIndex && styles.stepLineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim }]}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* STEP 1: CAPTURE */}
            {currentStep === 'capture' && (
              <View style={styles.stepContainer}>
                <ImagePickerCamera imageUri={localImageUri} onImageSelected={handleImageSelected} onRetakeImage={handleRetake} />
              </View>
            )}

            {/* STEP 2: AI ANALYSIS */}
            {currentStep === 'ai_analysis' && (
              <View style={styles.stepContainer}>
                {detectingAI ? (
                  <Card style={styles.loadingCard}>
                    <CardContent style={styles.loadingContent}>
                      <ActivityIndicator color={COLORS.primary} size="large" style={{ marginBottom: 16 }} />
                      <Text style={styles.loadingTitle}>Running YOLOv8 Vision...</Text>
                      <Text style={styles.loadingSubtitle}>Scanning for potholes, road damage & garbage overflow</Text>
                    </CardContent>
                  </Card>
                ) : localImageUri ? (
                  <>
                    <DetectionOverlay imageUri={localImageUri} detections={aiDetections} confidence={aiConfidence} height={260} />
                    <CategorySelector selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} customCategory={customCategory} onChangeCustomCategory={setCustomCategory} aiDetected={aiDetected} aiClass={aiDetectedClass} aiConfidence={aiConfidence} />
                    <DescriptionEditor category={selectedCategory} customCategory={customCategory} description={description} onChangeDescription={setDescription} address={address} />
                    
                    <View style={styles.buttonRow}>
                      <Button title="Retake Photo" onPress={handleRetake} variant="secondary" size="lg" style={{ flex: 1 }} />
                      <Button title="Continue to Location" onPress={() => animateStepChange('location')} variant="default" size="lg" style={{ flex: 1.5 }} />
                    </View>
                  </>
                ) : null}
              </View>
            )}

            {/* STEP 3: LOCATION */}
            {currentStep === 'location' && (
              <View style={styles.stepContainer}>
                {locationLoading ? (
                  <Card style={styles.loadingCard}>
                    <CardContent style={styles.loadingContent}>
                      <ActivityIndicator color={COLORS.primary} size="large" style={{ marginBottom: 12 }} />
                      <Text style={styles.loadingTitle}>Triangulating GPS coordinates...</Text>
                      <Text style={styles.loadingSubtitle}>Acquiring high-accuracy satellite fix</Text>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <MapLocationPicker latitude={latitude} longitude={longitude} address={address} height={290} showCard={true} onSelectLocation={(lat, lng) => { setLatitude(lat); setLongitude(lng); setAddress(`Coordinates Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)}`); }} onUseCurrentLocation={fetchCurrentLocation} />
                    <LocationCard address={address} latitude={latitude} longitude={longitude} onRefreshLocation={fetchCurrentLocation} />
                    <Button title="Confirm Location & Review" onPress={() => animateStepChange('review')} variant="default" size="lg" style={{ marginTop: 8 }} />
                  </>
                )}
              </View>
            )}

            {/* STEP 4: REVIEW */}
            {currentStep === 'review' && (
              <View style={styles.stepContainer}>
                <Card style={styles.reviewCard}>
                  <CardContent style={styles.reviewContent}>
                    <Text style={styles.reviewCardTitle}>Incident Summary</Text>
                    <View style={styles.reviewThumbRow}>
                      {localImageUri ? <Image source={{ uri: localImageUri }} style={styles.reviewThumb} /> : null}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewCategoryLabel}>SELECTED CATEGORY</Text>
                        <Text style={styles.reviewCategoryVal}>
                          {selectedCategory === 'other' && customCategory ? customCategory.toUpperCase() : selectedCategory.replace(/_/g, ' ').toUpperCase()}
                        </Text>
                        {aiConfidence > 0 && <Badge label={`${Math.round(aiConfidence * 100)}% Match`} variant="warning" icon={<Ionicons name="sparkles" size={10} color="#FFFFFF" />} />}
                      </View>
                    </View>
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewSectionLabel}>DESCRIPTION</Text>
                      <Text style={styles.reviewSectionBody}>{description}</Text>
                    </View>
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewSectionLabel}>INCIDENT LOCATION</Text>
                      <View style={styles.reviewLocationRow}>
                        <Ionicons name="location-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.reviewLocationText}>{address}</Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
                <Button title={submitting ? "Submitting Report..." : "SUBMIT COMPLAINT"} onPress={handleSubmitComplaint} variant="default" size="lg" loading={submitting} disabled={submitting} style={{ marginTop: 10 }} />
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal visible={showSuccessModal} complaintId={createdComplaint?.complaintId || 'CIV-100245'} title="Complaint registered successfully" message="Your complaint has been successfully registered and routed to municipal operations." onViewComplaint={() => { setShowSuccessModal(false); if (createdComplaint?._id) { handleRetake(); (navigation as any).navigate('ComplaintDetail', { complaintId: createdComplaint._id }); } else { handleRetake(); navigation.navigate('ComplaintHistory'); } }} onClose={() => { setShowSuccessModal(false); handleRetake(); navigation.navigate('CitizenDashboard'); }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundNeutral },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, backgroundColor: COLORS.backgroundNeutral },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight, marginRight: 12, ...SHADOWS.sm },
  headerTextWrapper: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, ...SHADOWS.sm },
  stepPill: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  stepCircleCurrent: { backgroundColor: COLORS.primary },
  stepCircleDone: { backgroundColor: COLORS.primaryDark },
  stepNumText: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary },
  stepNumTextCurrent: { color: '#FFFFFF' },
  stepLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  stepLabelCurrent: { color: COLORS.primary, fontWeight: '800' },
  stepLabelDone: { color: COLORS.textPrimary, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.borderLight, marginHorizontal: 8 },
  stepLineDone: { backgroundColor: COLORS.primary },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  scrollContentDesktop: { paddingTop: 32, paddingBottom: 56 },
  mainWrapper: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  stepContainer: { width: '100%' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.errorLight, padding: 12, borderRadius: BORDER_RADIUS.md, marginBottom: 16, borderWidth: 1, borderColor: COLORS.errorBorder },
  errorText: { color: COLORS.errorDark, fontSize: 13, fontWeight: '600', flex: 1 },
  loadingCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  loadingContent: { padding: 40, alignItems: 'center' },
  loadingTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  loadingSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 20 },
  reviewCard: { marginBottom: 20 },
  reviewContent: { padding: 24 },
  reviewCardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  reviewThumbRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  reviewThumb: { width: 76, height: 76, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.backgroundNeutral },
  reviewCategoryLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 4 },
  reviewCategoryVal: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
  reviewSection: { marginBottom: 16 },
  reviewSectionLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 6 },
  reviewSectionBody: { fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
  reviewLocationRow: { flexDirection: 'row', alignItems: 'center' },
  reviewLocationText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
});

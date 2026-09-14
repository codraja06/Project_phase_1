import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

interface ImagePickerCameraProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  onRetakeImage?: () => void;
}

export const ImagePickerCamera: React.FC<ImagePickerCameraProps> = ({
  imageUri,
  onImageSelected,
  onRetakeImage,
}) => {
  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const uri = URL.createObjectURL(file);
          onImageSelected(uri);
        }
      };
      input.click();
      return;
    }

    try {
      const ImagePicker = require('expo-image-picker');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to photograph civic issues in real-time.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn('Camera error:', err.message);
    }
  };

  const handlePickGallery = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const uri = URL.createObjectURL(file);
          onImageSelected(uri);
        }
      };
      input.click();
      return;
    }

    try {
      const ImagePicker = require('expo-image-picker');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Gallery Permission Required',
          'Please allow photo library access to upload civic issue photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn('Gallery pick error:', err.message);
    }
  };

  if (imageUri) {
    return (
      <View style={styles.retakeRow}>
        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => onRetakeImage?.()}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.retakeBtnText}>Change / Retake Photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Large Tap to Capture Card matching Screen 5 */}
      <TouchableOpacity
        style={styles.captureCard}
        onPress={handleTakePhoto}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Tap to Capture. Take a photo of the issue"
      >
        <View style={styles.iconBox}>
          <Ionicons name="camera-outline" size={38} color={COLORS.primary} />
        </View>
        <Text style={styles.captureTitle}>Tap to Capture</Text>
        <Text style={styles.captureSub}>Take a photo of the issue</Text>
      </TouchableOpacity>

      {/* Upload from Gallery Button matching Screen 5 */}
      <TouchableOpacity
        style={styles.galleryBtn}
        onPress={handlePickGallery}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Upload from Gallery"
      >
        <Ionicons name="images-outline" size={18} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
        <Text style={styles.galleryBtnText}>Upload from Gallery</Text>
      </TouchableOpacity>

      <Text style={styles.formatHint}>Supported formats: JPG, PNG</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  captureCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primarySurface,
  },
  captureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  captureSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  galleryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    ...SHADOWS.card,
  },
  galleryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  formatHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  retakeRow: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

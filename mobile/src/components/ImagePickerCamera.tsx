import React, { useState } from 'react';
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
  const [error, setError] = useState('');
  const acceptImage = (asset: { uri?: string; mimeType?: string; fileSize?: number }, file?: File) => {
    const mime = file?.type || asset.mimeType;
    if ((mime && !['image/jpeg', 'image/png', 'image/webp'].includes(mime)) || (file?.size || asset.fileSize || 0) > 10 * 1024 * 1024) {
      setError('Choose a JPEG, PNG or WebP image, 10 MB or smaller.'); return;
    }
    setError('');
    if (file) onImageSelected(URL.createObjectURL(file));
    else if (asset.uri) onImageSelected(asset.uri);
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.capture = 'environment';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          acceptImage({}, file);
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
        acceptImage(result.assets[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Camera could not be opened.');
    }
  };

  const handlePickGallery = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          acceptImage({}, file);
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
        acceptImage(result.assets[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Photo library could not be opened.');
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
      {!!error && <Text accessibilityRole="alert" style={{ color: COLORS.error, marginBottom: 12 }}>{error}</Text>}

      <View
        style={[styles.captureCard, { borderStyle: Platform.OS === 'web' ? 'dashed' : 'solid' }]}
      >
        <View style={styles.iconBox}>
          <Ionicons name="camera" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.captureTitle}>Upload an Issue Image</Text>
        <Text style={styles.captureSub}>Capture a photo or choose an image from your device</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Ionicons name="camera-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnText}>Capture Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={handlePickGallery}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Ionicons name="images-outline" size={16} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnTextSecondary}>Upload Image</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  captureTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  captureSub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primarySurface,
  },
  actionBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    fontSize: 13,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  actionBtnTextSecondary: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
    fontSize: 13,
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

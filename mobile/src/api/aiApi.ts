import { Platform } from 'react-native';
import { axiosClient } from './axiosClient';
import { ENDPOINTS } from '../constants/endpoints';
import { AIDetectResponse } from '../types/ai';

export const aiApi = {
  async detectIssue(imageUri: string): Promise<AIDetectResponse> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // On web, imageUri is a blob:// URL - fetch it as a blob and append
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
        const filename = `civic_issue_${Date.now()}.${ext}`;
        formData.append('image', blob, filename);
      } catch {
        throw new Error('Failed to read image for AI detection.');
      }
    } else {
      // Native: append as React Native file object
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';
      formData.append('image', { uri: imageUri, name: filename, type } as any);
    }

    // axiosClient interceptor returns response.data (the outer ApiResponse envelope):
    // Backend: { success: true, message: "...", data: { success: true, detections: [...] } }
    // After axiosClient strips outer envelope we get:
    // envelope = { success: true, message: "...", data: { success: true, detections: [...] } }
    const envelope: any = await axiosClient.post(ENDPOINTS.AI.DETECT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    // envelope.data contains the inner AI result payload: { success, detections, message? }
    const aiResult = envelope?.data || {};

    return {
      detected: aiResult.detected ?? false,
      message: aiResult.message || envelope?.message || 'AI detection completed.',
      detections: aiResult.detections || [],
    };
  },

  async uploadImage(imageUri: string): Promise<string> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
        const filename = `civic_issue_${Date.now()}.${ext}`;
        formData.append('image', blob, filename);
      } catch {
        throw new Error('Failed to read the selected image. Please select it again.');
      }
    } else {
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';
      formData.append('image', { uri: imageUri, name: filename, type } as any);
    }

    // axiosClient returns the outer ApiResponse envelope:
    // { success: true, message: "...", data: { imageUrl: "https://..." } }
    const envelope: any = await axiosClient.post(ENDPOINTS.UPLOADS.IMAGE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Read imageUrl from envelope.data (the inner data payload)
    const imageUrl = envelope?.data?.imageUrl;
    if (typeof imageUrl !== 'string' || !/^https?:\/\//i.test(imageUrl)) throw new Error('Image upload did not return a permanent URL. Please retry.');
    return imageUrl;
  },
};

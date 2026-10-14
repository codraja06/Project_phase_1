import * as ImagePicker from 'expo-image-picker';

export async function selectImage(source: 'camera' | 'library') {
  const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error(`${source === 'camera' ? 'Camera' : 'Photo library'} permission denied. Enable access in device settings or choose another source.`);
  const options = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, allowsEditing: false };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  return result.canceled ? null : result.assets[0];
}

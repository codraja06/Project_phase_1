import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function saveExportFile(bytes: ArrayBuffer, filename: string, mimeType: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable on this device. Use the browser to download this export.');
  if (!FileSystem.cacheDirectory) throw new Error('Export storage is unavailable. Please try again.');
  const values = new Uint8Array(bytes);
  let binary = '';
  for (let offset = 0; offset < values.length; offset += 8192) binary += String.fromCharCode(...values.subarray(offset, offset + 8192));
  const uri = `${FileSystem.cacheDirectory}${Date.now()}-${filename}`;
  try {
    await FileSystem.writeAsStringAsync(uri, btoa(binary), { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { mimeType, UTI: mimeType.includes('spreadsheet') ? 'org.openxmlformats.spreadsheetml.sheet' : 'public.comma-separated-values-text', dialogTitle: 'Save CivicTrack operations export' });
  } catch (error) {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
    throw error;
  }
  // A receiving Android app can read the attachment after the share sheet closes.
  // Keep successful exports in the OS-managed cache rather than deleting early.
}

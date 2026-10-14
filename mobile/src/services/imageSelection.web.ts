export async function selectImage(source: 'camera' | 'library'): Promise<{ uri: string; mimeType: string; fileSize: number } | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp';
    if (source === 'camera') input.capture = 'environment';
    input.oncancel = () => resolve(null);
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
        reject(new Error('Choose a JPEG, PNG or WebP image, 10 MB or smaller.')); return;
      }
      resolve({ uri: URL.createObjectURL(file), mimeType: file.type, fileSize: file.size });
    };
    input.click();
  });
}

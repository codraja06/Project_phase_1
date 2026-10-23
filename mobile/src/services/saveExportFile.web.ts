export async function saveExportFile(bytes: ArrayBuffer, filename: string, mimeType: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  try { anchor.click(); } finally {
    anchor.remove();
    // Give the browser time to acquire the blob before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

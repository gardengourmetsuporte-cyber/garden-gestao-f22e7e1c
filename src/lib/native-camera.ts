import { isNative, platform } from './native';

/**
 * Takes a photo using the Capacitor Camera plugin on native platforms.
 *
 * Important Android behavior:
 * Opening the external native camera activity may cause low-memory WebView
 * process death on some devices, which looks like "app reload to home".
 * To keep state (e.g. OCR sheet), we intentionally skip native camera on
 * Android and let callers use the in-browser camera fallback.
 */
export async function takeNativePhoto(source: 'camera' | 'gallery' = 'camera'): Promise<File | null> {
  if (!isNative) return null;

  // Keep flow inside WebView on Android to avoid losing React state.
  if (platform === 'android' && source === 'camera') return null;

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      width: 1920,
      correctOrientation: true,
    });

    if (!image.dataUrl) return null;

    // Convert data URL to File
    const res = await fetch(image.dataUrl);
    const blob = await res.blob();
    const ext = image.format === 'png' ? 'png' : 'jpg';
    return new File([blob], `photo_${Date.now()}.${ext}`, {
      type: `image/${ext === 'jpg' ? 'jpeg' : 'png'}`,
    });
  } catch (err: any) {
    // User cancelled or plugin not available
    if (err?.message?.includes('User cancelled') || err?.message?.includes('canceled')) {
      return null;
    }
    console.warn('Native camera error, falling back:', err);
    return null;
  }
}

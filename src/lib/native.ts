import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/** Whether the app is running inside a native shell (iOS/Android) */
export const isNative = Capacitor.isNativePlatform();

/** Platform: 'ios' | 'android' | 'web' */
export const platform = Capacitor.getPlatform();

/**
 * Enter immersive fullscreen mode on native platforms.
 * Hides status bar on native and navigation bar on Android.
 */
export async function enterImmersiveMode() {
  if (!isNative) return;

  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.hide();
  } catch {
    // status bar plugin not available
  }

  if (platform === 'android') {
    try {
      const { Fullscreen } = await import('@boengli/capacitor-fullscreen');
      await Fullscreen.activateImmersiveMode();
    } catch {
      // fullscreen plugin not available
    }
  }
}

/**
 * Trigger a light haptic feedback.
 * Uses native Haptics on iOS/Android, falls back to navigator.vibrate on web.
 */
export async function hapticLight() {
  if (isNative) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // plugin not available
    }
  } else {
    try {
      navigator.vibrate?.(10);
    } catch {
      // not supported
    }
  }
}

/**
 * Trigger a medium haptic feedback.
 */
export async function hapticMedium() {
  if (isNative) {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
  } else {
    try {
      navigator.vibrate?.(20);
    } catch {}
  }
}

/**
 * Trigger a success notification haptic.
 */
export async function hapticSuccess() {
  if (isNative) {
    try {
      await Haptics.notification({ type: 'SUCCESS' as any });
    } catch {}
  } else {
    try {
      navigator.vibrate?.([10, 50, 10]);
    } catch {}
  }
}

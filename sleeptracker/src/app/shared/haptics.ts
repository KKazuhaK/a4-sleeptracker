import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Haptics are unavailable in the browser; never let that surface as an error.
export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* no haptics on this platform */ }
}

export async function hapticWarning(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch { /* no haptics on this platform */ }
}

/** Light tick while dragging. */
export async function hapticTick(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* no haptics on this platform */ }
}

import * as Haptics from 'expo-haptics';

/**
 * Central haptics wrapper so a future settings toggle (Phase 15) can silence
 * every haptic in one place. Fire-and-forget: haptic failures must never
 * affect app behavior.
 */
export function hapticLight(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticSuccess(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticError(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

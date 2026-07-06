import {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

/**
 * Shared motion presets. Every preset opts into ReduceMotion.System explicitly
 * so an OS-level "reduce motion" setting collapses them to instant — a11y is
 * part of the preset, not something each call site remembers.
 */

/** Rows and cards arriving: slide up + fade, softly sprung. */
export const enterDown = FadeInDown.springify().damping(18).reduceMotion(ReduceMotion.System);

/** Content swaps (section switches): plain crossfade. */
export const enterFade = FadeIn.duration(200).reduceMotion(ReduceMotion.System);

/** Anything leaving: quick fade — exits should never make the user wait. */
export const exitFade = FadeOut.duration(150).reduceMotion(ReduceMotion.System);

/** Siblings reflowing after add/remove — spring the gap closed. */
export const listLayout = LinearTransition.springify()
  .damping(18)
  .reduceMotion(ReduceMotion.System);

/** Staggered feed entrances (Home) — index-scaled delay on the standard slide. */
export const enterDownStagger = (index: number) =>
  FadeInDown.delay(Math.min(index, 8) * 60)
    .springify()
    .damping(18)
    .reduceMotion(ReduceMotion.System);

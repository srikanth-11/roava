import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

/**
 * Android hardware back should close an open bottom sheet, not navigate the
 * screen beneath it. Wire the returned callback into BottomSheetModal's
 * `onChange`: while the sheet is open (index >= 0) a back press dismisses the
 * most-recently-presented modal (this one) and consumes the event; closed
 * sheets leave the back button alone.
 */
export function useSheetBackHandler(): (index: number) => void {
  const { dismiss } = useBottomSheetModal();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss();
      return true;
    });
    return () => sub.remove();
  }, [open, dismiss]);

  return useCallback((index: number) => setOpen(index >= 0), []);
}

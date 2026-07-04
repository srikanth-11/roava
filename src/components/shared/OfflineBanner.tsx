import { WifiOff } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/ui';
import { useOnline } from '@/hooks/useOnline';

/** Global banner rendered above the navigator when connectivity is lost. */
export function OfflineBanner() {
  const online = useOnline();
  const insets = useSafeAreaInsets();

  if (online !== false) return null;

  return (
    <View
      accessibilityRole="alert"
      className="absolute left-0 right-0 z-50 flex-row items-center justify-center gap-2 bg-foreground py-2"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Icon icon={WifiOff} size={16} color="on-primary" accessibilityLabel="Offline" />
      <Text variant="label" className="text-background">
        {"You're offline — showing saved data"}
      </Text>
    </View>
  );
}

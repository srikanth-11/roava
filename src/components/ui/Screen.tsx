import { Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

export interface ScreenProps {
  children: React.ReactNode;
  /** Scrollable content (default true for content screens). */
  scroll?: boolean;
  /** Safe-area edges to respect. Bottom omitted by default (tab bar owns it). */
  edges?: Edge[];
  className?: string;
}

// The app is mobile-first; on a desktop browser its screens shouldn't stretch
// edge-to-edge, so web constrains content to a centered column. (The share
// landing builds its own full-bleed layout and doesn't use Screen.)
const WEB_COLUMN = Platform.OS === 'web' ? 'w-full max-w-xl mx-auto' : '';

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'left', 'right'],
  className = '',
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      {scroll ? (
        <ScrollView
          className={`flex-1 ${className}`}
          contentContainerClassName={`pb-8 ${WEB_COLUMN}`}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${WEB_COLUMN} ${className}`}>{children}</View>
      )}
    </SafeAreaView>
  );
}

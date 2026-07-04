import { ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

export interface ScreenProps {
  children: React.ReactNode;
  /** Scrollable content (default true for content screens). */
  scroll?: boolean;
  /** Safe-area edges to respect. Bottom omitted by default (tab bar owns it). */
  edges?: Edge[];
  className?: string;
}

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
          contentContainerClassName="pb-8"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${className}`}>{children}</View>
      )}
    </SafeAreaView>
  );
}

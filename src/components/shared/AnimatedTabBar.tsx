import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { hapticLight } from '@/lib/haptics';
import { palette } from '@/lib/palette';

export interface TabConfig {
  icon: LucideIcon;
  label: string;
}

interface AnimatedTabBarProps extends BottomTabBarProps {
  tabs: Record<string, TabConfig>;
}

const SPRING = { damping: 18, stiffness: 220 };

export function AnimatedTabBar({ state, navigation, tabs }: AnimatedTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const colors = palette[colorScheme ?? 'light'];

  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth / state.routes.length;
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      indicatorX.set(withSpring(state.index * tabWidth, SPRING));
    }
  }, [state.index, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.get() }],
  }));

  return (
    <View
      className="border-t border-border bg-surface"
      style={{ paddingBottom: insets.bottom }}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {tabWidth > 0 ? (
        <Animated.View
          style={[indicatorStyle, { width: tabWidth }]}
          className="absolute top-0 h-0.5 items-center"
        >
          <View className="h-0.5 w-12 rounded-full bg-primary" />
        </Animated.View>
      ) : null}

      <View className="flex-row">
        {state.routes.map((route: (typeof state)['routes'][number], index: number) => {
          const focused = state.index === index;
          const config = tabs[route.name];
          if (!config) return null;
          const IconCmp = config.icon;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={config.label}
              accessibilityState={{ selected: focused }}
              className="h-16 flex-1 items-center justify-center gap-1"
              onPress={() => {
                if (!focused) {
                  hapticLight();
                  navigation.navigate(route.name);
                }
              }}
            >
              <IconCmp
                size={22}
                strokeWidth={focused ? 2.25 : 1.75}
                color={focused ? colors.primary : colors.mutedForeground}
              />
              <Text variant="caption" color={focused ? 'primary' : 'muted'}>
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

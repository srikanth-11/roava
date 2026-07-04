import { Tabs } from 'expo-router';
import { Heart, House, Luggage, Search, UserRound } from 'lucide-react-native';

import { AnimatedTabBar, type TabConfig } from '@/components/shared/AnimatedTabBar';

const TABS: Record<string, TabConfig> = {
  home: { icon: House, label: 'Home' },
  search: { icon: Search, label: 'Search' },
  trips: { icon: Luggage, label: 'Trips' },
  favorites: { icon: Heart, label: 'Favorites' },
  profile: { icon: UserRound, label: 'Profile' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AnimatedTabBar {...props} tabs={TABS} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="trips" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

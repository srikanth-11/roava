import { Link } from 'expo-router';
import { Moon, Palette, Sun, UserRound } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, Card, Icon, Screen, Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export default function ProfileScreen() {
  const { mode, setMode, resolved } = useTheme();

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-4">
        <Text variant="h1">Profile</Text>

        <Card>
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Icon icon={UserRound} color="primary" />
            </View>
            <View>
              <Text variant="h3">Guest traveler</Text>
              <Text variant="body-sm" color="muted">
                Sign-in arrives in Phase 4
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <View className="mb-3 flex-row items-center gap-2">
            <Icon icon={resolved === 'dark' ? Moon : Sun} color="muted" />
            <Text variant="h3">Appearance</Text>
          </View>
          <View className="flex-row gap-2">
            {(['light', 'dark', 'system'] as const).map((m) => (
              <Button
                key={m}
                label={m}
                size="sm"
                variant={mode === m ? 'primary' : 'outline'}
                onPress={() => setMode(m)}
              />
            ))}
          </View>
        </Card>

        {__DEV__ ? (
          <Link href="/dev-gallery" asChild>
            <Button label="Component gallery" variant="outline" icon={Palette} />
          </Link>
        ) : null}
      </View>
    </Screen>
  );
}

import { Compass, MapPin, Search } from 'lucide-react-native';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  PressableCard,
  Screen,
  Skeleton,
  Text,
} from '@/components/ui';
import { useTheme, type ThemeMode } from '@/lib/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 px-4 pt-6">
      <Text variant="h3" color="muted">
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function DevGallery() {
  const { mode, setMode, resolved } = useTheme();

  if (!__DEV__) return null;

  const modes: ThemeMode[] = ['light', 'dark', 'system'];

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between px-4 pt-4">
        <Text variant="h1">Gallery</Text>
        <Badge label={`resolved: ${resolved}`} variant="outline" />
      </View>

      <Section title="Theme">
        <View className="flex-row gap-2">
          {modes.map((m) => (
            <Button
              key={m}
              label={m}
              size="sm"
              variant={mode === m ? 'primary' : 'outline'}
              onPress={() => setMode(m)}
            />
          ))}
        </View>
      </Section>

      <Section title="Typography">
        <Text variant="display">Display</Text>
        <Text variant="h1">Heading 1</Text>
        <Text variant="h2">Heading 2</Text>
        <Text variant="h3">Heading 3</Text>
        <Text variant="body">Body — plan trips, explore the world.</Text>
        <Text variant="body-sm" color="muted">
          Body small muted — secondary information.
        </Text>
        <Text variant="label">Label text</Text>
        <Text variant="caption" color="muted">
          Caption — fine print
        </Text>
      </Section>

      <Section title="Buttons">
        <View className="flex-row flex-wrap gap-2">
          <Button label="Primary" />
          <Button label="Secondary" variant="secondary" />
          <Button label="Outline" variant="outline" />
          <Button label="Ghost" variant="ghost" />
          <Button label="Destructive" variant="destructive" />
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          <Button label="Small" size="sm" />
          <Button label="Medium" size="md" />
          <Button label="Large" size="lg" />
        </View>
        <View className="flex-row gap-2">
          <Button label="Loading" loading />
          <Button label="Disabled" disabled />
        </View>
      </Section>

      <Section title="Badges">
        <View className="flex-row flex-wrap gap-2">
          <Badge label="Default" />
          <Badge label="Success" variant="success" />
          <Badge label="Warning" variant="warning" />
          <Badge label="Destructive" variant="destructive" />
          <Badge label="Outline" variant="outline" />
        </View>
      </Section>

      <Section title="Cards">
        <Card>
          <Text variant="h3">Static card</Text>
          <Text variant="body-sm" color="muted">
            Surface + border + radius-lg
          </Text>
        </Card>
        <PressableCard accessibilityLabel="Open Paris destination">
          <View className="flex-row items-center gap-3">
            <Icon icon={MapPin} color="primary" accessibilityLabel="Location" />
            <View>
              <Text variant="h3">Pressable card</Text>
              <Text variant="body-sm" color="muted">
                Tap me — haptic + opacity feedback
              </Text>
            </View>
          </View>
        </PressableCard>
      </Section>

      <Section title="Inputs">
        <Input
          label="Destination"
          placeholder="Where to?"
          helperText="Try a city or country"
          leftSlot={<Icon icon={Search} size={20} color="muted" />}
        />
        <Input
          label="Email"
          placeholder="you@example.com"
          errorText="That doesn't look like a valid email"
        />
      </Section>

      <Section title="Skeleton">
        <View className="gap-2">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </View>
      </Section>

      <Section title="Empty & Error states">
        <Card className="p-0">
          <EmptyState
            icon={Compass}
            title="No trips yet"
            message="Start planning your first adventure and it will show up here."
            actionLabel="Plan a trip"
            onAction={() => {}}
          />
        </Card>
        <Card className="p-0">
          <ErrorState
            message="We couldn't load destinations. Check your connection."
            onRetry={() => {}}
          />
        </Card>
      </Section>
    </Screen>
  );
}

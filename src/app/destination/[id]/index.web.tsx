import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { Banknote, CloudSun, Compass, Luggage, MapPinned } from 'lucide-react-native';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import { AppLogo } from '@/components/shared/AppLogo';
import { Icon, Text } from '@/components/ui';
import { APP_STORE_URL, GET_APP_URL, MAKER, PLAY_STORE_URL } from '@/lib/links';
import { useGetDestinationByIdQuery } from '@/store/api';

/** Store badge — active when the link exists, "Coming soon" until the app ships. */
function StoreButton({ label, href }: { label: string; href: string | null }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={href ? `${label} — get Roava` : `${label} — coming soon`}
      disabled={!href}
      onPress={() => {
        if (href) void Linking.openURL(href).catch(() => {});
      }}
      className={`rounded-xl bg-foreground px-6 py-3 ${href ? 'active:opacity-90' : 'opacity-60'}`}
    >
      <Text variant="caption" className="text-background opacity-70">
        {href ? 'Available on' : 'Coming soon'}
      </Text>
      <Text variant="label" className="text-background">
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Web-only landing for a shared destination link — NOT the RN detail screen.
 * This is what someone without the app sees when they tap
 * https://roava.expo.app/destination/<id>: the place itself, then an invitation
 * into the app. Full-bleed by design (does not use the constrained Screen).
 */

const FEATURES = [
  {
    icon: CloudSun,
    title: 'Weather, even offline',
    body: 'Forecasts, sun times and air quality — cached for the plane.',
  },
  {
    icon: MapPinned,
    title: 'Sights on a map',
    body: 'OpenStreetMap places, clustered — plus pins you drop yourself.',
  },
  {
    icon: Banknote,
    title: 'Live currency',
    body: 'Convert at today’s rate; it keeps working with no signal.',
  },
  {
    icon: Luggage,
    title: 'Plan the trip',
    body: 'Itineraries, budgets and packing — saved on your device.',
  },
];

export default function DestinationLandingWeb() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const destinationId = String(id ?? '');
  const { data, isLoading } = useGetDestinationByIdQuery(destinationId, { skip: !destinationId });

  const openApp = () => {
    void Linking.openURL(`roava://destination/${destinationId}`).catch(() => {});
  };
  const getApp = () => {
    void Linking.openURL(GET_APP_URL).catch(() => {});
  };

  const place = data?.name ?? 'A place worth the trip';
  const region = data ? `${data.region ? `${data.region}, ` : ''}${data.country}` : '';

  return (
    <>
      <Head>
        <title>{data ? `${data.name} · Roava` : 'Roava'}</title>
        <meta
          name="description"
          content={`Explore ${data?.name ?? 'this destination'} on Roava — a travel companion that works offline.`}
        />
        <meta property="og:title" content={data ? `${data.name}, ${data.country}` : 'Roava'} />
        <meta
          property="og:description"
          content="Explore it on Roava — travel that works offline."
        />
        {data?.imageUrl ? <meta property="og:image" content={data.imageUrl} /> : null}
        <meta property="og:type" content="website" />
      </Head>

      <ScrollView className="flex-1 bg-background">
        {/* HERO */}
        <View className="relative min-h-[70vh] justify-end overflow-hidden md:min-h-[88vh]">
          {data?.imageUrl ? (
            <Image
              source={{ uri: data.imageUrl }}
              contentFit="cover"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View className="absolute inset-0 bg-primary/15" />
          )}
          <View pointerEvents="none" className="absolute inset-0 bg-scrim/35" />
          <View pointerEvents="none" className="absolute inset-x-0 bottom-0 h-2/3 bg-scrim/55" />

          {/* top: mark + wordmark */}
          <View className="absolute inset-x-0 top-0 flex-row items-center gap-2 p-5 md:p-8">
            <AppLogo size={40} />
            <Text variant="h3" color="on-image">
              Roava
            </Text>
          </View>

          {/* hero content */}
          <View className="gap-3 p-6 md:max-w-3xl md:p-16">
            {data ? (
              <Text variant="label" color="on-image" className="uppercase opacity-80">
                Someone’s exploring
              </Text>
            ) : null}
            <Text variant="display" color="on-image" className="text-6xl md:text-8xl">
              {isLoading ? '…' : place}
            </Text>
            {region ? (
              <Text variant="h3" color="on-image" className="opacity-90">
                {region}
              </Text>
            ) : null}

            <View className="mt-4 flex-row flex-wrap gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={openApp}
                className="flex-row items-center gap-2 rounded-full bg-primary px-6 py-3.5 active:opacity-90"
              >
                <Icon icon={Compass} color="on-primary" size={20} />
                <Text variant="label" color="on-primary">
                  Open in Roava
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={getApp}
                className="rounded-full bg-surface px-6 py-3.5 active:opacity-90"
              >
                <Text variant="label">Get the app</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* TASTE */}
        <View className="mx-auto w-full max-w-5xl gap-8 px-6 py-14 md:px-16 md:py-20">
          <Text variant="h1" className="text-center">
            What Roava shows you here
          </Text>
          <View className="flex-row flex-wrap justify-center gap-4">
            {FEATURES.map((f) => (
              <View
                key={f.title}
                className="w-full gap-2 rounded-2xl border border-border bg-surface p-5 md:w-[46%] lg:w-[23%]"
              >
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon icon={f.icon} color="primary" />
                </View>
                <Text variant="label">{f.title}</Text>
                <Text variant="body-sm" color="muted">
                  {f.body}
                </Text>
              </View>
            ))}
          </View>

          {/* GET ROAVA */}
          <View className="items-center gap-4 pt-4">
            <Text variant="h3">Get Roava</Text>
            <View className="flex-row flex-wrap justify-center gap-3">
              <StoreButton label="Google Play" href={PLAY_STORE_URL} />
              <StoreButton label="App Store" href={APP_STORE_URL} />
            </View>
            <Pressable accessibilityRole="button" onPress={getApp}>
              <Text variant="caption" color="primary">
                Or download the Android APK →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* FOOTER */}
        <View className="items-center gap-2 border-t border-border px-6 py-10">
          <View className="flex-row items-center gap-2">
            <AppLogo size={24} />
            <Text variant="label">Roava</Text>
          </View>
          <Text variant="body-sm" color="muted">
            Built by {MAKER}
          </Text>
          <Text variant="caption" color="muted" className="text-center">
            Travel that works offline.
            {data?.photoCredit ? ` · Photo: ${data.photoCredit} / Unsplash` : ''} · Map data ©
            OpenStreetMap
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

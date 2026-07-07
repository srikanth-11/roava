# Roava 🧭

**An offline-first travel companion.** Discover destinations, read forecasts, browse sights on a map, convert currency, track live flights, and plan trips — and keep almost all of it working with no connection.

🌐 **[roava.expo.app](https://roava.expo.app)**

## Screenshots

| Home                                         | Destination                                                    | Weather                                                    | Map                                                 |
| -------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| ![Home feed](docs/screenshots/home-feed.png) | ![Destination detail](docs/screenshots/destination-detail.png) | ![Weather forecast](docs/screenshots/weather-forecast.png) | ![Clustered map](docs/screenshots/map-clusters.png) |

| Trips                                                  | Budget                                           | Flights                                                | Favorites                                    |
| ------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------- |
| ![Trip itinerary](docs/screenshots/trip-itinerary.png) | ![Trip budget](docs/screenshots/trip-budget.png) | ![Flight tracker](docs/screenshots/flight-tracker.png) | ![Favorites](docs/screenshots/favorites.png) |

### Built to work offline

Airplane mode on, app killed and relaunched — your data is intact and every screen says exactly what it's serving:

| Detail from cache                                                    | Stale forecast, labeled                                        | Rates with their age                                         |
| -------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| ![Offline destination](docs/screenshots/offline-detail-snapshot.png) | ![Offline weather](docs/screenshots/offline-weather-stale.png) | ![Offline currency](docs/screenshots/currency-converter.png) |

## Features

- **Discovery** — trending cities with rich photography, debounced search with filters and history
- **Destination detail** — parallax hero, live weather / local time / currency cards that degrade independently, points of interest
- **Weather** — animated sun arc, hourly rail, 5-day forecast, air quality and UV
- **Maps** — MapLibre with clustered points of interest, your own custom pins, and distance/route measuring
- **Currency** — offline-capable converter with saved pairs and stale-if-error rates
- **Flights** — live aircraft tracking with a credit-budgeted polling strategy
- **Trips** — itineraries with drag-to-reorder days, budgets, packing lists, and autosaving notes, stored entirely on-device
- **Favorites** — swipe-to-remove with undo; photos served from cache offline
- **Settings** — theme, home currency, cache controls, and attributions
- **Sharing** — a shared destination link opens the app when installed and shows a web page otherwise

## Architecture

```
screens (routes only)
   ↓
features (feature UI + logic)
   ↓
hooks / RTK Query (data access never leaks upward)
   ↓
repositories (interfaces; live implementations, snapshots, TTL caches)
   ↓
services (HTTP client, per-API mapping, typed errors)
```

Offline-first is enforced at the repository layer: last-known-good snapshots, TTL + stale-if-error caches, and a persisted store — screens just render an "isStale" badge. Every async surface has loading, empty, error, and offline states.

## Tech stack

Expo · React Native (New Architecture) · TypeScript · Expo Router · Redux Toolkit + RTK Query · NativeWind · Reanimated · MMKV · MapLibre · FlashList · react-hook-form + zod · @gorhom/bottom-sheet

## Data sources

All keyless or free-tier, no billing account required:

| Data                           | Provider                         |
| ------------------------------ | -------------------------------- |
| Cities                         | GeoDB Cities                     |
| Photos                         | Unsplash                         |
| Weather / air quality          | OpenWeather                      |
| UV index                       | Open-Meteo                       |
| Points of interest & geocoding | OpenStreetMap (Overpass, Photon) |
| Map tiles                      | OpenFreeMap                      |
| Routing                        | OSRM                             |
| Exchange rates                 | open.er-api.com                  |
| Live flights                   | The OpenSky Network              |

## Getting started

Roava uses a development build (not Expo Go — MMKV and MapLibre are native modules).

```bash
npm install
cp .env.example .env          # add your API keys
npx expo run:android          # first run: builds + installs the dev client
npm start                     # thereafter: Metro
```

Quality gates: `npm run typecheck` · `npm run lint`.

## Deployment

- **Web** deploys to EAS Hosting on every push to `main`.
- **Android** builds run on EAS ([`docs/screenshots`](docs/screenshots) shows the app in action).

## License

MIT © Srikanth Kasireddy

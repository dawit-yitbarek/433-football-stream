# 433 Football Stream

A full-stack football streaming discovery project with a Node.js backend proxy/cache service and an Expo React Native mobile app.

## Overview

This repository contains two main workspaces:

- `backend/` - Express + TypeScript service that fetches football match stream metadata from an external API, validates available stream servers, caches results in Redis, and exposes a lightweight API.
- `mobile-app/` - Expo-based React Native app that consumes the backend API, displays live/upcoming matches, allows league filtering, schedules local notifications, and streams available channels.

## Backend

### Purpose
The backend retrieves football match data from an external streaming API and handles:

- API key rotation and rate-limit handling
- Redis caching for fast match results retrieval
- Stream endpoint validation via HEAD requests
- Scheduled background syncs and dynamic polling based on active match windows
- Serving match data to clients through `/api/matches`

### Key folders

- `src/config` - environment loading, Redis connection, logger setup
- `src/services` - external API fetching, stream verification, API key rotation
- `src/controllers` - API controller for match data retrieval
- `src/routes` - Express route definitions
- `src/jobs` - background polling and cron schedule logic
- `src/utils` - helper functions such as stream verification

### Startup

Required environment variables:

- `PORT` - port for the API server
- `REDIS_URL` - connection string for Redis
- `FOOTBALL_API_KEYS` - comma-separated API keys for the football stream provider
- `NODE_ENV` - environment mode
- `BACKEND_URL` - optional backend URL for frontend integration

Install dependencies and start:

```bash
cd backend
npm install
npm run dev
```

## Mobile App

### Purpose
The mobile app is an Expo React Native client that:

- Loads football match data from the backend
- Renders live and upcoming matches with league filters
- Manages scheduled local notifications for match kickoffs
- Plays selected stream channels using an embedded video player
- Supports navigation from match listings to match detail stream pages

### Key folders

- `app/` - Expo Router screens and layout
- `context/` - shared match data provider and notification handling
- `components/` - dashboard UI, match cards, channel selector, video player
- `config/` - API base URL and retry utilities
- `utils/` - notification scheduling and validation helpers

### Startup

Install dependencies and start Expo:

```bash
cd mobile-app
npm install
npm run start
```

Then use one of:

```bash
npm run android
npm run ios
npm run web
```

## Architecture

### Data flow

1. Backend cron jobs fetch match data from the external football stream API.
2. Matches are filtered by supported leagues and verified for available stream servers.
3. Valid results are cached in Redis under `matches:today`.
4. The mobile app fetches the cached match list from `/api/matches`.
5. Users can browse live/upcoming matches and open a match page to play one of the verified stream sources.

### Backend scheduling

- Initial cache warmup on startup
- Daily refresh at 00:00 UTC and 10:00 UTC
- Dynamic polling intervals based on active match windows and available API key capacity

## Important details

- The backend uses `node-cron` for scheduled polling and `redis` for caching.
- The service validates stream URLs before exposing matches to the mobile app.
- The mobile app uses Expo Notifications for local reminder scheduling and deep-linking.
- The mobile app uses `expo-router` and React Context for state management.

## Notes

- Ensure the backend is reachable by the mobile app, especially when using a local network emulator.
- Configure `EXPO_PUBLIC_API_BASE_URL` or `BACKEND_URL` as needed for proper API routing.
- Keep your API keys secure and provide multiple keys for better rate limit handling.

## Contact

For improvements or changes, update the `backend` and `mobile-app` modules separately and follow the structure described above.

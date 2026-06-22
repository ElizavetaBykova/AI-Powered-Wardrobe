# Wardrobe

A mobile app to digitise your wardrobe and get AI-powered outfit suggestions.

## Features

- Photograph clothing items and have them auto-analysed by AI (name, type, colour, style, season, occasion, warmth level)
- Browse your wardrobe in a grid
- Edit item details and add personal notes
- Generate outfit combinations from your wardrobe using AI

## Stack

- [Expo](https://expo.dev) (SDK 54) + React Native
- [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- [Supabase](https://supabase.com) for auth, database, and image storage
- [Claude API](https://console.anthropic.com) (Haiku) for clothing analysis and outfit generation

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_api_key
```

### 3. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Go to **Storage** and create a public bucket named `clothing-images`

### 4. Run

```bash
npx expo start
```

Open in [Expo Go](https://expo.dev/go) on Android/iOS, or press `w` for web.

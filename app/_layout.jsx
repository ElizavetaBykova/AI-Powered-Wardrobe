import 'react-native-url-polyfill/auto';
import { Stack, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, CormorantGaramond_300Light, CormorantGaramond_500Medium, CormorantGaramond_400Regular_Italic } from '@expo-google-fonts/cormorant-garamond';
import { supabase } from '../lib/supabase';
import SplashAnimation from '../components/SplashAnimation';

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);
  const [session, setSession] = useState(undefined);

  const [fontsLoaded] = useFonts({
    'CormorantGaramond-Light': CormorantGaramond_300Light,
    'CormorantGaramond-Medium': CormorantGaramond_500Medium,
    'CormorantGaramond-Italic': CormorantGaramond_400Regular_Italic,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded || session === undefined) {
    return <View style={{ flex: 1, backgroundColor: '#0A0A0A' }} />;
  }

  if (showIntro) {
    return <SplashAnimation onDone={() => setShowIntro(false)} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-item"
          options={{
            presentation: 'modal',
            title: 'ADD ITEM',
            headerStyle: { backgroundColor: '#FAFAFA' },
            headerTitleStyle: { fontFamily: 'CormorantGaramond-Medium', fontSize: 16, letterSpacing: 4 },
          }}
        />
        <Stack.Screen
          name="item/[id]"
          options={{
            title: 'PIÈCE',
            headerStyle: { backgroundColor: '#FAFAFA' },
            headerTitleStyle: { fontFamily: 'CormorantGaramond-Light', fontSize: 22, letterSpacing: 8 },
          }}
        />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
      {!session && <Redirect href="/auth" />}
    </>
  );
}

import 'react-native-url-polyfill/auto';
import { Stack, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-item"
          options={{
            presentation: 'modal',
            title: 'Add Clothing',
            headerStyle: { backgroundColor: '#FAFAFA' },
          }}
        />
        <Stack.Screen
          name="item/[id]"
          options={{
            title: 'Item Details',
            headerStyle: { backgroundColor: '#FAFAFA' },
          }}
        />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
      {!session && <Redirect href="/auth" />}
    </>
  );
}

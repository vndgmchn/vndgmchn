import { supabase } from '@/lib/supabase';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('appTheme').then(theme => {
      if (theme === 'dark' || theme === 'light') {
        Appearance.setColorScheme(theme);
      } else {
        Appearance.setColorScheme('light');
        AsyncStorage.setItem('appTheme', 'light');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setProfileExists(false);
        setInitialized(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfileExists(false);
        setInitialized(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const checkProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      setProfileExists(!error && data !== null);
      setInitialized(true);
    };

    checkProfile();
  }, [session]);

  useEffect(() => {
    if (!initialized || profileExists === null && session) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inCreateProfile = segments[0] === 'create-profile';
    const inAuth = segments[0] === 'auth';

    if (!session) {
      if (!inAuth) {
        router.replace('/auth');
      }
    } else if (session) {
      if (!profileExists && !inCreateProfile) {
        router.replace('/create-profile');
      } else if (profileExists && (inAuth || inCreateProfile || !segments[0])) {
        router.replace('/(tabs)');
      }
    }
  }, [session, profileExists, initialized, segments, router]);

  if (!initialized || (session && profileExists === null)) {
    return null; // A splash screen would be ideal here
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="create-profile" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="search" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="storefront/[handle]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

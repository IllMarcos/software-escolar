// app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseConfig.ts'; // CAMBIO: Importamos Supabase
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_500Medium, Montserrat_300Light } from '@expo-google-fonts/montserrat';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync();

// El tipo de usuario ahora es 'Session' de Supabase
function useProtectedRoute(session: Session | null | undefined) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (session === undefined) return;
    const inAuthGroup = segments[0] === 'login';
    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, segments, router]);
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_300Light, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold,
  });

  useEffect(() => {
    // CAMBIO: Usamos el listener de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useProtectedRoute(session);
  
  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (session !== undefined) {
        SplashScreen.hideAsync();
      }
    }
  }, [fontsLoaded, fontError, session]);

  if (!fontsLoaded && !fontError || session === undefined) {
    return null; 
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f7fa' }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="scanner" options={{ presentation: 'modal', contentStyle: { backgroundColor: 'transparent' }}} />
      </Stack>
    </View>
  );
}
// app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_500Medium, Montserrat_300Light } from '@expo-google-fonts/montserrat';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseConfig.ts';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync();

// CAMBIO 1: El hook ahora recibe una bandera 'isReady'
function useProtectedRoute(session: Session | null, isReady: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // CAMBIO 2: La lógica de navegación ahora espera a que isReady sea 'true'
    if (!isReady) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, segments, router, isReady]); // Se añade 'isReady' a las dependencias
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAppReady, setAppReady] = useState(false); // CAMBIO 3: Nuevo estado de control
  
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Se pasa el nuevo estado al hook
  useProtectedRoute(session ?? null, isAppReady);
  
  useEffect(() => {
    if ((fontsLoaded || fontError) && session !== undefined) {
      // CAMBIO 4: Cuando todo carga, marcamos la app como lista y ocultamos el splash
      setAppReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, session]);

  // Se renderiza siempre el Stack para que esté disponible
  return (
    <View style={{ flex: 1, backgroundColor: '#f4f7fa' }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" /> 
      </Stack>
    </View>
  );
}
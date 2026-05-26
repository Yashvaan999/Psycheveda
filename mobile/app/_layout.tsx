import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_400Regular,
    Lora_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="goals/[id]"
                  options={{
                    headerShown: true,
                    headerBackTitle: 'Back',
                    headerTitle: 'Goal Detail',
                    headerStyle: { backgroundColor: '#FBF9F4' },
                    headerTintColor: '#D97736',
                    headerTitleStyle: { fontFamily: 'Lora_700Bold', color: '#2D3631' },
                  }}
                />
                <Stack.Screen
                  name="journal-history"
                  options={{
                    headerShown: true,
                    headerBackTitle: 'Back',
                    headerTitle: 'Journal History',
                    headerStyle: { backgroundColor: '#FBF9F4' },
                    headerTintColor: '#D97736',
                    headerTitleStyle: { fontFamily: 'Lora_700Bold', color: '#2D3631' },
                  }}
                />
                <Stack.Screen
                  name="gratitude-history"
                  options={{
                    headerShown: true,
                    headerBackTitle: 'Back',
                    headerTitle: 'Gratitude History',
                    headerStyle: { backgroundColor: '#FBF9F4' },
                    headerTintColor: '#D97736',
                    headerTitleStyle: { fontFamily: 'Lora_700Bold', color: '#2D3631' },
                  }}
                />
              </Stack>
            </AuthProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

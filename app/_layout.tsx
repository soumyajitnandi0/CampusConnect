import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { OfflineBanner } from '../components/offline-banner';
import { AuthProvider } from '../contexts/auth.context';
import { EventsProvider } from '../contexts/events.context';
import { NetworkProvider } from '../contexts/network.context';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Suppress Expo Updates errors at the native level - set up immediately
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    // Suppress Expo Updates errors silently - check multiple patterns
    const errorMessage = error?.message || error?.toString() || '';
    if (
      errorMessage.includes('Failed to download remote update') ||
      errorMessage.includes('java.io.IOException') ||
      errorMessage.includes('remote update') ||
      errorMessage.includes('IOException') ||
      (errorMessage.includes('download') && errorMessage.includes('update')) ||
      // Suppress NativeWind dark mode error on web
      errorMessage.includes('Cannot manually set color scheme') ||
      errorMessage.includes('dark mode is type')
    ) {
      // Silently suppress - don't crash the app
      console.warn('[Suppressed]', errorMessage);
      return;
    }
    // Handle other errors normally
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Suppress NativeWind dark mode error on web
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    if (
      errorMessage.includes('Cannot manually set color scheme') ||
      errorMessage.includes('dark mode is type')
    ) {
      // Suppress NativeWind dark mode warning on web
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      // Suppress font loading errors related to updates
      const errorMessage = error?.message || error?.toString() || '';
      if (
        errorMessage.includes('Failed to download') ||
        errorMessage.includes('IOException') ||
        errorMessage.includes('remote update')
      ) {
        console.warn('[Suppressed] Font loading error related to updates:', errorMessage);
        return;
      }
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <NetworkProvider>
        <AuthProvider>
          <EventsProvider>
            <OfflineBanner />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(student)" options={{ headerShown: false }} />
              <Stack.Screen name="(organizer)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="light" />
          </EventsProvider>
        </AuthProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}

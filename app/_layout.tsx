import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../i18n';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store';
import { auth } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authAPI } from '@/services/api';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    PoppinsBold: require('@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf'),
    PoppinsSemiBold: require('@expo-google-fonts/poppins/600SemiBold/Poppins_600SemiBold.ttf'),
  });

  const { setUser, setLoading, isAuthenticated, isLoading, isRegistering } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Skip auto-login during registration flow
      if (useAuthStore.getState().isRegistering) {
        setLoading(false);
        return;
      }
      if (firebaseUser) {
        try {
          const response = await authAPI.login();
          setUser(response.data.user);
        } catch (err: any) {
          // User exists in Firebase but not registered in MongoDB yet
          if (err.response?.data?.error?.code === 'NOT_REGISTERED') {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Navigation guard: redirect based on auth state
  useEffect(() => {
    if (isLoading || isRegistering) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/feed');
    }
  }, [isAuthenticated, segments, isLoading, isRegistering]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoading]);

  if (!loaded || isLoading) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

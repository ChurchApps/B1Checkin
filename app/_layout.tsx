import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CheckinThemeProvider } from "../src/context/CheckinThemeContext";
import { ToastHost } from "../src/components/ui";
import "../src/i18n";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://b02de73c6c40f84c1360d6a3b8ffd3f7@o4510432524107776.ingest.us.sentry.io/4510443717591040",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()]

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  useEffect(() => {
    // Force hide splash screen after a timeout regardless of font loading
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 2000);

    if (loaded) {
      clearTimeout(timer);
      SplashScreen.hideAsync();
    }

    return () => clearTimeout(timer);
  }, [loaded]);

  return (
    <SafeAreaProvider>
      <CheckinThemeProvider>
        <ThemeProvider value={DefaultTheme}>
          <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom", animationDuration: 220 }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="lookup" />
            <Stack.Screen name="household" />
            <Stack.Screen name="selectChurch" />
            <Stack.Screen name="services" />
            <Stack.Screen name="selectGroup" />
            <Stack.Screen name="addGuest" />
            <Stack.Screen name="checkinComplete" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="printers" />
            <Stack.Screen name="setPin" />
            <Stack.Screen name="adminSettings" />
            <Stack.Screen name="privacyPolicy" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <ToastHost />
        </ThemeProvider>
      </CheckinThemeProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);

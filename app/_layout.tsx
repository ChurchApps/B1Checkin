import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
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
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({ SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf") });

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
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="lookup" />
        <Stack.Screen name="household" />
        <Stack.Screen name="selectChurch" />
        <Stack.Screen name="services" />
        <Stack.Screen name="service" />
        <Stack.Screen name="selectGroup" />
        <Stack.Screen name="addGuest" />
        <Stack.Screen name="checkinComplete" />
        <Stack.Screen name="printers" />
        <Stack.Screen name="privacyPolicy" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);

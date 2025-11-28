import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import "../src/i18n";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

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

export default RootLayout;

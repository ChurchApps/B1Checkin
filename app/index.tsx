import React, { useEffect, useRef, useCallback } from "react";
import { Image, Text, View } from "react-native";
import { router, useRootNavigationState, Href } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import { useTranslation } from "react-i18next";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { ApiHelper, CachedData, EnvironmentHelper, SessionHelper } from "../src/helpers";
import { useCheckinTheme } from "../src/context/CheckinThemeContext";
import { fonts, palette } from "../src/theme/tokens";

const IndeterminateBar: React.FC = () => {
  const position = useSharedValue(-0.4);

  useEffect(() => {
    position.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ left: `${position.value * 100}%` }));

  return (
    <View style={{ width: 200, height: 4, borderRadius: 2, backgroundColor: palette.line, overflow: "hidden" }}>
      <Animated.View style={[{ position: "absolute", width: "40%", height: 4, borderRadius: 2, backgroundColor: palette.b1 }, animatedStyle]} />
    </View>
  );
};

export default function Splash() {
  const { t } = useTranslation();
  const { loadTheme } = useCheckinTheme();
  const [statusMessage, setStatusMessage] = React.useState("");
  const navigationState = useRootNavigationState();
  const hasNavigated = useRef(false);
  const pendingNavigation = useRef<string | null>(null);

  const isNavigationReady = navigationState?.key != null;

  const safeNavigate = useCallback((path: string) => {
    if (hasNavigated.current) return;

    if (!isNavigationReady) {
      pendingNavigation.current = path;
      return;
    }

    try {
      hasNavigated.current = true;
      router.replace(path as Href);
    } catch (error) {
      console.error("Navigation error:", error);
      hasNavigated.current = false;
      setTimeout(() => {
        if (!hasNavigated.current) {
          try {
            hasNavigated.current = true;
            router.replace(path as Href);
          } catch (retryError) {
            console.error("Navigation retry failed:", retryError);
            hasNavigated.current = false;
          }
        }
      }, 500);
    }
  }, [isNavigationReady]);

  useEffect(() => {
    if (isNavigationReady && pendingNavigation.current && !hasNavigated.current) {
      const path = pendingNavigation.current;
      pendingNavigation.current = null;
      safeNavigate(path);
    }
  }, [isNavigationReady, safeNavigate]);

  useEffect(() => {
    EnvironmentHelper.init();
    setStatusMessage(t("splash.initializing"));

    const initTimer = setTimeout(() => {
      checkForUpdates();
    }, 100);

    return () => clearTimeout(initTimer);
  }, [t]);

  const checkForUpdates = async () => {
    try {
      if (!__DEV__) {
        setStatusMessage(t("splash.checkingUpdates"));

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          setStatusMessage(t("splash.downloadingUpdate"));
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
          return;
        }
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    }

    checkStoredCredentials();
  };

  const checkStoredCredentials = async () => {
    try {
      const [
        selectedChurchId,
        churchAppearance,
        savedPrinter,
        kioskPin,
        kioskLocked,
        stationMode
      ] = await AsyncStorage.multiGet([
        "@SelectedChurchId", "@ChurchAppearance", "@Printer", "@KioskPIN", "@KioskLocked", "@StationMode"
      ]);

      if (stationMode[1] === "manned") {
        CachedData.stationMode = "manned";
      }

      if (savedPrinter[1]) {
        try {
          const parsed = JSON.parse(savedPrinter[1]);
          if (!parsed.brand) parsed.brand = "Brother";
          CachedData.printer = parsed;
        } catch (error) {
          console.error("Error parsing saved printer:", error);
        }
      }

      if (kioskPin[1]) {
        CachedData.kioskPin = kioskPin[1];
      }
      if (kioskLocked[1] === "true") {
        CachedData.kioskLocked = true;
      }

      setStatusMessage(t("splash.loggingIn"));
      const churches = await SessionHelper.restore();
      if (!churches) {
        safeNavigate("/login");
        return;
      }

      if (selectedChurchId[1]) {
        const previousChurch = churches.find(uc => uc.church?.id?.toString() === selectedChurchId[1]);

        if (previousChurch?.church?.id) {
          setStatusMessage(t("splash.loadingChurch"));
          CachedData.userChurch = previousChurch;
          previousChurch.apis?.forEach(api => ApiHelper.setPermissions(api.keyName || "", api.jwt, api.permissions));

          try {
            CachedData.churchAppearance = await ApiHelper.getAnonymous("/settings/public/" + previousChurch.church.id, "MembershipApi");
            await AsyncStorage.setItem("@ChurchAppearance", JSON.stringify(CachedData.churchAppearance));
          } catch {
            if (churchAppearance[1]) CachedData.churchAppearance = JSON.parse(churchAppearance[1]);
          }

          loadTheme(previousChurch.church.id);
          safeNavigate("/services");
          return;
        }
      }

      safeNavigate("/selectChurch");
    } catch (error) {
      console.error("Auto-login error:", error);
      safeNavigate("/login");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF", gap: 40 }}>
      <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: "center" }}>
        <Image source={require("../src/images/logo1.png")} style={{ width: 160, height: 160, resizeMode: "contain" }} />
      </Animated.View>
      <View style={{ alignItems: "center", gap: 16 }}>
        <IndeterminateBar />
        <Text style={{ fontSize: 15, fontFamily: fonts.regular, color: palette.ink3 }}>{statusMessage}</Text>
      </View>
    </View>
  );
}

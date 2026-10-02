import React from "react";
import { Pressable, Text, View } from "react-native";
import WebView from "react-native-webview";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CachedData, FirebaseHelper, GuestRegisterHelper } from "../src/helpers";
import { useInactivityTimer } from "../src/hooks/useInactivityTimer";
import { useAppTheme } from "../src/theme";
import { Button } from "../src/components/ui";

const IDLE_SECONDS = 120;
// Typing inside the WebView never reaches React Native touch handlers, so report it as activity.
const ACTIVITY_SCRIPT = "document.addEventListener(\"input\", function () { window.ReactNativeWebView.postMessage(\"activity\"); }, true); true;";

const GuestRegister = () => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const subDomain = CachedData.userChurch?.church?.subDomain || "";
  const { isIdle, resetTimer } = useInactivityTimer(IDLE_SECONDS, true);

  // Popping back to lookup unmounts the WebView so one family's typed data never reaches the next.
  const done = React.useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/lookup");
  }, []);

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("GuestRegister");
    if (!subDomain) done();
  }, []);

  React.useEffect(() => { if (isIdle) done(); }, [isIdle, done]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }} onTouchStart={resetTimer}>
      <View style={{ paddingTop: insets.top, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel={String(t("common.back"))} onPress={done} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 17, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary }}>{t("lookup.registerGuest")}</Text>
          <Button label={t("common.done")} size="md" onPress={done} />
        </View>
      </View>
      {!!subDomain && (
        <WebView
          source={{ uri: GuestRegisterHelper.getUrl(subDomain, CachedData.serviceId) }}
          style={{ flex: 1 }}
          incognito
          cacheEnabled={false}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={req => GuestRegisterHelper.isAllowedNavigation(req.url, subDomain)}
          injectedJavaScript={ACTIVITY_SCRIPT}
          onMessage={resetTimer}
        />
      )}
    </View>
  );
};

export default GuestRegister;

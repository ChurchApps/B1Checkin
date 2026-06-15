import React from "react";
import { Pressable, Text, View } from "react-native";
import WebView from "react-native-webview";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FirebaseHelper } from "../src/helpers";
import { useAppTheme } from "../src/theme";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Privacy");
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <View style={{ paddingTop: insets.top, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel={String(t("common.back"))} onPress={() => router.back()} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 17, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary }}>{t("login.privacyPolicy")}</Text>
        </View>
      </View>
      <WebView source={{ uri: "https://churchapps.org/privacy" }} style={{ flex: 1 }} />
    </View>
  );
};

export default PrivacyPolicy;

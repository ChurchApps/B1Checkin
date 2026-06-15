import React from "react";
import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CachedData } from "../src/helpers";
import PinEntryModal from "../src/components/PinEntryModal";
import { useAppTheme } from "../src/theme";

const SetPin = () => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const handlePinSet = () => {
    router.replace("/services");
  };

  const getLogoUrl = () => {
    if (CachedData.churchAppearance?.logoLight) return { uri: CachedData.churchAppearance.logoLight };
    return require("../src/images/logo1.png");
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.canvas }}>
      <View style={{ backgroundColor: theme.colors.header, paddingTop: insets.top + theme.spacing.md, paddingBottom: theme.spacing.lg, alignItems: "center" }}>
        <Image source={getLogoUrl()} style={{ width: 220, height: 48, resizeMode: "contain" }} />
      </View>

      <View style={{ alignItems: "center", paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.xl, gap: theme.spacing.sm }}>
        <Text style={{ fontSize: 24, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary, textAlign: "center" }}>{t("setPin.title")}</Text>
        <Text style={{ fontSize: 16, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, textAlign: "center" }}>{t("setPin.subtitle")}</Text>
      </View>

      <PinEntryModal
        visible={true}
        mode="setup"
        onSuccess={handlePinSet}
        onCancel={() => router.back()}
        dismissible={false}
      />
    </View>
  );
};

export default SetPin;

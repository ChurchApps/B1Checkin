import React from "react";
import { View, Text, Image } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { CachedData, StyleConstants, DimensionHelper } from "../src/helpers";
import PinEntryModal from "../src/components/PinEntryModal";

const SetPin = () => {
  const { t } = useTranslation();

  const handlePinSet = () => {
    router.replace("/services");
  };

  const getLogoUrl = () => {
    if (CachedData.churchAppearance?.logoLight) return { uri: CachedData.churchAppearance.logoLight };
    return require("../src/images/logo1.png");
  };

  return (
    <View style={setPinStyles.container}>
      <View style={setPinStyles.logoSection}>
        <Image source={getLogoUrl()} style={setPinStyles.logo} />
      </View>

      <View style={setPinStyles.content}>
        <Text style={setPinStyles.title}>{t("setPin.title")}</Text>
        <Text style={setPinStyles.subtitle}>{t("setPin.subtitle")}</Text>
      </View>

      <PinEntryModal
        visible={true}
        mode="setup"
        onSuccess={handlePinSet}
        onCancel={() => {}}
        dismissible={false}
      />
    </View>
  );
};

const setPinStyles = {
  container: {
    flex: 1,
    backgroundColor: StyleConstants.ghostWhite,
  },
  logoSection: {
    backgroundColor: StyleConstants.baseColor,
    paddingVertical: DimensionHelper.wp("8%"),
    alignItems: "center",
  },
  logo: {
    width: DimensionHelper.wp("40%"),
    height: DimensionHelper.wp("12%"),
    resizeMode: "contain" as const,
  },
  content: {
    alignItems: "center",
    paddingTop: DimensionHelper.wp("6%"),
    paddingHorizontal: DimensionHelper.wp("8%"),
  },
  title: {
    fontSize: DimensionHelper.wp("5.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    marginBottom: DimensionHelper.wp("2%"),
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: DimensionHelper.wp("3.8%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.grayColor,
    textAlign: "center" as const,
  },
};

export default SetPin;

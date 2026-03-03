import React from "react";
import { View, Text, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ripple from "react-native-material-ripple";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import PinEntryModal from "../src/components/PinEntryModal";
import { CachedData, StyleConstants, DimensionHelper, screenNavigationProps } from "../src/helpers";

interface Props { navigation: screenNavigationProps; }

const AdminSettings = (props: Props) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showChangePinModal, setShowChangePinModal] = React.useState(false);

  const handleChangeService = () => {
    router.replace("/services");
  };

  const handleChangePrinter = () => {
    router.navigate("/printers");
  };

  const handleChangePin = () => {
    setShowChangePinModal(true);
  };

  const handleLogout = () => {
    Alert.alert(
      t("header.secretMenuTitle"),
      t("header.logoutConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.logout"),
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              "@Email", "@Password", "@SelectedChurchId",
              "@ChurchAppearance", "@UserChurches", "@Login",
              "@KioskPIN", "@KioskLocked"
            ]);
            CachedData.userChurch = null;
            CachedData.churchAppearance = null;
            CachedData.kioskPin = "";
            CachedData.kioskLocked = false;
            router.replace("/login");
          }
        }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  const menuItems = [
    { icon: "exchange" as const, label: t("admin.changeService"), onPress: handleChangeService, destructive: false },
    { icon: "print" as const, label: t("admin.changePrinter"), onPress: handleChangePrinter, destructive: false },
    { icon: "lock" as const, label: CachedData.kioskPin ? t("admin.changePin") : t("admin.setPin"), onPress: handleChangePin, destructive: false },
    { icon: "sign-out" as const, label: t("common.logout"), onPress: handleLogout, destructive: true },
  ];

  return (
    <View style={adminStyles.container}>
      <Header navigation={props.navigation} prominentLogo={true} />
      <Subheader icon="⚙️" title={t("admin.title")} subtitle={t("admin.subtitle")} />

      <View style={adminStyles.mainContent}>
        {menuItems.map((item, index) => (
          <Ripple
            key={index}
            style={[adminStyles.menuCard, item.destructive && adminStyles.destructiveCard]}
            onPress={item.onPress}
          >
            <View style={[adminStyles.iconContainer, item.destructive && adminStyles.destructiveIconContainer]}>
              <FontAwesome
                name={item.icon}
                size={DimensionHelper.wp("5%")}
                color={item.destructive ? StyleConstants.redColor : StyleConstants.baseColor}
              />
            </View>
            <Text style={[adminStyles.menuLabel, item.destructive && adminStyles.destructiveText]}>
              {item.label}
            </Text>
            <Text style={[adminStyles.arrow, item.destructive && adminStyles.destructiveText]}>›</Text>
          </Ripple>
        ))}
      </View>

      <View style={[adminStyles.buttonContainer, { paddingBottom: insets.bottom + DimensionHelper.wp("3%") }]}>
        <Ripple style={adminStyles.backButton} onPress={handleBack}>
          <FontAwesome
            name="arrow-left"
            size={DimensionHelper.wp("4%")}
            color={StyleConstants.whiteColor}
            style={adminStyles.buttonIcon}
          />
          <Text style={adminStyles.backButtonText}>{t("admin.backToKiosk")}</Text>
        </Ripple>
      </View>

      <PinEntryModal
        visible={showChangePinModal}
        mode={CachedData.kioskPin ? "change" : "setup"}
        onSuccess={() => setShowChangePinModal(false)}
        onCancel={() => setShowChangePinModal(false)}
      />
    </View>
  );
};

const adminStyles = {
  container: {
    flex: 1,
    backgroundColor: StyleConstants.ghostWhite,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingTop: DimensionHelper.wp("2%"),
  },
  menuCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    marginVertical: DimensionHelper.wp("1.5%"),
    padding: DimensionHelper.wp("4%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    shadowColor: StyleConstants.baseColor,
    flexDirection: "row" as const,
    alignItems: "center",
    minHeight: DimensionHelper.wp("16%"),
  },
  destructiveCard: {
    borderWidth: 1,
    borderColor: StyleConstants.redColor + "30",
  },
  iconContainer: {
    width: DimensionHelper.wp("10%"),
    height: DimensionHelper.wp("10%"),
    borderRadius: DimensionHelper.wp("5%"),
    backgroundColor: StyleConstants.baseColor + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: DimensionHelper.wp("3%"),
  },
  destructiveIconContainer: {
    backgroundColor: StyleConstants.redColor + "15",
  },
  menuLabel: {
    flex: 1,
    fontSize: DimensionHelper.wp("4.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
  },
  destructiveText: {
    color: StyleConstants.redColor,
  },
  arrow: {
    fontSize: DimensionHelper.wp("6%"),
    color: StyleConstants.baseColor,
    opacity: 0.7,
    marginLeft: DimensionHelper.wp("2%"),
  },
  buttonContainer: {
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingVertical: DimensionHelper.wp("3%"),
    backgroundColor: StyleConstants.whiteColor,
    borderTopWidth: 1,
    borderTopColor: StyleConstants.baseColor + "20",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    flexDirection: "row" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: StyleConstants.baseColor,
    borderRadius: 8,
    paddingVertical: DimensionHelper.wp("3.5%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: DimensionHelper.wp("2%"),
  },
  backButtonText: {
    fontSize: DimensionHelper.wp("4.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.whiteColor,
  },
};

export default AdminSettings;

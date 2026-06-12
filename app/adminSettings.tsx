import React from "react";
import { Alert, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import PinEntryModal from "../src/components/PinEntryModal";
import { CachedData, screenNavigationProps } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Button, IconName, ListRow, Screen } from "../src/components/ui";
import { MaterialIcons } from "@expo/vector-icons";

interface Props { navigation: screenNavigationProps; }

const getVersion = () => {
  const pkg = require("../package.json");
  return "v" + pkg.version;
};

const AdminSettings = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [showChangePinModal, setShowChangePinModal] = React.useState(false);
  const [manned, setManned] = React.useState(CachedData.stationMode === "manned");

  const toggleManned = (value: boolean) => {
    setManned(value);
    CachedData.stationMode = value ? "manned" : "self";
    AsyncStorage.setItem("@StationMode", CachedData.stationMode).catch(() => {});
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
              "@Email",
              "@Password",
              "@SelectedChurchId",
              "@ChurchAppearance",
              "@UserChurches",
              "@Login",
              "@KioskPIN",
              "@KioskLocked"
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

  const menuItems: { icon: IconName; label: string; onPress: () => void; destructive?: boolean }[] = [
    { icon: "swap-horiz", label: t("admin.changeService"), onPress: () => router.replace("/services") },
    { icon: "print", label: t("admin.changePrinter"), onPress: () => router.navigate("/printers") },
    { icon: "lock-outline", label: CachedData.kioskPin ? t("admin.changePin") : t("admin.setPin"), onPress: () => setShowChangePinModal(true) }
  ];

  const getIconCircle = (icon: IconName, destructive?: boolean) => (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: destructive ? theme.colors.dangerBg : theme.colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
      <MaterialIcons name={icon} size={22} color={destructive ? theme.colors.danger : theme.colors.primary} />
    </View>
  );

  const footer = <Button label={t("admin.backToKiosk")} size="xl" icon="arrow-back" fullWidth onPress={() => router.back()} />;

  return (
    <>
      <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} footer={footer} scroll>
        <Subheader compact title={t("admin.title")} subtitle={t("admin.subtitle")} />
        {menuItems.map((item, index) => (
          <ListRow
            key={index}
            title={item.label}
            left={getIconCircle(item.icon)}
            right="chevron"
            onPress={item.onPress}
            style={{ marginBottom: theme.spacing.sm }}
          />
        ))}
        <ListRow
          title={t("admin.mannedMode")}
          subtitle={t("admin.mannedModeHint")}
          left={getIconCircle("badge")}
          right={<Switch value={manned} onValueChange={toggleManned} trackColor={{ true: theme.colors.primary }} />}
          onPress={() => toggleManned(!manned)}
          style={{ marginBottom: theme.spacing.sm }}
        />
        <View style={{ height: theme.spacing.lg }} />
        <ListRow
          title={t("common.logout")}
          left={getIconCircle("logout", true)}
          right={<MaterialIcons name="chevron-right" size={28} color={theme.colors.danger} />}
          onPress={handleLogout}
        />
        <Text style={{ textAlign: "center", fontSize: 13, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, marginTop: theme.spacing.xl }}>{getVersion()}</Text>
      </Screen>

      <PinEntryModal
        visible={showChangePinModal}
        mode={CachedData.kioskPin ? "change" : "setup"}
        onSuccess={() => setShowChangePinModal(false)}
        onCancel={() => setShowChangePinModal(false)}
      />
    </>
  );
};

export default AdminSettings;

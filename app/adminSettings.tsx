import React from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import PinEntryModal from "../src/components/PinEntryModal";
import { ApiHelper, CachedData, screenNavigationProps } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Button, IconName, ListRow, Screen, Sheet, TextField } from "../src/components/ui";
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
  const [broadcastOpen, setBroadcastOpen] = React.useState(false);
  const [services, setServices] = React.useState<any[]>([]);
  const [broadcastServiceId, setBroadcastServiceId] = React.useState("");
  const [broadcastMessage, setBroadcastMessage] = React.useState("");
  const [broadcastConfirm, setBroadcastConfirm] = React.useState("");
  const [broadcastBusy, setBroadcastBusy] = React.useState(false);
  const [broadcastResult, setBroadcastResult] = React.useState("");

  const openBroadcast = () => {
    setBroadcastResult("");
    setBroadcastMessage("");
    setBroadcastConfirm("");
    setBroadcastServiceId(CachedData.serviceId || "");
    setBroadcastOpen(true);
    ApiHelper.get("/services", "AttendanceApi").then(data => setServices(Array.isArray(data) ? data : [])).catch(() => setServices([]));
  };

  const sendBroadcast = () => {
    if (broadcastBusy || !broadcastServiceId || broadcastMessage.trim().length < 2) return;
    setBroadcastBusy(true);
    setBroadcastResult("");
    ApiHelper.post("/checkin/broadcast", { serviceId: broadcastServiceId, message: broadcastMessage.trim() }, "AttendanceApi")
      .then((res: any) => {
        setBroadcastBusy(false);
        setBroadcastResult(t("admin.broadcastResult", { sent: res?.sent ?? 0, skipped: (res?.skippedOptedOut ?? 0) + (res?.skippedNoPhone ?? 0) }));
      })
      .catch((err: any) => {
        setBroadcastBusy(false);
        setBroadcastResult(/No SMS provider/i.test(String(err?.message || "")) ? t("admin.noProvider") : t("admin.broadcastFailed"));
      });
  };

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
    { icon: "lock-outline", label: CachedData.kioskPin ? t("admin.changePin") : t("admin.setPin"), onPress: () => setShowChangePinModal(true) },
    { icon: "campaign", label: t("admin.emergencyBroadcast"), onPress: openBroadcast, destructive: true }
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
            left={getIconCircle(item.icon, item.destructive)}
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

      <Sheet visible={broadcastOpen} onClose={() => setBroadcastOpen(false)} maxWidth={480}>
        <View style={{ gap: theme.spacing.md }}>
          <Text style={{ fontSize: 22, fontFamily: theme.fonts.semibold, color: theme.colors.danger }}>{t("admin.emergencyBroadcast")}</Text>
          {!broadcastResult && (
            <>
              <Text style={{ fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.textSecondary }}>{t("admin.broadcastHint")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
                {services.map(s => {
                  const active = broadcastServiceId === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      accessibilityRole="button"
                      onPress={() => setBroadcastServiceId(s.id)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: theme.spacing.md,
                        borderRadius: theme.radius.md,
                        borderWidth: active ? 0 : 1.5,
                        borderColor: theme.colors.primaryBorder,
                        backgroundColor: active ? theme.colors.button : theme.colors.surface
                      }}>
                      <Text style={{ fontSize: 15, fontFamily: theme.fonts.medium, color: active ? theme.colors.onButton : theme.colors.primary }}>{s.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextField label={t("admin.broadcastMessage")} value={broadcastMessage} onChangeText={setBroadcastMessage} autoCapitalize="sentences" />
              <TextField label={t("admin.broadcastConfirmLabel")} placeholder="EMERGENCY" value={broadcastConfirm} onChangeText={setBroadcastConfirm} autoCapitalize="characters" autoCorrect={false} />
              <Button
                label={t("admin.broadcastSend")}
                variant="danger"
                size="lg"
                fullWidth
                loading={broadcastBusy}
                disabled={!broadcastServiceId || broadcastMessage.trim().length < 2 || broadcastConfirm.trim().toUpperCase() !== "EMERGENCY"}
                onPress={sendBroadcast}
              />
            </>
          )}
          {!!broadcastResult && <Text style={{ fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary, textAlign: "center" }}>{broadcastResult}</Text>}
          <Button label={broadcastResult ? t("common.ok") : t("common.cancel")} variant="ghost" fullWidth onPress={() => setBroadcastOpen(false)} />
        </View>
      </Sheet>
    </>
  );
};

export default AdminSettings;

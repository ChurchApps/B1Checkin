import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import PrintUI from "../src/components/PrintUI";
import { ApiHelper, ArrayHelper, CachedData, EnvironmentHelper, FirebaseHelper, LabelHelper, PersonInterface, PrinterLog, screenNavigationProps, VisitInterface } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Avatar, Button, Screen, Toast } from "../src/components/ui";

interface Props { navigation: screenNavigationProps }

const CODE_PATTERN = /^[23456789BCDFGHJKLMNPQRSTVWXYZ]{4}$/;

const Scan = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = React.useState<"front" | "back">("front");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [people, setPeople] = React.useState<PersonInterface[]>([]);
  const [htmlLabels, setHtmlLabels] = React.useState<string[]>([]);
  const lastScanRef = React.useRef<{ code: string; at: number }>({ code: "", at: 0 });

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Scan");
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission?.granted]);

  const fail = (message: string) => {
    setError(message);
    setBusy(false);
  };

  const lookupCode = async (code: string) => {
    setBusy(true);
    setError("");
    try {
      const visits: VisitInterface[] = await ApiHelper.get("/visits/code/" + code, "AttendanceApi");
      if (!Array.isArray(visits) || visits.length === 0) { fail(t("scan.codeNotFound")); return; }
      const ids: string[] = ArrayHelper.getUniqueValues(visits, "personId");
      const found: PersonInterface[] = await ApiHelper.get("/people/ids?ids=" + encodeURIComponent(ids.join(",")), "MembershipApi");
      setPeople(found);
      if (!CachedData.printer?.ipAddress) {
        Toast.show(t("scan.noPrinter"), "info");
        router.replace("/lookup");
        return;
      }
      PrinterLog.add("--- Print from QR scan ---");
      const labels = await LabelHelper.getAllLabelsFor(visits, found, code);
      if (labels.length === 0) {
        Toast.show(t("scan.nothingToPrint"), "info");
        router.replace("/lookup");
        return;
      }
      setHtmlLabels(labels);
    } catch {
      fail(t("scan.lookupError"));
    }
  };

  const handleScanned = ({ data }: { data: string }) => {
    if (busy || htmlLabels.length > 0) return;
    const code = String(data || "").trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) return;
    const now = Date.now();
    if (lastScanRef.current.code === code && now - lastScanRef.current.at < 4000) return;
    lastScanRef.current = { code, at: now };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    lookupCode(code);
  };

  const handlePrintComplete = () => {
    setHtmlLabels([]);
    setBusy(false);
    Toast.show(t("scan.printed"), "success");
    router.replace("/lookup");
  };

  const camera = permission?.granted
    ? (
      <View style={{ flex: 1, borderRadius: theme.radius.lg, overflow: "hidden", backgroundColor: "#000" }}>
        <CameraView
          style={{ flex: 1 }}
          facing={facing}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleScanned}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("scan.flipCamera")}
          onPress={() => setFacing(facing === "front" ? "back" : "front")}
          style={{ position: "absolute", bottom: theme.spacing.md, right: theme.spacing.md, width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="flip-camera-android" size={26} color="#FFFFFF" />
        </Pressable>
      </View>
    )
    : (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg }}>
        <MaterialIcons name="no-photography" size={52} color={theme.colors.textMuted} />
        <Text style={{ fontSize: 17, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary, textAlign: "center" }}>{t("scan.permissionMessage")}</Text>
        {permission?.canAskAgain && <Button label={t("scan.grantPermission")} onPress={requestPermission} />}
      </View>
    );

  const printing = (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ ...theme.type.h2, color: theme.colors.textPrimary }}>{t("scan.printing")}</Text>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: theme.spacing.lg, flexWrap: "wrap" }}>
        {people.slice(0, 5).map(person => {
          const name = person.name?.display || person.displayName || "";
          return (
            <View key={person.id} style={{ alignItems: "center", gap: 6, maxWidth: 88 }}>
              <Avatar name={name} photoUri={person.photo ? EnvironmentHelper.ContentRoot + person.photo : undefined} size={56} />
              <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary }}>{person.name?.first || name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <>
      <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} scroll={false}>
        <Subheader title={t("scan.title")} subtitle={t("scan.subtitle")} onBack={() => router.back()} />
        {busy ? printing : camera}
        {!!error && (
          <Text style={{ fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.danger, textAlign: "center", marginTop: theme.spacing.md }}>{error}</Text>
        )}
      </Screen>
      {htmlLabels.length > 0 && (
        <PrintUI htmlLabels={htmlLabels} onLog={PrinterLog.add} onPrintComplete={handlePrintComplete} />
      )}
    </>
  );
};

export default Scan;

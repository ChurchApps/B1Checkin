import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BarcodeType, CameraView, useCameraPermissions } from "expo-camera";
import { ScanCodeHelper } from "../helpers";
import { useAppTheme } from "../theme";
import { Button } from "./ui";

interface Props {
  onCode: (code: string) => void;
  barcodeTypes?: BarcodeType[];
  initialFacing?: "front" | "back";
  disabled?: boolean;
}

const CodeScanner = ({ onCode, barcodeTypes = ["qr"], initialFacing = "front", disabled }: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = React.useState<"front" | "back">(initialFacing);
  const lastScanRef = React.useRef({ code: "", at: 0 });

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission?.granted]);

  const handleScanned = ({ data }: { data: string }) => {
    if (disabled) return;
    const code = ScanCodeHelper.parse(data);
    if (!code) return;
    const now = Date.now();
    if (ScanCodeHelper.isRepeat(lastScanRef.current, code, now)) return;
    lastScanRef.current = { code, at: now };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onCode(code);
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg }}>
        <MaterialIcons name="no-photography" size={52} color={theme.colors.textMuted} />
        <Text style={{ fontSize: 17, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary, textAlign: "center" }}>{t("scan.permissionMessage")}</Text>
        {permission?.canAskAgain && <Button label={t("scan.grantPermission")} onPress={requestPermission} />}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, borderRadius: theme.radius.lg, overflow: "hidden", backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        facing={facing}
        barcodeScannerSettings={{ barcodeTypes }}
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
  );
};

export default CodeScanner;

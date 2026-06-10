import React from "react";
import { Image, Pressable, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CachedData, screenNavigationProps } from "../helpers";
import { router } from "expo-router";
import PinEntryModal from "./PinEntryModal";
import { useAppTheme } from "../theme";
import * as PrinterHelper from "printer-helper";

interface Props {
  navigation?: screenNavigationProps,
  logo?: boolean,
  prominentLogo?: boolean,
  title?: string,
  subtitle?: string
}

const Header = (props: Props) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = React.useState("");
  const [logoTapCount, setLogoTapCount] = React.useState(0);
  const logoTapTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const pendingAdminAction = React.useRef<"settings" | "printers">("settings");

  const handlePrinterTap = () => {
    if (CachedData.kioskLocked && CachedData.kioskPin) {
      pendingAdminAction.current = "printers";
      setShowPinModal(true);
    } else {
      router.navigate("/printers");
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    if (pendingAdminAction.current === "printers") {
      router.navigate("/printers");
    } else {
      router.navigate("/adminSettings");
    }
    pendingAdminAction.current = "settings";
  };

  const handleLogoTap = () => {
    if (logoTapTimeoutRef.current) clearTimeout(logoTapTimeoutRef.current);
    const newTapCount = logoTapCount + 1;
    setLogoTapCount(newTapCount);

    if (newTapCount >= 7) {
      setLogoTapCount(0);
      if (CachedData.kioskLocked && CachedData.kioskPin) {
        pendingAdminAction.current = "settings";
        setShowPinModal(true);
      } else {
        router.navigate("/adminSettings");
      }
    } else {
      logoTapTimeoutRef.current = setTimeout(() => {
        setLogoTapCount(0);
      }, 2000);
    }
  };

  const init = () => {
    try {
      PrinterHelper.checkInit(CachedData.printer?.ipAddress || "", CachedData.printer?.model || "", CachedData.printer?.brand || "");
      const subscription = PrinterHelper.addStatusListener((event) => {
        if (event.status.indexOf("ready") > -1) CachedData.printer.ipAddress = "ready";
        setStatus(event.status);
      });
      return () => subscription.remove();
    } catch {
      // PrinterHelper not available on this platform
    }
  };

  React.useEffect(init, []);

  const getLogoUrl = () => {
    if (CachedData.churchAppearance?.logoLight) return { uri: CachedData.churchAppearance?.logoLight };
    else return require("../images/logo1.png");
  };

  const getPrinterDotColor = () => {
    const s = status.toLowerCase();
    if (s.indexOf("ready") > -1) return theme.colors.success;
    if (s.indexOf("error") > -1 || s.indexOf("fail") > -1) return theme.colors.danger;
    return theme.colors.gold;
  };

  const barStyle = theme.colors.onHeader === "#FFFFFF" ? "light-content" : "dark-content";

  const pinModal = (
    <PinEntryModal
      visible={showPinModal}
      mode="verify"
      onSuccess={handlePinSuccess}
      onCancel={() => setShowPinModal(false)}
    />
  );

  if (props.prominentLogo) {
    return (
      <View>
        <StatusBar backgroundColor={theme.colors.header} barStyle={barStyle} />
        <View style={{ backgroundColor: theme.colors.header, paddingTop: insets.top + theme.spacing.md, paddingBottom: theme.spacing.lg, paddingHorizontal: theme.spacing.xl, alignItems: "center" }}>
          <Pressable
            onPress={handleLogoTap}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md + 2,
              height: 56,
              width: "100%",
              maxWidth: 280,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: theme.spacing.xl,
              ...theme.elevation.e1
            }}>
            <Image source={getLogoUrl()} style={{ width: 232, height: 40, resizeMode: "contain" }} />
          </Pressable>
          {!!CachedData.printer?.ipAddress && (
            <Pressable
              accessibilityLabel="printer status"
              onPress={handlePrinterTap}
              style={{ position: "absolute", right: 0, bottom: 0, width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getPrinterDotColor() }} />
            </Pressable>
          )}
        </View>
        {pinModal}
      </View>
    );
  }

  return (
    <View>
      <StatusBar backgroundColor={theme.colors.surface} barStyle="dark-content" />
      <View style={{
        backgroundColor: theme.colors.surface,
        paddingTop: insets.top,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        ...theme.elevation.e2
      }}>
        <View style={{ height: 64, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.lg }}>
          <Pressable onPress={handleLogoTap} style={{ alignItems: "center", justifyContent: "center", height: 64, paddingHorizontal: theme.spacing.lg }}>
            <Image source={getLogoUrl()} style={{ width: 160, height: 36, resizeMode: "contain" }} />
          </Pressable>
          {!!props.title && <Text style={{ position: "absolute", right: theme.spacing.lg, color: theme.colors.textMuted, fontSize: 15, fontFamily: theme.fonts.medium }}>{props.title}</Text>}
        </View>
      </View>
      {pinModal}
    </View>
  );
};

export default Header;

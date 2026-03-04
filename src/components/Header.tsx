import React from "react";
import { View, Image, StatusBar, Text, Dimensions, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ripple from "react-native-material-ripple";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CachedData, screenNavigationProps, Styles, StyleConstants, DimensionHelper } from "../helpers";
import { router } from "expo-router";
import PinEntryModal from "./PinEntryModal";
import { useCheckinTheme } from "../context/CheckinThemeContext";
import * as PrinterHelper from "printer-helper";

interface Props {
  navigation: screenNavigationProps,
  logo?: boolean,
  prominentLogo?: boolean,
  title?: string,
  subtitle?: string
}

const Header = (props: Props) => {
  const { t } = useTranslation();
  const { theme } = useCheckinTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = React.useState("");
  const [landscape, setLandscape] = React.useState(false);
  const [logoTapCount, setLogoTapCount] = React.useState(0);
  const logoTapTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const pendingAdminAction = React.useRef<"settings" | "printers">("settings");

  const handleClick = () => {
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
    // Clear any existing timeout
    if (logoTapTimeoutRef.current) {
      clearTimeout(logoTapTimeoutRef.current);
    }

    // Increment tap count
    const newTapCount = logoTapCount + 1;
    setLogoTapCount(newTapCount);

    if (newTapCount >= 7) {
      setLogoTapCount(0);

      if (CachedData.kioskLocked && CachedData.kioskPin) {
        // PIN is set — require PIN to access admin settings
        pendingAdminAction.current = "settings";
        setShowPinModal(true);
      } else {
        // No PIN set — go directly to admin settings
        router.navigate("/adminSettings");
      }
    } else {
      // Reset tap count after 2 seconds of no taps
      logoTapTimeoutRef.current = setTimeout(() => {
        setLogoTapCount(0);
      }, 2000);
    }
  };

  const receiveNativeStatus = (receivedStatus: string) => { setStatus(receivedStatus); };

  const init = () => {
    try {
      console.log("print", CachedData.printer);
      PrinterHelper.checkInit(CachedData.printer?.ipAddress || "", CachedData.printer?.model || "");
      const subscription = PrinterHelper.addStatusListener((event) => {
        if (event.status.indexOf("ready") > -1) CachedData.printer.ipAddress = "ready";
        setStatus(event.status);
      });
      return () => subscription.remove();
    } catch (e) {
      console.log("PrinterHelper not available:", e);
    }
  };

  const getVersion = () => {
    const pkg = require("../../package.json");
    return "v" + pkg.version;
  };

  React.useEffect(init, []);

  const isLandscape = () => {
    const dim = Dimensions.get("screen");
    return dim.width >= dim.height;
  };

  React.useEffect(() => {
    Dimensions.addEventListener("change", () => {
      isLandscape() ? setLandscape(true) : setLandscape(false);
    });
  }, []);

  React.useEffect(() => {
    Dimensions.addEventListener("change", () => {
      isLandscape() ? setLandscape(true) : setLandscape(false);
    });
  }, [landscape]);

  const getLogoUrl = () => {
    if (CachedData.churchAppearance?.logoLight) return { uri: CachedData.churchAppearance?.logoLight };
    else return require("../images/logo1.png");
  };

  if (props.prominentLogo) {
    return (
      <View style={{ backgroundColor: StyleConstants.ghostWhite }}>
        <StatusBar backgroundColor={theme.colors.headerBackground} />

        {/* Compact Printer Status Bar */}
        <Ripple style={[Styles.printerStatus, { paddingTop: insets.top, height: undefined, backgroundColor: theme.colors.headerBackground }]} onPress={() => { handleClick(); }}>
          <Text style={{ backgroundColor: theme.colors.headerBackground, color: theme.colors.primaryContrast }}>{getVersion()} - {status}</Text>
        </Ripple>

        {/* Logo Section with Dark Blue Background */}
        <View style={[headerStyles.logoSection, { backgroundColor: theme.colors.headerBackground }]}>
          {/* Prominent Church Logo in White Box - Tappable for secret logout */}
          <Ripple style={headerStyles.logoContainer} onPress={handleLogoTap}>
            <Image source={getLogoUrl()} style={headerStyles.prominentLogo} />
          </Ripple>
        </View>

        <PinEntryModal
          visible={showPinModal}
          mode="verify"
          onSuccess={handlePinSuccess}
          onCancel={() => setShowPinModal(false)}
        />
      </View>
    );
  }

  return (
    <View style={[props.logo !== false ? Styles.headerLogoView : { backgroundColor: "transparent" }, landscape && { maxHeight: props.logo ? "30%" : DimensionHelper.wp("50%") }]}>
      <StatusBar backgroundColor={theme.colors.headerBackground} />
      <Ripple style={[Styles.printerStatus, { paddingTop: insets.top, height: undefined, backgroundColor: theme.colors.headerBackground }]} onPress={() => { handleClick(); }}>
        <Text style={{ backgroundColor: theme.colors.headerBackground, color: theme.colors.primaryContrast }}>{getVersion()} - {status}</Text>
      </Ripple>
      {props.logo !== false && (
        <Ripple onPress={handleLogoTap} style={{ alignItems: "center", justifyContent: "center" }}>
          <Image source={getLogoUrl()} style={[Styles.headerLogoIcon, landscape && { maxHeight: "40%", top: "10%" }]} />
        </Ripple>
      )}
      <PinEntryModal
        visible={showPinModal}
        mode="verify"
        onSuccess={handlePinSuccess}
        onCancel={() => setShowPinModal(false)}
      />
    </View>
  );
};

// Professional tablet-optimized styles for prominent logo mode
const headerStyles = {
  // Logo Section (Dark blue background)
  logoSection: {
    backgroundColor: StyleConstants.baseColor, // Dark blue #1565C0
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingTop: DimensionHelper.wp("5%"),
    paddingBottom: DimensionHelper.wp("5%"),
    alignItems: "center"
  },

  // Prominent White Box for Logo within Blue Header
  logoContainer: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    width: DimensionHelper.wp("70%"), // 70% of blue box width
    height: DimensionHelper.wp("16%"),
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },

  prominentLogo: {
    width: DimensionHelper.wp("65%"), // Slightly smaller than container for padding
    height: DimensionHelper.wp("14%"),
    resizeMode: "contain"
  }
};

export default Header;


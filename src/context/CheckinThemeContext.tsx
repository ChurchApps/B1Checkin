import React, { createContext, useContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckinThemeConfig, CheckinThemeColors, AppThemeConfig, CheckinSettingsConfig } from "../helpers/CheckinThemeInterfaces";
import { CachedData } from "../helpers/CachedData";
import { ApiHelper } from "../helpers/ApiHelper";
import { StyleConstants } from "../helpers/Styles";

const DEFAULT_COLORS: CheckinThemeColors = {
  primary: StyleConstants.baseColor,
  primaryContrast: "#FFFFFF",
  secondary: StyleConstants.baseColor1,
  secondaryContrast: "#FFFFFF",
  headerBackground: StyleConstants.baseColor,
  subheaderBackground: "#568BDA",
  buttonBackground: StyleConstants.baseColor,
  buttonText: "#FFFFFF"
};

export const DEFAULT_THEME: CheckinThemeConfig = { colors: DEFAULT_COLORS, backgroundImage: "", idleScreen: { enabled: false, timeoutSeconds: 120, slides: [] } };

interface CheckinThemeContextType {
  theme: CheckinThemeConfig;
  loadTheme: (churchId: string) => Promise<void>;
  isLoaded: boolean;
}

const CheckinThemeContext = createContext<CheckinThemeContextType>({
  theme: DEFAULT_THEME,
  loadTheme: async () => {},
  isLoaded: false
});

export const useCheckinTheme = () => useContext(CheckinThemeContext);

function colorsFromAppTheme(appTheme: AppThemeConfig): CheckinThemeColors {
  const light = appTheme.light;
  return {
    primary: light.primary,
    primaryContrast: light.primaryContrast,
    secondary: light.secondary,
    secondaryContrast: light.primaryContrast,
    headerBackground: light.primary,
    subheaderBackground: light.secondary,
    buttonBackground: light.primary,
    buttonText: light.primaryContrast
  };
}

function mergeWithDefaults(data: Partial<CheckinThemeConfig>): CheckinThemeConfig {
  return {
    colors: { ...DEFAULT_COLORS, ...(data.colors || {}) },
    backgroundImage: data.backgroundImage ?? DEFAULT_THEME.backgroundImage,
    idleScreen: { ...DEFAULT_THEME.idleScreen, ...(data.idleScreen || {}) }
  };
}

export const CheckinThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<CheckinThemeConfig>(DEFAULT_THEME);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadTheme = async (churchId: string) => {
    try {
      // Load from cache first for instant display
      const cached = await AsyncStorage.getItem("@CheckinTheme");
      if (cached) {
        setTheme(mergeWithDefaults(JSON.parse(cached)));
      }

      // Fetch all public settings in one call
      const publicSettings = await ApiHelper.getAnonymous(
        "/settings/public/" + churchId,
        "MembershipApi"
      );

      // Try new unified appTheme first
      let colors: CheckinThemeColors = { ...DEFAULT_COLORS };
      let gotAppTheme = false;

      try {
        if (publicSettings?.appTheme) {
          const appThemeData: AppThemeConfig = typeof publicSettings.appTheme === "string"
            ? JSON.parse(publicSettings.appTheme) : publicSettings.appTheme;
          if (appThemeData && appThemeData.light) {
            colors = colorsFromAppTheme(appThemeData);
            gotAppTheme = true;
          }
        }
      } catch { /* invalid appTheme data */ }

      // Fall back to legacy checkinTheme if no appTheme
      if (!gotAppTheme) {
        try {
          if (publicSettings?.checkinTheme) {
            const legacyData = typeof publicSettings.checkinTheme === "string"
              ? JSON.parse(publicSettings.checkinTheme) : publicSettings.checkinTheme;
            if (legacyData && Object.keys(legacyData).length > 0) {
              const merged = mergeWithDefaults(legacyData);
              setTheme(merged);
              await AsyncStorage.setItem("@CheckinTheme", JSON.stringify(merged));
              setIsLoaded(true);
              return;
            }
          }
        } catch { /* no legacy theme either */ }
      }

      // Load checkinSettings for background image and idle screen
      let backgroundImage = "";
      let idleScreen = DEFAULT_THEME.idleScreen;
      try {
        if (publicSettings?.checkinSettings) {
          const settings: CheckinSettingsConfig = typeof publicSettings.checkinSettings === "string"
            ? JSON.parse(publicSettings.checkinSettings) : publicSettings.checkinSettings;
          backgroundImage = settings.backgroundImage || "";
          idleScreen = { ...DEFAULT_THEME.idleScreen, ...(settings.idleScreen || {}) };
        } else if (publicSettings?.checkinTheme) {
          // Legacy: extract non-color settings from old checkinTheme
          const legacy = typeof publicSettings.checkinTheme === "string"
            ? JSON.parse(publicSettings.checkinTheme) : publicSettings.checkinTheme;
          backgroundImage = legacy.backgroundImage || "";
          idleScreen = { ...DEFAULT_THEME.idleScreen, ...(legacy.idleScreen || {}) };
        }
      } catch { /* no checkin settings */ }

      const result: CheckinThemeConfig = { colors, backgroundImage, idleScreen };
      setTheme(result);
      await AsyncStorage.setItem("@CheckinTheme", JSON.stringify(result));
    } catch {
      // Last resort: fall back to church appearance colors
      if (CachedData.churchAppearance) {
        const a = CachedData.churchAppearance;
        setTheme({
          ...DEFAULT_THEME,
          colors: {
            ...DEFAULT_COLORS,
            primary: a.primaryColor || DEFAULT_COLORS.primary,
            primaryContrast: a.primaryContrast || DEFAULT_COLORS.primaryContrast,
            secondary: a.secondaryColor || DEFAULT_COLORS.secondary,
            secondaryContrast: a.secondaryContrast || DEFAULT_COLORS.secondaryContrast,
            headerBackground: a.primaryColor || DEFAULT_COLORS.headerBackground,
            subheaderBackground: a.secondaryColor || DEFAULT_COLORS.subheaderBackground,
            buttonBackground: a.primaryColor || DEFAULT_COLORS.buttonBackground
          }
        });
      }
    } finally {
      setIsLoaded(true);
    }
  };

  return (
    <CheckinThemeContext.Provider value={{ theme, loadTheme, isLoaded }}>
      {children}
    </CheckinThemeContext.Provider>
  );
};

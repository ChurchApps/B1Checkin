import React, { createContext, useContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckinThemeConfig, CheckinThemeColors } from "../helpers/CheckinThemeInterfaces";
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
      const cached = await AsyncStorage.getItem("@CheckinTheme");
      if (cached) {
        setTheme(mergeWithDefaults(JSON.parse(cached)));
      }

      const data = await ApiHelper.getAnonymous(
        "/settings/public/" + churchId + "/checkin-theme",
        "MembershipApi"
      );

      if (data && Object.keys(data).length > 0) {
        const merged = mergeWithDefaults(data);
        setTheme(merged);
        await AsyncStorage.setItem("@CheckinTheme", JSON.stringify(merged));
      }
    } catch {
      // Fall back to church appearance colors if available
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

import { useMemo } from "react";
import { useCheckinTheme } from "../context/CheckinThemeContext";
import { CheckinThemeColors } from "../helpers/CheckinThemeInterfaces";
import { elevation, fonts, motion, palette, radius, spacing, type } from "./tokens";
import { layout } from "./layout";
import { AppTheme, SemanticColors } from "./types";

export function hexWithAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex?.trim() || "");
  if (!match) return hex;
  let h = match[1];
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function contrastOn(hex: string): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex?.trim() || "");
  if (!match) return "#FFFFFF";
  let h = match[1];
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? palette.ink : "#FFFFFF";
}

export function buildTheme(themeColors: CheckinThemeColors): AppTheme {
  const primary = themeColors.primary || palette.b1;
  const colors: SemanticColors = {
    canvas: palette.canvas,
    surface: palette.surface,
    textPrimary: palette.ink,
    textSecondary: palette.ink2,
    textMuted: palette.ink3,
    border: palette.line,
    primary,
    onPrimary: themeColors.primaryContrast || contrastOn(primary),
    primarySoft: hexWithAlpha(primary, 0.1),
    primarySelected: hexWithAlpha(primary, 0.15),
    primaryBorder: hexWithAlpha(primary, 0.4),
    secondary: themeColors.secondary || palette.b1,
    onSecondary: themeColors.secondaryContrast || contrastOn(themeColors.secondary || palette.b1),
    header: themeColors.headerBackground || primary,
    onHeader: contrastOn(themeColors.headerBackground || primary),
    subheader: themeColors.subheaderBackground || primary,
    onSubheader: contrastOn(themeColors.subheaderBackground || primary),
    button: themeColors.buttonBackground || primary,
    onButton: themeColors.buttonText || contrastOn(themeColors.buttonBackground || primary),
    success: palette.success,
    successBg: palette.successBg,
    warning: palette.warning,
    warningBg: palette.warningBg,
    danger: palette.danger,
    dangerBg: palette.dangerBg,
    overlay: palette.overlay,
    gold: palette.gold
  };
  return { colors, spacing, radius, type, elevation, motion, fonts, layout };
}

export function useAppTheme(): AppTheme {
  const { theme } = useCheckinTheme();
  return useMemo(() => buildTheme(theme.colors), [theme.colors]);
}

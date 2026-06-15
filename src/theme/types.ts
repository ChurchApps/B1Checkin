import { elevation, fonts, motion, radius, spacing, type } from "./tokens";
import { layout } from "./layout";

export interface SemanticColors {
  canvas: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  primarySelected: string;
  primaryBorder: string;
  secondary: string;
  onSecondary: string;
  header: string;
  onHeader: string;
  subheader: string;
  onSubheader: string;
  button: string;
  onButton: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  overlay: string;
  gold: string;
}

export interface AppTheme {
  colors: SemanticColors;
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof type;
  elevation: typeof elevation;
  motion: typeof motion;
  fonts: typeof fonts;
  layout: typeof layout;
}

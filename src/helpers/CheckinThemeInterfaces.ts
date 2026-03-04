export interface CheckinThemeColors {
  primary: string;
  primaryContrast: string;
  secondary: string;
  secondaryContrast: string;
  headerBackground: string;
  subheaderBackground: string;
  buttonBackground: string;
  buttonText: string;
}

export interface IdleSlide {
  imageUrl: string;
  durationSeconds: number;
  sort: number;
}

export interface IdleScreenConfig {
  enabled: boolean;
  timeoutSeconds: number;
  slides: IdleSlide[];
}

export interface CheckinThemeConfig {
  colors: CheckinThemeColors;
  backgroundImage: string;
  idleScreen: IdleScreenConfig;
}

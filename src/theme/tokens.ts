export const palette = {
  b1: "#1565C0",
  ink: "#0F172A",
  ink2: "#334155",
  ink3: "#64748B",
  ink4: "#94A3B8",
  line: "#E2E8F0",
  surface: "#FFFFFF",
  canvas: "#F6F7F9",
  success: "#2E9E5B",
  successBg: "#E6F6EC",
  warning: "#B45309",
  warningBg: "#FEF3C7",
  danger: "#B0120C",
  dangerBg: "#FEE2E2",
  gold: "#F6C445",
  overlay: "rgba(15, 23, 42, 0.5)"
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold"
};

export const type = {
  display: { fontSize: 40, lineHeight: 48, fontFamily: fonts.bold },
  h1: { fontSize: 30, lineHeight: 38, fontFamily: fonts.bold },
  h2: { fontSize: 24, lineHeight: 30, fontFamily: fonts.semibold },
  h3: { fontSize: 20, lineHeight: 26, fontFamily: fonts.semibold },
  bodyLg: { fontSize: 18, lineHeight: 26, fontFamily: fonts.regular },
  body: { fontSize: 16, lineHeight: 22, fontFamily: fonts.regular },
  caption: { fontSize: 15, lineHeight: 20, fontFamily: fonts.medium },
  overline: { fontSize: 13, lineHeight: 18, fontFamily: fonts.medium, letterSpacing: 1.2, textTransform: "uppercase" as const }
};

export const elevation = {
  e0: {},
  e1: { shadowColor: palette.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  e2: { shadowColor: palette.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  e3: { shadowColor: palette.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 }
};

export const motion = { fast: 120, base: 200, slow: 320 };

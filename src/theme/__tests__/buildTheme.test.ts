import { buildTheme, contrastOn, hexWithAlpha } from "../useAppTheme";
import { CheckinThemeColors } from "../../helpers/CheckinThemeInterfaces";

const DEFAULT_COLORS: CheckinThemeColors = {
  primary: "#1565C0",
  primaryContrast: "#FFFFFF",
  secondary: "#568BDA",
  secondaryContrast: "#FFFFFF",
  headerBackground: "#1565C0",
  subheaderBackground: "#568BDA",
  buttonBackground: "#1565C0",
  buttonText: "#FFFFFF"
};

describe("hexWithAlpha", () => {
  it("converts 6-digit hex to rgba", () => {
    expect(hexWithAlpha("#1565C0", 0.1)).toBe("rgba(21, 101, 192, 0.1)");
  });

  it("expands 3-digit hex", () => {
    expect(hexWithAlpha("#fff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("returns non-hex input unchanged", () => {
    expect(hexWithAlpha("blue", 0.5)).toBe("blue");
  });
});

describe("contrastOn", () => {
  it("returns white on dark backgrounds", () => {
    expect(contrastOn("#1565C0")).toBe("#FFFFFF");
  });

  it("returns ink on light backgrounds", () => {
    expect(contrastOn("#F6F7F9")).toBe("#0F172A");
  });
});

describe("buildTheme", () => {
  it("maps the default colors to legacy B1 values", () => {
    const theme = buildTheme(DEFAULT_COLORS);
    expect(theme.colors.primary).toBe("#1565C0");
    expect(theme.colors.onPrimary).toBe("#FFFFFF");
    expect(theme.colors.header).toBe("#1565C0");
    expect(theme.colors.subheader).toBe("#568BDA");
    expect(theme.colors.button).toBe("#1565C0");
    expect(theme.colors.onButton).toBe("#FFFFFF");
  });

  it("applies church overrides to semantic roles", () => {
    const theme = buildTheme({
      ...DEFAULT_COLORS,
      primary: "#8B0000",
      primaryContrast: "#FFEEEE",
      headerBackground: "#222222",
      buttonBackground: "#8B0000",
      buttonText: "#FFEEEE"
    });
    expect(theme.colors.primary).toBe("#8B0000");
    expect(theme.colors.onPrimary).toBe("#FFEEEE");
    expect(theme.colors.header).toBe("#222222");
    expect(theme.colors.onHeader).toBe("#FFFFFF");
    expect(theme.colors.primarySoft).toBe("rgba(139, 0, 0, 0.1)");
    expect(theme.colors.onButton).toBe("#FFEEEE");
  });

  it("computes a readable onHeader for light header backgrounds", () => {
    const theme = buildTheme({ ...DEFAULT_COLORS, headerBackground: "#FFFFFF" });
    expect(theme.colors.onHeader).toBe("#0F172A");
  });

  it("falls back to B1 blue when primary is missing", () => {
    const theme = buildTheme({ ...DEFAULT_COLORS, primary: "" });
    expect(theme.colors.primary).toBe("#1565C0");
  });
});

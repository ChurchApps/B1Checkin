import { useWindowDimensions } from "react-native";

export const layout = {
  contentMaxWidth: 640,
  gutter: 24,
  minTarget: 56,
  buttonMd: 48,
  buttonLg: 56,
  buttonXl: 64,
  keypadKey: 88,
  breakpointRegular: 720
};

export function useBreakpoint(): "compact" | "regular" {
  const { width } = useWindowDimensions();
  return width >= layout.breakpointRegular ? "regular" : "compact";
}

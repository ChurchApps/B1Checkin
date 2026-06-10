import React from "react";
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated from "react-native-reanimated";
import { useAppTheme } from "../../theme";
import { IconName } from "./icons";
import { usePressScale } from "./pressScale";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "md" | "lg" | "xl";

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const HEIGHTS: Record<ButtonSize, number> = { md: 48, lg: 56, xl: 64 };
const FONT_SIZES: Record<ButtonSize, number> = { md: 16, lg: 17, xl: 18 };

export const Button: React.FC<Props> = ({ label, onPress, variant = "primary", size = "lg", icon, loading, disabled, fullWidth, style, testID }) => {
  const theme = useAppTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const isDisabled = disabled || loading;

  const variants: Record<ButtonVariant, { bg: string; text: string; borderColor?: string }> = {
    primary: { bg: theme.colors.button, text: theme.colors.onButton },
    secondary: { bg: theme.colors.primarySoft, text: theme.colors.primary },
    outline: { bg: theme.colors.surface, text: theme.colors.primary, borderColor: theme.colors.primaryBorder },
    ghost: { bg: "transparent", text: theme.colors.primary },
    danger: { bg: theme.colors.dangerBg, text: theme.colors.danger }
  };
  const v = variants[variant];

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Animated.View style={[fullWidth ? { width: "100%" } : undefined, animatedStyle, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={isDisabled}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => ({
          height: HEIGHTS[size],
          borderRadius: theme.radius.md + 2,
          backgroundColor: pressed && variant === "ghost" ? theme.colors.primarySoft : v.bg,
          borderWidth: v.borderColor ? 1.5 : 0,
          borderColor: v.borderColor,
          opacity: isDisabled ? 0.4 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: theme.spacing.xl,
          ...(variant === "primary" && !isDisabled ? theme.elevation.e1 : {})
        })}>
        {loading
          ? <ActivityIndicator color={v.text} />
          : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
              {icon && <MaterialIcons name={icon} size={FONT_SIZES[size] + 6} color={v.text} />}
              <Text numberOfLines={1} style={{ color: v.text, fontSize: FONT_SIZES[size], fontFamily: theme.fonts.semibold }}>{label}</Text>
            </View>
          )}
      </Pressable>
    </Animated.View>
  );
};

import React from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { spacing, useAppTheme } from "../../theme";
import { usePressScale } from "./pressScale";

interface Props {
  children: React.ReactNode;
  padding?: keyof typeof spacing | 0;
  elevation?: "e0" | "e1" | "e2" | "e3";
  onPress?: () => void;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<Props> = ({ children, padding = "lg", elevation = "e1", onPress, accent, style }) => {
  const theme = useAppTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.98);

  const base: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: padding === 0 ? 0 : theme.spacing[padding],
    borderTopWidth: accent ? 3 : 0,
    borderTopColor: accent ? theme.colors.primary : undefined,
    ...theme.elevation[elevation]
  };

  if (!onPress) return <View style={[base, style]}>{children}</View>;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={[base, style]}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

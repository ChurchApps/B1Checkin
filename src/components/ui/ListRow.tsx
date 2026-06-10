import React from "react";
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated from "react-native-reanimated";
import { useAppTheme } from "../../theme";
import { usePressScale } from "./pressScale";

interface Props {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode | "chevron" | "spinner";
  onPress?: () => void;
  selected?: boolean;
  size?: "md" | "lg";
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ListRow: React.FC<Props> = ({ title, subtitle, left, right, onPress, selected, size = "md", style, testID }) => {
  const theme = useAppTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.98);
  const isLarge = size === "lg";

  const base: ViewStyle = {
    minHeight: isLarge ? 88 : 64,
    backgroundColor: selected ? theme.colors.primarySelected : theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: selected ? 2 : 0,
    borderColor: selected ? theme.colors.primary : undefined,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.elevation.e1
  };

  const renderRight = () => {
    if (right === "chevron") return <MaterialIcons name="chevron-right" size={28} color={theme.colors.textMuted} />;
    if (right === "spinner") return <ActivityIndicator color={theme.colors.primary} />;
    return right;
  };

  const content = (
    <>
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ color: theme.colors.textPrimary, fontSize: isLarge ? 20 : 16, fontFamily: isLarge ? theme.fonts.semibold : theme.fonts.medium }}>{title}</Text>
        {!!subtitle && <Text numberOfLines={1} style={{ color: theme.colors.textMuted, fontSize: 15, fontFamily: theme.fonts.regular }}>{subtitle}</Text>}
      </View>
      {renderRight()}
    </>
  );

  if (!onPress) return <View testID={testID} style={[base, style]}>{content}</View>;

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable testID={testID} accessibilityRole="button" onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut} style={base}>
        {content}
      </Pressable>
    </Animated.View>
  );
};

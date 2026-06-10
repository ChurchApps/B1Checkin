import React from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated from "react-native-reanimated";
import { useAppTheme } from "../../theme";
import { usePressScale } from "./pressScale";

interface KeyProps {
  onPress: () => void;
  onLongPress?: () => void;
  height: number;
  children: React.ReactNode;
  accessibilityLabel: string;
  flat?: boolean;
}

const PadKey: React.FC<KeyProps> = ({ onPress, onLongPress, height, children, accessibilityLabel, flat }) => {
  const theme = useAppTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.95);

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={handlePress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => ({
          height,
          borderRadius: theme.radius.lg,
          backgroundColor: pressed ? theme.colors.primarySoft : flat ? "transparent" : theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          ...(flat ? {} : theme.elevation.e1)
        })}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

interface Props {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
  bottomLeft?: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; onPress: () => void };
  keyHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export const NumberPad: React.FC<Props> = ({ onDigit, onBackspace, onClear, bottomLeft, keyHeight = 88, style }) => {
  const theme = useAppTheme();
  const gap = theme.spacing.md;
  const rows = [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]];

  return (
    <View style={[{ gap }, style]}>
      {rows.map(row => (
        <View key={row[0]} style={{ flexDirection: "row", gap }}>
          {row.map(digit => (
            <PadKey key={digit} height={keyHeight} onPress={() => onDigit(digit)} accessibilityLabel={digit}>
              <Text style={{ fontSize: 32, fontFamily: theme.fonts.medium, color: theme.colors.textPrimary }}>{digit}</Text>
            </PadKey>
          ))}
        </View>
      ))}
      <View style={{ flexDirection: "row", gap }}>
        {bottomLeft
          ? (
            <PadKey height={keyHeight} onPress={bottomLeft.onPress} accessibilityLabel={bottomLeft.label} flat>
              <View style={{ alignItems: "center", gap: 2 }}>
                <MaterialIcons name={bottomLeft.icon} size={26} color={theme.colors.primary} />
                <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: theme.fonts.medium, color: theme.colors.primary }}>{bottomLeft.label}</Text>
              </View>
            </PadKey>
          )
          : <View style={{ flex: 1 }} />}
        <PadKey height={keyHeight} onPress={() => onDigit("0")} accessibilityLabel="0">
          <Text style={{ fontSize: 32, fontFamily: theme.fonts.medium, color: theme.colors.textPrimary }}>0</Text>
        </PadKey>
        <PadKey height={keyHeight} onPress={onBackspace} onLongPress={onClear} accessibilityLabel="backspace" flat>
          <MaterialIcons name="backspace" size={28} color={theme.colors.textSecondary} />
        </PadKey>
      </View>
    </View>
  );
};

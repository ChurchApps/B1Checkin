import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../theme";
import { IconName } from "./icons";

export type BadgeTone = "success" | "warning" | "info" | "neutral" | "danger";

interface Props {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<Props> = ({ label, tone = "neutral", icon, style }) => {
  const theme = useAppTheme();
  const tones: Record<BadgeTone, { bg: string; text: string }> = {
    success: { bg: theme.colors.successBg, text: theme.colors.success },
    warning: { bg: theme.colors.warningBg, text: theme.colors.warning },
    info: { bg: theme.colors.primarySoft, text: theme.colors.primary },
    neutral: { bg: theme.colors.border, text: theme.colors.textSecondary },
    danger: { bg: theme.colors.dangerBg, text: theme.colors.danger }
  };
  const t = tones[tone];
  const base: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: t.bg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start"
  };

  return (
    <View style={[base, style]}>
      {icon && <MaterialIcons name={icon} size={15} color={t.text} />}
      <Text numberOfLines={1} style={{ color: t.text, fontSize: 14, fontFamily: theme.fonts.medium }}>{label}</Text>
    </View>
  );
};

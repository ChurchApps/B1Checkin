import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAppTheme } from "../../theme";
import { IconName } from "./icons";

interface Props {
  icon: IconName;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  tone?: "default" | "warning";
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<Props> = ({ icon, title, subtitle, action, tone = "default", style }) => {
  const theme = useAppTheme();
  const circleBg = tone === "warning" ? theme.colors.warningBg : theme.colors.primarySoft;
  const iconColor = tone === "warning" ? theme.colors.warning : theme.colors.primary;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={[{ alignItems: "center", paddingVertical: theme.spacing.xxl, gap: theme.spacing.lg }, style]}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: circleBg, alignItems: "center", justifyContent: "center" }}>
        <MaterialIcons name={icon} size={44} color={iconColor} />
      </View>
      <View style={{ alignItems: "center", gap: theme.spacing.sm, maxWidth: 420 }}>
        <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontFamily: theme.fonts.semibold, textAlign: "center" }}>{title}</Text>
        {!!subtitle && <Text style={{ color: theme.colors.textMuted, fontSize: 17, lineHeight: 24, fontFamily: theme.fonts.regular, textAlign: "center" }}>{subtitle}</Text>}
      </View>
      {action && <View style={{ alignSelf: "stretch", gap: theme.spacing.md, marginTop: theme.spacing.sm }}>{action}</View>}
    </Animated.View>
  );
};

import React from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppTheme } from "../theme";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  icon?: string;
  compact?: boolean;
  centered?: boolean;
}

const Subheader = (props: Props) => {
  const theme = useAppTheme();
  const titleSize = props.compact ? 24 : 30;
  const titleFont = props.compact ? theme.fonts.semibold : theme.fonts.bold;

  return (
    <View style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg, flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
      {props.onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="back"
          onPress={props.onBack}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: pressed ? theme.colors.primarySoft : theme.colors.surface,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            alignItems: "center",
            justifyContent: "center"
          })}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
      )}
      <View style={{ flex: 1, alignItems: props.centered ? "center" : "flex-start" }}>
        <Text style={{ fontSize: titleSize, lineHeight: titleSize + 8, fontFamily: titleFont, color: theme.colors.textPrimary, textAlign: props.centered ? "center" : "left" }}>{props.title}</Text>
        {!!props.subtitle && <Text style={{ fontSize: 17, lineHeight: 24, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, marginTop: 4, textAlign: props.centered ? "center" : "left" }}>{props.subtitle}</Text>}
      </View>
      {props.onBack && props.centered && <View style={{ width: 48 }} />}
    </View>
  );
};

export default Subheader;

import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../theme";

interface Props {
  steps: string[];
  current: number;
  style?: StyleProp<ViewStyle>;
}

export const StepIndicator: React.FC<Props> = ({ steps, current, style }) => {
  const theme = useAppTheme();

  return (
    <View style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing.sm }, style]}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const color = done || active ? theme.colors.primary : theme.colors.textMuted;
        return (
          <React.Fragment key={step}>
            {i > 0 && <View style={{ width: 24, height: 2, borderRadius: 1, backgroundColor: done || active ? theme.colors.primary : theme.colors.border }} />}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              {done
                ? <MaterialIcons name="check-circle" size={18} color={theme.colors.primary} />
                : (
                  <View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? theme.colors.primary : "transparent",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {active && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.onPrimary }} />}
                  </View>
                )}
              <Text style={{ color, fontSize: 14, fontFamily: active ? theme.fonts.semibold : theme.fonts.medium }}>{step}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
};

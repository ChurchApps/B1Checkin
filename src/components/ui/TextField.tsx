import React, { forwardRef, useState } from "react";
import { StyleProp, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppTheme } from "../../theme";
import { IconName } from "./icons";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leadingIcon?: IconName;
  trailing?: React.ReactNode;
  size?: "md" | "lg";
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<TextInput, Props>(({ label, error, leadingIcon, trailing, size = "md", containerStyle, style, ...inputProps }, ref) => {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  const height = size === "lg" ? 64 : 56;
  const borderColor = error ? theme.colors.danger : focused ? theme.colors.primary : theme.colors.border;

  return (
    <View style={containerStyle}>
      {!!label && <Text style={{ color: theme.colors.textPrimary, fontSize: 15, fontFamily: theme.fonts.medium, marginBottom: theme.spacing.sm }}>{label}</Text>}
      <View style={{
        height,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: focused || error ? 2 : 1.5,
        borderColor,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm
      }}>
        {leadingIcon && <MaterialIcons name={leadingIcon} size={22} color={focused ? theme.colors.primary : theme.colors.textMuted} />}
        <TextInput
          ref={ref}
          {...inputProps}
          style={[{ flex: 1, fontSize: size === "lg" ? 20 : 17, fontFamily: theme.fonts.regular, color: theme.colors.textPrimary, paddingVertical: 0 }, style]}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={e => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {trailing}
      </View>
      {!!error && <Text style={{ color: theme.colors.danger, fontSize: 14, fontFamily: theme.fonts.regular, marginTop: theme.spacing.xs }}>{error}</Text>}
    </View>
  );
});

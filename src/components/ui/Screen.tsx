import React from "react";
import { ImageBackground, ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCheckinTheme } from "../../context/CheckinThemeContext";
import { useAppTheme } from "../../theme";

interface Props {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  overlay?: React.ReactNode;
  scroll?: boolean;
  maxWidth?: boolean;
  padded?: boolean;
  onUserActivity?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}

export const Screen: React.FC<Props> = ({ children, header, footer, overlay, scroll, maxWidth = true, padded = true, onUserActivity, contentStyle }) => {
  const theme = useAppTheme();
  const { theme: checkinTheme } = useCheckinTheme();
  const insets = useSafeAreaInsets();

  const column: ViewStyle = {
    width: "100%",
    maxWidth: maxWidth ? theme.layout.contentMaxWidth : undefined,
    alignSelf: "center",
    paddingHorizontal: padded ? theme.layout.gutter : 0,
    flexGrow: 1
  };

  const body = (
    <>
      {header || <View style={{ height: insets.top }} />}
      {scroll
        ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={[column, contentStyle]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        )
        : <View style={[{ flex: 1 }, column, contentStyle]}>{children}</View>}
      {footer && (
        <View style={{
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          ...theme.elevation.e2
        }}>
          <View style={{ width: "100%", maxWidth: theme.layout.contentMaxWidth, alignSelf: "center", padding: theme.spacing.lg, paddingBottom: Math.max(insets.bottom, theme.spacing.lg) }}>
            {footer}
          </View>
        </View>
      )}
      {overlay}
    </>
  );

  if (checkinTheme.backgroundImage) {
    return (
      <ImageBackground source={{ uri: checkinTheme.backgroundImage }} style={{ flex: 1 }} resizeMode="cover">
        <View style={{ flex: 1, backgroundColor: "rgba(246, 247, 249, 0.88)" }} onTouchStart={onUserActivity}>
          {body}
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.canvas }} onTouchStart={onUserActivity}>
      {body}
    </View>
  );
};

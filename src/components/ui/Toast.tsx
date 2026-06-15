import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../theme";
import { IconName } from "./icons";

export type ToastTone = "info" | "success" | "error";

let hostHandler: ((message: string, tone: ToastTone) => void) | null = null;

export const Toast = {
  show(message: string, tone: ToastTone = "info") {
    hostHandler?.(message, tone);
  }
};

interface ToastState {
  message: string;
  tone: ToastTone;
  key: number;
}

export const ToastHost: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    hostHandler = (message, tone) => setToast({ message, tone, key: Date.now() });
    return () => {
      hostHandler = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const tones: Record<ToastTone, { bg: string; icon: IconName }> = {
    info: { bg: theme.colors.textPrimary, icon: "info-outline" },
    success: { bg: theme.colors.success, icon: "check-circle-outline" },
    error: { bg: theme.colors.danger, icon: "error-outline" }
  };
  const t = tones[toast.tone];

  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 32, alignItems: "center", zIndex: 1000 }}>
      <Animated.View
        key={toast.key}
        entering={FadeInDown.duration(200)}
        exiting={FadeOutDown.duration(200)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          backgroundColor: t.bg,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
          maxWidth: 520,
          marginHorizontal: theme.spacing.xl,
          ...theme.elevation.e3
        }}>
        <MaterialIcons name={t.icon} size={20} color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: theme.fonts.medium, flexShrink: 1 }}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
};

import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAppTheme } from "../../theme";

interface Props {
  visible: boolean;
  onClose?: () => void;
  dismissible?: boolean;
  maxWidth?: number;
  children: React.ReactNode;
}

export const Sheet: React.FC<Props> = ({ visible, onClose, dismissible = true, maxWidth = 440, children }) => {
  const theme = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => dismissible && onClose?.()}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: theme.colors.overlay, alignItems: "center", justifyContent: "center", padding: theme.spacing.xl }}
          onPress={() => dismissible && onClose?.()}>
          <Animated.View entering={FadeInDown.duration(220)} style={{ width: "100%", maxWidth }}>
            <Pressable onPress={() => {}}>
              <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl, padding: theme.spacing.xl, ...theme.elevation.e3 }}>
                {children}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

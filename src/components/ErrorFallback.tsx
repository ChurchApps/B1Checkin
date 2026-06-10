import * as React from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { fonts, palette } from "../theme/tokens";

function ErrorFallback(props: any) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: palette.warningBg, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <MaterialIcons name="error-outline" size={44} color={palette.warning} />
      </View>
      <Text style={{ fontSize: 24, fontFamily: fonts.semibold, color: palette.ink, textAlign: "center", marginBottom: 8 }}>Something went wrong</Text>
      <Text style={{ fontSize: 17, fontFamily: fonts.regular, color: palette.ink3, textAlign: "center", marginBottom: 24 }}>Please try again, or restart the app if the problem continues.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={props.resetErrorBoundary}
        style={({ pressed }) => ({
          height: 56,
          paddingHorizontal: 32,
          borderRadius: 14,
          backgroundColor: pressed ? "#114A99" : palette.b1,
          alignItems: "center",
          justifyContent: "center"
        })}>
        <Text style={{ color: "#FFFFFF", fontSize: 17, fontFamily: fonts.semibold }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default ErrorFallback;

import React, { useState } from "react";
import { Image, StyleProp, Text, View, ViewStyle } from "react-native";
import { useAppTheme } from "../../theme";

interface Props {
  name: string;
  photoUri?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const Avatar: React.FC<Props> = ({ name, photoUri, size = 64, style }) => {
  const theme = useAppTheme();
  const [failed, setFailed] = useState(false);
  const showPhoto = !!photoUri && !failed;

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}>
      {showPhoto
        ? <Image source={{ uri: photoUri }} style={{ width: size, height: size }} resizeMode="cover" onError={() => setFailed(true)} />
        : <Text style={{ color: theme.colors.primary, fontSize: Math.round(size * 0.36), fontFamily: theme.fonts.semibold }}>{getInitials(name)}</Text>}
    </View>
  );
};

import React, { useEffect } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useAppTheme } from "../../theme";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = "100%", height = 16, radius = 8, style }) => {
  const theme = useAppTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: theme.colors.border }, animatedStyle, style]} />;
};

interface SkeletonListProps {
  rows?: number;
  avatar?: boolean;
  rowHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ rows = 3, avatar = true, rowHeight = 88, style }) => {
  const theme = useAppTheme();

  return (
    <View style={[{ gap: theme.spacing.md }, style]}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            height: rowHeight,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: theme.spacing.lg,
            gap: theme.spacing.md,
            ...theme.elevation.e1
          }}>
          {avatar && <Skeleton width={48} height={48} radius={24} />}
          <View style={{ flex: 1, gap: theme.spacing.sm }}>
            <Skeleton width="60%" height={18} />
            <Skeleton width="35%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
};

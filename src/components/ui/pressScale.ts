import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export function usePressScale(scaleTo = 0.97) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => {
    scale.value = withTiming(scaleTo, { duration: 90 });
  };
  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };
  return { animatedStyle, onPressIn, onPressOut };
}

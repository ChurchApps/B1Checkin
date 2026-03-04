import React, { useState, useEffect, useRef } from "react";
import { View, Image, TouchableWithoutFeedback, Animated, StyleSheet } from "react-native";
import { useCheckinTheme } from "../context/CheckinThemeContext";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const IdleScreen: React.FC<Props> = ({ visible, onDismiss }) => {
  const { theme } = useCheckinTheme();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = (theme.idleScreen.slides || [])
    .filter(s => s.imageUrl)
    .sort((a, b) => a.sort - b.sort);

  useEffect(() => {
    if (!visible) {
      setCurrentSlideIndex(0);
      fadeAnim.setValue(1);
      return;
    }
    if (slides.length <= 1) return;

    const duration = (slides[currentSlideIndex]?.durationSeconds || 10) * 1000;
    slideTimerRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      }).start(() => {
        setCurrentSlideIndex(prev => (prev + 1) % slides.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }).start();
      });
    }, duration);

    return () => {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };
  }, [visible, currentSlideIndex, slides.length]);

  if (!visible || slides.length === 0) return null;

  return (
    <TouchableWithoutFeedback onPress={onDismiss}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, backgroundColor: "#000" }]}>
          <Image
            source={{ uri: slides[currentSlideIndex]?.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default IdleScreen;

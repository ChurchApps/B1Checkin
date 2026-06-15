import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useCheckinTheme } from "../context/CheckinThemeContext";
import { CachedData } from "../helpers";
import { fonts } from "../theme/tokens";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const KenBurnsImage: React.FC<{ uri: string; durationMs: number; fadeIn?: boolean }> = ({ uri, durationMs, fadeIn }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(1.08, { duration: durationMs + 800, easing: Easing.linear });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={fadeIn ? FadeIn.duration(800) : undefined} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      </Animated.View>
    </Animated.View>
  );
};

const PulsingCta: React.FC<{ label: string }> = ({ label }) => {
  const opacity = useSharedValue(0.75);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[{ alignItems: "center", gap: 4 }, animatedStyle]}>
      <MaterialIcons name="keyboard-arrow-up" size={28} color="#FFFFFF" />
      <Text style={{ fontSize: 22, fontFamily: fonts.semibold, color: "#FFFFFF" }}>{label}</Text>
    </Animated.View>
  );
};

const IdleScreen: React.FC<Props> = ({ visible, onDismiss }) => {
  const { t } = useTranslation();
  const { theme } = useCheckinTheme();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [prevSlideIndex, setPrevSlideIndex] = useState(-1);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = (theme.idleScreen.slides || [])
    .filter(s => s.imageUrl)
    .sort((a, b) => a.sort - b.sort);

  useEffect(() => {
    if (!visible) {
      setCurrentSlideIndex(0);
      setPrevSlideIndex(-1);
      return;
    }
    if (slides.length <= 1) return;

    const duration = (slides[currentSlideIndex]?.durationSeconds || 10) * 1000;
    slideTimerRef.current = setTimeout(() => {
      setPrevSlideIndex(currentSlideIndex);
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, duration);

    return () => {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };
  }, [visible, currentSlideIndex, slides.length]);

  if (slides.length === 0 || !visible) return null;

  const currentDuration = (slides[currentSlideIndex]?.durationSeconds || 10) * 1000;
  const logoUri = CachedData.churchAppearance?.logoLight;

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]}>
          {prevSlideIndex >= 0 && prevSlideIndex !== currentSlideIndex && (
            <KenBurnsImage key={"prev-" + prevSlideIndex} uri={slides[prevSlideIndex]?.imageUrl} durationMs={0} />
          )}
          <KenBurnsImage key={"slide-" + currentSlideIndex} uri={slides[currentSlideIndex]?.imageUrl} durationMs={currentDuration} fadeIn={prevSlideIndex >= 0} />
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 48, paddingBottom: 56, alignItems: "center", gap: 20, backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
            {!!logoUri && (
              <View style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 10 }}>
                <Image source={{ uri: logoUri }} style={{ width: 180, height: 36, resizeMode: "contain" }} />
              </View>
            )}
            <PulsingCta label={t("idle.tapToCheckin")} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default IdleScreen;

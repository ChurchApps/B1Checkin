import React from "react";
import { Animated, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { CachedData } from "../helpers";
import { useAppTheme } from "../theme";
import { Button, NumberPad, Sheet } from "./ui";

interface PinEntryModalProps {
  visible: boolean;
  mode: "setup" | "verify" | "change";
  onSuccess: () => void;
  onCancel: () => void;
  dismissible?: boolean;
}

const MAX_PIN_LENGTH = 6;
const MIN_PIN_LENGTH = 4;
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000;

const PinEntryModal = (props: PinEntryModalProps) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { visible, mode, onSuccess, onCancel, dismissible = true } = props;

  const [pin, setPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [step, setStep] = React.useState<"enter" | "confirm" | "verifyOld" | "newPin" | "confirmNew">("enter");
  const [error, setError] = React.useState("");
  const [failedAttempts, setFailedAttempts] = React.useState(0);
  const [lockedUntil, setLockedUntil] = React.useState(0);
  const [lockCountdown, setLockCountdown] = React.useState(0);
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setPin("");
      setConfirmPin("");
      setError("");
      if (mode === "setup") setStep("enter");
      else if (mode === "verify") setStep("enter");
      else if (mode === "change") setStep("verifyOld");
    }
  }, [visible, mode]);

  React.useEffect(() => {
    if (lockedUntil <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining <= 0) {
        setLockedUntil(0);
        setFailedAttempts(0);
        setError("");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handleDigitPress = (digit: string) => {
    if (lockedUntil > 0) return;
    const currentPin = getCurrentPin();
    if (currentPin.length >= MAX_PIN_LENGTH) return;
    setError("");
    setCurrentPin(currentPin + digit);
  };

  const handleBackspace = () => {
    const currentPin = getCurrentPin();
    if (currentPin.length > 0) {
      setCurrentPin(currentPin.slice(0, -1));
    }
  };

  const getCurrentPin = (): string => {
    if (step === "confirm" || step === "confirmNew") return confirmPin;
    return pin;
  };

  const setCurrentPin = (value: string) => {
    if (step === "confirm" || step === "confirmNew") setConfirmPin(value);
    else setPin(value);
  };

  const handleSubmit = async () => {
    const currentPin = getCurrentPin();

    if (currentPin.length < MIN_PIN_LENGTH) {
      setError(t("setPin.pinTooShort"));
      triggerShake();
      return;
    }

    if (step === "enter" && mode === "setup") {
      setStep("confirm");
      setConfirmPin("");
      setError("");
      return;
    }

    if (step === "confirm") {
      if (pin === confirmPin) {
        await AsyncStorage.setItem("@KioskPIN", pin);
        await AsyncStorage.setItem("@KioskLocked", "true");
        CachedData.kioskPin = pin;
        CachedData.kioskLocked = true;
        onSuccess();
      } else {
        setError(t("setPin.pinMismatch"));
        triggerShake();
        setConfirmPin("");
      }
      return;
    }

    if (step === "enter" && mode === "verify") {
      if (currentPin === CachedData.kioskPin) {
        setFailedAttempts(0);
        onSuccess();
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_DURATION);
          setLockCountdown(Math.ceil(LOCKOUT_DURATION / 1000));
          setError(t("pinEntry.tooManyAttempts"));
        } else {
          setError(t("pinEntry.wrongPin") + " " + t("pinEntry.attemptsRemaining", { count: MAX_ATTEMPTS - newAttempts }));
        }
        triggerShake();
        setPin("");
      }
      return;
    }

    if (step === "verifyOld") {
      if (currentPin === CachedData.kioskPin) {
        setStep("newPin");
        setPin("");
        setError("");
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_DURATION);
          setLockCountdown(Math.ceil(LOCKOUT_DURATION / 1000));
          setError(t("pinEntry.tooManyAttempts"));
        } else {
          setError(t("pinEntry.wrongPin") + " " + t("pinEntry.attemptsRemaining", { count: MAX_ATTEMPTS - newAttempts }));
        }
        triggerShake();
        setPin("");
      }
      return;
    }

    if (step === "newPin") {
      setStep("confirmNew");
      setConfirmPin("");
      setError("");
      return;
    }

    if (step === "confirmNew") {
      if (pin === confirmPin) {
        await AsyncStorage.setItem("@KioskPIN", pin);
        CachedData.kioskPin = pin;
        onSuccess();
      } else {
        setError(t("setPin.pinMismatch"));
        triggerShake();
        setConfirmPin("");
      }
      return;
    }
  };

  const getTitle = () => {
    switch (step) {
      case "enter": return mode === "setup" ? t("setPin.enterPin") : t("pinEntry.enterPin");
      case "confirm": return t("setPin.confirmPin");
      case "verifyOld": return t("pinEntry.enterPin");
      case "newPin": return t("setPin.enterPin");
      case "confirmNew": return t("setPin.confirmPin");
    }
  };

  const getSubmitLabel = () => {
    if (step === "confirm" || step === "confirmNew") return t("setPin.confirmPin");
    if ((step === "enter" && mode === "setup") || step === "newPin") return t("common.continue");
    return t("common.ok");
  };

  const currentPinValue = getCurrentPin();
  const canSubmit = currentPinValue.length >= MIN_PIN_LENGTH && lockedUntil <= 0;

  const getDigitCircles = () => {
    const circles = [];
    for (let i = 0; i < MAX_PIN_LENGTH; i++) {
      const filled = i < currentPinValue.length;
      const optional = !filled && i >= MIN_PIN_LENGTH;
      circles.push(
        <View
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: filled ? theme.colors.primary : "transparent",
            borderWidth: filled ? 0 : 2,
            borderColor: optional ? theme.colors.textMuted : theme.colors.primary,
            borderStyle: optional ? "dashed" : "solid",
            opacity: optional ? 0.5 : 1
          }}
        />
      );
    }
    return circles;
  };

  return (
    <Sheet visible={visible} onClose={onCancel} dismissible={dismissible} maxWidth={400}>
      <Animated.View style={{ transform: [{ translateX: shakeAnim }], alignItems: "center" }}>
        {dismissible && (
          <Pressable accessibilityLabel="close" onPress={onCancel} style={{ position: "absolute", top: -theme.spacing.sm, right: -theme.spacing.sm, width: 48, height: 48, alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <MaterialIcons name="close" size={26} color={theme.colors.textMuted} />
          </Pressable>
        )}

        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: theme.spacing.lg }}>
          <MaterialIcons name="lock-outline" size={30} color={theme.colors.primary} />
        </View>
        <Text style={{ fontSize: 20, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary, textAlign: "center" }}>{getTitle()}</Text>

        {mode === "setup" && step === "enter" && (
          <Text style={{ fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, textAlign: "center", marginTop: theme.spacing.xs }}>{t("setPin.subtitle")}</Text>
        )}

        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: theme.spacing.xl, gap: theme.spacing.md }}>
          {getDigitCircles()}
        </View>

        {!!error && <Text style={{ fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.danger, textAlign: "center", marginBottom: theme.spacing.md }}>{error}</Text>}
        {lockedUntil > 0 && (
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: theme.colors.danger, alignItems: "center", justifyContent: "center", marginBottom: theme.spacing.md }}>
            <Text style={{ fontSize: 18, fontFamily: theme.fonts.semibold, color: theme.colors.danger }}>{lockCountdown}</Text>
          </View>
        )}

        <NumberPad onDigit={handleDigitPress} onBackspace={handleBackspace} keyHeight={64} style={{ alignSelf: "stretch" }} />

        <Button label={getSubmitLabel()} onPress={handleSubmit} disabled={!canSubmit} fullWidth style={{ marginTop: theme.spacing.lg }} />
      </Animated.View>
    </Sheet>
  );
};

export default PinEntryModal;

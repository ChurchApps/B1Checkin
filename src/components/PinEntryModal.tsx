import React from "react";
import { View, Text, Modal, Pressable, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { CachedData, StyleConstants, DimensionHelper } from "../helpers";

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
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
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
      case "enter":
        return mode === "setup" ? t("setPin.enterPin") : t("pinEntry.enterPin");
      case "confirm":
        return t("setPin.confirmPin");
      case "verifyOld":
        return t("pinEntry.enterPin");
      case "newPin":
        return t("setPin.enterPin");
      case "confirmNew":
        return t("setPin.confirmPin");
    }
  };

  const currentPinValue = getCurrentPin();
  const canSubmit = currentPinValue.length >= MIN_PIN_LENGTH && lockedUntil <= 0;

  const getDigitCircles = () => {
    const circles = [];
    for (let i = 0; i < MAX_PIN_LENGTH; i++) {
      circles.push(
        <View
          key={i}
          style={[
            pinStyles.digitCircle,
            i < currentPinValue.length && pinStyles.digitCircleFilled,
            i >= currentPinValue.length && i >= MIN_PIN_LENGTH && pinStyles.digitCircleOptional,
          ]}
        />
      );
    }
    return circles;
  };

  const renderKeypadButton = (value: string, onPress: () => void, isIcon?: boolean) => (
    <Pressable
      key={value}
      style={({ pressed }) => [pinStyles.keypadButton, pressed && pinStyles.keypadButtonPressed]}
      onPress={onPress}
      disabled={lockedUntil > 0}
    >
      {isIcon
        ? <FontAwesome name="arrow-left" size={DimensionHelper.wp("5%")} color={StyleConstants.darkColor} />
        : <Text style={pinStyles.keypadButtonText}>{value}</Text>}
    </Pressable>
  );

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={dismissible ? onCancel : undefined}>
      <View style={pinStyles.overlay}>
        <Animated.View style={[pinStyles.card, { transform: [{ translateX: shakeAnim }] }]}>
          {dismissible && (
            <Pressable style={pinStyles.closeButton} onPress={onCancel}>
              <FontAwesome name="times" size={DimensionHelper.wp("5%")} color={StyleConstants.grayColor} />
            </Pressable>
          )}

          <FontAwesome name="lock" size={DimensionHelper.wp("8%")} color={StyleConstants.baseColor} style={pinStyles.lockIcon} />
          <Text style={pinStyles.title}>{getTitle()}</Text>

          {mode === "setup" && step === "enter" && (
            <Text style={pinStyles.subtitle}>{t("setPin.subtitle")}</Text>
          )}

          <View style={pinStyles.digitRow}>
            {getDigitCircles()}
          </View>

          {error ? <Text style={pinStyles.errorText}>{error}</Text> : null}
          {lockedUntil > 0 && <Text style={pinStyles.lockoutText}>{lockCountdown}s</Text>}

          <View style={pinStyles.keypadGrid}>
            <View style={pinStyles.keypadRow}>
              {renderKeypadButton("1", () => handleDigitPress("1"))}
              {renderKeypadButton("2", () => handleDigitPress("2"))}
              {renderKeypadButton("3", () => handleDigitPress("3"))}
            </View>
            <View style={pinStyles.keypadRow}>
              {renderKeypadButton("4", () => handleDigitPress("4"))}
              {renderKeypadButton("5", () => handleDigitPress("5"))}
              {renderKeypadButton("6", () => handleDigitPress("6"))}
            </View>
            <View style={pinStyles.keypadRow}>
              {renderKeypadButton("7", () => handleDigitPress("7"))}
              {renderKeypadButton("8", () => handleDigitPress("8"))}
              {renderKeypadButton("9", () => handleDigitPress("9"))}
            </View>
            <View style={pinStyles.keypadRow}>
              <View style={pinStyles.keypadButton} />
              {renderKeypadButton("0", () => handleDigitPress("0"))}
              {renderKeypadButton("backspace", handleBackspace, true)}
            </View>
          </View>

          <Pressable
            style={[pinStyles.submitButton, !canSubmit && pinStyles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={pinStyles.submitButtonText}>
              {(step === "confirm" || step === "confirmNew") ? t("setPin.confirmPin") :
               (step === "enter" && mode === "setup") || step === "newPin" ? t("common.search").replace(t("common.search"), "OK") : "OK"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const pinStyles = {
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 16,
    padding: DimensionHelper.wp("6%"),
    width: DimensionHelper.wp("85%"),
    maxWidth: 450,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: "absolute" as const,
    top: DimensionHelper.wp("3%"),
    right: DimensionHelper.wp("3%"),
    padding: DimensionHelper.wp("2%"),
    zIndex: 1,
  },
  lockIcon: {
    marginBottom: DimensionHelper.wp("3%"),
    marginTop: DimensionHelper.wp("2%"),
  },
  title: {
    fontSize: DimensionHelper.wp("5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    marginBottom: DimensionHelper.wp("1%"),
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: DimensionHelper.wp("3.2%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.grayColor,
    marginBottom: DimensionHelper.wp("2%"),
    textAlign: "center" as const,
  },
  digitRow: {
    flexDirection: "row" as const,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: DimensionHelper.wp("4%"),
    gap: DimensionHelper.wp("2.5%"),
  },
  digitCircle: {
    width: DimensionHelper.wp("4%"),
    height: DimensionHelper.wp("4%"),
    borderRadius: DimensionHelper.wp("2%"),
    borderWidth: 2,
    borderColor: StyleConstants.baseColor,
    backgroundColor: "transparent",
  },
  digitCircleFilled: {
    backgroundColor: StyleConstants.baseColor,
  },
  digitCircleOptional: {
    borderColor: StyleConstants.lightGray,
    borderStyle: "dashed" as const,
  },
  errorText: {
    fontSize: DimensionHelper.wp("3.2%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.redColor,
    textAlign: "center" as const,
    marginBottom: DimensionHelper.wp("2%"),
  },
  lockoutText: {
    fontSize: DimensionHelper.wp("6%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.redColor,
    textAlign: "center" as const,
    marginBottom: DimensionHelper.wp("2%"),
  },
  keypadGrid: {
    width: "100%",
    alignItems: "center",
  },
  keypadRow: {
    flexDirection: "row" as const,
    justifyContent: "center",
    marginBottom: DimensionHelper.wp("2%"),
  },
  keypadButton: {
    width: DimensionHelper.wp("16%"),
    height: DimensionHelper.wp("12%"),
    borderRadius: DimensionHelper.wp("2%"),
    backgroundColor: StyleConstants.ghostWhite,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: DimensionHelper.wp("1.5%"),
  },
  keypadButtonPressed: {
    backgroundColor: StyleConstants.lightGrayColor,
  },
  keypadButtonText: {
    fontSize: DimensionHelper.wp("6%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
  },
  submitButton: {
    backgroundColor: StyleConstants.baseColor,
    borderRadius: 8,
    paddingVertical: DimensionHelper.wp("3%"),
    paddingHorizontal: DimensionHelper.wp("12%"),
    marginTop: DimensionHelper.wp("2%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: StyleConstants.lightGray,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: DimensionHelper.wp("4.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.whiteColor,
    textAlign: "center" as const,
  },
};

export default PinEntryModal;

import React from "react";
import { Animated, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { ApiHelper, FirebaseHelper, LoginResponseInterface, screenNavigationProps, SessionHelper, Utilities } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Button, Card, TextField } from "../src/components/ui";

interface Props { navigation: screenNavigationProps }

function Login(_props: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [loginError, setLoginError] = React.useState("");
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const login = () => {
    const emailErr = email === "" ? t("login.enterEmail") : !Utilities.validateEmail(email) ? t("login.validEmail") : "";
    const passwordErr = password === "" ? t("login.enterPassword") : "";
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setLoginError("");
    if (emailErr || passwordErr) return;

    setIsLoading(true);
    ApiHelper.postAnonymous("/users/login", { email: email, password: password }, "MembershipApi").then((data: LoginResponseInterface) => {
      setIsLoading(false);
      if (data.errors && data.errors.length > 0) {
        setLoginError(data.errors[0]);
        triggerShake();
      } else {
        const churches = SessionHelper.filterChurches(data.userChurches);
        const userJwt = data.user?.jwt;
        if (!userJwt) {
          setLoginError(t("login.loginFailed"));
          triggerShake();
          return;
        }
        SessionHelper.save(userJwt, email, churches).then(() => {
          setEmail("");
          setPassword("");
          router.replace("/selectChurch");
        }).catch(() => {
          setLoginError(t("login.loginFailed"));
          triggerShake();
        });
      }
    }).catch(() => {
      setIsLoading(false);
      setLoginError(t("login.loginFailed"));
      triggerShake();
    });
  };

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Login");
  }, []);

  const getVersion = () => {
    const pkg = require("../package.json");
    return "v" + pkg.version;
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: theme.spacing.xl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: "100%", maxWidth: 480, alignSelf: "center" }}>
          <Card padding="xxl" elevation="e2">
            <View style={{ alignItems: "center", marginBottom: theme.spacing.xl }}>
              <Image source={require("../src/images/logo1.png")} style={{ width: 88, height: 88, resizeMode: "contain" }} />
              <Text style={{ fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, marginTop: theme.spacing.xs }}>{t("login.title")}</Text>
            </View>

            <Text style={{ fontSize: 24, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary, textAlign: "center", marginBottom: theme.spacing.xl }}>{t("login.welcomeBack")}</Text>

            <TextField
              placeholder={String(t("login.emailPlaceholder"))}
              value={email}
              onChangeText={value => {
                setEmail(value);
                if (emailError) setEmailError("");
              }}
              error={emailError}
              leadingIcon="mail-outline"
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              containerStyle={{ marginBottom: theme.spacing.lg }}
            />
            <TextField
              placeholder={String(t("login.passwordPlaceholder"))}
              value={password}
              onChangeText={value => {
                setPassword(value);
                if (passwordError) setPasswordError("");
              }}
              error={passwordError}
              leadingIcon="lock-outline"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={login}
              trailing={
                <Pressable accessibilityLabel="toggle password visibility" onPress={() => setShowPassword(!showPassword)} style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", marginRight: -theme.spacing.md }}>
                  <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={22} color={theme.colors.textMuted} />
                </Pressable>
              }
              containerStyle={{ marginBottom: theme.spacing.lg }}
            />

            {!!loginError && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, backgroundColor: theme.colors.dangerBg, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                <MaterialIcons name="error-outline" size={20} color={theme.colors.danger} />
                <Text style={{ fontSize: 15, fontFamily: theme.fonts.medium, color: theme.colors.danger, flexShrink: 1 }}>{loginError}</Text>
              </View>
            )}

            <Button label={t("common.login")} size="lg" fullWidth loading={isLoading} onPress={login} />

            <Text style={{ fontSize: 13, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, textAlign: "center", marginTop: theme.spacing.lg, lineHeight: 19 }}>
              {t("login.privacyConsent")}{" "}
              <Text style={{ color: theme.colors.primary, textDecorationLine: "underline" }} onPress={() => router.navigate("/privacyPolicy")}>
                {t("login.privacyPolicy")}
              </Text>
            </Text>
          </Card>
        </Animated.View>
        <Text style={{ fontSize: 13, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, textAlign: "center", marginTop: theme.spacing.lg }}>{getVersion()}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export default Login;

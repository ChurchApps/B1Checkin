import React from "react";
import { View, Text, TextInput, ActivityIndicator, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { Utilities, screenNavigationProps, Styles, StyleConstants } from "../src/helpers";
import { ApiHelper, DimensionHelper, FirebaseHelper, LoginResponseInterface, Utils } from "../src/helpers";
import Fontisto from "@expo/vector-icons/Fontisto";
import { router } from "expo-router";

interface Props { navigation: screenNavigationProps }

function Login(_props: Props) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const login = () => {
    if (email === "") { Utils.snackBar(t("login.enterEmail")); } else if (!Utilities.validateEmail(email)) { Utils.snackBar(t("login.validEmail")); } else if (password === "") { Utils.snackBar(t("login.enterPassword")); } else {
      setIsLoading(true);
      ApiHelper.postAnonymous("/users/login", { email: email, password: password }, "MembershipApi").then((data: LoginResponseInterface) => {
        setIsLoading(false);
        if (data.errors?.length > 0) Utils.snackBar(data.errors[0]);
        else {
          const churches = data.userChurches?.filter(userChurch => userChurch.apis && userChurch.apis?.length > 0);
          AsyncStorage.multiSet([["@Login", "true"], ["@Email", email], ["@Password", password], ["@UserChurches", JSON.stringify(churches)]]);
          setEmail("");
          setPassword("");
          router.replace("/selectChurch");
        }
      }).catch((_error) => {
        setIsLoading(false);
        Utils.snackBar(t("login.loginFailed"));
      });
    }
  };

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Login");
  }, []);

  return (
    <KeyboardAvoidingView
      style={Styles.loginContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={Styles.loginCard}>
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: DimensionHelper.wp("4%") }}>
            <Image
              source={require("../src/images/logo1.png")}
              style={{
                width: DimensionHelper.wp("28%"),
                height: DimensionHelper.wp("28%"),
                resizeMode: "contain",
                marginBottom: DimensionHelper.wp("1%")
              }}
            />
            <Text style={{ fontSize: DimensionHelper.wp("3.2%"), fontFamily: StyleConstants.RobotoRegular, color: StyleConstants.grayColor }}>{t("login.title")}</Text>
          </View>

          {/* Title */}
          <Text style={Styles.loginTitle}>{t("login.welcomeBack")}</Text>

          {/* Email Input */}
          <View style={Styles.loginInputView}>
            <Fontisto
              name="email"
              color={StyleConstants.darkColor}
              size={DimensionHelper.wp("4.5%")}
              style={Styles.loginInputIcon}
            />
            <TextInput
              placeholder={t("login.emailPlaceholder")}
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              style={Styles.loginInput}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(value) => setEmail(value)}
            />
          </View>

          {/* Password Input */}
          <View style={Styles.loginInputView}>
            <Fontisto
              name="key"
              color={StyleConstants.darkColor}
              size={DimensionHelper.wp("4.5%")}
              style={Styles.loginInputIcon}
            />
            <TextInput
              placeholder={t("login.passwordPlaceholder")}
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              style={Styles.loginInput}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
              value={password}
              onChangeText={(value) => setPassword(value)}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={Styles.loginButton}
            onPress={login}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={Styles.loginButtonText}>{t("common.login")}</Text>
            )}
          </TouchableOpacity>

          {/* Privacy Policy */}
          <Text style={Styles.privacyText}>
            {t("login.privacyConsent")}{" "}
            <Text
              style={Styles.privacyLink}
              onPress={() => router.navigate("/privacyPolicy")}
            >
              {t("login.privacyPolicy")}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export default Login;


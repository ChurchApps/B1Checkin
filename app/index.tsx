import React, { useEffect } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { CommonActions } from "@react-navigation/native";
import { screenNavigationProps, Styles, CachedData, Utilities, EnvironmentHelper } from "../src/helpers";
import { ApiHelper, AppCenterHelper, ErrorHelper, FirebaseHelper, LoginResponseInterface, PushNotificationHelper } from "@churchapps/mobilehelper";
import { router, useRouter } from "expo-router";

EnvironmentHelper.init();
type Props = { navigation: screenNavigationProps; };

function Splash(props: Props) {
  console.log('Callleed')
  const router = useRouter()

  useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Splash");
    ErrorHelper.init();
  }, []);

  const loadData = () => {
    FirebaseHelper.addAnalyticsEvent("splash Screen", "")
    // AppCenterHelper.trackEvent("Splash Screen"); 
    PushNotificationHelper.registerUserDevice("ChumsCheckin");
    setTimeout(access, 1000);
  };

  const access = async () => {
    await AsyncStorage.multiGet(["@Login", "@Email", "@Password", "@SelectedChurchId", "@Printer", "@ChurchAppearance"]).then(response => {
      const printerJSON = response[4][1];
      if (printerJSON != null) { CachedData.printer = JSON.parse(printerJSON); }
      const appearanceJson = response[5][1];
      if (appearanceJson) { CachedData.churchAppearance = JSON.parse(appearanceJson); }
      const login = response[0][1] === "true";
      if (login) {
        const email = response[1][1];
        const password = response[2][1];
        const selectedChurchId = response[3][1];

        attemptLogin(email || "", password || "", selectedChurchId || "");
      } else { redirectToLogin(); }
    });

  };

  const redirectToLogin = () => {
    // console.log("login")
    // Replace the current route stack with the "login" route.
    // route.replace('/Login');
    router.replace('/login')
  };

  const attemptLogin = (email: string, password: string, churchId: string) => {
    ApiHelper.postAnonymous("/users/login", { email: email, password: password }, "MembershipApi").then((data: LoginResponseInterface) => {
      if (data.errors?.length > 0) { redirectToLogin(); }
      else {
        AsyncStorage.multiSet([["@Login", "true"], ["@Email", email], ["@Password", password]]);
        if (churchId) {
          const userChurch = data.userChurches.filter(userchurch => userchurch.church.id === churchId)[0];
          CachedData.userChurch = userChurch;
          userChurch.apis?.forEach(api => { ApiHelper.setPermissions(api.keyName || "", api.jwt, api.permissions); });
          // props.navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Services" }] }));
          router.replace("/selectChurch")
          return;
        }
        router.replace("/selectChurch")
        // props.navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "SelectChurch" }] }));
      }
    }).catch(() => { redirectToLogin(); });
  };

  React.useEffect(loadData, []);  //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{flex: 1, backgroundColor: "#FFF"}}>
      <View style={{ justifyContent: 'center', alignItems: 'center', flex:1 }}>
        <TouchableOpacity onPress={() => {
          console.log("onpresss")
          router.replace('/login');
        }}>
          <Image source={require("../assets/images/adaptive-icon.png")} style={{ width: 200, height: 200 }} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );

};

export default Splash
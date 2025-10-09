import React, { useState } from "react";
import {
  View, Image, StatusBar, Text, NativeModules, NativeEventEmitter, Platform, Dimensions, Alert,
  ViewStyle,
  ImageStyle
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ripple from "react-native-material-ripple";
import { CachedData, screenNavigationProps, Styles, StyleConstants, DimensionHelper, LoginUserInterface } from "../helpers";
import { router } from "expo-router";
import UserPlaceHolderIcon from "@/assets/images/user-placeholder.png";

interface Props {
  navigation: screenNavigationProps,
  logo?: boolean,
  prominentLogo?: boolean,
  title?: string,
  subtitle?: string
}


const Header = (props: Props) => {
  const [status, setStatus] = React.useState("");
  const [landscape, setLandscape] = React.useState(false);
  const [user, setUser] = useState<LoginUserInterface>({});

  let eventEmitter: NativeEventEmitter;

  const handleClick = () => {
    router.navigate("/printers");
    // props.navigation?.navigate("/printers");
  };

  const fetchUserDetails = async () => {
    try {
      const userDetails = await AsyncStorage.getItem("@UserObj");
      let user = userDetails ? JSON.parse(userDetails) : null;

      const data = await AsyncStorage.multiGet(["@UserChurches", "@SelectedChurchId"]);
      const churches = data[0][1] ? JSON.parse(data[0][1]) : [];
      const selectedChurchId = data[1][1] || null;

      if (churches.length && selectedChurchId) {
        const currentChurch = churches.find(
          (uc: any) => uc.church?.id?.toString() === selectedChurchId
        );
        if (currentChurch) {
          user = {
            ...user,
            photo: currentChurch?.person?.photo
          };
        }
      }

      if (user) setUser(user);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      "Logout Confirmation",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            // Clear stored credentials and church selection
            await AsyncStorage.multiRemove(["@Email", "@Password", "@SelectedChurchId", "@ChurchAppearance", "@UserChurches", "@Login"]);

            // Clear cached data
            CachedData.userChurch = null;
            CachedData.churchAppearance = null;

            // Navigate to login screen
            router.replace("/login");
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleLogoTap = () => {
    router.push({
      pathname: "/selectChurch",
      params: { fromServices: "true" },
    });
  };

  const receiveNativeStatus = (receivedStatus: string) => { setStatus(receivedStatus); };

  const init = () => {
    console.log(Platform.OS);
    fetchUserDetails();
    if (Platform.OS === "android" && NativeModules.PrinterHelper) {
      console.log("print", CachedData.printer);
      console.log(receiveNativeStatus);

      NativeModules.PrinterHelper.bind(receiveNativeStatus);
      NativeModules.PrinterHelper.checkInit(CachedData.printer?.ipAddress || "", CachedData.printer?.model || "");
      eventEmitter = new NativeEventEmitter(NativeModules.PrinterHelper);
      eventEmitter.addListener("StatusUpdated", (event: any) => {
        if (event.status.indexOf("ready") > -1) { CachedData.printer.ipAddress = "ready"; }
        setStatus(event.status);
      });
    }
  };

  const getVersion = () => {
    let pkg = require("../../package.json");
    return "v" + pkg.version;
  };

  React.useEffect(init, []);

  const isLandscape = () => {
    const dim = Dimensions.get("screen");
    return dim.width >= dim.height;
  };

  React.useEffect(() => {
    Dimensions.addEventListener("change", () => {
      isLandscape() ? setLandscape(true) : setLandscape(false);
    });
  }, []);

  React.useEffect(() => {
    Dimensions.addEventListener("change", () => {
      isLandscape() ? setLandscape(true) : setLandscape(false);
    });
  }, [landscape]);

  const getLogoUrl = () => {
    if (CachedData.churchAppearance?.logoLight) {
      return { uri: CachedData.churchAppearance?.logoLight };
    } else { return require("../images/logo1.png"); }
  };

  if (props.prominentLogo) {
    return (
      <View style={{ backgroundColor: StyleConstants.ghostWhite }}>
        <StatusBar backgroundColor={StyleConstants.baseColor} />

        {/* Compact Printer Status Bar */}
        <View style={headerStyles.printerAndProfileWrapper}>
          <Ripple style={headerStyles.userProfile} onPress={() => { handleLogout(); }}>
            <Image
              source={user?.photo ? { uri: user.photo } : UserPlaceHolderIcon}
              style={{ width: 25, height: 25, borderRadius: 20, marginRight: 6 }}
            />
            <Text style={{ backgroundColor: StyleConstants.baseColor, color: "#FFF" }}>{user?.firstName + ", " + user?.lastName}</Text>
          </Ripple>

          <Ripple onPress={() => { handleClick(); }}>
            <Text style={{ backgroundColor: StyleConstants.baseColor, color: "#FFF" }}>{getVersion()} - {status}</Text>
          </Ripple>
        </View>

        {/* Logo Section with Dark Blue Background */}
        <View style={headerStyles.logoSection}>
          {/* Prominent Church Logo in White Box - Tappable for secret logout */}
          <Ripple style={headerStyles.logoContainer} onPress={handleLogoTap}>
            <Image source={getLogoUrl()} style={headerStyles.prominentLogo} />
          </Ripple>
        </View>

      </View>
    );
  }

  return (
    <View style={[props.logo !== false ? Styles.headerLogoView : { backgroundColor: "transparent" }, landscape && { maxHeight: props.logo ? "30%" : DimensionHelper.wp("50%") }]}>
      <StatusBar backgroundColor={StyleConstants.baseColor} />

      <View style={headerStyles.printerAndProfileWrapper}>
        <Ripple style={headerStyles.userProfile} onPress={() => { handleLogout(); }}>
          <Image
            source={user?.photo ? { uri: user.photo } : UserPlaceHolderIcon}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 3 }}
          />
          <Text style={{ backgroundColor: StyleConstants.baseColor, color: "#FFF" }}>{user?.firstName + "," + user?.lastName}</Text>
        </Ripple>

        <Ripple onPress={() => { handleClick(); }}>
          <Text style={{ backgroundColor: StyleConstants.baseColor, color: "#FFF" }}>{getVersion()} - {status}</Text>
        </Ripple>
      </View>

      <Ripple style={Styles.printerStatus} onPress={() => { handleClick(); }}>
        <Text style={{ backgroundColor: StyleConstants.baseColor, color: "#FFF" }}>{getVersion()} - {status}</Text>
      </Ripple>
      {props.logo !== false && (
        <Ripple onPress={handleLogoTap} style={{ alignItems: "center", justifyContent: "center" }}>
          <Image source={getLogoUrl()} style={[Styles.headerLogoIcon, landscape && { maxHeight: "40%", top: "10%" }]} />
        </Ripple>
      )}
    </View>
  );
};

// Professional tablet-optimized styles for prominent logo mode
const headerStyles = {
  // Logo Section (Dark blue background)
  logoSection: {
    backgroundColor: StyleConstants.baseColor, // Dark blue #1565C0
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingTop: DimensionHelper.wp("5%"),
    paddingBottom: DimensionHelper.wp("5%"),
    alignItems: "center"
  } as ViewStyle,

  // Prominent White Box for Logo within Blue Header
  logoContainer: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    width: DimensionHelper.wp("70%"), // 70% of blue box width
    height: DimensionHelper.wp("16%"),
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  } as ViewStyle,

  prominentLogo: {
    width: DimensionHelper.wp("65%"), // Slightly smaller than container for padding
    height: DimensionHelper.wp("14%"),
    resizeMode: "contain"
  } as ImageStyle,

  printerAndProfileWrapper: {
    flexDirection: "row",
    backgroundColor: StyleConstants.baseColor,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10
  } as ViewStyle,

  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle
};

export default Header;


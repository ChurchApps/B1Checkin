import * as React from "react";
import {
  Text, FlatList, ActivityIndicator, View, Image, TouchableOpacity
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StyleConstants, Styles, CachedData } from "../src/helpers";
import { ApiHelper, DimensionHelper, FirebaseHelper, LoginUserChurchInterface } from "../src/helpers";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// interface Props {
//   navigation: screenNavigationProps
// }

function SelectChurch() {
  const router = useRouter();
  const [userChurches, setUserChurches] = React.useState<LoginUserChurchInterface[]>([]);
  const [isLoading, setLoading] = React.useState<boolean>(false);
  const [churchLogos, setChurchLogos] = React.useState<{[key: string]: string}>({});

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Select Church");
    setLoading(true);
    // AppCenterHelper.trackEvent("Select Church Screen");
    (async () => {
      const userChurch = await AsyncStorage.getItem("@UserChurches");
      const churches = JSON.parse(userChurch || "");
      setUserChurches(churches);

      // Fetch church logos
      const logos: {[key: string]: string} = {};

      for (const church of churches) {
        try {
          if (church.church?.id) {
            const appearance = await ApiHelper.getAnonymous("/settings/public/" + church.church.id, "MembershipApi");

            if (appearance?.logoLight) {
              logos[church.church.id] = appearance.logoLight;
            } else if (appearance?.logo) {
              logos[church.church.id] = appearance.logo;
            }
          }
        } catch (_error) {
          // Silently continue if logo fetch fails
        }
      }

      setChurchLogos(logos);
      setLoading(false);
    })();
  }, []);

  const select = async (userChurch: LoginUserChurchInterface) => {
    console.log("Navigating to /services..."); // Debugging log
    CachedData.userChurch = userChurch;
    userChurch.apis?.forEach(api => ApiHelper.setPermissions(api.keyName || "", api.jwt, api.permissions));
    await AsyncStorage.setItem("@SelectedChurchId", userChurch.church?.id?.toString() || "");
    CachedData.churchAppearance = await ApiHelper.getAnonymous("/settings/public/" + userChurch.church.id, "MembershipApi");
    await AsyncStorage.setItem("@ChurchAppearance", JSON.stringify(CachedData.churchAppearance));
    // navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Services" }] }));

    router.replace("/services"); // Navigate using expo-router
    // router.push({ pathname: "/services", params: { selectedChurchId: userChurch.church.id } });

  };



  const getChurchLogo = (userChurch: LoginUserChurchInterface) => {
    const churchId = userChurch.church?.id;
    const logoUrl = churchId ? churchLogos[churchId] : null;

    if (logoUrl) {
      return (
        <View style={Styles.churchLogoContainer}>
          <Image
            source={{ uri: logoUrl }}
            style={Styles.churchLogo}
          />
        </View>
      );
    } else {
      // Placeholder church icon when no logo is available
      return (
        <View style={Styles.churchLogoContainer}>
          <MaterialIcons
            name="location-city"
            size={DimensionHelper.wp("3.5%")}
            color={StyleConstants.baseColor}
            style={Styles.churchPlaceholderIcon}
          />
        </View>
      );
    }
  };

  const getRow = (userChurch: LoginUserChurchInterface) => (
    <TouchableOpacity
      style={Styles.churchCard}
      onPress={() => select(userChurch)}
      activeOpacity={0.8}
    >
      {getChurchLogo(userChurch)}
      <Text style={Styles.churchName}>{userChurch.church?.name}</Text>
    </TouchableOpacity>
  );

  const churchList = isLoading
    ? (
      <View style={Styles.churchSelectionLoader}>
        <ActivityIndicator size="large" color={StyleConstants.baseColor} animating={isLoading} />
        <Text style={{ marginTop: DimensionHelper.wp("4%"), fontSize: DimensionHelper.wp("3.5%"), color: StyleConstants.grayColor, fontFamily: StyleConstants.RobotoRegular }}>Loading churches...</Text>
      </View>
    )
    : (
      <FlatList
        data={userChurches}
        renderItem={({ item }) => getRow(item)}
        keyExtractor={(item: any) => item.church?.id?.toString() || item.id?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: DimensionHelper.wp("10%") }}
      />
    );

  return (
    <View style={Styles.churchSelectionContainer}>
      {/* Header with Logo */}
      <View style={{ alignItems: "center", marginBottom: DimensionHelper.wp("6%") }}>
        <Image
          source={require("../src/images/logo1.png")}
          style={{
            width: DimensionHelper.wp("20%"),
            height: DimensionHelper.wp("20%"),
            resizeMode: "contain",
            marginBottom: DimensionHelper.wp("2%"),
            borderRadius: DimensionHelper.wp("5%")
          }}
        />
        <Text style={Styles.churchSelectionTitle}>Select a Church</Text>
      </View>

      {churchList}
    </View>
  );
}
export default SelectChurch;


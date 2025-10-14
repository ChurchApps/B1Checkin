
import React, { useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import Ripple from "react-native-material-ripple";
import { RouteProp } from "@react-navigation/native";

import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import MemberList from "../src/components/MemberList";
import { screenNavigationProps, CachedData, StyleConstants, DimensionHelper } from "../src/helpers";
import { FirebaseHelper, VisitInterface } from "../src/helpers";
import { router, useFocusEffect } from "expo-router";
import { ScreenList } from "../src/screenList";

type ProfileScreenRouteProp = RouteProp<ScreenList, "Household">;
interface Props { navigation: screenNavigationProps; }

const Household = (props: Props) => {
  const [pendingVisits, setPendingVisits] = React.useState<VisitInterface[]>([]);
  // const init = () => {
  //   // AppCenterHelper.trackEvent("Household screen");
  //   props.navigation.addListener("focus", () => {
  //     setPendingVisits([...CachedData.pendingVisits]);
  //   });
  // };

  useFocusEffect(
    useCallback(() => {
      setPendingVisits([...CachedData.pendingVisits]);
    }, [])
  );
  const checkin = () => { router.navigate("/checkinComplete"); };
  const addGuest = () => { router.navigate("/addGuest"); };


  // console.log(props.navigation)

  React.useEffect(() => { FirebaseHelper.addOpenScreenEvent("Household"); }, []);

  return (
    <View style={householdStyles.container}>
      <Header
        navigation={props.navigation}
        prominentLogo={true}
      />

      {/* Household Members Section */}
      <Subheader
        icon="👥"
        title="Select Household Members"
        subtitle="Choose who is checking in today"
      />

      {/* Main Content */}
      <View style={householdStyles.mainContent}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={householdStyles.scrollContent}
        >
          <MemberList navigation={props.navigation} pendingVisits={pendingVisits} />

          {/* Add Guest Button */}
          <View style={householdStyles.addGuestSection}>
            <Ripple style={householdStyles.addGuestButton} onPress={addGuest}>
              <Text style={householdStyles.addGuestIcon}>👤</Text>
              <Text style={householdStyles.addGuestText}>Add a Guest</Text>
            </Ripple>
          </View>
        </ScrollView>
      </View>

      {/* Check-in Button */}
      <View style={householdStyles.checkinSection}>
        <Ripple style={householdStyles.checkinButton} onPress={checkin}>
          <Text style={householdStyles.checkinButtonText}>CHECK IN</Text>
        </Ripple>
      </View>
    </View>
  );
};

const householdStyles = {
  container: {
    flex: 1,
    backgroundColor: StyleConstants.ghostWhite
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: DimensionHelper.wp("5%")
  },

  scrollContent: {
    paddingBottom: DimensionHelper.wp("5%")
  },

  // Add Guest Section
  addGuestSection: {
    marginTop: DimensionHelper.wp("5%"),
    marginBottom: DimensionHelper.wp("3%")
  },

  addGuestButton: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    paddingVertical: DimensionHelper.wp("4%"),
    paddingHorizontal: DimensionHelper.wp("6%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    shadowColor: StyleConstants.baseColor,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: DimensionHelper.wp("90%"),
    borderWidth: 2,
    borderColor: StyleConstants.baseColor
  },

  addGuestIcon: {
    fontSize: DimensionHelper.wp("5%"),
    marginRight: DimensionHelper.wp("3%")
  },

  addGuestText: {
    color: StyleConstants.baseColor,
    fontSize: DimensionHelper.wp("4%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "600"
  },

  // Check-in Section
  checkinSection: {
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingVertical: DimensionHelper.wp("3%"),
    backgroundColor: StyleConstants.whiteColor,
    borderTopWidth: 1,
    borderTopColor: StyleConstants.lightGrayColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    shadowColor: StyleConstants.baseColor
  },

  checkinButton: {
    backgroundColor: StyleConstants.baseColor,
    borderRadius: 12,
    paddingVertical: DimensionHelper.wp("4%"),
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    shadowColor: StyleConstants.baseColor
  },

  checkinButtonText: {
    color: StyleConstants.whiteColor,
    fontSize: DimensionHelper.wp("4.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "600",
    letterSpacing: 1
  }
};

export default Household;

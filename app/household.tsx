
import React, { useCallback } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import Ripple from "react-native-material-ripple";
import { RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import MemberList from "../src/components/MemberList";
import { screenNavigationProps, CachedData, VisitHelper, StyleConstants, DimensionHelper } from "../src/helpers";
import { FirebaseHelper, VisitInterface } from "../src/helpers";
import { router, useFocusEffect } from "expo-router";
import { useCheckinTheme } from "../src/context/CheckinThemeContext";
import { ScreenList } from "../src/screenList";

type ProfileScreenRouteProp = RouteProp<ScreenList, "Household">;
interface Props { navigation: screenNavigationProps; }

const Household = (props: Props) => {
  const { t } = useTranslation();
  const { theme } = useCheckinTheme();
  const [pendingVisits, setPendingVisits] = React.useState<VisitInterface[]>([]);

  useFocusEffect(
    useCallback(() => {
      setPendingVisits([...CachedData.pendingVisits]);
    }, [])
  );
  const checkin = () => {
    const alreadyCheckedInNames: string[] = [];
    CachedData.pendingVisits.forEach(pv => {
      if (pv.visitSessions && pv.visitSessions.length > 0) {
        const existingVisit = VisitHelper.getByPersonId(CachedData.existingVisits, pv.personId || "");
        if (existingVisit && existingVisit.id) {
          const person = CachedData.householdMembers.find(m => m.id === pv.personId);
          if (person) alreadyCheckedInNames.push(person.name?.display || person.displayName || t("members.unknown"));
        }
      }
    });

    if (alreadyCheckedInNames.length > 0) {
      Alert.alert(
        t("household.duplicateTitle"),
        t("household.duplicateMessage", { names: alreadyCheckedInNames.join(", ") }),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("household.duplicateConfirm"), onPress: () => { router.navigate("/checkinComplete"); } }
        ]
      );
    } else {
      router.navigate("/checkinComplete");
    }
  };
  const addGuest = () => { router.navigate("/addGuest"); };

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
        title={t("household.title")}
        subtitle={t("household.subtitle")}
        onBack={() => router.back()}
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
            <Ripple style={[householdStyles.addGuestButton, { shadowColor: theme.colors.primary, borderColor: theme.colors.primary }]} onPress={addGuest}>
              <Text style={householdStyles.addGuestIcon}>👤</Text>
              <Text style={[householdStyles.addGuestText, { color: theme.colors.primary }]}>{t("household.addGuest")}</Text>
            </Ripple>
          </View>
        </ScrollView>
      </View>

      {/* Check-in Button */}
      <View style={[householdStyles.checkinSection, { shadowColor: theme.colors.primary }]}>
        <Ripple style={[householdStyles.checkinButton, { backgroundColor: theme.colors.buttonBackground, shadowColor: theme.colors.primary }]} onPress={checkin}>
          <Text style={[householdStyles.checkinButtonText, { color: theme.colors.buttonText }]}>{t("household.checkin")}</Text>
        </Ripple>
      </View>
    </View>
  );
};

const householdStyles = {
  container: { flex: 1, backgroundColor: StyleConstants.ghostWhite },

  mainContent: { flex: 1, paddingHorizontal: DimensionHelper.wp("4%") },

  scrollContent: { paddingBottom: DimensionHelper.wp("3%") },

  addGuestSection: { marginTop: DimensionHelper.wp("3%"), marginBottom: DimensionHelper.wp("2%") },

  addGuestButton: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 10,
    paddingVertical: DimensionHelper.wp("2.5%"),
    paddingHorizontal: DimensionHelper.wp("4%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    shadowColor: StyleConstants.baseColor,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: DimensionHelper.wp("90%"),
    borderWidth: 2,
    borderColor: StyleConstants.baseColor
  },

  addGuestIcon: { fontSize: DimensionHelper.wp("3.5%"), marginRight: DimensionHelper.wp("2%") },

  addGuestText: { color: StyleConstants.baseColor, fontSize: DimensionHelper.wp("3.2%"), fontFamily: StyleConstants.RobotoMedium, fontWeight: "600" },

  checkinSection: {
    paddingHorizontal: DimensionHelper.wp("4%"),
    paddingVertical: DimensionHelper.wp("2%"),
    backgroundColor: StyleConstants.whiteColor,
    borderTopWidth: 1,
    borderTopColor: StyleConstants.lightGrayColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    shadowColor: StyleConstants.baseColor
  },

  checkinButton: {
    backgroundColor: StyleConstants.baseColor,
    borderRadius: 10,
    paddingVertical: DimensionHelper.wp("3%"),
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    shadowColor: StyleConstants.baseColor
  },

  checkinButtonText: { color: StyleConstants.whiteColor, fontSize: DimensionHelper.wp("3.5%"), fontFamily: StyleConstants.RobotoMedium, fontWeight: "600", letterSpacing: 0.5 }
};

export default Household;

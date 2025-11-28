import React from "react";
import { View, Text } from "react-native";
import Ripple from "react-native-material-ripple";
import { useTranslation } from "react-i18next";
import { CachedData, screenNavigationProps, VisitHelper, VisitSessionHelper, StyleConstants } from "../helpers";
import { FontAwesome } from "@expo/vector-icons";
import { PersonInterface, VisitInterface, ServiceTimeInterface, VisitSessionInterface, GroupInterface, ArrayHelper, DimensionHelper } from "../helpers";
import { router } from "expo-router";

interface Props { person: PersonInterface, selectedMemberId: string, navigation: screenNavigationProps, pendingVisits: VisitInterface[] }

const MemberServiceTimes = (props: Props) => {
  const { t } = useTranslation();

  const handleServiceTimeClick = (serviceTime: any, person: any) => {
    router.navigate({
      pathname: "/selectGroup",
      params: {
        personId: person.id || "",
        serviceTime: JSON.stringify(serviceTime)
      }
    });

  };

  const getExpandedRow = (serviceTime: ServiceTimeInterface, visitSessions: VisitSessionInterface[]) => {
    const stSessions = VisitSessionHelper.getByServiceTimeId(visitSessions, serviceTime.id || "");
    const isSelected = stSessions.length > 0;
    let selectedGroupName = t("members.selectGroup");
    if (isSelected) {
      const groupId = stSessions[0].session?.groupId || "";
      const group: GroupInterface = ArrayHelper.getOne(serviceTime.groups || [], "id", groupId);
      selectedGroupName = group?.name || t("members.error");
    }

    // Truncate group name if it's too long
    const maxLength = 15;
    if (selectedGroupName.length > maxLength) {
      selectedGroupName = selectedGroupName.substring(0, maxLength) + "...";
    }

    return (
      <View key={serviceTime.id} style={serviceTimeStyles.expandedRow}>
        <View style={serviceTimeStyles.serviceTimeInfo}>
          <View style={serviceTimeStyles.timeIconContainer}>
            <FontAwesome
              name="clock-o"
              style={serviceTimeStyles.timeIcon}
              size={DimensionHelper.wp("4%")}
            />
          </View>
          <View style={serviceTimeStyles.serviceTimeTextContainer}>
            <Text style={serviceTimeStyles.serviceTimeText}>{serviceTime.name}</Text>
          </View>
        </View>
        <Ripple
          style={[serviceTimeStyles.serviceTimeButton, isSelected ? serviceTimeStyles.selectedButton : serviceTimeStyles.unselectedButton]}
          onPress={() => { handleServiceTimeClick(serviceTime, props.person); }}
        >
          <Text style={[serviceTimeStyles.serviceTimeButtonText, isSelected ? serviceTimeStyles.selectedButtonText : serviceTimeStyles.unselectedButtonText]}>
            {selectedGroupName}
          </Text>
          <FontAwesome
            name="chevron-right"
            style={[serviceTimeStyles.buttonIcon, isSelected ? serviceTimeStyles.selectedButtonIcon : serviceTimeStyles.unselectedButtonIcon]}
            size={DimensionHelper.wp("3.5%")}
          />
        </Ripple>
      </View>
    );
  };

  const result: any[] = [];
  if (props.selectedMemberId === props.person.id) {
    const visit = VisitHelper.getByPersonId(props.pendingVisits, props.person.id || "");
    const visitSessions = visit?.visitSessions || [];
    if (CachedData.serviceTimes && Array.isArray(CachedData.serviceTimes)) {
      CachedData.serviceTimes.forEach(st => {
        if (st) {
          result.push(getExpandedRow(st, visitSessions));
        }
      });
    }
  }

  return (
    <View style={serviceTimeStyles.container}>
      {result}
    </View>
  );
};
// Professional tablet-optimized styles for service times
const serviceTimeStyles = {
  container: {
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingBottom: DimensionHelper.wp("2%")
  },

  expandedRow: {
    backgroundColor: StyleConstants.ghostWhite,
    borderRadius: 8,
    padding: DimensionHelper.wp("3%"),
    marginVertical: DimensionHelper.wp("1%"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 3,
    borderLeftColor: StyleConstants.baseColor
  },

  serviceTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },

  timeIconContainer: {
    width: DimensionHelper.wp("8%"),
    height: DimensionHelper.wp("8%"),
    borderRadius: DimensionHelper.wp("4%"),
    backgroundColor: StyleConstants.baseColor + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: DimensionHelper.wp("3%")
  },

  timeIcon: {
    color: StyleConstants.baseColor
  },

  serviceTimeTextContainer: {
    flex: 1
  },

  serviceTimeText: {
    fontSize: DimensionHelper.wp("4%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor
  },

  // Service Time Buttons
  serviceTimeButton: {
    paddingHorizontal: DimensionHelper.wp("4%"),
    paddingVertical: DimensionHelper.wp("2.5%"),
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: DimensionHelper.wp("35%"),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    shadowColor: StyleConstants.baseColor
  },

  selectedButton: {
    backgroundColor: StyleConstants.baseColor
  },

  unselectedButton: {
    backgroundColor: StyleConstants.whiteColor,
    borderWidth: 1,
    borderColor: StyleConstants.baseColor + "40"
  },

  serviceTimeButtonText: {
    fontSize: DimensionHelper.wp("3.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    marginRight: DimensionHelper.wp("2%")
  },

  selectedButtonText: {
    color: StyleConstants.whiteColor
  },

  unselectedButtonText: {
    color: StyleConstants.baseColor
  },

  buttonIcon: {
    marginLeft: DimensionHelper.wp("1%")
  },

  selectedButtonIcon: {
    color: StyleConstants.whiteColor,
    opacity: 0.8
  },

  unselectedButtonIcon: {
    color: StyleConstants.baseColor,
    opacity: 0.6
  }
};

export default MemberServiceTimes;


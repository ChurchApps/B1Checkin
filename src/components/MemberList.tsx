import React from "react";
import { View, Text, FlatList, Image, Dimensions, PixelRatio } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Ripple from "react-native-material-ripple";
import {
  CachedData, EnvironmentHelper, screenNavigationProps, VisitHelper, StyleConstants, VisitInterface, PersonInterface, VisitSessionInterface, ServiceTimeInterface, GroupInterface, ArrayHelper, DimensionHelper
} from "../helpers";
import MemberServiceTimes from "./MemberServiceTimes";

interface Props { navigation: screenNavigationProps, pendingVisits: VisitInterface[] }

const MemberList = (props: Props) => {
  const [selectedMemberId, setSelectedMemberId] = React.useState("");
  const [dimension, setDimension] = React.useState(Dimensions.get("window"));

  const handleMemberClick = (id: string) => { setSelectedMemberId((selectedMemberId === id) ? "" : id); };

  const getCondensedGroupList = (person: PersonInterface) => {
    if (selectedMemberId === person.id) { return <></>; }

    const visit = VisitHelper.getByPersonId(props.pendingVisits, person.id || "");
    if (!visit || !visit.visitSessions || !Array.isArray(visit.visitSessions) || visit.visitSessions.length === 0) {
      return <></>;
    }

    const groups: JSX.Element[] = [];
    const visitSessions = visit.visitSessions || [];

    visitSessions.forEach((vs: VisitSessionInterface, index) => {
      if (!vs || !vs.session) { return; }

      const st: ServiceTimeInterface | null = ArrayHelper.getOne(CachedData.serviceTimes || [], "id", vs.session.serviceTimeId || "");
      const group: GroupInterface | null = ArrayHelper.getOne(st?.groups || [], "id", vs.session.groupId || "");
      const groupName = group?.name || "none";
      const serviceTime = st?.name || "";

      groups.push(
        <View key={index} style={memberListStyles.groupChip}>
          <View style={memberListStyles.groupInfo}>
            <Text style={memberListStyles.serviceTimeLabel} numberOfLines={1}>{serviceTime}</Text>
            <Text style={memberListStyles.groupName} numberOfLines={1}>{groupName}</Text>
          </View>
        </View>
      );
    });

    if (groups.length === 0) { return <></>; }
    return (<View style={memberListStyles.groupContainer}>{groups}</View>);
  };



  React.useEffect(() => {
    Dimensions.addEventListener("change", () => {
      const dim = Dimensions.get("screen");
      setDimension(dim);
    });
  }, []);

  const wd = (number: string) => {
    let givenWidth = typeof number === "number" ? number : parseFloat(number);
    return PixelRatio.roundToNearestPixel((dimension.width * givenWidth) / 100);
  };

  const getMemberRow = (data: any) => {
    const person: PersonInterface = data.item;
    const isExpanded = selectedMemberId === person.id;

    const getPhotoElement = () => {
      if (person.photo) {
        return (
          <Image
            source={{ uri: EnvironmentHelper.ContentRoot + person.photo }}
            style={memberListStyles.memberPhoto}
          />
        );
      } else {
        return (
          <View style={[memberListStyles.memberPhoto, memberListStyles.placeholderPhoto]}>
            <FontAwesome
              name="user"
              size={DimensionHelper.wp("7%")}
              color={StyleConstants.whiteColor}
            />
          </View>
        );
      }
    };

    return (
      <View style={memberListStyles.memberContainer}>
        <Ripple style={[memberListStyles.memberCard, { width: wd("90%") }]} onPress={() => { handleMemberClick(person.id || ""); }}>
          <View style={memberListStyles.memberContent}>
            {getPhotoElement()}
            <View style={memberListStyles.memberInfo}>
              <Text style={memberListStyles.memberName} numberOfLines={1}>{person.name?.display || person.displayName || "Unknown"}</Text>
              {getCondensedGroupList(person)}
            </View>
            <View style={memberListStyles.expandIconContainer}>
              <FontAwesome
                name={isExpanded ? "chevron-up" : "chevron-down"}
                style={memberListStyles.expandIcon}
                size={DimensionHelper.wp("5%")}
              />
            </View>
          </View>
        </Ripple>
        <MemberServiceTimes
          person={person}
          navigation={props.navigation}
          selectedMemberId={selectedMemberId}
          key={person.id?.toString()}
          pendingVisits={props.pendingVisits}
        />
      </View>
    );
  };

  return (
    <FlatList
      data={CachedData.householdMembers || []}
      renderItem={getMemberRow}
      keyExtractor={(item: PersonInterface) => item.id?.toString() || "0"}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={memberListStyles.listContainer}
    />
  );
};

// Professional tablet-optimized styles for member list
const memberListStyles = {
  listContainer: {
    paddingBottom: DimensionHelper.wp("5%")
  },

  memberContainer: {
    marginBottom: DimensionHelper.wp("3%")
  },

  // Member Cards (Professional Material Design)
  memberCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    padding: DimensionHelper.wp("4%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    shadowColor: StyleConstants.baseColor,
    alignSelf: "center",
    minHeight: DimensionHelper.wp("18%")
  },

  memberContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%"
  },

  memberPhoto: {
    width: DimensionHelper.wp("14%"),
    height: DimensionHelper.wp("14%"),
    borderRadius: DimensionHelper.wp("7%"),
    marginRight: DimensionHelper.wp("4%")
  },

  placeholderPhoto: {
    backgroundColor: StyleConstants.baseColor,
    justifyContent: "center",
    alignItems: "center"
  },

  memberInfo: {
    flex: 1,
    justifyContent: "center"
  },

  memberName: {
    fontSize: DimensionHelper.wp("4.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    marginBottom: DimensionHelper.wp("1%")
  },

  groupContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1
  },

  groupChip: {
    backgroundColor: StyleConstants.baseColor + "15",
    borderRadius: 8,
    paddingHorizontal: DimensionHelper.wp("2.5%"),
    paddingVertical: DimensionHelper.wp("1.5%"),
    marginBottom: DimensionHelper.wp("1%"),
    borderWidth: 1,
    borderColor: StyleConstants.baseColor + "30",
    maxWidth: "100%",
    alignSelf: "flex-start"
  },

  groupInfo: {
    flexDirection: "column",
    alignItems: "flex-start"
  },

  serviceTimeLabel: {
    fontSize: DimensionHelper.wp("2.8%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.baseColor,
    marginBottom: DimensionHelper.wp("0.5%")
  },

  groupName: {
    fontSize: DimensionHelper.wp("3.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor
  },

  expandIconContainer: {
    marginLeft: DimensionHelper.wp("3%"),
    justifyContent: "center",
    alignItems: "center"
  },

  expandIcon: {
    color: StyleConstants.baseColor,
    opacity: 0.7
  }
};

export default MemberList;

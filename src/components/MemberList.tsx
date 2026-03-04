import React from "react";
import { View, Text, FlatList, Image, Dimensions, PixelRatio } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Ripple from "react-native-material-ripple";
import { useTranslation } from "react-i18next";
import { CachedData, EnvironmentHelper, screenNavigationProps, VisitHelper, StyleConstants, VisitInterface, PersonInterface, VisitSessionInterface, ServiceTimeInterface, GroupInterface, ArrayHelper, DimensionHelper } from "../helpers";
import MemberServiceTimes from "./MemberServiceTimes";

interface Props { navigation: screenNavigationProps, pendingVisits: VisitInterface[] }

const MemberList = (props: Props) => {
  const { t } = useTranslation();
  const [selectedMemberId, setSelectedMemberId] = React.useState("");
  const [dimension, setDimension] = React.useState(Dimensions.get("window"));

  const handleMemberClick = (id: string) => { setSelectedMemberId((selectedMemberId === id) ? "" : id); };

  const isCheckedIn = (personId: string): boolean => {
    const visit = VisitHelper.getByPersonId(CachedData.existingVisits, personId);
    return visit !== null && visit !== undefined && visit.id !== null && visit.id !== undefined;
  };

  const getCondensedGroupList = (person: PersonInterface) => {
    if (selectedMemberId === person.id) return <></>;

    const visit = VisitHelper.getByPersonId(props.pendingVisits, person.id || "");
    if (!visit || !visit.visitSessions || !Array.isArray(visit.visitSessions) || visit.visitSessions.length === 0) {
      return <></>;
    }

    const groups: JSX.Element[] = [];
    const visitSessions = visit.visitSessions || [];

    visitSessions.forEach((vs: VisitSessionInterface, index) => {
      if (!vs || !vs.session) return;

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

    if (groups.length === 0) return <></>;
    return (<View style={memberListStyles.groupContainer}>{groups}</View>);
  };

  React.useEffect(() => {
    Dimensions.addEventListener("change", () => {
      const dim = Dimensions.get("screen");
      setDimension(dim);
    });
  }, []);

  const wd = (number: string) => {
    const givenWidth = typeof number === "number" ? number : parseFloat(number);
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
              size={DimensionHelper.wp("5%")}
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
              <Text style={memberListStyles.memberName} numberOfLines={1}>{person.name?.display || person.displayName || t("members.unknown")}</Text>
              {isCheckedIn(person.id || "") && (
                <View style={memberListStyles.checkedInBadge}>
                  <FontAwesome name="check-circle" size={DimensionHelper.wp("3%")} color={StyleConstants.greenColor} style={memberListStyles.checkedInIcon} />
                  <Text style={memberListStyles.checkedInText}>{t("household.alreadyCheckedIn")}</Text>
                </View>
              )}
              {person.nametagNotes ? (
                <View style={memberListStyles.noteBadge}>
                  <FontAwesome name="exclamation-triangle" size={DimensionHelper.wp("3%")} color={StyleConstants.yellowColor} style={memberListStyles.noteIcon} />
                  <Text style={memberListStyles.noteText} numberOfLines={1}>{person.nametagNotes}</Text>
                </View>
              ) : null}
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

const memberListStyles = {
  listContainer: { paddingBottom: DimensionHelper.wp("3%") },

  memberContainer: { marginBottom: DimensionHelper.wp("2%") },

  memberCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 10,
    padding: DimensionHelper.wp("3%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    shadowColor: StyleConstants.baseColor,
    alignSelf: "center",
    minHeight: DimensionHelper.wp("14%")
  },

  memberContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%"
  },

  memberPhoto: {
    width: DimensionHelper.wp("10%"),
    height: DimensionHelper.wp("10%"),
    borderRadius: DimensionHelper.wp("5%"),
    marginRight: DimensionHelper.wp("3%")
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
    fontSize: DimensionHelper.wp("3.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    marginBottom: DimensionHelper.wp("0.5%")
  },

  groupContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1
  },

  groupChip: {
    backgroundColor: StyleConstants.baseColor + "15",
    borderRadius: 6,
    paddingHorizontal: DimensionHelper.wp("2%"),
    paddingVertical: DimensionHelper.wp("1%"),
    marginBottom: DimensionHelper.wp("0.5%"),
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
    fontSize: DimensionHelper.wp("2.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.baseColor,
    marginBottom: DimensionHelper.wp("0.3%")
  },

  groupName: {
    fontSize: DimensionHelper.wp("2.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor
  },

  expandIconContainer: {
    marginLeft: DimensionHelper.wp("2%"),
    justifyContent: "center",
    alignItems: "center"
  },

  expandIcon: {
    color: StyleConstants.baseColor,
    opacity: 0.7
  },

  checkedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: StyleConstants.greenColor + "20",
    borderRadius: 6,
    paddingHorizontal: DimensionHelper.wp("1.5%"),
    paddingVertical: DimensionHelper.wp("0.5%"),
    marginBottom: DimensionHelper.wp("0.5%"),
    alignSelf: "flex-start"
  },

  checkedInIcon: {
    marginRight: DimensionHelper.wp("1%")
  },

  checkedInText: {
    fontSize: DimensionHelper.wp("2.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.greenColor
  },

  noteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: StyleConstants.yellowColor + "20",
    borderRadius: 6,
    paddingHorizontal: DimensionHelper.wp("1.5%"),
    paddingVertical: DimensionHelper.wp("0.5%"),
    marginBottom: DimensionHelper.wp("0.5%"),
    borderWidth: 1,
    borderColor: StyleConstants.yellowColor + "60",
    alignSelf: "flex-start"
  },

  noteIcon: {
    marginRight: DimensionHelper.wp("1%")
  },

  noteText: {
    fontSize: DimensionHelper.wp("2.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor
  }
};

export default MemberList;

import React from "react";
import { View, Text, FlatList, ScrollView } from "react-native";
import Ripple from "react-native-material-ripple";
import { useTranslation } from "react-i18next";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import { VisitHelper, VisitSessionHelper, CachedData, StyleConstants } from "../src/helpers";
import { FontAwesome } from "@expo/vector-icons";
import { DimensionHelper, FirebaseHelper, GroupInterface } from "../src/helpers";
import { useRouter, useLocalSearchParams } from "expo-router";


// type ProfileScreenRouteProp = RouteProp<ScreenList, "SelectGroup">;
// interface Props { navigation: screenNavigationProps; route: ProfileScreenRouteProp; }
interface GroupCategoryInterface { key: number, name: string, items: GroupInterface[] }

const SelectGroup = (props: any) => {
  const { t } = useTranslation();

  const router = useRouter();
  const { personId, serviceTime } = useLocalSearchParams();
  let serviceTimes = JSON.parse(serviceTime);

  const [selectedCategory, setSelectedCategory] = React.useState(-1);
  const [groupTree, setGroupTree] = React.useState<GroupCategoryInterface[]>([]);

  const buildTree = () => {
    FirebaseHelper.addOpenScreenEvent("Select Group");
    let category = "";
    let gt: GroupCategoryInterface[] = [];



    const sortedGroups = [...(serviceTimes?.groups || [])].sort((a, b) => ((a.categoryName || "") > (b.categoryName || "")) ? 1 : -1);




    sortedGroups?.forEach(g => {
      if (g.categoryName !== category) { gt.push({ key: gt.length, name: g.categoryName || "", items: [] }); }
      gt[gt.length - 1].items.push(g);
      category = g.categoryName || "";
    });

    setGroupTree(gt);
  };

  const handleCategoryClick = (value: number) => { setSelectedCategory((selectedCategory === value) ? -1 : value); };
  const handleNone = () => { selectGroup("", "NONE"); };

  // const selectGroup = (id: string, name: string) => {
  //   // AppCenterHelper.trackEvent("Select Group", name);
  //   const personId = props.route.params.personId;
  //   let visit = VisitHelper.getByPersonId(CachedData.pendingVisits, personId);
  //   if (visit === null) {
  //     visit = { personId: personId, serviceId: CachedData.serviceId, visitSessions: [] };
  //     CachedData.pendingVisits.push(visit);
  //   }
  //   const vs = visit?.visitSessions || [];
  //   const serviceTimeId = props.route.params.serviceTime.id || "";
  //   VisitSessionHelper.setValue(vs, serviceTimeId, id, name);
  //   // props.navigation.goBack();
  //   router.back();
  // };

  const selectGroup = (id: string, name: string) => {

    let visit = VisitHelper.getByPersonId(CachedData.pendingVisits, personId);

    if (!visit) {
      visit = { personId, serviceId: CachedData.serviceId, visitSessions: [] };
      CachedData.pendingVisits.push(visit);
    }

    const vs = visit?.visitSessions || [];
    const serviceTimeId = serviceTimes.id || ""; // ✅ Use serviceTimeId from params
    VisitSessionHelper.setValue(vs, serviceTimeId, id, name);

    router.back();
  };

  const getRow = (data: any) => {
    const item: GroupCategoryInterface = data.item;
    const isExpanded = selectedCategory === item.key;
    return (
      <View style={selectGroupStyles.categoryContainer}>
        <Ripple style={selectGroupStyles.categoryCard} onPress={() => { handleCategoryClick(item.key); }}>
          <View style={selectGroupStyles.categoryContent}>
            <View style={selectGroupStyles.categoryInfo}>
              <Text style={selectGroupStyles.categoryName}>{item.name}</Text>
              <Text style={selectGroupStyles.categoryCount}>{t("selectGroup.groupCount", { count: item.items.length })}</Text>
            </View>
            <View style={selectGroupStyles.expandIconContainer}>
              <FontAwesome
                name={isExpanded ? "chevron-up" : "chevron-down"}
                style={selectGroupStyles.expandIcon}
                size={DimensionHelper.wp("5%")}
              />
            </View>
          </View>
        </Ripple>
        {getExpanded(selectedCategory, item)}
      </View>
    );
  };

  const getExpanded = (selectedcategory: number, category: GroupCategoryInterface) => {
    if (selectedcategory !== category.key) { return <></>; }

    const result: JSX.Element[] = [];
    category.items.forEach(g => {
      result.push(
        <Ripple
          key={g.id?.toString()}
          style={selectGroupStyles.groupItem}
          onPress={() => selectGroup(g.id || "", g.name || "")}
        >
          <View style={selectGroupStyles.groupItemContent}>
            <View style={selectGroupStyles.groupIconContainer}>
              <FontAwesome
                name="users"
                style={selectGroupStyles.groupIcon}
                size={DimensionHelper.wp("4%")}
              />
            </View>
            <Text style={selectGroupStyles.groupName}>{g.name}</Text>
            <View style={selectGroupStyles.selectIconContainer}>
              <FontAwesome
                name="check-circle-o"
                style={selectGroupStyles.selectIcon}
                size={DimensionHelper.wp("4.5%")}
              />
            </View>
          </View>
        </Ripple>
      );
    });
    return <View style={selectGroupStyles.expandedContainer}>{result}</View>;
  };

  React.useEffect(buildTree, []);

  return (
    <View style={selectGroupStyles.container}>
      <Header
        navigation={props.navigation}
        prominentLogo={true}
      />

      {/* Select Group Section */}
      <Subheader
        icon="👥"
        title={t("selectGroup.title")}
        subtitle={t("selectGroup.subtitle", { serviceName: serviceTimes?.name || "this service" })}
      />

      {/* Main Content */}
      <View style={selectGroupStyles.mainContent}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={selectGroupStyles.scrollContent}
        >
          <FlatList
            data={groupTree}
            renderItem={getRow}
            keyExtractor={(item: GroupCategoryInterface) => item.name}
            scrollEnabled={false}
            contentContainerStyle={selectGroupStyles.listContainer}
          />
        </ScrollView>
      </View>

      {/* None Button */}
      <View style={selectGroupStyles.noneSection}>
        <Ripple style={selectGroupStyles.noneButton} onPress={handleNone}>
          <Text style={selectGroupStyles.noneButtonText}>{t("selectGroup.none")}</Text>
        </Ripple>
      </View>
    </View>
  );

};

const selectGroupStyles = {
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

  listContainer: {
    paddingBottom: DimensionHelper.wp("3%")
  },

  // Category Cards
  categoryContainer: {
    marginBottom: DimensionHelper.wp("3%")
  },

  categoryCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    padding: DimensionHelper.wp("4%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    shadowColor: StyleConstants.baseColor,
    alignSelf: "center",
    width: DimensionHelper.wp("90%")
  },

  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },

  categoryInfo: {
    flex: 1
  },

  categoryName: {
    fontSize: DimensionHelper.wp("4.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    marginBottom: DimensionHelper.wp("1%")
  },

  categoryCount: {
    fontSize: DimensionHelper.wp("3.5%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.baseColor
  },

  expandIconContainer: {
    marginLeft: DimensionHelper.wp("3%"),
    justifyContent: "center",
    alignItems: "center"
  },

  expandIcon: {
    color: StyleConstants.baseColor,
    opacity: 0.7
  },

  // Expanded Group Items
  expandedContainer: {
    marginTop: DimensionHelper.wp("2%"),
    paddingHorizontal: DimensionHelper.wp("5%")
  },

  groupItem: {
    backgroundColor: StyleConstants.ghostWhite,
    borderRadius: 8,
    marginBottom: DimensionHelper.wp("2%"),
    borderLeftWidth: 3,
    borderLeftColor: StyleConstants.baseColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    shadowColor: StyleConstants.baseColor
  },

  groupItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: DimensionHelper.wp("3%")
  },

  groupIconContainer: {
    width: DimensionHelper.wp("8%"),
    height: DimensionHelper.wp("8%"),
    borderRadius: DimensionHelper.wp("4%"),
    backgroundColor: StyleConstants.baseColor + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: DimensionHelper.wp("3%")
  },

  groupIcon: {
    color: StyleConstants.baseColor
  },

  groupName: {
    flex: 1,
    fontSize: DimensionHelper.wp("4%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.darkColor
  },

  selectIconContainer: {
    marginLeft: DimensionHelper.wp("2%")
  },

  selectIcon: {
    color: StyleConstants.baseColor,
    opacity: 0.6
  },

  // None Button Section
  noneSection: {
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

  noneButton: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    paddingVertical: DimensionHelper.wp("4%"),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: StyleConstants.lightGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    shadowColor: StyleConstants.baseColor
  },

  noneButtonText: {
    color: StyleConstants.lightGray,
    fontSize: DimensionHelper.wp("4%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "600",
    letterSpacing: 1
  }
};

export default SelectGroup;

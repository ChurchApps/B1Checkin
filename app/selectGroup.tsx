import React from "react";
import { View, Text, ScrollView } from "react-native";
import Ripple from "react-native-material-ripple";
import { useTranslation } from "react-i18next";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import { VisitHelper, VisitSessionHelper, CachedData, StyleConstants } from "../src/helpers";
import { FontAwesome } from "@expo/vector-icons";
import { DimensionHelper, FirebaseHelper, GroupInterface } from "../src/helpers";
import { useRouter, useLocalSearchParams } from "expo-router";

interface GroupCategoryInterface { key: number, name: string, items: GroupInterface[] }

const SelectGroup = (props: any) => {
  const { t } = useTranslation();

  const router = useRouter();
  const params = useLocalSearchParams();
  const personIdStr = String(params.personId ?? "");
  const serviceTimes = React.useMemo(() => {
    try { return JSON.parse(String(params.serviceTime ?? "{}")); } catch { return {}; }
  }, [params.serviceTime]);

  const [selectedCategory, setSelectedCategory] = React.useState(-1);
  const [groupTree, setGroupTree] = React.useState<GroupCategoryInterface[]>([]);

  const buildTree = () => {
    FirebaseHelper.addOpenScreenEvent("Select Group");
    let category = "";
    const gt: GroupCategoryInterface[] = [];

    const sortedGroups = [...(serviceTimes?.groups || [])].sort((a, b) => ((a.categoryName || "") > (b.categoryName || "")) ? 1 : -1);

    sortedGroups?.forEach(g => {
      if (g.categoryName !== category) gt.push({ key: gt.length, name: g.categoryName || "", items: [] });
      gt[gt.length - 1].items.push(g);
      category = g.categoryName || "";
    });

    setGroupTree(gt);
  };

  const handleCategoryClick = (value: number) => { setSelectedCategory((selectedCategory === value) ? -1 : value); };
  const handleNone = () => { selectGroup("", "NONE"); };

  const selectGroup = (id: string, name: string) => {

    let visit = VisitHelper.getByPersonId(CachedData.pendingVisits, personIdStr);

    if (!visit) {
      visit = { personId: personIdStr, serviceId: CachedData.serviceId, visitSessions: [] };
      CachedData.pendingVisits.push(visit);
    }

    const vs = visit?.visitSessions || [];
    const serviceTimeId = serviceTimes.id || "";
    VisitSessionHelper.setValue(vs, serviceTimeId, id, name);

    router.back();
  };

  const getRow = (item: GroupCategoryInterface) => {
    const isExpanded = selectedCategory === item.key;
    return (
      <View style={selectGroupStyles.categoryCard}>
        <Ripple style={selectGroupStyles.categoryHeader} onPress={() => { handleCategoryClick(item.key); }}>
          <View style={selectGroupStyles.categoryContent}>
            <View style={selectGroupStyles.categoryIconBox}>
              <FontAwesome name="folder-open" style={selectGroupStyles.categoryIconSymbol} size={DimensionHelper.wp("4.5%")} />
            </View>
            <View style={selectGroupStyles.categoryInfo}>
              <Text style={selectGroupStyles.categoryName}>{item.name}</Text>
              <Text style={selectGroupStyles.categoryCount}>{t("selectGroup.groupCount", { count: item.items.length })}</Text>
            </View>
            <View style={selectGroupStyles.chevronCircle}>
              <FontAwesome
                name={isExpanded ? "chevron-up" : "chevron-down"}
                style={selectGroupStyles.chevronIcon}
                size={DimensionHelper.wp("3.5%")}
              />
            </View>
          </View>
        </Ripple>
        {isExpanded && (
          <>
            <View style={selectGroupStyles.categoryDivider} />
            <View style={selectGroupStyles.groupList}>
              {item.items.map(g => (
                <Ripple
                  key={g.id?.toString()}
                  style={selectGroupStyles.groupItem}
                  onPress={() => selectGroup(g.id || "", g.name || "")}
                >
                  <View style={selectGroupStyles.groupItemContent}>
                    <View style={selectGroupStyles.groupIconContainer}>
                      <FontAwesome name="users" style={selectGroupStyles.groupIcon} size={DimensionHelper.wp("4%")} />
                    </View>
                    <Text style={selectGroupStyles.groupName}>{g.name}</Text>
                    <View style={selectGroupStyles.groupCheckCircle} />
                  </View>
                </Ripple>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  React.useEffect(buildTree, [serviceTimes]);

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
        onBack={() => router.back()}
      />

      {/* Main Content */}
      <View style={selectGroupStyles.mainContent}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={selectGroupStyles.scrollContent}
        >
          <View style={selectGroupStyles.listContainer}>
            {groupTree.map((item) => (
              <React.Fragment key={item.name}>
                {getRow(item)}
              </React.Fragment>
            ))}
          </View>
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
  container: { flex: 1, backgroundColor: StyleConstants.ghostWhite },

  mainContent: { flex: 1, paddingHorizontal: DimensionHelper.wp("5%") },

  scrollContent: { paddingBottom: DimensionHelper.wp("3%") },

  listContainer: { paddingBottom: DimensionHelper.wp("2%") },

  categoryCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 20,
    marginBottom: DimensionHelper.wp("4%"),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    overflow: "hidden" as const
  },

  categoryHeader: { paddingVertical: DimensionHelper.wp("4%"), paddingHorizontal: DimensionHelper.wp("5%") },

  categoryContent: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const },

  categoryIconBox: { width: DimensionHelper.wp("11%"), height: DimensionHelper.wp("11%"), borderRadius: 12, backgroundColor: StyleConstants.baseColor + "15", justifyContent: "center" as const, alignItems: "center" as const, marginRight: DimensionHelper.wp("4%") },

  categoryIconSymbol: { color: StyleConstants.baseColor },

  categoryInfo: { flex: 1 },

  categoryName: { fontSize: DimensionHelper.wp("4%"), fontFamily: StyleConstants.RobotoMedium, color: StyleConstants.darkColor, marginBottom: DimensionHelper.wp("0.5%") },

  categoryCount: { fontSize: DimensionHelper.wp("2.8%"), fontFamily: StyleConstants.RobotoRegular, color: StyleConstants.baseColor },

  chevronCircle: { width: DimensionHelper.wp("9%"), height: DimensionHelper.wp("9%"), borderRadius: DimensionHelper.wp("4.5%"), backgroundColor: StyleConstants.ghostWhite, justifyContent: "center" as const, alignItems: "center" as const, marginLeft: DimensionHelper.wp("2%") },

  chevronIcon: { color: "#94a3b8" },

  categoryDivider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: DimensionHelper.wp("5%") },

  groupList: { paddingHorizontal: DimensionHelper.wp("4%"), paddingTop: DimensionHelper.wp("2%"), paddingBottom: DimensionHelper.wp("4%") },

  groupItem: { backgroundColor: StyleConstants.ghostWhite, borderRadius: 14, marginBottom: DimensionHelper.wp("2%") },

  groupItemContent: { flexDirection: "row" as const, alignItems: "center" as const, paddingVertical: DimensionHelper.wp("3.5%"), paddingHorizontal: DimensionHelper.wp("4%") },

  groupIconContainer: { width: DimensionHelper.wp("10%"), height: DimensionHelper.wp("10%"), borderRadius: 10, backgroundColor: StyleConstants.baseColor + "18", justifyContent: "center" as const, alignItems: "center" as const, marginRight: DimensionHelper.wp("3.5%") },

  groupIcon: { color: StyleConstants.baseColor },

  groupName: { flex: 1, fontSize: DimensionHelper.wp("3.5%"), fontFamily: StyleConstants.RobotoRegular, color: StyleConstants.darkColor },

  groupCheckCircle: { width: DimensionHelper.wp("6.5%"), height: DimensionHelper.wp("6.5%"), borderRadius: DimensionHelper.wp("3.25%"), borderWidth: 2, borderColor: "#e2e8f0", marginLeft: DimensionHelper.wp("2%") },

  noneSection: {
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingVertical: DimensionHelper.wp("3%"),
    backgroundColor: StyleConstants.whiteColor,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 5,
    shadowColor: "#000"
  },

  noneButton: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 16,
    paddingVertical: DimensionHelper.wp("4%"),
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    shadowColor: "#000"
  },

  noneButtonText: { color: "#64748b", fontSize: DimensionHelper.wp("3.5%"), fontFamily: StyleConstants.RobotoMedium, fontWeight: "500" as const }
};

export default SelectGroup;

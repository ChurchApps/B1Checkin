import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import { ArrayHelper, CachedData, EnvironmentHelper, FirebaseHelper, GroupInterface, VisitHelper, VisitSessionHelper } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Avatar, Button, EmptyState, Screen } from "../src/components/ui";

interface GroupCategoryInterface { key: number, name: string, items: GroupInterface[] }

const SelectGroup = (props: any) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const personIdStr = String(params.personId ?? "");
  const serviceTimes = React.useMemo(() => {
    try { return JSON.parse(String(params.serviceTime ?? "{}")); } catch { return {}; }
  }, [params.serviceTime]);

  const [selectedCategory, setSelectedCategory] = React.useState(-1);
  const [groupTree, setGroupTree] = React.useState<GroupCategoryInterface[]>([]);
  const [flashGroupId, setFlashGroupId] = React.useState("");
  const selectingRef = React.useRef(false);

  const person = (CachedData.householdMembers || []).find(m => m.id === personIdStr);
  const personName = person?.name?.display || person?.displayName || "";

  const getCurrentGroupId = (): string => {
    const visit = VisitHelper.getByPersonId(CachedData.pendingVisits, personIdStr);
    const stSessions = VisitSessionHelper.getByServiceTimeId(visit?.visitSessions || [], serviceTimes.id || "");
    return stSessions.length > 0 ? (stSessions[0].session?.groupId || "") : "";
  };
  const currentGroupId = getCurrentGroupId();

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
    if (gt.length === 1) {
      setSelectedCategory(0);
    } else if (currentGroupId) {
      const current = gt.find(c => ArrayHelper.getOne(c.items, "id", currentGroupId));
      if (current) setSelectedCategory(current.key);
    }
  };

  const handleCategoryClick = (value: number) => { setSelectedCategory((selectedCategory === value) ? -1 : value); };

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

  const handleGroupTap = (id: string, name: string) => {
    if (selectingRef.current) return;
    selectingRef.current = true;
    Haptics.selectionAsync().catch(() => {});
    setFlashGroupId(id);
    setTimeout(() => selectGroup(id, name), 150);
  };

  const handleNone = () => { handleGroupTap("", "NONE"); };

  const getGroupRow = (g: GroupInterface) => {
    const isCurrent = !!g.id && (flashGroupId ? flashGroupId === g.id : currentGroupId === g.id);
    return (
      <Pressable
        key={g.id?.toString()}
        accessibilityRole="button"
        onPress={() => handleGroupTap(g.id || "", g.name || "")}
        style={({ pressed }) => ({
          minHeight: 64,
          backgroundColor: isCurrent || pressed ? theme.colors.primarySelected : theme.colors.canvas,
          borderRadius: theme.radius.md,
          marginBottom: theme.spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg
        })}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="groups" size={20} color={theme.colors.primary} />
        </View>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 18, fontFamily: theme.fonts.regular, color: theme.colors.textPrimary }}>{g.name}</Text>
        {isCurrent
          ? (
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="check" size={18} color={theme.colors.onPrimary} />
            </View>
          )
          : <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: theme.colors.border }} />}
      </Pressable>
    );
  };

  const getCategoryCard = (item: GroupCategoryInterface) => {
    const isExpanded = selectedCategory === item.key;
    return (
      <Animated.View
        key={item.name}
        layout={LinearTransition.duration(200)}
        style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, marginBottom: theme.spacing.md, overflow: "hidden", ...theme.elevation.e1 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleCategoryClick(item.key)}
          style={({ pressed }) => ({
            minHeight: 72,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            backgroundColor: pressed ? theme.colors.canvas : "transparent"
          })}>
          <View style={{ width: 48, height: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="folder-open" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text numberOfLines={1} style={{ fontSize: 20, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary }}>{item.name}</Text>
            <Text style={{ fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.textMuted }}>{t("selectGroup.groupCount", { count: item.items.length })}</Text>
          </View>
          <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={28} color={theme.colors.textMuted} />
        </Pressable>
        {isExpanded && (
          <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, padding: theme.spacing.md }}>
            {item.items.map(getGroupRow)}
          </View>
        )}
      </Animated.View>
    );
  };

  React.useEffect(buildTree, [serviceTimes]);

  const footer = <Button label={t("selectGroup.noGroupOption")} variant="outline" size="lg" fullWidth onPress={handleNone} style={{ borderColor: theme.colors.border }} />;

  return (
    <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} footer={footer} scroll={false}>
      {!!personName && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          <Avatar name={personName} photoUri={person?.photo ? EnvironmentHelper.ContentRoot + person.photo : undefined} size={48} />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 17, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary }}>
            {t("selectGroup.choosingFor", { name: personName })}{serviceTimes?.name ? " — " + serviceTimes.name : ""}
          </Text>
        </View>
      )}
      <Subheader
        title={t("selectGroup.title")}
        subtitle={t("selectGroup.subtitle", { serviceName: serviceTimes?.name || "this service" })}
        onBack={() => router.back()}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xl }} style={{ flex: 1 }}>
        {groupTree.length === 0
          ? <EmptyState icon="search-off" title={t("selectGroup.noGroups")} />
          : groupTree.map(getCategoryCard)}
      </ScrollView>
    </Screen>
  );
};

export default SelectGroup;

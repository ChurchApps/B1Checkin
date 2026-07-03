import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ArrayHelper, CachedData, CheckinType, GroupInterface, PersonInterface, screenNavigationProps, ServiceTimeInterface, VisitHelper, VisitInterface, VisitSessionInterface, VisitSessionHelper } from "../helpers";
import { useAppTheme } from "../theme";

interface Props { person: PersonInterface, selectedMemberId: string, navigation: screenNavigationProps, pendingVisits: VisitInterface[] }

const CHECKIN_TYPES: { value: CheckinType; icon: any; labelKey: "household.type.member" | "household.type.guest" | "household.type.volunteer" }[] = [
  { value: "member", icon: "person", labelKey: "household.type.member" },
  { value: "guest", icon: "waving-hand", labelKey: "household.type.guest" },
  { value: "volunteer", icon: "volunteer-activism", labelKey: "household.type.volunteer" }
];

const MemberServiceTimes = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const personId = props.person.id || "";
  const defaultType: CheckinType = props.person.isGuest ? "guest" : "member";
  const [checkinType, setCheckinType] = React.useState<CheckinType>(CachedData.checkinTypes[personId] || defaultType);

  const selectType = (value: CheckinType) => {
    setCheckinType(value);
    CachedData.checkinTypes[personId] = value;
  };

  const getTypeChips = () => (
    <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
      {CHECKIN_TYPES.map(ct => {
        const active = checkinType === ct.value;
        return (
          <Pressable
            key={ct.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => selectType(ct.value)}
            style={{
              flex: 1,
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              borderRadius: theme.radius.md,
              borderWidth: active ? 0 : 1.5,
              borderColor: theme.colors.primaryBorder,
              backgroundColor: active ? theme.colors.button : theme.colors.surface
            }}>
            <MaterialIcons name={ct.icon} size={18} color={active ? theme.colors.onButton : theme.colors.primary} />
            <Text style={{ fontSize: 15, fontFamily: theme.fonts.medium, color: active ? theme.colors.onButton : theme.colors.primary }}>{t(ct.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );

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

    return (
      <View key={serviceTime.id} style={{ backgroundColor: theme.colors.canvas, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="schedule" size={20} color={theme.colors.primary} />
        </View>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 17, fontFamily: theme.fonts.medium, color: theme.colors.textPrimary }}>{serviceTime.name}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => { handleServiceTimeClick(serviceTime, props.person); }}
          style={({ pressed }) => ({
            minHeight: 56,
            maxWidth: "55%",
            minWidth: 160,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing.sm,
            backgroundColor: isSelected ? theme.colors.button : pressed ? theme.colors.primarySoft : theme.colors.surface,
            borderWidth: isSelected ? 0 : 1.5,
            borderColor: theme.colors.primaryBorder,
            opacity: pressed ? 0.9 : 1
          })}>
          <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 16, fontFamily: theme.fonts.medium, color: isSelected ? theme.colors.onButton : theme.colors.primary }}>
            {selectedGroupName}
          </Text>
          <MaterialIcons name="chevron-right" size={22} color={isSelected ? theme.colors.onButton : theme.colors.primary} />
        </Pressable>
      </View>
    );
  };

  if (props.selectedMemberId !== props.person.id) return null;

  const result: React.ReactNode[] = [];
  result.push(<View key="typeChips">{getTypeChips()}</View>);
  if (props.person.nametagNotes) {
    result.push(
      <View key="noteAlert" style={{ backgroundColor: theme.colors.warningBg, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <MaterialIcons name="warning-amber" size={22} color={theme.colors.warning} />
        <Text style={{ flex: 1, fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.warning }}>{props.person.nametagNotes}</Text>
      </View>
    );
  }
  const visit = VisitHelper.getByPersonId(props.pendingVisits, props.person.id || "");
  const visitSessions = visit?.visitSessions || [];
  if (CachedData.serviceTimes && Array.isArray(CachedData.serviceTimes)) {
    CachedData.serviceTimes.forEach(st => {
      if (st) result.push(getExpandedRow(st, visitSessions));
    });
  }

  return (
    <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
      {result}
    </View>
  );
};

export default MemberServiceTimes;

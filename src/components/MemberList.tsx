import React from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Animated, { LinearTransition } from "react-native-reanimated";
import { ArrayHelper, CachedData, EnvironmentHelper, GroupInterface, PersonInterface, screenNavigationProps, ServiceTimeInterface, VisitHelper, VisitInterface, VisitSessionInterface } from "../helpers";
import MemberServiceTimes from "./MemberServiceTimes";
import { useAppTheme } from "../theme";
import { Avatar, Badge } from "./ui";

interface Props { navigation: screenNavigationProps, pendingVisits: VisitInterface[] }

const MemberList = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [selectedMemberId, setSelectedMemberId] = React.useState("");

  const handleMemberClick = (id: string) => { setSelectedMemberId((selectedMemberId === id) ? "" : id); };

  const isCheckedIn = (personId: string): boolean => {
    const visit = VisitHelper.getByPersonId(CachedData.existingVisits, personId);
    return visit !== null && visit !== undefined && visit.id !== null && visit.id !== undefined;
  };

  const getSessionCount = (personId: string): number => {
    const visit = VisitHelper.getByPersonId(props.pendingVisits, personId);
    return visit?.visitSessions?.length || 0;
  };

  const getCondensedGroupChips = (person: PersonInterface) => {
    if (selectedMemberId === person.id) return null;
    const visit = VisitHelper.getByPersonId(props.pendingVisits, person.id || "");
    if (!visit?.visitSessions?.length) return null;

    const chips: React.ReactNode[] = [];
    visit.visitSessions.forEach((vs: VisitSessionInterface, index: number) => {
      if (!vs?.session) return;
      const st: ServiceTimeInterface | null = ArrayHelper.getOne(CachedData.serviceTimes || [], "id", vs.session.serviceTimeId || "");
      const group: GroupInterface | null = ArrayHelper.getOne(st?.groups || [], "id", vs.session.groupId || "");
      const label = (st?.name ? st.name + " — " : "") + (group?.name || t("selectGroup.none"));
      chips.push(<Badge key={index} label={label} tone="info" icon="schedule" />);
    });
    return chips.length > 0 ? chips : null;
  };

  const getMemberRow = (person: PersonInterface, index: number) => {
    const isExpanded = selectedMemberId === person.id;
    const hasSelection = getSessionCount(person.id || "") > 0;
    const displayName = person.name?.display || person.displayName || t("members.unknown");

    return (
      <Animated.View
        key={person.id?.toString() || index.toString()}
        layout={LinearTransition.duration(200)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          marginBottom: theme.spacing.md,
          borderLeftWidth: hasSelection ? 3 : 0,
          borderLeftColor: hasSelection ? theme.colors.primary : undefined,
          overflow: "hidden",
          ...theme.elevation.e1
        }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleMemberClick(person.id || "")}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            padding: theme.spacing.lg,
            minHeight: 88,
            backgroundColor: pressed ? theme.colors.canvas : "transparent"
          })}>
          <Avatar name={displayName} photoUri={person.photo ? EnvironmentHelper.ContentRoot + person.photo : undefined} size={64} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text numberOfLines={1} style={{ fontSize: 22, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary }}>{displayName}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {isCheckedIn(person.id || "") && <Badge label={t("household.alreadyCheckedIn")} tone="success" icon="check-circle" />}
              {!!person.nametagNotes && <Badge label={person.nametagNotes} tone="warning" icon="warning-amber" />}
              {getCondensedGroupChips(person)}
            </View>
          </View>
          <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={30} color={theme.colors.textMuted} />
        </Pressable>
        <MemberServiceTimes
          person={person}
          navigation={props.navigation}
          selectedMemberId={selectedMemberId}
          pendingVisits={props.pendingVisits}
        />
      </Animated.View>
    );
  };

  return <View>{(CachedData.householdMembers || []).map(getMemberRow)}</View>;
};

export default MemberList;

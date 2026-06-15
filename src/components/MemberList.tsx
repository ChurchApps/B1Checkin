import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Animated, { LinearTransition } from "react-native-reanimated";
import { ApiHelper, ArrayHelper, CachedData, EnvironmentHelper, GroupInterface, PersonInterface, screenNavigationProps, ServiceTimeInterface, VisitHelper, VisitInterface, VisitSessionInterface } from "../helpers";
import MemberServiceTimes from "./MemberServiceTimes";
import { useAppTheme } from "../theme";
import { Avatar, Badge, Button, Sheet, TextField } from "./ui";

interface Props { navigation: screenNavigationProps, pendingVisits: VisitInterface[] }

const MemberList = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [selectedMemberId, setSelectedMemberId] = React.useState("");
  const [editPersonId, setEditPersonId] = React.useState<string | null>(null);

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
          {CachedData.stationMode === "manned" && (
            <Pressable accessibilityRole="button" accessibilityLabel="edit" hitSlop={8} onPress={() => setEditPersonId(person.id || null)}>
              <MaterialIcons name="edit" size={26} color={theme.colors.textMuted} />
            </Pressable>
          )}
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

  return (
    <View>
      {(CachedData.householdMembers || []).map(getMemberRow)}
      <ProfileEditor personId={editPersonId} onClose={() => setEditPersonId(null)} />
    </View>
  );
};

const ProfileEditor: React.FC<{ personId: string | null; onClose: () => void }> = ({ personId, onClose }) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [person, setPerson] = React.useState<PersonInterface | null>(null);
  const [fields, setFields] = React.useState({ first: "", last: "", birthDate: "", mobilePhone: "", email: "", nametagNotes: "" });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!personId) return;
    setPerson(null);
    setError("");
    ApiHelper.get("/people/" + personId, "MembershipApi")
      .then((p: PersonInterface) => {
        setPerson(p);
        setFields({
          first: p.name?.first || "",
          last: p.name?.last || "",
          birthDate: p.birthDate ? String(p.birthDate).slice(0, 10) : "",
          mobilePhone: p.contactInfo?.mobilePhone || "",
          email: p.contactInfo?.email || "",
          nametagNotes: p.nametagNotes || ""
        });
      })
      .catch(() => setError(t("editPerson.loadFailed")));
  }, [personId]);

  const save = () => {
    if (!person) return;
    setSaving(true);
    setError("");
    // POST the freshly loaded person with only these fields changed so nothing else is wiped
    person.name = { ...person.name, first: fields.first.trim(), last: fields.last.trim(), display: (fields.first.trim() + " " + fields.last.trim()).trim() };
    person.birthDate = (fields.birthDate.trim() || null) as unknown as Date;
    person.contactInfo = { ...person.contactInfo, mobilePhone: fields.mobilePhone.trim(), email: fields.email.trim() };
    person.nametagNotes = fields.nametagNotes.trim();
    ApiHelper.post("/people", [person], "MembershipApi")
      .then(() => {
        const cached = (CachedData.householdMembers || []).find(m => m.id === person.id);
        if (cached) Object.assign(cached, { name: person.name, birthDate: person.birthDate, contactInfo: person.contactInfo, nametagNotes: person.nametagNotes });
        setSaving(false);
        onClose();
      })
      .catch(() => {
        setSaving(false);
        setError(t("editPerson.saveFailed"));
      });
  };

  const setField = (key: keyof typeof fields) => (value: string) => setFields(prev => ({ ...prev, [key]: value }));

  return (
    <Sheet visible={!!personId} onClose={onClose}>
      <Text style={{ fontSize: 22, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg }}>{t("editPerson.title")}</Text>
      {!person && !error && <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: theme.spacing.xl }} />}
      {person && (
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <TextField label={t("addGuest.firstName")} value={fields.first} onChangeText={setField("first")} autoCapitalize="words" containerStyle={{ flex: 1 }} />
            <TextField label={t("addGuest.lastName")} value={fields.last} onChangeText={setField("last")} autoCapitalize="words" containerStyle={{ flex: 1 }} />
          </View>
          <TextField label={t("editPerson.birthDate")} placeholder={String(t("editPerson.birthDatePlaceholder"))} value={fields.birthDate} onChangeText={setField("birthDate")} keyboardType="numbers-and-punctuation" />
          <TextField label={t("editPerson.mobilePhone")} value={fields.mobilePhone} onChangeText={setField("mobilePhone")} keyboardType="phone-pad" />
          <TextField label={t("editPerson.email")} value={fields.email} onChangeText={setField("email")} keyboardType="email-address" autoCapitalize="none" />
          <TextField label={t("editPerson.nametagNotes")} value={fields.nametagNotes} onChangeText={setField("nametagNotes")} />
        </View>
      )}
      {!!error && <Text style={{ fontSize: 15, fontFamily: theme.fonts.medium, color: theme.colors.danger, marginTop: theme.spacing.md }}>{error}</Text>}
      <View style={{ flexDirection: "row", gap: theme.spacing.md, marginTop: theme.spacing.xl }}>
        <Button label={t("common.cancel")} variant="ghost" onPress={onClose} style={{ flex: 1 }} />
        <Button label={t("common.save")} loading={saving} disabled={!person || !fields.first.trim() || !fields.last.trim()} onPress={save} style={{ flex: 1.4 }} />
      </View>
    </Sheet>
  );
};

export default MemberList;

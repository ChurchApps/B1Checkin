import React, { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router, useFocusEffect } from "expo-router";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import MemberList from "../src/components/MemberList";
import { CachedData, FirebaseHelper, screenNavigationProps, VisitHelper, VisitInterface } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Button, EmptyState, Screen, Sheet, StepIndicator } from "../src/components/ui";
import { MaterialIcons } from "@expo/vector-icons";

interface Props { navigation: screenNavigationProps; }

const Household = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [pendingVisits, setPendingVisits] = React.useState<VisitInterface[]>([]);
  const [duplicateNames, setDuplicateNames] = React.useState<string[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPendingVisits([...CachedData.pendingVisits]);
    }, [])
  );

  const selectionCount = pendingVisits.filter(v => v.visitSessions && v.visitSessions.length > 0).length;
  const members = CachedData.householdMembers || [];

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

    if (alreadyCheckedInNames.length > 0) setDuplicateNames(alreadyCheckedInNames);
    else router.navigate("/checkinComplete");
  };

  const addGuest = () => { router.navigate("/addGuest"); };

  React.useEffect(() => { FirebaseHelper.addOpenScreenEvent("Household"); }, []);

  const footer = (
    <View style={{ gap: theme.spacing.sm }}>
      {selectionCount === 0 && (
        <Text style={{ fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, textAlign: "center" }}>{t("household.chooseGroupHint")}</Text>
      )}
      <Button
        label={selectionCount > 0 ? t("household.checkinCount", { count: selectionCount }) : t("household.checkin")}
        size="xl"
        fullWidth
        disabled={selectionCount === 0}
        onPress={checkin}
      />
    </View>
  );

  return (
    <>
      <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} footer={footer} scroll={false}>
        <StepIndicator steps={[t("steps.find"), t("steps.select"), t("steps.done")]} current={1} style={{ marginTop: theme.spacing.lg }} />
        <Subheader title={t("household.title")} subtitle={t("household.subtitle")} onBack={() => router.back()} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xl }} style={{ flex: 1 }}>
          {members.length === 0
            ? <EmptyState icon="group-off" title={t("household.emptyTitle")} />
            : <MemberList navigation={props.navigation} pendingVisits={pendingVisits} />}
          <Button
            label={t("household.addGuest")}
            variant="ghost"
            icon="person-add-alt"
            onPress={addGuest}
            fullWidth
            style={{
              marginTop: theme.spacing.lg,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: theme.colors.primaryBorder,
              borderRadius: theme.radius.md + 2
            }}
          />
        </ScrollView>
      </Screen>

      <Sheet visible={!!duplicateNames} onClose={() => setDuplicateNames(null)} maxWidth={420}>
        <View style={{ alignItems: "center", gap: theme.spacing.lg }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.warningBg, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="warning-amber" size={34} color={theme.colors.warning} />
          </View>
          <Text style={{ fontSize: 22, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary, textAlign: "center" }}>{t("household.duplicateTitle")}</Text>
          <Text style={{ fontSize: 16, lineHeight: 23, fontFamily: theme.fonts.regular, color: theme.colors.textSecondary, textAlign: "center" }}>
            {t("household.duplicateMessage", { names: (duplicateNames || []).join(", ") })}
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.md, alignSelf: "stretch" }}>
            <Button label={t("common.cancel")} variant="ghost" onPress={() => setDuplicateNames(null)} style={{ flex: 1 }} />
            <Button
              label={t("household.duplicateConfirm")}
              onPress={() => {
                setDuplicateNames(null);
                router.navigate("/checkinComplete");
              }}
              style={{ flex: 1.4 }}
            />
          </View>
        </View>
      </Sheet>
    </>
  );
};

export default Household;

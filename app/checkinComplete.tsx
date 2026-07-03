import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from "react-native-reanimated";
import { router } from "expo-router";
import { ApiHelper, ArrayHelper, CachedData, EnvironmentHelper, FirebaseHelper, LabelHelper, PersonInterface, PrinterLog, screenNavigationProps } from "../src/helpers";
import PrintUI from "../src/components/PrintUI";
import ConfettiCelebration from "../src/components/ConfettiCelebration";
import Header from "../src/components/Header";
import { useAppTheme } from "../src/theme";
import { Avatar, Button, Screen, StepIndicator, Sheet } from "../src/components/ui";

interface Props { navigation: screenNavigationProps; }

interface GateViolation { groupId: string; groupName: string; reason: "capacity" | "ratio"; }

// ApiHelper throws Error("HTTP <status>: <body>") on non-2xx — recover the gate JSON from it.
const parseGate = (error: unknown): { status: number; body: any } | null => {
  const match = String((error as any)?.message || "").match(/^HTTP (\d+): ([\s\S]*)$/);
  if (!match) return null;
  try { return { status: Number(match[1]), body: JSON.parse(match[2]) }; } catch { return { status: Number(match[1]), body: null }; }
};

const CheckinComplete = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [htmlLabels, setHtmlLabels] = React.useState<string[]>([]);
  const [milestones, setMilestones] = React.useState<{ personId: string; streak: number }[]>([]);
  const [printStatus, setPrintStatus] = React.useState<"idle" | "printing" | "done">(CachedData.printer?.ipAddress ? "printing" : "idle");
  const [checkinFailed, setCheckinFailed] = React.useState(false);
  const [gateError, setGateError] = React.useState<GateViolation[] | null>(null);
  const [gateWarning, setGateWarning] = React.useState<GateViolation[] | null>(null);
  const [returnDelay, setReturnDelay] = React.useState(0);
  const milestonesRef = React.useRef<{ personId: string; streak: number }[]>([]);
  const redirectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectedRef = React.useRef(false);

  const [checkedInPeople] = React.useState<PersonInterface[]>(() => {
    const people: PersonInterface[] = [];
    (CachedData.pendingVisits || []).forEach(v => {
      if (v.visitSessions && v.visitSessions.length > 0) {
        const person = (CachedData.householdMembers || []).find(m => m.id === v.personId);
        if (person) people.push(person);
      }
    });
    return people;
  });

  const loadData = () => {
    PrinterLog.attachNativeListeners();
    FirebaseHelper.addOpenScreenEvent("CheckinCompleteScreen");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    doCheckin(false);
  };

  const doCheckin = async (acknowledgeWarnings: boolean) => {
    setGateError(null);
    setGateWarning(null);
    try {
      const securityCode = await checkin(acknowledgeWarnings);
      if (CachedData.printer?.ipAddress) await print(securityCode);
      else startOver(milestonesRef.current.length > 0);
    } catch (error) {
      const gate = parseGate(error);
      if (gate?.status === 409 && gate.body?.warning) { setGateWarning(gate.body.groups || []); return; }
      if (gate?.status === 409) { setGateError(gate.body?.groups || []); return; }
      console.error("Error during checkin:", error);
      setCheckinFailed(true);
      startOver();
    }
  };

  const startOver = (hasMilestone?: boolean) => {
    CachedData.existingVisits = [];
    CachedData.pendingVisits = [];
    CachedData.checkinTypes = {};
    setHtmlLabels([]);
    redirectToLookup(hasMilestone);
  };

  const handlePrintComplete = () => {
    setPrintStatus("done");
    startOver(milestonesRef.current.length > 0);
  };

  const goToLookup = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    router.replace("/lookup");
  };

  const redirectToLookup = (hasMilestone?: boolean) => {
    const delay = hasMilestone ? 6000 : 3000;
    setReturnDelay(delay);
    redirectTimerRef.current = setTimeout(goToLookup, delay);
  };

  const print = async (securityCode?: string) => {
    try {
      PrinterLog.add(`--- Family check-in print: ${CachedData.printer?.brand} ${CachedData.printer?.model} @ ${CachedData.printer?.ipAddress} ---`);
      const labels = await LabelHelper.getAllLabels(securityCode);
      setHtmlLabels(labels);
      if (labels.length === 0) {
        PrinterLog.add("Family print: nothing to print (0 labels)");
        setPrintStatus("idle");
        startOver();
      }
    } catch (error) {
      PrinterLog.add(`Family print error: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Error printing labels:", error);
      setCheckinFailed(true);
      startOver();
    }
  };

  const checkin = async (acknowledgeWarnings: boolean) => {
    const peopleIds: number[] = ArrayHelper.getUniqueValues(CachedData.householdMembers, "id");
    // Stamp the per-person check-in type onto each visit actually being checked in.
    CachedData.pendingVisits.forEach(pv => {
      if (pv.visitSessions && pv.visitSessions.length > 0 && pv.personId) {
        pv.checkinType = CachedData.checkinTypes[pv.personId] || "member";
      }
    });
    let url = "/visits/checkin?serviceId=" + CachedData.serviceId + "&peopleIds=" + encodeURIComponent(peopleIds.join(","));
    if (acknowledgeWarnings) url += "&acknowledgeWarnings=true";
    return ApiHelper.post(url, CachedData.pendingVisits, "AttendanceApi")
      .then(data => {
        if (data?.streaks) {
          const hits: { personId: string; streak: number }[] = [];
          for (const [personId, streak] of Object.entries(data.streaks as Record<string, number>)) {
            if (streak > 0 && streak % 5 === 0) hits.push({ personId, streak });
          }
          if (hits.length > 0) {
            milestonesRef.current = hits;
            setMilestones(hits);
          }
        }
        return typeof data?.securityCode === "string" ? data.securityCode : "";
      })
      .catch(error => {
        console.error("Error during checkin:", error);
        throw error;
      });
  };

  React.useEffect(loadData, []);
  React.useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const getLabelView = () => {
    if (htmlLabels?.length > 0) return (<PrintUI htmlLabels={htmlLabels} onLog={PrinterLog.add} onPrintComplete={handlePrintComplete} />);
    else return <></>;
  };

  const getAvatarRow = () => {
    if (checkedInPeople.length === 0) return null;
    const shown = checkedInPeople.slice(0, 5);
    const overflow = checkedInPeople.length - shown.length;
    return (
      <View style={{ flexDirection: "row", justifyContent: "center", gap: theme.spacing.lg, flexWrap: "wrap", marginTop: theme.spacing.sm }}>
        {shown.map(person => {
          const name = person.name?.display || person.displayName || "";
          return (
            <View key={person.id} style={{ alignItems: "center", gap: 6, maxWidth: 88 }}>
              <Avatar name={name} photoUri={person.photo ? EnvironmentHelper.ContentRoot + person.photo : undefined} size={56} />
              <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary }}>{person.name?.first || name}</Text>
            </View>
          );
        })}
        {overflow > 0 && (
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 17, fontFamily: theme.fonts.semibold, color: theme.colors.primary }}>+{overflow}</Text>
          </View>
        )}
      </View>
    );
  };

  const getPrintStatusLine = () => {
    if (printStatus === "idle") return null;
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
        <MaterialIcons name={printStatus === "done" ? "check-circle-outline" : "print"} size={22} color={printStatus === "done" ? theme.colors.success : theme.colors.textMuted} />
        {printStatus === "printing"
          ? <PulsingText text={t("checkinComplete.printingLabels")} color={theme.colors.textMuted} fontFamily={theme.fonts.regular} />
          : <Text style={{ fontSize: 17, fontFamily: theme.fonts.regular, color: theme.colors.success }}>{t("checkinComplete.labelsPrinted")}</Text>}
      </View>
    );
  };

  const reasonText = (v: GateViolation) => v.reason === "ratio" ? t("checkinComplete.gateNeedsVolunteer") : t("checkinComplete.gateFull");

  if (gateError) {
    return (
      <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg, padding: theme.spacing.lg }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme.colors.dangerBg, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="block" size={52} color={theme.colors.danger} />
          </View>
          <Text style={{ ...theme.type.h1, color: theme.colors.textPrimary, textAlign: "center" }}>{t("checkinComplete.gateTitle")}</Text>
          <View style={{ alignSelf: "stretch", gap: theme.spacing.sm }}>
            {gateError.map(v => (
              <View key={v.groupId} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, backgroundColor: theme.colors.dangerBg, borderRadius: theme.radius.md, padding: theme.spacing.md }}>
                <MaterialIcons name="meeting-room" size={22} color={theme.colors.danger} />
                <Text style={{ flex: 1, fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.danger }}>{v.groupName} — {reasonText(v)}</Text>
              </View>
            ))}
          </View>
          <Button label={t("checkinComplete.gateChangeRooms")} size="xl" icon="arrow-back" fullWidth onPress={() => router.replace("/household")} />
        </View>
      </Screen>
    );
  }

  return (
    <>
      <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} scroll={false}>
        <Pressable style={{ flex: 1 }} onPress={goToLookup} disabled={returnDelay === 0}>
          <StepIndicator steps={[t("steps.find"), t("steps.select"), t("steps.done")]} current={2} style={{ marginTop: theme.spacing.lg }} />
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md }}>
            <Animated.View
              entering={ZoomIn.springify().damping(12)}
              style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: theme.colors.successBg, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="check" size={60} color={theme.colors.success} />
            </Animated.View>
            <Text style={{ ...theme.type.h1, color: theme.colors.textPrimary, textAlign: "center", marginTop: theme.spacing.sm }}>{t("checkinComplete.allSet")}</Text>
            <Text style={{ ...theme.type.bodyLg, color: theme.colors.textMuted, textAlign: "center" }}>{t("checkinComplete.haveAGreatService")}</Text>
            {getAvatarRow()}
            {getPrintStatusLine()}
            {checkinFailed && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, backgroundColor: theme.colors.warningBg, borderRadius: theme.radius.md, padding: theme.spacing.md, marginTop: theme.spacing.sm }}>
                <MaterialIcons name="warning-amber" size={20} color={theme.colors.warning} />
                <Text style={{ fontSize: 15, fontFamily: theme.fonts.medium, color: theme.colors.warning, flexShrink: 1 }}>{t("checkinComplete.checkinError")}</Text>
              </View>
            )}
            {getLabelView()}
          </View>
          {returnDelay > 0 && (
            <View style={{ alignItems: "center", gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}>
              <Text style={{ fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.textMuted }}>{t("checkinComplete.returning")}</Text>
              <ReturnProgress duration={returnDelay} />
            </View>
          )}
        </Pressable>
      </Screen>
      <ConfettiCelebration milestones={milestones} />
      <Sheet visible={!!gateWarning} dismissible={false} maxWidth={440}>
        <View style={{ alignItems: "center", gap: theme.spacing.lg }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.warningBg, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="warning-amber" size={34} color={theme.colors.warning} />
          </View>
          <Text style={{ fontSize: 22, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary, textAlign: "center" }}>{t("checkinComplete.warnTitle")}</Text>
          <Text style={{ fontSize: 16, lineHeight: 23, fontFamily: theme.fonts.regular, color: theme.colors.textSecondary, textAlign: "center" }}>
            {t("checkinComplete.warnMessage", { rooms: (gateWarning || []).map(v => v.groupName).join(", ") })}
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.md, alignSelf: "stretch" }}>
            <Button label={t("checkinComplete.gateChangeRooms")} variant="ghost" onPress={() => { setGateWarning(null); router.replace("/household"); }} style={{ flex: 1 }} />
            <Button label={t("checkinComplete.warnConfirm")} onPress={() => { setGateWarning(null); doCheckin(true); }} style={{ flex: 1.4 }} />
          </View>
        </View>
      </Sheet>
    </>
  );
};

const PulsingText: React.FC<{ text: string; color: string; fontFamily: string }> = ({ text, color, fontFamily }) => {
  const opacity = useSharedValue(0.5);
  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={[{ fontSize: 17, fontFamily, color }, style]}>{text}</Animated.Text>;
};

const ReturnProgress: React.FC<{ duration: number }> = ({ duration }) => {
  const theme = useAppTheme();
  const progress = useSharedValue(0);
  React.useEffect(() => {
    progress.value = withTiming(1, { duration, easing: Easing.linear });
  }, [duration]);
  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={{ width: 240, height: 4, borderRadius: 2, backgroundColor: theme.colors.primarySelected, overflow: "hidden" }}>
      <Animated.View style={[{ height: 4, borderRadius: 2, backgroundColor: theme.colors.primary }, style]} />
    </View>
  );
};

export default CheckinComplete;

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
import { Avatar, Screen, StepIndicator } from "../src/components/ui";

interface Props { navigation: screenNavigationProps; }

const CheckinComplete = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [htmlLabels, setHtmlLabels] = React.useState<string[]>([]);
  const [milestones, setMilestones] = React.useState<{ personId: string; streak: number }[]>([]);
  const [printStatus, setPrintStatus] = React.useState<"idle" | "printing" | "done">(CachedData.printer?.ipAddress ? "printing" : "idle");
  const [checkinFailed, setCheckinFailed] = React.useState(false);
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
    const promises: Promise<any>[] = [];
    promises.push(checkin());
    if (CachedData.printer?.ipAddress) print();

    Promise.all(promises)
      .then(() => {
        if (!CachedData.printer?.ipAddress) startOver(milestonesRef.current.length > 0);
      })
      .catch(error => {
        console.error("Error during checkin:", error);
        setCheckinFailed(true);
        startOver();
      });
  };

  const startOver = (hasMilestone?: boolean) => {
    CachedData.existingVisits = [];
    CachedData.pendingVisits = [];
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

  const print = async () => {
    try {
      PrinterLog.add(`--- Family check-in print: ${CachedData.printer?.brand} ${CachedData.printer?.model} @ ${CachedData.printer?.ipAddress} ---`);
      const labels = await LabelHelper.getAllLabels();
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

  const checkin = async () => {
    const peopleIds: number[] = ArrayHelper.getUniqueValues(CachedData.householdMembers, "id");
    const url = "/visits/checkin?serviceId=" + CachedData.serviceId + "&peopleIds=" + encodeURIComponent(peopleIds.join(","));
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

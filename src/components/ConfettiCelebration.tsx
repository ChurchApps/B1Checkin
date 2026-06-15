import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import ConfettiCannon from "react-native-confetti-cannon";
import { CachedData, EnvironmentHelper } from "../helpers";
import { useAppTheme } from "../theme";
import { Avatar } from "./ui";

interface MilestoneInfo {
  personId: string;
  streak: number;
}

interface Props {
  milestones: MilestoneInfo[];
}

const ConfettiCelebration: React.FC<Props> = ({ milestones }) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const highest = (milestones && milestones.length > 0)
    ? milestones.reduce((max, m) => (m.streak > max.streak ? m : max), milestones[0])
    : null;
  const [displayCount, setDisplayCount] = React.useState(0);

  React.useEffect(() => {
    if (!highest) return;
    const steps = Math.min(highest.streak, 30);
    const stepTime = 600 / steps;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setDisplayCount(Math.round((current / steps) * highest.streak));
      if (current >= steps) clearInterval(interval);
    }, stepTime);
    return () => clearInterval(interval);
  }, [highest?.streak]);

  if (!highest) return null;

  const person = (CachedData.householdMembers || []).find(m => m.id === highest.personId);
  const personName = person?.name?.display || person?.displayName || "";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiCannon
        count={200}
        origin={{ x: -10, y: 0 }}
        fadeOut={true}
        autoStart={true}
        colors={[theme.colors.primary, theme.colors.secondary, theme.colors.gold, "#FFFFFF"]}
      />
      <View style={{
        position: "absolute",
        top: "26%",
        alignSelf: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        borderRadius: theme.radius.xl,
        paddingHorizontal: theme.spacing.xxxl,
        paddingVertical: theme.spacing.xl,
        gap: theme.spacing.sm,
        ...theme.elevation.e3
      }}>
        {!!personName && <Avatar name={personName} photoUri={person?.photo ? EnvironmentHelper.ContentRoot + person.photo : undefined} size={72} />}
        <Text style={{ fontSize: 64, lineHeight: 72, fontFamily: theme.fonts.bold, color: theme.colors.primary }}>{displayCount}</Text>
        <Text style={{ fontSize: 20, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary }}>{t("checkinComplete.milestoneWeeks")}</Text>
      </View>
    </View>
  );
};

export default ConfettiCelebration;

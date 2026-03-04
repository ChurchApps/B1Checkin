import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import ConfettiCannon from "react-native-confetti-cannon";
import { StyleConstants } from "../helpers/Styles";
import { DimensionHelper } from "../helpers/DimensionHelper";

interface MilestoneInfo {
  personId: string;
  streak: number;
}

interface Props {
  milestones: MilestoneInfo[];
}

const ConfettiCelebration: React.FC<Props> = ({ milestones }) => {
  const { t } = useTranslation();
  if (!milestones || milestones.length === 0) return null;

  const highest = milestones.reduce((max, m) => (m.streak > max.streak ? m : max), milestones[0]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut={true} autoStart={true} />
      <View style={styles.overlay}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.streakNumber}>{highest.streak}</Text>
        <Text style={styles.streakLabel}>{t("checkinComplete.milestoneWeeks")}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: "30%",
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    paddingHorizontal: DimensionHelper.wp("10%"),
    paddingVertical: DimensionHelper.wp("5%"),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  emoji: {
    fontSize: DimensionHelper.wp("12%"),
  },
  streakNumber: {
    fontSize: DimensionHelper.wp("14%"),
    fontFamily: StyleConstants.RobotoBold,
    fontWeight: "700",
    color: StyleConstants.baseColor,
  },
  streakLabel: {
    fontSize: DimensionHelper.wp("5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    marginTop: DimensionHelper.wp("1%"),
  },
});

export default ConfettiCelebration;

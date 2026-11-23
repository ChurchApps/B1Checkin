import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { AnnouncementHelper, CachedData } from "../helpers";
import { useAppTheme } from "../theme";
import { Button, Sheet } from "./ui";

// Shows the church's check-in announcement once per household, before they pick who to check in.
// The text is rendered as plain <Text>, never as markup.
export const CheckinAnnouncement: React.FC = () => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const text = CachedData.checkinAnnouncement;
  const [visible, setVisible] = React.useState(() => AnnouncementHelper.shouldShow(text, CachedData.householdMembers));

  // Check again each time the household screen gains focus: the screen can be reused for the next family,
  // and lookup always loads a new household list, so a new family sees it while add-guest / change-rooms does not.
  useFocusEffect(React.useCallback(() => {
    setVisible(AnnouncementHelper.shouldShow(CachedData.checkinAnnouncement, CachedData.householdMembers));
  }, []));

  const confirm = () => {
    AnnouncementHelper.confirm(CachedData.householdMembers);
    setVisible(false);
  };

  return (
    <Sheet visible={visible} dismissible={false} maxWidth={520}>
      <View style={{ alignItems: "center", gap: theme.spacing.lg }} testID="checkin-announcement">
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="campaign" size={34} color={theme.colors.primary} />
        </View>
        <Text style={{ fontSize: 22, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary, textAlign: "center" }}>{t("household.announcementTitle")}</Text>
        <ScrollView style={{ maxHeight: 360, alignSelf: "stretch" }}>
          <Text testID="checkin-announcement-text" style={{ fontSize: 18, lineHeight: 26, fontFamily: theme.fonts.regular, color: theme.colors.textSecondary, textAlign: "center" }}>
            {AnnouncementHelper.normalize(text)}
          </Text>
        </ScrollView>
        <Button label={t("common.ok")} size="xl" fullWidth onPress={confirm} testID="checkin-announcement-ok" />
      </View>
    </Sheet>
  );
};

export default CheckinAnnouncement;

import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import PrintUI from "../src/components/PrintUI";
import CodeScanner from "../src/components/CodeScanner";
import { ApiHelper, ArrayHelper, CachedData, EnvironmentHelper, FirebaseHelper, LabelHelper, PersonInterface, PrinterLog, screenNavigationProps, VisitInterface } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Avatar, Screen, Toast } from "../src/components/ui";

interface Props { navigation: screenNavigationProps }

const Scan = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [people, setPeople] = React.useState<PersonInterface[]>([]);
  const [htmlLabels, setHtmlLabels] = React.useState<string[]>([]);

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Scan");
  }, []);

  const fail = (message: string) => {
    setError(message);
    setBusy(false);
  };

  const lookupCode = async (code: string) => {
    setBusy(true);
    setError("");
    try {
      const visits: VisitInterface[] = await ApiHelper.get("/visits/code/" + code, "AttendanceApi");
      if (!Array.isArray(visits) || visits.length === 0) { fail(t("scan.codeNotFound")); return; }
      const ids: string[] = ArrayHelper.getUniqueValues(visits, "personId");
      const found: PersonInterface[] = await ApiHelper.get("/people/ids?ids=" + encodeURIComponent(ids.join(",")), "MembershipApi");
      setPeople(found);
      if (!CachedData.printer?.ipAddress) {
        Toast.show(t("scan.noPrinter"), "info");
        router.replace("/lookup");
        return;
      }
      PrinterLog.add("--- Print from QR scan ---");
      const labels = await LabelHelper.getAllLabelsFor(visits, found, code);
      if (labels.length === 0) {
        Toast.show(t("scan.nothingToPrint"), "info");
        router.replace("/lookup");
        return;
      }
      setHtmlLabels(labels);
    } catch {
      fail(t("scan.lookupError"));
    }
  };

  const handlePrintComplete = () => {
    setHtmlLabels([]);
    setBusy(false);
    Toast.show(t("scan.printed"), "success");
    router.replace("/lookup");
  };

  const printing = (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.lg }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ ...theme.type.h2, color: theme.colors.textPrimary }}>{t("scan.printing")}</Text>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: theme.spacing.lg, flexWrap: "wrap" }}>
        {people.slice(0, 5).map(person => {
          const name = person.name?.display || person.displayName || "";
          return (
            <View key={person.id} style={{ alignItems: "center", gap: 6, maxWidth: 88 }}>
              <Avatar name={name} photoUri={person.photo ? EnvironmentHelper.ContentRoot + person.photo : undefined} size={56} />
              <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary }}>{person.name?.first || name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <>
      <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} scroll={false}>
        <Subheader title={t("scan.title")} subtitle={t("scan.subtitle")} onBack={() => router.back()} />
        {busy && printing}
        {/* Stay mounted while busy so a failed code isn't re-read the moment the camera returns. */}
        <View style={{ flex: 1, display: busy ? "none" : "flex" }}>
          <CodeScanner onCode={lookupCode} disabled={busy || htmlLabels.length > 0} />
        </View>
        {!!error && (
          <Text style={{ fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.danger, textAlign: "center", marginTop: theme.spacing.md }}>{error}</Text>
        )}
      </Screen>
      {htmlLabels.length > 0 && (
        <PrintUI htmlLabels={htmlLabels} onLog={PrinterLog.add} onPrintComplete={handlePrintComplete} />
      )}
    </>
  );
};

export default Scan;

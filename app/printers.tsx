import React from "react";
import { Alert, FlatList, ScrollView, Share, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import RNRestart from "react-native-restart";
import * as PrinterHelper from "printer-helper";
import { ScreenList } from "../src/screenList";
import { AvailablePrinter, CachedData, FirebaseHelper, PrinterLog, screenNavigationProps } from "../src/helpers";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import PrintUI from "../src/components/PrintUI";
import { useAppTheme } from "../src/theme";
import { Button, ListRow, Screen, SkeletonList } from "../src/components/ui";

const NO_PRINTER: AvailablePrinter = { model: "none", ipAddress: "", brand: "" };

type ProfileScreenRouteProp = RouteProp<ScreenList, "Household">;
interface Props { navigation: screenNavigationProps; route: ProfileScreenRouteProp; }

const Printers = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [printers, setPrinters] = React.useState<AvailablePrinter[]>([NO_PRINTER]);
  const [selectedPrinter, setSelectedPrinter] = React.useState<AvailablePrinter>(NO_PRINTER);
  const [htmlLabels, setHtmlLabels] = React.useState<string[]>([]);
  const [isScanning, setIsScanning] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = React.useState<boolean>(false);
  // Read from the persistent app-wide printer log so this panel also shows the
  // family-print flow that ran earlier on the checkin-complete screen.
  const [debugLog, setDebugLog] = React.useState<string[]>(PrinterLog.get());

  React.useEffect(() => {
    PrinterLog.attachNativeListeners();
    return PrinterLog.subscribe(setDebugLog);
  }, []);

  const reversedLog = React.useMemo(() => debugLog.slice().reverse(), [debugLog]);

  const isNoPrinterSelected = (printer: AvailablePrinter) => !printer.ipAddress || printer.model === "none";

  const init = async () => {
    FirebaseHelper.addOpenScreenEvent("Printers");
    setIsScanning(true);

    try {
      const savedPrinter = await AsyncStorage.getItem("@Printer");
      if (savedPrinter) {
        const printer = JSON.parse(savedPrinter);
        if (printer && printer.model !== "none") {
          setSelectedPrinter(printer);
          CachedData.printer = printer;
        }
      }
    } catch (error) {
      console.error("Error loading saved printer:", error);
    }

    PrinterHelper.scan()
      .then((data: string) => {
        const items = data.split(",");
        const result: AvailablePrinter[] = [];
        items.forEach(item => {
          if (item.length > 0) {
            const splitItem = item.split("~");
            result.push({ brand: splitItem[0], model: splitItem[1], ipAddress: splitItem[2] });
          }
        });
        result.push(NO_PRINTER);
        setPrinters(result);
        setIsScanning(false);
      })
      .catch(error => {
        console.error("Error scanning for printers:", error);
        setIsScanning(false);
      });
  };

  const saveSelectedPrinter = async () => {
    const printer = isNoPrinterSelected(selectedPrinter) ? NO_PRINTER : selectedPrinter;
    CachedData.printer = printer;
    await AsyncStorage.setItem("@Printer", JSON.stringify(printer));
    PrinterHelper.checkInit(printer.ipAddress || "", printer.model || "", printer.brand || "");
  };

  React.useEffect(() => { init(); }, []);

  const getRadio = (isSelected: boolean) => (
    isSelected
      ? (
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcons name="check" size={18} color={theme.colors.onPrimary} />
        </View>
      )
      : <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: theme.colors.border }} />
  );

  const getPrinterRow = ({ item }: { item: AvailablePrinter }) => {
    const isSelected = item.ipAddress === selectedPrinter.ipAddress;
    const noPrinter = isNoPrinterSelected(item);

    return (
      <ListRow
        title={noPrinter ? t("printers.noPrinter") : `${item.brand} ${item.model}`}
        subtitle={noPrinter ? undefined : item.ipAddress}
        selected={isSelected}
        left={
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: noPrinter ? theme.colors.border : theme.colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name={noPrinter ? "print-disabled" : "print"} size={22} color={noPrinter ? theme.colors.textMuted : theme.colors.primary} />
          </View>
        }
        right={getRadio(isSelected)}
        onPress={() => { setSelectedPrinter(item); }}
        style={{ marginBottom: theme.spacing.sm }}
      />
    );
  };

  const testPrint = () => {
    if (isNoPrinterSelected(selectedPrinter)) Alert.alert(t("printers.noPrinterSelected"));
    else {
      PrinterLog.add(`--- Test print: ${selectedPrinter.brand} ${selectedPrinter.model} @ ${selectedPrinter.ipAddress} ---`);
      saveSelectedPrinter();
      setHtmlLabels(["<b>Hello World</b>"]);
    }
  };

  const saveAndRestart = async () => {
    setIsSaving(true);
    try {
      await saveSelectedPrinter();
    } finally {
      setTimeout(() => RNRestart.Restart(), 500);
    }
  };

  const shareLog = () => {
    Share.share({ message: PrinterLog.get().join("\n") || "No log entries." }).catch(() => { /* user dismissed */ });
  };

  const getLabelView = () => {
    if (htmlLabels?.length > 0) {
      return (<PrintUI htmlLabels={htmlLabels} onLog={PrinterLog.add} onPrintComplete={() => { setHtmlLabels([]); }} />);
    }
    return <></>;
  };

  const getDiagnostics = () => (
    <View style={{ marginTop: theme.spacing.sm }}>
      <ListRow
        title={t("printers.diagnostics")}
        left={
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.border, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="terminal" size={22} color={theme.colors.textSecondary} />
          </View>
        }
        right={<MaterialIcons name={diagnosticsOpen ? "expand-less" : "expand-more"} size={28} color={theme.colors.textMuted} />}
        onPress={() => setDiagnosticsOpen(!diagnosticsOpen)}
      />
      {diagnosticsOpen && (
        <View style={{ backgroundColor: "#1E1E1E", borderRadius: theme.radius.lg, marginTop: theme.spacing.sm, maxHeight: 240, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: theme.spacing.sm, padding: theme.spacing.sm, backgroundColor: "#2D2D2D" }}>
            <Button label="Share" variant="ghost" size="md" onPress={shareLog} />
            <Button label="Clear" variant="ghost" size="md" onPress={() => PrinterLog.clear()} />
          </View>
          <ScrollView style={{ maxHeight: 180 }} contentContainerStyle={{ padding: theme.spacing.md }}>
            {reversedLog.length === 0
              ? <Text style={{ color: "#888888", fontSize: 13, fontStyle: "italic" }}>No log entries yet. Tap Test Print to capture printer diagnostics.</Text>
              : reversedLog.map((line, i) => (
                <Text key={i} style={{ color: "#D4D4D4", fontFamily: "monospace", fontSize: 12, marginBottom: 2 }} selectable>{line}</Text>
              ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const footer = (
    <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
      <Button label={t("printers.testPrint")} variant="outline" size="lg" icon="print" onPress={testPrint} style={{ flex: 1 }} />
      <Button label={isSaving ? t("printers.saving") : t("printers.saveRestart")} size="xl" icon="check" loading={isSaving} onPress={saveAndRestart} style={{ flex: 1.4 }} />
    </View>
  );

  return (
    <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} footer={footer}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Subheader compact title={t("printers.title")} subtitle={t("printers.subtitle")} />
        </View>
        <Button label={t("printers.rescan")} variant="ghost" size="md" icon="refresh" disabled={isScanning} onPress={init} />
      </View>
      {isScanning
        ? (
          <View style={{ gap: theme.spacing.md }}>
            <SkeletonList rows={3} rowHeight={64} />
            <Text style={{ fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.textMuted, textAlign: "center" }}>{t("printers.scanning")}</Text>
          </View>
        )
        : (
          <>
            {printers.length === 1 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, backgroundColor: theme.colors.warningBg, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md }}>
                <MaterialIcons name="wifi-find" size={20} color={theme.colors.warning} />
                <Text style={{ fontSize: 15, fontFamily: theme.fonts.medium, color: theme.colors.warning, flexShrink: 1 }}>{t("printers.noneFound")}</Text>
              </View>
            )}
            <FlatList
              data={printers}
              renderItem={getPrinterRow}
              keyExtractor={(printer: AvailablePrinter) => printer.ipAddress || "none"}
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
            />
            {getLabelView()}
            {getDiagnostics()}
          </>
        )}
    </Screen>
  );
};

export default Printers;

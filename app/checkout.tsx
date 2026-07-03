import React from "react";
import { ActivityIndicator, Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import PrintUI from "../src/components/PrintUI";
import { ApiHelper, ArrayHelper, CachedData, EnvironmentHelper, FirebaseHelper, HouseholdPickupInterface, LabelHelper, PersonInterface, PickupMatchHelper, PrinterLog, screenNavigationProps, VisitInterface, VisitSessionHelper } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Avatar, Badge, Button, Screen, Sheet, TextField, Toast } from "../src/components/ui";

interface Props { navigation: screenNavigationProps }

const ALPHABET = "23456789BCDFGHJKLMNPQRSTVWXYZ";
const KEY_ROWS = ["234567", "89BCDF", "GHJKLM", "NPQRST", "VWXYZ"];

const Checkout = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const inputRef = React.useRef<TextInput>(null);
  const [code, setCode] = React.useState("");
  const [looking, setLooking] = React.useState(false);
  const [error, setError] = React.useState("");
  const [visits, setVisits] = React.useState<VisitInterface[]>([]);
  const [children, setChildren] = React.useState<PersonInterface[]>([]);
  const [adults, setAdults] = React.useState<PersonInterface[]>([]);
  const [pickupPeople, setPickupPeople] = React.useState<HouseholdPickupInterface[]>([]);
  const [otherMode, setOtherMode] = React.useState(false);
  const [otherName, setOtherName] = React.useState("");
  const [blocked, setBlocked] = React.useState<HouseholdPickupInterface | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [pageOpen, setPageOpen] = React.useState(false);
  const [pageCustom, setPageCustom] = React.useState("");
  const [pageBusy, setPageBusy] = React.useState(false);
  const [pageResult, setPageResult] = React.useState("");
  const [reprintLabels, setReprintLabels] = React.useState<string[]>([]);
  const [reprinting, setReprinting] = React.useState(false);

  const manned = CachedData.stationMode === "manned";
  const keyHeight = windowHeight < 1000 ? 52 : 64;
  const trusted = pickupPeople.filter(p => p.status === "trusted");

  React.useEffect(() => { FirebaseHelper.addOpenScreenEvent("Checkout"); }, []);

  const reset = (message: string) => {
    setCode("");
    setError(message);
    setLooking(false);
    inputRef.current?.focus();
  };

  const lookupCode = (value: string) => {
    setLooking(true);
    setError("");
    ApiHelper.get("/visits/code/" + value, "AttendanceApi")
      .then(async (found: VisitInterface[]) => {
        if (!Array.isArray(found) || found.length === 0) {
          reset(t("checkout.codeNotFound"));
          return;
        }
        const ids: string[] = ArrayHelper.getUniqueValues(found, "personId");
        const people: PersonInterface[] = await ApiHelper.get("/people/ids?ids=" + encodeURIComponent(ids.join(",")), "MembershipApi");
        const householdId = people[0]?.householdId;
        const members: PersonInterface[] = householdId ? await ApiHelper.get("/people/household/" + householdId, "MembershipApi") : [];
        const pickup: HouseholdPickupInterface[] = householdId
          ? await ApiHelper.get("/householdpickup/" + householdId, "MembershipApi").catch(() => [])
          : [];
        setVisits(found);
        setChildren(people);
        setAdults(members.filter(m => !ids.includes(m.id || "") && m.householdRole !== "Child"));
        setPickupPeople(Array.isArray(pickup) ? pickup : []);
        setLooking(false);
      })
      .catch(() => reset(t("checkout.lookupError")));
  };

  const handleCode = (text: string) => {
    const clean = text.toUpperCase().split("").filter(c => ALPHABET.includes(c)).join("").slice(0, 4);
    setCode(clean);
    setError("");
    if (clean.length === 4 && !looking) lookupCode(clean);
  };

  const checkout = (pickedBy: string, pickedById?: string) => {
    if (submitting) return;
    setSubmitting(true);
    const body = { visitIds: visits.map(v => v.id), checkedOutBy: pickedBy, checkedOutById: pickedById };
    ApiHelper.post("/visits/checkout", body, "AttendanceApi")
      .then(() => {
        Toast.show(t("checkout.success"), "success");
        router.replace("/lookup");
      })
      .catch(() => {
        setSubmitting(false);
        Toast.show(t("checkout.checkoutFailed"), "error");
      });
  };

  const confirmOther = () => {
    const name = otherName.trim();
    const match = PickupMatchHelper.findNotAuthorized(name, pickupPeople);
    if (match) { setBlocked(match); return; }
    checkout(name);
  };

  const roomName = (): string => {
    for (const v of visits) {
      for (const vs of v.visitSessions || []) {
        const name = VisitSessionHelper.getPickupText(vs);
        if (name) return name;
      }
    }
    return "";
  };

  const sendPage = (message: string) => {
    if (pageBusy || !visits[0]?.id) return;
    setPageBusy(true);
    setPageResult("");
    ApiHelper.post("/checkin/page", { visitId: visits[0].id, message }, "AttendanceApi")
      .then((res: any) => {
        setPageBusy(false);
        setPageResult(t("checkout.pageSent", { sent: res?.sent ?? 0, skipped: (res?.skippedOptedOut ?? 0) + (res?.skippedNoPhone ?? 0) }));
      })
      .catch((err: any) => {
        setPageBusy(false);
        const m = String(err?.message || "");
        setPageResult(/No SMS provider/i.test(m) ? t("checkout.noProvider") : t("checkout.pageFailed"));
      });
  };

  const reprint = async () => {
    if (reprinting) return;
    setReprinting(true);
    try {
      PrinterLog.add("--- Reprint from checkout ---");
      const labels = await LabelHelper.getAllLabelsFor(visits, children, code);
      if (labels.length === 0) { Toast.show(t("checkout.nothingToPrint"), "info"); setReprinting(false); return; }
      setReprintLabels(labels);
    } catch {
      setReprinting(false);
      Toast.show(t("checkout.reprintFailed"), "error");
    }
  };

  const getKey = (char: string) => (
    <Pressable
      key={char}
      accessibilityRole="button"
      accessibilityLabel={char}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        handleCode(code + char);
      }}
      style={({ pressed }) => ({
        flex: 1,
        height: keyHeight,
        borderRadius: theme.radius.lg,
        backgroundColor: pressed ? theme.colors.primarySoft : theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
        ...theme.elevation.e1
      })}>
      <Text style={{ fontSize: 26, fontFamily: theme.fonts.medium, color: theme.colors.textPrimary }}>{char}</Text>
    </Pressable>
  );

  const codeEntry = (
    <>
      <View style={{ height: 80, alignItems: "center", justifyContent: "center" }}>
        {looking
          ? <ActivityIndicator size="large" color={theme.colors.primary} />
          : (
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleCode}
              onSubmitEditing={() => { if (code.length === 4) lookupCode(code); }}
              autoFocus
              autoCorrect={false}
              autoCapitalize="characters"
              showSoftInputOnFocus={false}
              caretHidden
              placeholder="____"
              placeholderTextColor={theme.colors.textMuted}
              style={{ ...theme.type.display, color: theme.colors.textPrimary, textAlign: "center", letterSpacing: 8, minWidth: 240, padding: 0 }}
            />
          )}
      </View>
      {!!error && <Text style={{ fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.danger, textAlign: "center" }}>{error}</Text>}
      <View style={{ flex: 1 }} />
      <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        {KEY_ROWS.map(row => (
          <View key={row} style={{ flexDirection: "row", gap: theme.spacing.md }}>
            {row.split("").map(getKey)}
            {row === KEY_ROWS[KEY_ROWS.length - 1] && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="backspace"
                onPress={() => handleCode(code.slice(0, -1))}
                style={{ flex: 1, height: keyHeight, alignItems: "center", justifyContent: "center" }}>
                <MaterialIcons name="backspace" size={26} color={theme.colors.textSecondary} />
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </>
  );

  const personCard = (name: string, opts: { photoUri?: string; personId?: string; trustedBadge?: boolean }) => (
    <Pressable
      key={opts.personId || name}
      accessibilityRole="button"
      onPress={() => checkout(name, opts.personId)}
      style={({ pressed }) => ({
        width: 150,
        alignItems: "center",
        gap: theme.spacing.sm,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        backgroundColor: pressed ? theme.colors.primarySoft : theme.colors.surface,
        ...theme.elevation.e1
      })}>
      <Avatar name={name} photoUri={opts.photoUri} size={72} />
      <Text numberOfLines={1} style={{ fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.textPrimary }}>{name}</Text>
      {opts.trustedBadge && <Badge label={t("checkout.trusted")} tone="success" icon="verified-user" />}
    </Pressable>
  );

  const pickup = (
    <>
      {manned && (
        <View style={{ flexDirection: "row", gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <Button label={t("checkout.pageParent")} variant="outline" size="md" icon="sms" onPress={() => { setPageResult(""); setPageOpen(true); }} style={{ flex: 1 }} />
          <Button label={t("checkout.reprint")} variant="outline" size="md" icon="print" loading={reprinting} onPress={reprint} style={{ flex: 1 }} />
        </View>
      )}
      <Text style={{ ...theme.type.overline, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>{t("checkout.checkingOut")}</Text>
      {children.map(child => {
        const visit = visits.find(v => v.personId === child.id);
        return (
          <View key={child.id} style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.elevation.e1 }}>
            <Avatar name={child.name?.display || child.displayName || ""} photoUri={child.photo ? EnvironmentHelper.ContentRoot + child.photo : undefined} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary }}>{child.name?.display || child.displayName}</Text>
              <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.textMuted }}>
                {VisitSessionHelper.getDisplaySessions(visit?.visitSessions || [])}
              </Text>
            </View>
          </View>
        );
      })}
      <Text style={{ ...theme.type.h2, color: theme.colors.textPrimary, marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg }}>{t("checkout.whoPickingUp")}</Text>
      {submitting
        ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
            {adults.map(a => personCard(a.name?.display || a.displayName || "", { photoUri: a.photo ? EnvironmentHelper.ContentRoot + a.photo : undefined, personId: a.id }))}
            {trusted.map(p => personCard(p.name, { photoUri: p.photoUrl || undefined, personId: p.personId, trustedBadge: true }))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setOtherMode(true)}
              style={({ pressed }) => ({
                width: 150,
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing.sm,
                padding: theme.spacing.lg,
                borderRadius: theme.radius.lg,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: theme.colors.primaryBorder,
                backgroundColor: pressed ? theme.colors.primarySoft : "transparent"
              })}>
              <MaterialIcons name="person-outline" size={48} color={theme.colors.primary} />
              <Text style={{ fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.primary }}>{t("checkout.other")}</Text>
            </Pressable>
          </View>
        )}
      {otherMode && !submitting && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          <TextField
            placeholder={String(t("checkout.otherNamePlaceholder"))}
            value={otherName}
            onChangeText={setOtherName}
            autoCapitalize="words"
            autoFocus
            containerStyle={{ flex: 1 }}
          />
          <Button label={t("checkout.confirm")} disabled={otherName.trim().length < 2} onPress={confirmOther} />
        </View>
      )}
    </>
  );

  const presetMessage = roomName() ? t("checkout.pagePresetRoom", { room: roomName() }) : t("checkout.pagePresetGeneric");

  return (
    <>
      <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} scroll={visits.length > 0}>
        <Subheader title={t("checkout.title")} subtitle={visits.length === 0 ? t("checkout.subtitle") : undefined} onBack={() => router.back()} />
        {visits.length === 0 ? codeEntry : pickup}
      </Screen>

      <Sheet visible={!!blocked} onClose={() => setBlocked(null)} maxWidth={440}>
        <View style={{ alignItems: "center", gap: theme.spacing.lg }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.dangerBg, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="gpp-bad" size={36} color={theme.colors.danger} />
          </View>
          <Text style={{ fontSize: 22, fontFamily: theme.fonts.semibold, color: theme.colors.danger, textAlign: "center" }}>{t("checkout.notAuthorizedTitle")}</Text>
          <Text style={{ fontSize: 16, lineHeight: 23, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary, textAlign: "center" }}>
            {t("checkout.notAuthorizedMessage", { name: blocked?.name })}
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.md, alignSelf: "stretch" }}>
            <Button label={t("common.cancel")} onPress={() => setBlocked(null)} style={{ flex: 1.4 }} />
            <Button label={t("checkout.override")} variant="danger" onPress={() => { const name = otherName.trim(); setBlocked(null); checkout("OVERRIDE: " + name); }} style={{ flex: 1 }} />
          </View>
        </View>
      </Sheet>

      <Sheet visible={pageOpen} onClose={() => setPageOpen(false)} maxWidth={440}>
        <View style={{ gap: theme.spacing.md }}>
          <Text style={{ fontSize: 22, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary }}>{t("checkout.pageParent")}</Text>
          {!pageResult && (
            <>
              <Button label={presetMessage} size="lg" fullWidth loading={pageBusy} onPress={() => sendPage(presetMessage)} />
              <TextField placeholder={String(t("checkout.pageCustomPlaceholder"))} value={pageCustom} onChangeText={setPageCustom} autoCapitalize="sentences" />
              <Button label={t("checkout.pageSend")} variant="outline" fullWidth disabled={pageCustom.trim().length < 2 || pageBusy} onPress={() => sendPage(pageCustom.trim())} />
            </>
          )}
          {!!pageResult && <Text style={{ fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.textSecondary, textAlign: "center" }}>{pageResult}</Text>}
          <Button label={pageResult ? t("common.ok") : t("common.cancel")} variant="ghost" fullWidth onPress={() => { setPageOpen(false); setPageCustom(""); setPageResult(""); }} />
        </View>
      </Sheet>

      {reprintLabels.length > 0 && (
        <PrintUI htmlLabels={reprintLabels} onLog={PrinterLog.add} onPrintComplete={() => { setReprintLabels([]); setReprinting(false); Toast.show(t("checkout.reprinted"), "success"); }} />
      )}
    </>
  );
};

export default Checkout;

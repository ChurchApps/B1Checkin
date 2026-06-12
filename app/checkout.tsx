import React from "react";
import { ActivityIndicator, Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import { ApiHelper, ArrayHelper, EnvironmentHelper, FirebaseHelper, PersonInterface, screenNavigationProps, VisitInterface, VisitSessionHelper } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Avatar, Button, Screen, TextField, Toast } from "../src/components/ui";

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
  const [otherMode, setOtherMode] = React.useState(false);
  const [otherName, setOtherName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const keyHeight = windowHeight < 1000 ? 52 : 64;

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
        setVisits(found);
        setChildren(people);
        setAdults(members.filter(m => !ids.includes(m.id || "") && m.householdRole !== "Child"));
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

  const pickerCard = (person: PersonInterface) => {
    const name = person.name?.display || person.displayName || "";
    return (
      <Pressable
        key={person.id}
        accessibilityRole="button"
        onPress={() => checkout(name, person.id)}
        style={({ pressed }) => ({
          width: 150,
          alignItems: "center",
          gap: theme.spacing.sm,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          backgroundColor: pressed ? theme.colors.primarySoft : theme.colors.surface,
          ...theme.elevation.e1
        })}>
        <Avatar name={name} photoUri={person.photo ? EnvironmentHelper.ContentRoot + person.photo : undefined} size={72} />
        <Text numberOfLines={1} style={{ fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.textPrimary }}>{name}</Text>
      </Pressable>
    );
  };

  const pickup = (
    <>
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
            {adults.map(pickerCard)}
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
          <Button label={t("checkout.confirm")} disabled={otherName.trim().length < 2} onPress={() => checkout(otherName.trim())} />
        </View>
      )}
    </>
  );

  return (
    <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} scroll={visits.length > 0}>
      <Subheader title={t("checkout.title")} subtitle={visits.length === 0 ? t("checkout.subtitle") : undefined} onBack={() => router.back()} />
      {visits.length === 0 ? codeEntry : pickup}
    </Screen>
  );
};

export default Checkout;

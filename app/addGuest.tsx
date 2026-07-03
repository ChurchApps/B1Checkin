import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { ApiHelper, CachedData, PersonInterface, screenNavigationProps } from "../src/helpers";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import { useAppTheme } from "../src/theme";
import { Button, Card, Screen, TextField } from "../src/components/ui";

interface Props { navigation: screenNavigationProps }

const AddGuest = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [firstNameError, setFirstNameError] = React.useState("");
  const [lastNameError, setLastNameError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitFailed, setSubmitFailed] = React.useState(false);

  const addGuest = () => {
    const first = firstName.trim();
    const last = lastName.trim();
    setFirstNameError(first === "" ? t("addGuest.enterFirstName") : "");
    setLastNameError(last === "" ? t("addGuest.enterLastName") : "");
    if (first === "" || last === "") return;

    setSubmitting(true);
    setSubmitFailed(false);
    getOrCreatePerson(first, last)
      .then(person => {
        person.isGuest = true;
        if (person.id) CachedData.checkinTypes[person.id] = "guest";
        CachedData.householdMembers.push(person);
        router.push("/household");
      })
      .catch(() => {
        setSubmitFailed(true);
      })
      .finally(() => setSubmitting(false));
  };

  const getOrCreatePerson = async (firstname: string, lastname: string) => {
    const fullName = firstname + " " + lastname;
    let person: PersonInterface | null = await searchForGuest(fullName);
    if (person === null) {
      person = { householdId: CachedData.householdId, name: { display: fullName, first: firstname, last: lastname }, contactInfo: {} };
      const data = await ApiHelper.post("/people", [person], "MembershipApi");
      if (data && data.length > 0) person.id = data[0].id;
    }
    return person;
  };

  const searchForGuest = async (fullName: string) => {
    let result: PersonInterface | null = null;
    const url = "/people/search?term=" + encodeURIComponent(fullName);
    const people: PersonInterface[] = await ApiHelper.get(url, "MembershipApi");
    people.forEach(p => { if (p.membershipStatus !== "Member") result = p; });
    return result ?? null;
  };

  const footer = (
    <View style={{ gap: theme.spacing.sm }}>
      {submitFailed && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing.sm, backgroundColor: theme.colors.dangerBg, borderRadius: theme.radius.md, padding: theme.spacing.md }}>
          <MaterialIcons name="error-outline" size={20} color={theme.colors.danger} />
          <Text style={{ fontSize: 15, fontFamily: theme.fonts.medium, color: theme.colors.danger }}>{t("addGuest.addFailed")}</Text>
        </View>
      )}
      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        <Button label={t("common.cancel")} variant="ghost" size="lg" onPress={() => router.back()} style={{ flex: 1 }} />
        <Button label={t("addGuest.addButton")} size="xl" icon="person-add-alt" loading={submitting} onPress={addGuest} style={{ flex: 2 }} />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <Screen header={<Header navigation={props.navigation} prominentLogo={true} />} footer={footer} scroll={false}>
        <Subheader title={t("addGuest.title")} subtitle={t("addGuest.subtitle")} onBack={() => router.back()} />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
          <Card padding="xl">
            <TextField
              label={t("addGuest.firstName")}
              placeholder={String(t("addGuest.firstNamePlaceholder"))}
              value={firstName}
              onChangeText={value => {
                setFirstName(value);
                if (firstNameError) setFirstNameError("");
              }}
              error={firstNameError}
              size="lg"
              autoCapitalize="words"
              autoFocus
              returnKeyType="next"
              containerStyle={{ marginBottom: theme.spacing.lg }}
            />
            <TextField
              label={t("addGuest.lastName")}
              placeholder={String(t("addGuest.lastNamePlaceholder"))}
              value={lastName}
              onChangeText={value => {
                setLastName(value);
                if (lastNameError) setLastNameError("");
              }}
              error={lastNameError}
              size="lg"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={addGuest}
            />
          </Card>
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
};

export default AddGuest;

import React from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import QRCode from "react-native-qrcode-svg";
import { RouteProp } from "@react-navigation/native";
import { ScreenList } from "../src/screenList";
import { ApiHelper, ArrayHelper, CachedData, EnvironmentHelper, FirebaseHelper, PersonInterface, screenNavigationProps } from "../src/helpers";
import Header from "../src/components/Header";
import IdleScreen from "../src/components/IdleScreen";
import { useCheckinTheme } from "../src/context/CheckinThemeContext";
import { useInactivityTimer } from "../src/hooks/useInactivityTimer";
import { useAppTheme } from "../src/theme";
import { Avatar, Button, EmptyState, ListRow, NumberPad, Screen, Sheet, SkeletonList, TextField } from "../src/components/ui";

type ProfileScreenRouteProp = RouteProp<ScreenList, "Lookup">;
interface Props { navigation: screenNavigationProps; route: ProfileScreenRouteProp; }

const Lookup = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { theme: checkinTheme } = useCheckinTheme();
  const { isIdle, resetTimer, dismiss } = useInactivityTimer(
    checkinTheme.idleScreen.timeoutSeconds,
    checkinTheme.idleScreen.enabled && (checkinTheme.idleScreen.slides || []).length > 0
  );
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const [hasSearched, setHasSearched] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [people, setPeople] = React.useState<PersonInterface[]>([]);
  const [phone, setPhone] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [searchMode, setSearchMode] = React.useState<"phone" | "name">("phone");
  const [showQR, setShowQR] = React.useState(false);
  const [qrVisible, setQrVisible] = React.useState(false);
  const [loadingPersonId, setLoadingPersonId] = React.useState<string | null>(null);
  const [searchFailed, setSearchFailed] = React.useState(false);
  const [manned, setManned] = React.useState(CachedData.stationMode === "manned");

  useFocusEffect(React.useCallback(() => { setManned(CachedData.stationMode === "manned"); }, []));

  const keyHeight = windowHeight < 1000 ? 72 : 88;
  const canSearch = searchMode === "phone" ? phone.length >= 4 : lastName.trim().length >= 2;

  const loadHouseholdMembers = async () => {
    CachedData.householdMembers = await ApiHelper.get("/people/household/" + CachedData.householdId, "MembershipApi");
    await loadExistingVisits();
  };

  const loadExistingVisits = async () => {
    CachedData.existingVisits = [];
    const peopleIds: number[] = ArrayHelper.getUniqueValues(CachedData.householdMembers, "id");
    const url = "/visits/checkin?serviceId=" + CachedData.serviceId + "&peopleIds=" + encodeURIComponent(peopleIds.join(",")) + "&include=visitSessions";
    CachedData.existingVisits = await ApiHelper.get(url, "AttendanceApi");
    CachedData.pendingVisits = [...CachedData.existingVisits];
    setLoadingPersonId(null);
    router.navigate("/household");
  };

  const selectPerson = (person: PersonInterface) => {
    if (loadingPersonId) return;
    setLoadingPersonId(person.id || "");
    CachedData.householdId = person.householdId || "";
    loadHouseholdMembers().catch(() => {
      setLoadingPersonId(null);
      setSearchFailed(true);
    });
  };

  const switchMode = (mode: "phone" | "name") => {
    if (mode === searchMode) return;
    setSearchMode(mode);
    setHasSearched(false);
    setSearchFailed(false);
    setPeople([]);
  };

  const resetSearch = () => {
    setHasSearched(false);
    setSearchFailed(false);
    setPeople([]);
    setPhone("");
    setLastName("");
  };

  const handleSearch = () => {
    if (!canSearch) return;
    setHasSearched(true);
    setIsLoading(true);
    setSearchFailed(false);
    const url = searchMode === "phone"
      ? "/people/search/phone?number=" + (phone.length > 4 ? phone : phone.slice(-4))
      : "/people/search?term=" + encodeURIComponent(lastName.trim());
    ApiHelper.get(url, "MembershipApi")
      .then(data => setPeople(data))
      .catch(() => setSearchFailed(true))
      .finally(() => setIsLoading(false));
  };

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Lookup");
    if (CachedData.userChurch?.church?.id) {
      ApiHelper.getAnonymous("/settings/public/" + CachedData.userChurch.church.id, "MembershipApi")
        .then((settings: any) => { setShowQR(settings?.enableQRGuestRegistration === "true"); })
        .catch(() => { setShowQR(false); });
    }
  }, []);

  const formatPhoneDisplay = (digits: string) => {
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return digits.slice(0, 3) + "-" + digits.slice(3);
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const getPersonRow = ({ item, index }: { item: PersonInterface; index: number }) => (
    <Animated.View entering={FadeInDown.duration(200).delay(Math.min(index, 8) * 40)}>
      <ListRow
        size="lg"
        title={item?.name?.display || ""}
        left={<Avatar name={item?.name?.display || ""} photoUri={item.photo ? EnvironmentHelper.ContentRoot + item.photo : undefined} size={64} />}
        right={loadingPersonId === item.id ? "spinner" : "chevron"}
        onPress={() => selectPerson(item)}
        style={{ marginBottom: theme.spacing.md }}
      />
    </Animated.View>
  );

  const getResultsBody = () => {
    if (isLoading) return <SkeletonList rows={3} />;
    if (searchFailed) {
      return (
        <EmptyState
          icon="error-outline"
          tone="warning"
          title={t("lookup.searchError")}
          action={<Button label={t("common.retry")} onPress={resetSearch} fullWidth />}
        />
      );
    }
    if (people.length === 0) {
      return (
        <EmptyState
          icon="search-off"
          title={t("lookup.noMatchTitle")}
          subtitle={searchMode === "phone" ? t("lookup.noMatchSubtitle") : t("lookup.noMatchSubtitleName")}
          action={
            <>
              <Button label={t("common.retry")} onPress={resetSearch} fullWidth />
              <Button
                label={searchMode === "phone" ? t("lookup.searchByName") : t("lookup.usePhone")}
                variant="ghost"
                onPress={() => {
                  resetSearch();
                  switchMode(searchMode === "phone" ? "name" : "phone");
                }}
                fullWidth
              />
            </>
          }
        />
      );
    }
    return (
      <FlatList
        data={people}
        renderItem={getPersonRow}
        keyExtractor={(item: PersonInterface) => item.id?.toString() || "0"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
      />
    );
  };

  const results = (
    <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
        <Text style={{ ...theme.type.overline, color: theme.colors.textMuted }}>
          {isLoading ? t("lookup.searching") : t("lookup.resultsFound", { count: people.length })}
        </Text>
        <Button label={t("lookup.backToKeypad")} variant="ghost" size="md" icon="dialpad" onPress={resetSearch} />
      </View>
      {getResultsBody()}
    </Animated.View>
  );

  const phonePad = (
    <>
      <View style={{ height: 72, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ ...theme.type.display, color: theme.colors.textPrimary, opacity: phone ? 1 : 0.25, letterSpacing: !phone || phone.length <= 4 ? 6 : 0 }}>
          {phone ? formatPhoneDisplay(phone) : "____"}
        </Text>
      </View>
      <View style={{ flex: 1 }} />
      <NumberPad
        keyHeight={keyHeight}
        onDigit={digit => {
          if (phone.length < 10) setPhone(phone + digit);
        }}
        onBackspace={() => setPhone(phone.slice(0, -1))}
        onClear={() => setPhone("")}
        bottomLeft={{ icon: "keyboard", label: t("lookup.searchByName"), onPress: () => switchMode("name") }}
      />
      <Button
        label={t("common.search")}
        size="xl"
        fullWidth
        disabled={!canSearch}
        onPress={handleSearch}
        style={{ marginTop: theme.spacing.lg }}
      />
    </>
  );

  const namePad = (
    <>
      <TextField
        size="lg"
        leadingIcon="person-search"
        placeholder={String(t("lookup.namePlaceholder"))}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        returnKeyType="search"
        onSubmitEditing={handleSearch}
        autoFocus
        containerStyle={{ marginTop: theme.spacing.xl }}
      />
      <Button
        label={t("common.search")}
        size="xl"
        fullWidth
        disabled={!canSearch}
        onPress={handleSearch}
        style={{ marginTop: theme.spacing.lg }}
      />
      <Button
        label={t("lookup.usePhone")}
        variant="ghost"
        icon="dialpad"
        onPress={() => switchMode("phone")}
        style={{ marginTop: theme.spacing.md }}
      />
      <View style={{ flex: 1 }} />
    </>
  );

  const searchBody = (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: "center", marginTop: theme.spacing.xl }}>
        <Text style={{ ...theme.type.h1, color: theme.colors.textPrimary, textAlign: "center" }}>{t("lookup.welcomeTitle")}</Text>
        <Text style={{ ...theme.type.bodyLg, color: theme.colors.textMuted, textAlign: "center", marginTop: theme.spacing.xs }}>
          {searchMode === "phone" ? t("lookup.welcomeSubtitle") : t("lookup.minLetters")}
        </Text>
      </View>
      {searchMode === "phone" ? phonePad : namePad}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing.lg, marginTop: theme.spacing.md, marginBottom: theme.spacing.lg, minHeight: 40 }}>
        {searchMode === "phone" && <Text style={{ fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.textMuted }}>{t("lookup.keypadHint")}</Text>}
        {showQR && !!CachedData.userChurch?.church?.subDomain && (
          <Pressable onPress={() => setQrVisible(true)} style={{ minHeight: 40, justifyContent: "center" }}>
            <Text style={{ fontSize: 15, fontFamily: theme.fonts.medium, color: theme.colors.primary, textDecorationLine: "underline" }}>{t("lookup.registerGuest")}</Text>
          </Pressable>
        )}
        <Button label={t("lookup.scanCode")} variant="ghost" size="md" icon="qr-code-scanner" onPress={() => router.navigate("/scan")} />
        {manned && <Button label={t("lookup.checkout")} variant="ghost" size="md" icon="logout" onPress={() => router.navigate("/checkout")} />}
      </View>
    </View>
  );

  return (
    <>
      <Screen
        header={<Header navigation={props.navigation} prominentLogo={true} />}
        onUserActivity={resetTimer}
        overlay={<IdleScreen visible={isIdle} onDismiss={dismiss} />}>
        {hasSearched ? results : searchBody}
      </Screen>
      <Sheet visible={qrVisible} onClose={() => setQrVisible(false)} maxWidth={340}>
        <View style={{ alignItems: "center", gap: theme.spacing.lg }}>
          {!!CachedData.userChurch?.church?.subDomain && (
            <QRCode
              value={`https://${CachedData.userChurch.church.subDomain}.b1.church/guest-register?serviceId=${CachedData.serviceId}`}
              size={200}
              backgroundColor="#FFFFFF"
              color={theme.colors.primary}
            />
          )}
          <Text style={{ fontSize: 16, fontFamily: theme.fonts.medium, color: theme.colors.textPrimary, textAlign: "center" }}>{t("lookup.qrGuest")}</Text>
          <Button label={t("common.ok")} onPress={() => setQrVisible(false)} fullWidth />
        </View>
      </Sheet>
    </>
  );
};

export default Lookup;

import React from "react";
import { FlatList, Text, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ApiHelper, EnvironmentHelper, PersonInterface } from "../helpers";
import { useAppTheme } from "../theme";
import { Avatar, Button, EmptyState, ListRow, NumberPad, SkeletonList, TextField } from "./ui";

interface Props {
  onSelect: (person: PersonInterface) => void;
  loadingPersonId?: string | null;
}

// Phone / last-name search from the lookup screen, trimmed down for the check-out screen.
export const HouseholdSearch: React.FC<Props> = ({ onSelect, loadingPersonId }) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [searchMode, setSearchMode] = React.useState<"phone" | "name">("name");
  const [phone, setPhone] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [people, setPeople] = React.useState<PersonInterface[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchFailed, setSearchFailed] = React.useState(false);

  const keyHeight = windowHeight < 1000 ? 56 : 72;
  const canSearch = searchMode === "phone" ? phone.length >= 4 : lastName.trim().length >= 2;

  const resetSearch = () => {
    setHasSearched(false);
    setSearchFailed(false);
    setPeople([]);
  };

  const switchMode = (mode: "phone" | "name") => {
    resetSearch();
    setSearchMode(mode);
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
      .then(data => setPeople(Array.isArray(data) ? data : []))
      .catch(() => setSearchFailed(true))
      .finally(() => setIsLoading(false));
  };

  const getResultsBody = () => {
    if (isLoading) return <SkeletonList rows={3} />;
    if (searchFailed) return <EmptyState icon="error-outline" tone="warning" title={t("lookup.searchError")} action={<Button label={t("common.retry")} onPress={resetSearch} fullWidth />} />;
    if (people.length === 0) {
      return (
        <EmptyState
          icon="search-off"
          title={t("lookup.noMatchTitle")}
          subtitle={searchMode === "phone" ? t("lookup.noMatchSubtitle") : t("lookup.noMatchSubtitleName")}
          action={<Button label={t("common.retry")} onPress={resetSearch} fullWidth />}
        />
      );
    }
    return (
      <FlatList
        data={people}
        keyExtractor={(item: PersonInterface) => item.id?.toString() || "0"}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ListRow
            size="lg"
            title={item?.name?.display || ""}
            left={<Avatar name={item?.name?.display || ""} photoUri={item.photo ? EnvironmentHelper.ContentRoot + item.photo : undefined} size={56} />}
            right={loadingPersonId === item.id ? "spinner" : "chevron"}
            onPress={() => { if (!loadingPersonId) onSelect(item); }}
            style={{ marginBottom: theme.spacing.md }}
          />
        )}
      />
    );
  };

  if (hasSearched) {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: theme.spacing.lg, marginBottom: theme.spacing.md }}>
          <Text style={{ ...theme.type.overline, color: theme.colors.textMuted }}>
            {isLoading ? t("lookup.searching") : t("lookup.resultsFound", { count: people.length })}
          </Text>
          <Button label={t("checkout.newSearch")} variant="ghost" size="md" icon="search" onPress={resetSearch} />
        </View>
        {getResultsBody()}
      </View>
    );
  }

  if (searchMode === "name") {
    return (
      <View style={{ flex: 1 }}>
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
          containerStyle={{ marginTop: theme.spacing.lg }}
        />
        <Button label={t("common.search")} size="xl" fullWidth disabled={!canSearch} onPress={handleSearch} testID="checkout-name-search" style={{ marginTop: theme.spacing.lg }} />
        <Button label={t("lookup.usePhone")} variant="ghost" icon="dialpad" onPress={() => switchMode("phone")} style={{ marginTop: theme.spacing.md }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 64, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ ...theme.type.display, color: theme.colors.textPrimary, opacity: phone ? 1 : 0.25, letterSpacing: 6 }}>{phone || "____"}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <NumberPad
        keyHeight={keyHeight}
        onDigit={digit => { if (phone.length < 10) setPhone(phone + digit); }}
        onBackspace={() => setPhone(phone.slice(0, -1))}
        onClear={() => setPhone("")}
        bottomLeft={{ icon: "keyboard", label: t("lookup.searchByName"), onPress: () => switchMode("name") }}
      />
      <Button label={t("common.search")} size="xl" fullWidth disabled={!canSearch} onPress={handleSearch} style={{ marginTop: theme.spacing.lg }} />
    </View>
  );
};

export default HouseholdSearch;

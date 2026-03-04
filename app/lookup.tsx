import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { TextInput, View, Text, Image, ImageBackground, FlatList, ActivityIndicator, Keyboard, Dimensions, PixelRatio, StyleSheet } from "react-native";
import Ripple from "react-native-material-ripple";
import { useTranslation } from "react-i18next";
import { RouteProp } from "@react-navigation/native";
import { ScreenList } from "../src/screenList";
import { EnvironmentHelper, screenNavigationProps, CachedData, StyleConstants } from "../src/helpers";
import { ApiHelper, ArrayHelper, DimensionHelper, FirebaseHelper, PersonInterface, Utils } from "../src/helpers";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import QRCode from "react-native-qrcode-svg";
import { useCheckinTheme } from "../src/context/CheckinThemeContext";
import { useInactivityTimer } from "../src/hooks/useInactivityTimer";
import IdleScreen from "../src/components/IdleScreen";

type ProfileScreenRouteProp = RouteProp<ScreenList, "Lookup">;
interface Props { navigation: screenNavigationProps; route: ProfileScreenRouteProp; }

const Lookup = (props: Props) => {
  // const Lookup = () => {
  const { t } = useTranslation();
  const { theme } = useCheckinTheme();
  const { isIdle, resetTimer, dismiss } = useInactivityTimer(
    theme.idleScreen.timeoutSeconds,
    theme.idleScreen.enabled && (theme.idleScreen.slides || []).length > 0
  );
  const router = useRouter();
  const params = useLocalSearchParams();
  const [hasSearched, setHasSearched] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [people, setPeople] = React.useState([]);
  const [phone, setPhone] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [searchMode, setSearchMode] = React.useState<"phone" | "name">("phone");
  const [dimension, setDimension] = React.useState(Dimensions.get("window"));
  const [showQR, setShowQR] = React.useState(false);
  const [qrExpanded, setQrExpanded] = React.useState(false);

  const loadHouseholdMembers = async () => {
    CachedData.householdMembers = await ApiHelper.get("/people/household/" + CachedData.householdId, "MembershipApi");
    loadExistingVisits();
  };

  const loadExistingVisits = async () => {
    CachedData.existingVisits = [];
    const peopleIds: number[] = ArrayHelper.getUniqueValues(CachedData.householdMembers, "id");
    const url = "/visits/checkin?serviceId=" + CachedData.serviceId + "&peopleIds=" + escape(peopleIds.join(",")) + "&include=visitSessions";
    CachedData.existingVisits = await ApiHelper.get(url, "AttendanceApi");
    CachedData.pendingVisits = [...CachedData.existingVisits];
    setIsLoading(false);
    router.navigate("/household");
  };

  const selectPerson = (person: PersonInterface) => {
    setIsLoading(true);
    CachedData.householdId = person.householdId || "";
    loadHouseholdMembers();
  };

  const handleModeChange = (mode: "phone" | "name") => {
    if (mode === searchMode) return;
    setSearchMode(mode);
    setHasSearched(false);
    setPeople([]);
  };

  const handleSearch = () => {
    if (searchMode === "phone") {
      const nonNumericPattern = /[^\d]/;
      if (nonNumericPattern.test(phone)) {
        Utils.snackBar(t("lookup.invalidNumbers"));
        return;
      }

      const cleanedPhone = phone.replace(/\D/g, "");
      if (cleanedPhone === "") {
        Utils.snackBar(t("lookup.enterPhone"));
        return;
      }

      if (cleanedPhone.length < 4) {
        Utils.snackBar(t("lookup.minDigits"));
        return;
      }

      Keyboard.dismiss();
      setHasSearched(true);
      setIsLoading(true);
      const searchQuery = cleanedPhone.length > 4 ? cleanedPhone : cleanedPhone.slice(-4);
      ApiHelper.get("/people/search/phone?number=" + searchQuery, "MembershipApi")
        .then(data => {
          setPeople(data);
        })
        .catch(() => {
          Utils.snackBar(t("lookup.searchError"));
        })
        .finally(() => setIsLoading(false));
    } else {
      const trimmedLast = lastName.trim();
      if (trimmedLast.length < 2) {
        Utils.snackBar(t("lookup.minLetters"));
        return;
      }

      Keyboard.dismiss();
      setHasSearched(true);
      setIsLoading(true);
      const url = "/people/search?term=" + encodeURIComponent(trimmedLast);
      ApiHelper.get(url, "MembershipApi")
        .then(data => {
          setPeople(data);
        })
        .catch(() => {
          Utils.snackBar(t("lookup.searchError"));
        })
        .finally(() => setIsLoading(false));
    }
  };

  const getRow = (data: any) => {
    const person: PersonInterface = data.item;
    return (
      <Ripple style={[lookupStyles.personCard, { width: wd("90%"), shadowColor: theme.colors.primary }]} onPress={() => { selectPerson(person); }}>
        <Image
          source={{ uri: EnvironmentHelper.ContentRoot + person.photo }}
          style={lookupStyles.personPhoto}
        />
        <View style={lookupStyles.personInfo}>
          <Text style={lookupStyles.personName}>{person?.name?.display}</Text>
        </View>
        <View style={lookupStyles.arrowContainer}>
          <Text style={[lookupStyles.arrow, { color: theme.colors.primary }]}>›</Text>
        </View>
      </Ripple>
    );
  };

  const getResults = () => {
    if (!hasSearched) {
      return (
        <View style={lookupStyles.emptyState}>
          <Text style={lookupStyles.emptyStateIcon}>🔍</Text>
          <Text style={lookupStyles.emptyStateTitle}>{t("lookup.readyTitle")}</Text>
          <Text style={lookupStyles.emptyStateSubtitle}>{t("lookup.readySubtitle")}</Text>
        </View>
      );
    } else if (isLoading) {
      return (
        <View style={lookupStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} animating={isLoading} />
          <Text style={lookupStyles.loadingText}>{t("lookup.searching")}</Text>
        </View>
      );
    } else {
      if (people.length === 0) {
        return (
          <View style={lookupStyles.noResultsState}>
            <Text style={lookupStyles.noResultsIcon}>😔</Text>
            <Text style={lookupStyles.noResultsTitle}>{t("lookup.noMatchTitle")}</Text>
            <Text style={lookupStyles.noResultsSubtitle}>
              {searchMode === "phone"
                ? t("lookup.noMatchSubtitle")
                : t("lookup.noMatchSubtitleName")}
            </Text>
          </View>
        );
      }
      return (
        <View style={lookupStyles.resultsContainer}>
          <FlatList
            data={people}
            renderItem={getRow}
            keyExtractor={(item: PersonInterface) => item.id?.toString() || "0"}
            contentContainerStyle={lookupStyles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    }
  };

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Lookup");
    Dimensions.addEventListener("change", () => {
      const dim = Dimensions.get("screen");
      setDimension(dim);
    });
    if (CachedData.userChurch?.church?.id) {
      ApiHelper.getAnonymous("/settings/public/" + CachedData.userChurch.church.id, "MembershipApi")
        .then((settings: any) => { setShowQR(settings?.enableQRGuestRegistration === "true"); })
        .catch(() => { setShowQR(false); });
    }
  }, []);

  const wd = (number: string) => {
    const givenWidth = typeof number === "number" ? number : parseFloat(number);
    return PixelRatio.roundToNearestPixel((dimension.width * givenWidth) / 100);
  };

  const screenContent = (
    <>
      <Header
        navigation={props.navigation}
        prominentLogo={true}
      />

      {/* Search Section */}
      <Subheader
        icon="🔍"
        title={t("lookup.title")}
        subtitle={t("lookup.subtitle")}
      />

      {/* Main Content */}
      <View style={lookupStyles.mainContent}>
        {/* Search Input */}
        <View style={lookupStyles.searchSection}>
          <View style={[lookupStyles.modeToggleContainer, { shadowColor: theme.colors.primary }]}>
            <Ripple
              style={[lookupStyles.modeButton, searchMode === "phone" && [lookupStyles.modeButtonActive, { backgroundColor: theme.colors.buttonBackground }]]}
              onPress={() => handleModeChange("phone")}
            >
              <Text style={[lookupStyles.modeButtonText, { color: theme.colors.primary }, searchMode === "phone" && lookupStyles.modeButtonTextActive]}>{t("lookup.modePhone")}</Text>
            </Ripple>
            <Ripple
              style={[lookupStyles.modeButton, searchMode === "name" && [lookupStyles.modeButtonActive, { backgroundColor: theme.colors.buttonBackground }]]}
              onPress={() => handleModeChange("name")}
            >
              <Text style={[lookupStyles.modeButtonText, { color: theme.colors.primary }, searchMode === "name" && lookupStyles.modeButtonTextActive]}>{t("lookup.modeName")}</Text>
            </Ripple>
          </View>
          {searchMode === "phone" ? (
            <View style={[lookupStyles.searchView, { width: wd("90%"), shadowColor: theme.colors.primary }]}>
              <TextInput
                placeholder={String(t("lookup.phonePlaceholder"))}
                onChangeText={(value) => { setPhone(value); }}
                value={phone}
                keyboardType="numeric"
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                style={lookupStyles.searchTextInput}
                placeholderTextColor={StyleConstants.lightGray}
                numberOfLines={1}
                editable={true}
              />
              <Ripple style={[lookupStyles.searchButton, { backgroundColor: theme.colors.buttonBackground }]} onPress={handleSearch}>
                <Text style={lookupStyles.searchButtonText}>{t("common.search")}</Text>
              </Ripple>
            </View>
          ) : (
            <View style={[lookupStyles.searchView, { width: wd("90%"), shadowColor: theme.colors.primary }]}>
              <TextInput
                placeholder={String(t("lookup.namePlaceholder"))}
                onChangeText={(value) => { setLastName(value); }}
                value={lastName}
                autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                style={[lookupStyles.searchTextInput, lookupStyles.nameTextInput]}
                placeholderTextColor={StyleConstants.lightGray}
                editable={true}
              />
              <Ripple style={[lookupStyles.searchButton, lookupStyles.nameSearchButton, { backgroundColor: theme.colors.buttonBackground }]} onPress={handleSearch}>
                <Text style={lookupStyles.searchButtonText}>{t("common.search")}</Text>
              </Ripple>
            </View>
          )}
        </View>

        {/* QR Guest Registration */}
        {showQR && CachedData.userChurch?.church?.subDomain && (
          <View style={lookupStyles.qrSection}>
            {qrExpanded ? (
              <View style={lookupStyles.qrContainer}>
                <QRCode
                  value={`https://${CachedData.userChurch.church.subDomain}.b1.church/guest-register?serviceId=${CachedData.serviceId}`}
                  size={DimensionHelper.wp("20%")}
                  backgroundColor={StyleConstants.whiteColor}
                  color={theme.colors.primary}
                />
                <Text style={[lookupStyles.qrLabel, { color: theme.colors.primary }]}>{t("lookup.qrGuest")}</Text>
              </View>
            ) : (
              <Ripple onPress={() => setQrExpanded(true)}>
                <Text style={[lookupStyles.guestLink, { color: theme.colors.primary }]}>{t("lookup.registerGuest")}</Text>
              </Ripple>
            )}
          </View>
        )}

        {/* Results Section */}
        <View style={lookupStyles.resultsSection}>
          {getResults()}
        </View>
      </View>
    </>
  );

  if (theme.backgroundImage) {
    return (
      <ImageBackground
        source={{ uri: theme.backgroundImage }}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={[lookupStyles.container, { backgroundColor: "rgba(246,246,248,0.85)" }]} onTouchStart={resetTimer}>
          {screenContent}
          <IdleScreen visible={isIdle} onDismiss={dismiss} />
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={lookupStyles.container} onTouchStart={resetTimer}>
      {screenContent}
      <IdleScreen visible={isIdle} onDismiss={dismiss} />
    </View>
  );
};

const lookupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StyleConstants.ghostWhite
  },

  mainContent: {
    flex: 1,
    paddingHorizontal: DimensionHelper.wp("4%")
  },

  searchSection: { marginBottom: DimensionHelper.wp("3%") },

  modeToggleContainer: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 999,
    padding: DimensionHelper.wp("0.6%"),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    shadowColor: StyleConstants.baseColor,
    width: DimensionHelper.wp("46%")
  },

  modeButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: DimensionHelper.wp("1.5%"),
    alignItems: "center",
    justifyContent: "center"
  },

  modeButtonActive: { backgroundColor: StyleConstants.baseColor },

  modeButtonText: {
    fontSize: DimensionHelper.wp("2.8%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.baseColor
  },

  modeButtonTextActive: { color: StyleConstants.whiteColor },

  searchView: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DimensionHelper.wp("3%"),
    paddingVertical: DimensionHelper.wp("1.2%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    shadowColor: StyleConstants.baseColor,
    alignSelf: "center",
    marginVertical: DimensionHelper.wp("2%")
  },

  searchTextInput: {
    flex: 1,
    fontSize: DimensionHelper.wp("3.2%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.darkColor,
    paddingVertical: DimensionHelper.wp("1.5%"),
    paddingHorizontal: DimensionHelper.wp("1.5%")
  },

  searchButton: {
    backgroundColor: StyleConstants.baseColor,
    paddingHorizontal: DimensionHelper.wp("4.5%"),
    paddingVertical: DimensionHelper.wp("2.2%"),
    borderRadius: 8,
    marginLeft: DimensionHelper.wp("2%")
  },

  searchButtonText: {
    color: StyleConstants.whiteColor,
    fontSize: DimensionHelper.wp("3%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "600"
  },

  nameSearchView: {
    flexDirection: "column",
    alignItems: "stretch"
  },

  nameTextInput: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 8
  },

  nameSearchButton: {
    alignSelf: "stretch",
    marginLeft: 0,
    marginTop: 0
  },

  resultsSection: { flex: 1 },

  resultsContainer: { flex: 1 },

  resultsList: { paddingBottom: DimensionHelper.wp("3%") },

  personCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 10,
    marginVertical: DimensionHelper.wp("1%"),
    padding: DimensionHelper.wp("3%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    shadowColor: StyleConstants.baseColor,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    minHeight: DimensionHelper.wp("14%")
  },

  personPhoto: {
    width: DimensionHelper.wp("9%"),
    height: DimensionHelper.wp("9%"),
    borderRadius: DimensionHelper.wp("4.5%"),
    marginRight: DimensionHelper.wp("3%")
  },

  personInfo: {
    flex: 1,
    justifyContent: "center"
  },

  personName: {
    fontSize: DimensionHelper.wp("3.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    lineHeight: DimensionHelper.wp("4.5%")
  },

  arrowContainer: {
    marginLeft: DimensionHelper.wp("2%"),
    justifyContent: "center",
    alignItems: "center"
  },

  arrow: {
    fontSize: DimensionHelper.wp("5%"),
    color: StyleConstants.baseColor,
    opacity: 0.7
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: DimensionHelper.wp("15%")
  },

  loadingText: {
    fontSize: DimensionHelper.wp("3.2%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.baseColor,
    marginTop: DimensionHelper.wp("3%"),
    textAlign: "center"
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: DimensionHelper.wp("12%")
  },

  emptyStateIcon: {
    fontSize: DimensionHelper.wp("10%"),
    marginBottom: DimensionHelper.wp("3%")
  },

  emptyStateTitle: {
    fontSize: DimensionHelper.wp("4%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    marginBottom: DimensionHelper.wp("1.5%"),
    textAlign: "center"
  },

  emptyStateSubtitle: {
    fontSize: DimensionHelper.wp("3%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.lightGray,
    textAlign: "center",
    lineHeight: DimensionHelper.wp("4%")
  },

  qrSection: {
    alignItems: "center",
    marginBottom: DimensionHelper.wp("2%")
  },

  qrContainer: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 10,
    padding: DimensionHelper.wp("2.5%"),
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    shadowColor: StyleConstants.baseColor
  },

  qrLabel: {
    fontSize: DimensionHelper.wp("2.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.baseColor,
    marginTop: DimensionHelper.wp("1.5%"),
    textAlign: "center"
  },

  guestLink: {
    fontSize: DimensionHelper.wp("2.8%"),
    fontFamily: StyleConstants.RobotoRegular,
    textDecorationLine: "underline" as const,
    opacity: 0.7,
    textAlign: "center" as const,
    paddingVertical: DimensionHelper.wp("0.8%")
  },

  noResultsState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: DimensionHelper.wp("10%")
  },

  noResultsIcon: {
    fontSize: DimensionHelper.wp("10%"),
    marginBottom: DimensionHelper.wp("3%")
  },

  noResultsTitle: {
    fontSize: DimensionHelper.wp("4%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    marginBottom: DimensionHelper.wp("1.5%"),
    textAlign: "center"
  },

  noResultsSubtitle: {
    fontSize: DimensionHelper.wp("3%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.lightGray,
    textAlign: "center",
    lineHeight: DimensionHelper.wp("4%"),
    paddingHorizontal: DimensionHelper.wp("8%")
  }
});

export default Lookup;

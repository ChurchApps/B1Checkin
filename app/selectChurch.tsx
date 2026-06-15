import * as React from "react";
import { FlatList, Image, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ApiHelper, CachedData, FirebaseHelper, LoginUserChurchInterface, Utils } from "../src/helpers";
import { useAppTheme } from "../src/theme";
import { Button, EmptyState, ListRow, Screen, TextField } from "../src/components/ui";

function SelectChurch() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const [userChurches, setUserChurches] = React.useState<LoginUserChurchInterface[]>([]);
  const [churchLogos, setChurchLogos] = React.useState<{ [key: string]: string }>({});
  const [filter, setFilter] = React.useState("");
  const [selectingId, setSelectingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Select Church");
    (async () => {
      const stored = await AsyncStorage.getItem("@UserChurches");
      let churches: LoginUserChurchInterface[] = [];
      try { churches = JSON.parse(stored || "[]"); } catch { churches = []; }
      setUserChurches(churches);

      churches.forEach(church => {
        const churchId = church.church?.id;
        if (!churchId) return;
        ApiHelper.getAnonymous("/settings/public/" + churchId, "MembershipApi")
          .then(appearance => {
            const logo = appearance?.logoLight || appearance?.logo;
            if (logo) setChurchLogos(prev => ({ ...prev, [churchId]: logo }));
          })
          .catch(() => {});
      });
    })();
  }, []);

  const select = async (userChurch: LoginUserChurchInterface) => {
    if (selectingId) return;
    setSelectingId(userChurch.church?.id || "");
    try {
      CachedData.userChurch = userChurch;
      userChurch.apis?.forEach(api => ApiHelper.setPermissions(api.keyName || "", api.jwt, api.permissions));
      await AsyncStorage.setItem("@SelectedChurchId", userChurch.church?.id?.toString() || "");
      CachedData.churchAppearance = await ApiHelper.getAnonymous("/settings/public/" + (userChurch.church?.id || ""), "MembershipApi");
      await AsyncStorage.setItem("@ChurchAppearance", JSON.stringify(CachedData.churchAppearance));
      router.replace("/services");
    } catch {
      setSelectingId(null);
      Utils.snackBar(t("services.loadError"), "error");
    }
  };

  const getChurchLogo = (userChurch: LoginUserChurchInterface) => {
    const churchId = userChurch.church?.id;
    const logoUrl = churchId ? churchLogos[churchId] : null;
    return (
      <View style={{ width: 56, height: 48, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {logoUrl
          ? <Animated.View entering={FadeIn.duration(250)}><Image source={{ uri: logoUrl }} style={{ width: 52, height: 42, resizeMode: "contain" }} /></Animated.View>
          : <MaterialIcons name="location-city" size={24} color={theme.colors.textMuted} />}
      </View>
    );
  };

  const filtered = filter.trim()
    ? userChurches.filter(c => (c.church?.name || "").toLowerCase().includes(filter.trim().toLowerCase()))
    : userChurches;

  const getRow = ({ item, index }: { item: LoginUserChurchInterface; index: number }) => (
    <Animated.View entering={FadeInDown.duration(200).delay(Math.min(index, 8) * 40)}>
      <ListRow
        title={item.church?.name || ""}
        left={getChurchLogo(item)}
        right={selectingId === item.church?.id ? "spinner" : "chevron"}
        onPress={() => select(item)}
        style={{ marginBottom: theme.spacing.sm }}
      />
    </Animated.View>
  );

  const logout = async () => {
    await AsyncStorage.multiRemove(["@Login", "@Email", "@Password", "@UserChurches"]);
    router.replace("/login");
  };

  return (
    <Screen>
      <View style={{ alignItems: "center", marginTop: theme.spacing.xxl, marginBottom: theme.spacing.xl }}>
        <Image source={require("../src/images/logo1.png")} style={{ width: 72, height: 72, resizeMode: "contain" }} />
        <Text style={{ fontSize: 24, fontFamily: theme.fonts.semibold, color: theme.colors.textPrimary, marginTop: theme.spacing.md }}>{t("selectChurch.title")}</Text>
      </View>
      {userChurches.length > 8 && (
        <TextField
          placeholder={String(t("common.search"))}
          value={filter}
          onChangeText={setFilter}
          leadingIcon="search"
          autoCapitalize="none"
          containerStyle={{ marginBottom: theme.spacing.lg }}
        />
      )}
      {userChurches.length === 0
        ? (
          <EmptyState
            icon="location-city"
            title={t("selectChurch.emptyTitle")}
            subtitle={t("selectChurch.emptySubtitle")}
            action={<Button label={t("common.logout")} variant="outline" onPress={logout} fullWidth />}
          />
        )
        : (
          <FlatList
            data={filtered}
            renderItem={getRow}
            keyExtractor={(item: any) => item.church?.id?.toString() || item.id?.toString() || ""}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
          />
        )}
    </Screen>
  );
}
export default SelectChurch;

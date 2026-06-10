import React from "react";
import { FlatList, View } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import { ApiHelper, ArrayHelper, CachedData, FirebaseHelper, GroupInterface, GroupServiceTimeInterface, screenNavigationProps } from "../src/helpers";
import { useCheckinTheme } from "../src/context/CheckinThemeContext";
import { useAppTheme } from "../src/theme";
import { Button, EmptyState, ListRow, Screen, SkeletonList } from "../src/components/ui";

interface Props { navigation: screenNavigationProps }

const Services = (props: Props) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { loadTheme } = useCheckinTheme();
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [services, setServices] = React.useState([]);
  const [selectingId, setSelectingId] = React.useState<string | null>(null);

  const loadData = () => {
    setIsLoading(true);
    setLoadFailed(false);
    ApiHelper.get("/services", "AttendanceApi")
      .then(data => {
        setServices(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error loading services:", error);
        setLoadFailed(true);
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Services");
    if (CachedData.userChurch?.church?.id) {
      loadTheme(CachedData.userChurch.church.id);
    }
  }, []);

  const selectService = (serviceId: string) => {
    if (selectingId) return;
    setSelectingId(serviceId);

    const promises: Promise<any>[] = [
      ApiHelper.get("/servicetimes?serviceId=" + serviceId, "AttendanceApi").then(times => {
        CachedData.serviceId = serviceId;
        CachedData.serviceTimes = times;
      }),
      ApiHelper.get("/groupservicetimes", "AttendanceApi").then(groupServiceTimes => { CachedData.groupServiceTimes = groupServiceTimes; }),
      ApiHelper.get("/groups", "MembershipApi").then(groups => { CachedData.groups = groups; })
    ];

    Promise.all(promises)
      .then(() => {
        //for simplicity, iterate the group service times and add groups to the services.
        if (CachedData.serviceTimes && Array.isArray(CachedData.serviceTimes)) {
          CachedData.serviceTimes.forEach(st => {
            if (st) {
              st.groups = [];
              ArrayHelper.getAll(CachedData.groupServiceTimes || [], "serviceTimeId", st.id).forEach((gst: GroupServiceTimeInterface) => {
                const g: GroupInterface = ArrayHelper.getOne(CachedData.groups || [], "id", gst.groupId);
                if (g) {
                  st.groups?.push(g);
                }
              });
            }
          });
        }
        router.navigate("/lookup");
        setSelectingId(null);
      })
      .catch(error => {
        console.error("Error loading service data:", error);
        setSelectingId(null);
        setLoadFailed(true);
      });
  };

  const getRow = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.duration(200).delay(Math.min(index, 8) * 40)}>
      <ListRow
        title={item.name}
        left={
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="event" size={22} color={theme.colors.primary} />
          </View>
        }
        right={selectingId === item.id ? "spinner" : "chevron"}
        onPress={() => selectService(item.id)}
        style={{ marginBottom: theme.spacing.md }}
      />
    </Animated.View>
  );

  const getResults = () => {
    if (isLoading) return <SkeletonList rows={4} rowHeight={64} />;
    if (loadFailed) {
      return (
        <EmptyState
          icon="cloud-off"
          tone="warning"
          title={t("services.loadError")}
          action={<Button label={t("common.retry")} onPress={loadData} fullWidth />}
        />
      );
    }
    if (services.length === 0) {
      return (
        <EmptyState
          icon="event-busy"
          title={t("services.emptyTitle")}
          subtitle={t("services.emptySubtitle")}
          action={<Button label={t("common.retry")} variant="outline" onPress={loadData} fullWidth />}
        />
      );
    }
    return (
      <FlatList
        data={services}
        renderItem={getRow}
        keyExtractor={(item: any) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
      />
    );
  };

  React.useEffect(loadData, []);

  return (
    <Screen header={<Header navigation={props.navigation} prominentLogo={true} />}>
      <Subheader compact title={t("services.title")} subtitle={t("services.subtitle")} />
      {getResults()}
    </Screen>
  );
};

export default Services;

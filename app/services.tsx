import React from "react";
import { Text, FlatList, ActivityIndicator, Dimensions, PixelRatio, View } from "react-native";
import Ripple from "react-native-material-ripple";
import { useTranslation } from "react-i18next";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import { screenNavigationProps, CachedData, StyleConstants } from "../src/helpers";
import { ApiHelper, ArrayHelper, DimensionHelper, FirebaseHelper, GroupInterface, GroupServiceTimeInterface } from "../src/helpers";
import { router } from "expo-router";
import { useCheckinTheme } from "../src/context/CheckinThemeContext";

interface Props { navigation: screenNavigationProps }

const Services = (props: Props) => {
  const { t } = useTranslation();
  const { theme, loadTheme } = useCheckinTheme();
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [services, setServices] = React.useState([]);
  const [dimension, setDimension] = React.useState(Dimensions.get("window"));

  const loadData = () => {
    setIsLoading(true);
    // AppCenterHelper.trackEvent("Services Screen");
    console.log("LOADING SERVICES");
    ApiHelper.get("/services", "AttendanceApi")
      .then(data => {
        console.log("Services Data: ", JSON.stringify(data));
        setServices(data); setIsLoading(false);
      })
      .catch(error => {
        console.error("Error loading services:", error);
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Services");
    Dimensions.addEventListener("change", () => {
      const dim = Dimensions.get("screen");
      setDimension(dim);
    });
    if (CachedData.userChurch?.church?.id) {
      loadTheme(CachedData.userChurch.church.id);
    }
  }, []);

  const wd = (number: string) => {
    const givenWidth = typeof number === "number" ? number : parseFloat(number);
    return PixelRatio.roundToNearestPixel((dimension.width * givenWidth) / 100);
  };

  const selectService = (serviceId: string) => {
    setIsLoading(true);

    const promises: Promise<any>[] = [ApiHelper.get("/servicetimes?serviceId=" + serviceId, "AttendanceApi").then(times => { CachedData.serviceId = serviceId; CachedData.serviceTimes = times; }), ApiHelper.get("/groupservicetimes", "AttendanceApi").then(groupServiceTimes => { CachedData.groupServiceTimes = groupServiceTimes; }), ApiHelper.get("/groups", "MembershipApi").then(groups => { CachedData.groups = groups; })];

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
        console.log(JSON.stringify(CachedData.serviceTimes));

        router.navigate("/lookup");
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error loading service data:", error);
        setIsLoading(false);
      });

  };

  const getRow = (data: any) => {
    const item = data.item;
    return (
      <Ripple style={[serviceStyles.serviceCard, { width: wd("90%"), shadowColor: theme.colors.primary }]} onPress={() => { selectService(item.id); }}>
        <View style={serviceStyles.serviceCardContent}>
          <Text style={serviceStyles.serviceName}>{item.name}</Text>
        </View>
        <View style={serviceStyles.arrowContainer}>
          <Text style={[serviceStyles.arrow, { color: theme.colors.primary }]}>›</Text>
        </View>
      </Ripple>
    );
  };

  const getResults = () => {
    if (isLoading) {
      return (
        <View style={serviceStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} animating={isLoading} />
          <Text style={[serviceStyles.loadingText, { color: theme.colors.primary }]}>{t("services.loading")}</Text>
        </View>
      );
    } else {
      return (
        <View style={serviceStyles.servicesContainer}>
          <FlatList
            data={services}
            renderItem={getRow}
            keyExtractor={(item: any) => item.id.toString()}
            contentContainerStyle={serviceStyles.servicesList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    }
  };

  React.useEffect(loadData, []);

  return (
    <View style={serviceStyles.container}>
      <Header
        navigation={props.navigation}
        prominentLogo={true}
      />

      {/* Select a Service Section */}
      <Subheader
        icon="📅"
        title={t("services.title")}
        subtitle={t("services.subtitle")}
      />

      {/* Main Content */}
      <View style={serviceStyles.mainContent}>
        {getResults()}
      </View>
    </View>
  );
};

const serviceStyles = {
  container: {
    flex: 1,
    backgroundColor: StyleConstants.ghostWhite
  },

  mainContent: {
    flex: 1,
    paddingHorizontal: DimensionHelper.wp("4%")
  },

  servicesContainer: { flex: 1 },

  servicesList: { paddingBottom: DimensionHelper.wp("3%") },

  serviceCard: {
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
    minHeight: DimensionHelper.wp("12%")
  },

  serviceCardContent: {
    flex: 1,
    justifyContent: "center"
  },

  campusName: {
    fontSize: DimensionHelper.wp("3%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.baseColor,
    marginBottom: DimensionHelper.wp("0.5%")
  },

  serviceName: {
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
  }
};

export default Services;

import React from "react";
import {
  Text, FlatList, ActivityIndicator, Dimensions, PixelRatio, View
} from "react-native";
import Ripple from "react-native-material-ripple";
import { useTranslation } from "react-i18next";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import { screenNavigationProps, CachedData, StyleConstants } from "../src/helpers";
import { ApiHelper, ArrayHelper, DimensionHelper, FirebaseHelper, GroupInterface, GroupServiceTimeInterface } from "../src/helpers";
import { router } from "expo-router";

interface Props { navigation: screenNavigationProps }

const Services = (props: Props) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [services, setServices] = React.useState([]);
  const [dimension, setDimension] = React.useState(Dimensions.get("window"));

  const loadData = () => {
    setIsLoading(true);
    // AppCenterHelper.trackEvent("Services Screen");
    console.log("LOADING SERVICES");
    ApiHelper.get("/services", "AttendanceApi").then(data => {
      console.log("Services Data: ", JSON.stringify(data));
      setServices(data); setIsLoading(false);
    });
  };

  React.useEffect(() => {
    FirebaseHelper.addOpenScreenEvent("Services");
    Dimensions.addEventListener("change", () => {
      const dim = Dimensions.get("screen");
      setDimension(dim);
    });
  }, []);

  const wd = (number: string) => {
    let givenWidth = typeof number === "number" ? number : parseFloat(number);
    return PixelRatio.roundToNearestPixel((dimension.width * givenWidth) / 100);
  };

  const selectService = (serviceId: string) => {
    setIsLoading(true);

    const promises: Promise<any>[] = [ApiHelper.get("/servicetimes?serviceId=" + serviceId, "AttendanceApi").then(times => { CachedData.serviceId = serviceId; CachedData.serviceTimes = times; }), ApiHelper.get("/groupservicetimes", "AttendanceApi").then(groupServiceTimes => { CachedData.groupServiceTimes = groupServiceTimes; }), ApiHelper.get("/groups", "MembershipApi").then(groups => { CachedData.groups = groups; })];

    Promise.all(promises).then(() => {
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
    });

  };

  const getRow = (data: any) => {
    const item = data.item;
    return (
      <Ripple style={[serviceStyles.serviceCard, { width: wd("90%") }]} onPress={() => { selectService(item.id); }}>
        <View style={serviceStyles.serviceCardContent}>
          <Text style={serviceStyles.serviceName}>{item.name}</Text>
        </View>
        <View style={serviceStyles.arrowContainer}>
          <Text style={serviceStyles.arrow}>›</Text>
        </View>
      </Ripple>
    );
  };

  const getResults = () => {
    if (isLoading) {
      return (
        <View style={serviceStyles.loadingContainer}>
          <ActivityIndicator size="large" color={StyleConstants.baseColor} animating={isLoading} />
          <Text style={serviceStyles.loadingText}>{t("services.loading")}</Text>
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

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: DimensionHelper.wp("5%")
  },

  servicesContainer: {
    flex: 1
  },

  servicesList: {
    paddingBottom: DimensionHelper.wp("5%")
  },

  // Service Cards (Professional Material Design)
  serviceCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    marginVertical: DimensionHelper.wp("1.5%"),
    padding: DimensionHelper.wp("4%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    shadowColor: StyleConstants.baseColor,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    minHeight: DimensionHelper.wp("16%")
  },

  serviceCardContent: {
    flex: 1,
    justifyContent: "center"
  },

  campusName: {
    fontSize: DimensionHelper.wp("3.8%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.baseColor,
    marginBottom: DimensionHelper.wp("1%")
  },

  serviceName: {
    fontSize: DimensionHelper.wp("4.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    lineHeight: DimensionHelper.wp("5.5%")
  },

  arrowContainer: {
    marginLeft: DimensionHelper.wp("3%"),
    justifyContent: "center",
    alignItems: "center"
  },

  arrow: {
    fontSize: DimensionHelper.wp("6%"),
    color: StyleConstants.baseColor,
    opacity: 0.7
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: DimensionHelper.wp("20%")
  },

  loadingText: {
    fontSize: DimensionHelper.wp("4%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.baseColor,
    marginTop: DimensionHelper.wp("4%"),
    textAlign: "center"
  }
};


export default Services;

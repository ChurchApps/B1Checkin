import React from "react";
import { Text, FlatList, ActivityIndicator, SafeAreaView, Dimensions, PixelRatio, ScrollView, View } from "react-native";
import Ripple from "react-native-material-ripple";
import Header from "./components/Header";
import { screenNavigationProps, CachedData, Styles, StyleConstants, Utilities } from "../src/helpers";
import { ApiHelper, AppCenterHelper, ArrayHelper, DimensionHelper, FirebaseHelper, GroupInterface, GroupServiceTimeInterface } from "@churchapps/mobilehelper";
import { router } from "expo-router";

interface Props { navigation: screenNavigationProps }

const Services = (props: Props) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [services, setServices] = React.useState([]);
  const [dimension, setDimension] = React.useState(Dimensions.get("window"));

  const loadData = () => {
    setIsLoading(true);
    // AppCenterHelper.trackEvent("Services Screen");
    ApiHelper.get("/services", "AttendanceApi").then(data => {
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

    const promises: Promise<any>[] = [
      ApiHelper.get("/servicetimes?serviceId=" + serviceId, "AttendanceApi").then(times => { CachedData.serviceId = serviceId; CachedData.serviceTimes = times; }),
      ApiHelper.get("/groupservicetimes", "AttendanceApi").then(groupServiceTimes => { CachedData.groupServiceTimes = groupServiceTimes; }),
      ApiHelper.get("/groups", "MembershipApi").then(groups => { CachedData.groups = groups; })
    ];

    Promise.all(promises).then(() => {
      //for simplicity, iterate the group service times and add groups to the services.
      CachedData.serviceTimes.forEach(st => {
        st.groups = [];
        ArrayHelper.getAll(CachedData.groupServiceTimes, "serviceTimeId", st.id).forEach((gst: GroupServiceTimeInterface) => {
          const g: GroupInterface = ArrayHelper.getOne(CachedData.groups, "id", gst.groupId);
          st.groups?.push(g);
        });
      });
      console.log(JSON.stringify(CachedData.serviceTimes));


      router.navigate('/lookup')
      setIsLoading(false);
    });

  };

  const getRow = (data: any) => {
    const item = data.item;
    return (
      <Ripple style={[Styles.bigLinkButton, { width: wd("90%") }]} onPress={() => { selectService(item.id); }}>
        <Text style={Styles.bigLinkButtonText}>{item?.campus?.name} - {item?.name}</Text>
      </Ripple>
    );
  };

  const getResults = () => {
    if (isLoading) { return (<ActivityIndicator size="large" color={StyleConstants.baseColor1} animating={isLoading} style={{ marginTop: "25%" }} />); }
    else { return (<FlatList data={services} renderItem={getRow} keyExtractor={(item: any) => item.id.toString()} />); }
  };

  React.useEffect(loadData, []);

  return (
    <View style={{ backgroundColor: StyleConstants.ghostWhite }}>
      <Header navigation={props.navigation} />
      <Text style={{ ...Styles.H1, marginLeft: DimensionHelper.wp("5%") }}>Select a service:</Text>
      {getResults()}
    </View>
  );
};


export default Services

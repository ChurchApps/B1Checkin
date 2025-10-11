import React from "react";
import { View, Text } from "react-native";
import { screenNavigationProps, CachedData, LabelHelper, Styles, StyleConstants } from "../src/helpers";
import { FontAwesome } from "@expo/vector-icons";
import { ApiHelper, AppCenterHelper, ArrayHelper, DimensionHelper, FirebaseHelper } from "@churchapps/mobilehelper";
import PrintUI from "./components/PrintUI";
import Header from "./components/Header";
import { router } from "expo-router";

interface Props { navigation: screenNavigationProps; }

const CheckinComplete = (props: Props) => {
  const [htmlLabels, setHtmlLabels] = React.useState<string[]>([]);

  const loadData = () => {
    FirebaseHelper.addOpenScreenEvent("CheckinCompleteScreen");
    const promises: Promise<any>[] = [];
    promises.push(checkin());
    if (CachedData.printer?.ipAddress) { print(); }
    //print();

    Promise.all(promises).then(() => {
      if (!CachedData.printer?.ipAddress) { startOver(); }
    });
  };

  const startOver = () => {
    CachedData.existingVisits = [];
    CachedData.pendingVisits = [];
    setHtmlLabels([]);
    redirectToLookup();
  };

  const redirectToLookup = () => {
    timeout(500).then(() => {
      router.replace('/lookup')
    });
  };

  const print = async () => LabelHelper.getAllLabels().then(async (labels) => {
    setHtmlLabels(labels);
    if (labels.length === 0) { startOver(); }
  });

  const timeout = (ms: number) => new Promise(resolve => setTimeout(() => { resolve(null); }, ms));

  const checkin = async () => {
    const peopleIds: number[] = ArrayHelper.getUniqueValues(CachedData.householdMembers, "id");
    const url = "/visits/checkin?serviceId=" + CachedData.serviceId + "&peopleIds=" + escape(peopleIds.join(","));
    return ApiHelper.post(url, CachedData.pendingVisits, "AttendanceApi").then(data => {
      console.log("Checkin Complete")
      //console.log(data)
      // AppCenterHelper.trackEvent("Checkin Complete");
      //router.navigate('/checkinComplete')
      // props.navigation.navigate("CheckinComplete");
    });
  };


  const getLabelView = () => {
    if (htmlLabels?.length > 0) { return (<PrintUI htmlLabels={htmlLabels} onPrintComplete={startOver} />); }
    else { return <></>; }
  };

  React.useEffect(loadData, []);  //eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ backgroundColor: StyleConstants.ghostWhite, flex:1 }}>
      <Header navigation={props.navigation} />
      <View style={[Styles.mainContainer, { justifyContent: "center" }]}>
        <FontAwesome name={"check-circle"} style={{ fontSize: DimensionHelper.wp("20%"), color: StyleConstants.greenColor, alignSelf: "center" }} size={DimensionHelper.wp("20%")} />
        <Text style={[Styles.H1, { alignSelf: "center" }]}>Checkin Complete.</Text>
        {getLabelView()}
      </View>
    </View>
  );

};


export default CheckinComplete
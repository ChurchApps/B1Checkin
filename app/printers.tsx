import React from "react";
import {
  View, Text, NativeModules, FlatList, PixelRatio, Dimensions, Alert, ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ripple from "react-native-material-ripple";
import { RouteProp } from "@react-navigation/native";
import { ScreenList } from "../src/screenList";
import { AvailablePrinter, CachedData, screenNavigationProps, StyleConstants } from "../src/helpers";
// import CodePush from "react-native-code-push";
import { DimensionHelper, FirebaseHelper } from "../src/helpers";
import Header from "../src/components/Header";
import Subheader from "../src/components/Subheader";
import { FontAwesome } from "@expo/vector-icons";
import PrintUI from "../src/components/PrintUI";
import RNRestart from "react-native-restart";

type ProfileScreenRouteProp = RouteProp<ScreenList, "Household">;
interface Props { navigation: screenNavigationProps; route: ProfileScreenRouteProp; }

const Printers = (props: Props) => {
  const [printers, setPrinters] = React.useState<AvailablePrinter[]>([{ model: "No Printer", ipAddress: "No Printer" }]);
  const [selectedPrinter, setSelectedPrinter] = React.useState<AvailablePrinter>({ model: "No Printer", ipAddress: "No Printer" });
  const [dimension, _setDimension] = React.useState(Dimensions.get("window"));
  const [htmlLabels, setHtmlLabels] = React.useState<string[]>([]);
  const [isScanning, setIsScanning] = React.useState<boolean>(true);

  const init = async () => {
    FirebaseHelper.addOpenScreenEvent("Printers");
    console.log("Scanning");
    setIsScanning(true);

    // Load saved printer selection if available
    try {
      if (CachedData.printer && CachedData.printer.model !== "none") {
        setSelectedPrinter(CachedData.printer);
        console.log("Loaded saved printer selection from CachedData:", CachedData.printer);
      } else {
        // Fallback: try to load directly from AsyncStorage
        const savedPrinter = await AsyncStorage.getItem("@Printer");
        if (savedPrinter) {
          const printer = JSON.parse(savedPrinter);
          if (printer && printer.model !== "none") {
            setSelectedPrinter(printer);
            CachedData.printer = printer; // Update CachedData too
            console.log("Loaded saved printer selection from AsyncStorage:", printer);
          }
        }
      }
    } catch (error) {
      console.error("Error loading saved printer:", error);
    }

    if (NativeModules.PrinterHelper) {
      NativeModules.PrinterHelper.scan().then((data: string) => {
        console.log("Scan callback", data);
        const items = data.split(",");
        let result: AvailablePrinter[] = [];
        items.forEach(item => {
          if (item.length > 0) {
            const splitItem = item.split("~");
            result.push({ ipAddress: splitItem[1], model: splitItem[0] });
          }
        });
        result.push({ model: "No Printer", ipAddress: "No Printer" });
        setPrinters(result);
        setIsScanning(false);
      });
    } else {
      setIsScanning(false);
    }
    return null;

  };

  const saveSelectedPrinter = async () => {
    let printer = selectedPrinter;
    if (printer.model === "No Printer") { printer = { model: "none", ipAddress: "" }; }

    CachedData.printer = printer;
    await AsyncStorage.setItem("@Printer", JSON.stringify(CachedData.printer));
    console.log(JSON.stringify(CachedData.printer));

    //NativeModules.PrinterHelper.bind(receiveNativeStatus);
    if (NativeModules.PrinterHelper) {
      NativeModules.PrinterHelper.checkInit(CachedData.printer?.ipAddress || "", CachedData.printer?.model || "");
    }

  };

  React.useEffect(() => { init(); }, []);

  const _wd = (number: string) => {
    let givenWidth = typeof number === "number" ? number : parseFloat(number);
    return PixelRatio.roundToNearestPixel((dimension.width * givenWidth) / 100);
  };

  const getPrinterRow = (data: any) => {
    const printer: AvailablePrinter = data.item;
    const isSelected = printer.ipAddress === selectedPrinter.ipAddress;
    const isNoPrinter = printer.model === "No Printer";

    return (
      <Ripple
        style={[printerStyles.printerCard, isSelected && printerStyles.selectedCard]}
        onPress={() => { setSelectedPrinter(printer); }}
      >
        <View style={printerStyles.printerIconContainer}>
          <FontAwesome
            name={isNoPrinter ? "times-circle" : "print"}
            size={DimensionHelper.wp("5%")}
            color={isSelected ? StyleConstants.whiteColor : StyleConstants.baseColor}
          />
        </View>
        <View style={printerStyles.printerInfo}>
          <Text style={[printerStyles.printerName, isSelected && printerStyles.selectedText]} numberOfLines={1}>
            {isNoPrinter ? "No Printer" : printer.model}
          </Text>
          {!isNoPrinter && (
            <Text style={[printerStyles.printerIp, isSelected && printerStyles.selectedSubtext]} numberOfLines={1}>
              {printer.ipAddress}
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={printerStyles.checkmarkContainer}>
            <FontAwesome
              name="check-circle"
              size={DimensionHelper.wp("5%")}
              color={StyleConstants.whiteColor}
            />
          </View>
        )}
      </Ripple>
    );
  };

  const testPrint = () => {
    if (selectedPrinter.model === "No Printer") { Alert.alert("No printer selected"); } else {
      saveSelectedPrinter();
      setHtmlLabels(["<b>Hello World</b>"]);
    }
  };

  const getLabelView = () => {
    if (htmlLabels?.length > 0) {
      return (<PrintUI htmlLabels={htmlLabels} onPrintComplete={() => { setHtmlLabels([]); }} />);
    }
    return null;
  };

  const getContent = () => {
    if (isScanning) {
      return (
        <View style={printerStyles.loadingContainer}>
          <ActivityIndicator size="large" color={StyleConstants.baseColor} />
          <Text style={printerStyles.loadingText}>Scanning for printers...</Text>
        </View>
      );
    }

    return (
      <>
        <FlatList
          data={printers as any[]}
          renderItem={getPrinterRow}
          keyExtractor={(printer: AvailablePrinter) => printer.ipAddress}
          contentContainerStyle={printerStyles.listContent}
          showsVerticalScrollIndicator={false}
        />
        {getLabelView()}
      </>
    );
  };

  return (
    <View style={printerStyles.container}>
      <Header
        navigation={props.navigation}
        prominentLogo={true}
      />

      {/* Select Printer Section */}
      <Subheader
        icon="🖨️"
        title="Select a Printer"
        subtitle="Choose a printer for printing name tags and labels"
      />

      {/* Main Content */}
      <View style={printerStyles.mainContent}>
        {getContent()}
      </View>

      {/* Action Buttons */}
      <View style={printerStyles.buttonContainer}>
        <Ripple
          style={[printerStyles.actionButton, printerStyles.testButton]}
          onPress={testPrint}
        >
          <FontAwesome
            name="print"
            size={DimensionHelper.wp("4%")}
            color={StyleConstants.baseColor}
            style={printerStyles.buttonIcon}
          />
          <Text style={printerStyles.testButtonText}>Test Print</Text>
        </Ripple>
        <Ripple
          style={[printerStyles.actionButton, printerStyles.doneButton]}
          onPress={() => {
            saveSelectedPrinter();
            RNRestart.Restart();
          }}
        >
          <FontAwesome
            name="check"
            size={DimensionHelper.wp("4%")}
            color={StyleConstants.whiteColor}
            style={printerStyles.buttonIcon}
          />
          <Text style={printerStyles.doneButtonText}>Save & Restart</Text>
        </Ripple>
      </View>
    </View>
  );
};

const printerStyles = {
  container: {
    flex: 1,
    backgroundColor: StyleConstants.ghostWhite
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: DimensionHelper.wp("5%")
  },

  listContent: {
    paddingTop: DimensionHelper.wp("2%"),
    paddingBottom: DimensionHelper.wp("5%")
  },

  // Printer Cards (Professional Material Design)
  printerCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    marginVertical: DimensionHelper.wp("1.5%"),
    padding: DimensionHelper.wp("4%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    shadowColor: StyleConstants.baseColor,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent"
  },

  selectedCard: {
    backgroundColor: StyleConstants.baseColor,
    borderColor: StyleConstants.baseColor,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6
  },

  printerIconContainer: {
    width: DimensionHelper.wp("10%"),
    height: DimensionHelper.wp("10%"),
    borderRadius: DimensionHelper.wp("5%"),
    backgroundColor: StyleConstants.baseColor + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: DimensionHelper.wp("3%")
  },

  printerInfo: {
    flex: 1,
    justifyContent: "center"
  },

  printerName: {
    fontSize: DimensionHelper.wp("4.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "600",
    color: StyleConstants.darkColor,
    marginBottom: DimensionHelper.wp("0.5%")
  },

  printerIp: {
    fontSize: DimensionHelper.wp("3.5%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.darkColor,
    opacity: 0.7
  },

  selectedText: {
    color: StyleConstants.whiteColor
  },

  selectedSubtext: {
    color: StyleConstants.whiteColor,
    opacity: 0.9
  },

  checkmarkContainer: {
    marginLeft: DimensionHelper.wp("2%")
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
  },

  // Action Buttons
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingVertical: DimensionHelper.wp("3%"),
    backgroundColor: StyleConstants.whiteColor,
    borderTopWidth: 1,
    borderTopColor: StyleConstants.baseColor + "20",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3
  },

  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DimensionHelper.wp("3.5%"),
    borderRadius: 8,
    marginHorizontal: DimensionHelper.wp("1.5%")
  },

  testButton: {
    backgroundColor: StyleConstants.whiteColor,
    borderWidth: 2,
    borderColor: StyleConstants.baseColor
  },

  doneButton: {
    backgroundColor: StyleConstants.baseColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },

  buttonIcon: {
    marginRight: DimensionHelper.wp("2%")
  },

  testButtonText: {
    fontSize: DimensionHelper.wp("4.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "600",
    color: StyleConstants.baseColor
  },

  doneButtonText: {
    fontSize: DimensionHelper.wp("4.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "600",
    color: StyleConstants.whiteColor
  }
};

export default Printers;


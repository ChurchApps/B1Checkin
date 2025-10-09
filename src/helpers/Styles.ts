import { DimensionHelper } from "./DimensionHelper";
import { StyleSheet, Dimensions } from "react-native";
// import PrivacyPolicy from "../screens/PrivacyPolicy";

export class StyleConstants {
  static deviceWidth = Dimensions.get("window").width;
  static deviceHeight = Dimensions.get("window").height;

  static fontSize = StyleConstants.deviceWidth * 4 / 100;
  static fontSize1 = StyleConstants.deviceWidth * 4.5 / 100;
  static fontSize2 = StyleConstants.deviceWidth * 5 / 100;
  static smallFont = StyleConstants.deviceWidth * 3.6 / 100;
  static smallerFont = StyleConstants.deviceWidth * 3.0 / 100;

  //Colors
  static baseColor = "#1565C0";  // ChumsApp primary blue
  static baseColor1 = "#568BDA"; // ChumsApp light blue (header color)
  static blueColor = "#2196F3";
  static darkColor = "#3c3c3c";
  static blackColor = "black";
  static grayColor = "gray";
  static lightGrayColor = "lightgray";
  static lightGray = "#9E9E9E";
  static whiteColor = "white";
  static yellowColor = "#FEAA24";
  static greenColor = "#70DC87";
  static redColor = "#B0120C";
  static cyanColor = "#1C9BA0";
  static darkPink = "	#FF69B4";
  static ghostWhite = "#F6F6F8";
  static loginBackground = "#EEE"; // ChumsApp login background

  //Font
  static RobotoBold = "Roboto-Bold";
  static RobotoBlack = "Roboto-Black";
  static RobotoItalic = "Roboto-Italic";
  static RobotoLight = "Roboto-Light";
  static RobotoMedium = "Roboto-Medium";
  static RobotoRegular = "Roboto-Regular";
  static RobotoThin = "Roboto-Thin";
}

export const Styles = StyleSheet.create({
  //Global styles
  mainContainer: { paddingHorizontal: "5%", backgroundColor: StyleConstants.ghostWhite, flex: 1, },
  fullWidthContainer: { backgroundColor: StyleConstants.ghostWhite, flex: 1, },
  H1: { fontSize: StyleConstants.fontSize2, alignSelf: "flex-start", marginVertical: "4%", fontFamily: StyleConstants.RobotoLight },
  H2: { fontSize: StyleConstants.fontSize, alignSelf: "flex-start", marginVertical: "4%", fontFamily: StyleConstants.RobotoLight },
  headerImageView: { height: StyleConstants.deviceHeight * 24 / 100, width: "100%", backgroundColor: StyleConstants.whiteColor },
  headerImage: { maxWidth: StyleConstants.deviceWidth * 70 / 100, height: StyleConstants.deviceHeight * 20 / 100, alignSelf: "center" },
  printerStatus: { backgroundColor: StyleConstants.baseColor, height: 30, justifyContent: "center", flexDirection: "row" },
  content: { backgroundColor: StyleConstants.ghostWhite, paddingBottom: "5%", flex: 1, },
  label: { fontSize: StyleConstants.fontSize, alignSelf: "flex-start", marginVertical: "4%", fontFamily: StyleConstants.RobotoLight },
  textInput: { backgroundColor: StyleConstants.whiteColor, paddingHorizontal: "3%", fontSize: StyleConstants.smallFont, },
  textInputView: {
    height: DimensionHelper.wp("12%"), flexDirection: "row", alignItems: "center", marginTop: DimensionHelper.wp("5.5%"), marginHorizontal: DimensionHelper.wp("5%"), backgroundColor: "white", borderRadius: DimensionHelper.wp("2%"), shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: DimensionHelper.wp("1.5%"), elevation: 5, alignSelf:"center"
  },
  textInputStyle: { height: DimensionHelper.wp("10%"), width: DimensionHelper.wp("80%"), alignItems: "center", justifyContent: "center", fontSize: DimensionHelper.wp("3.8%"), color: "gray" },
  flatlistDropIcon: { fontSize: DimensionHelper.wp("6%"), color: StyleConstants.grayColor, marginLeft: DimensionHelper.wp("3%") },
  inputIcon: { width: DimensionHelper.wp("4.5%"), height: DimensionHelper.wp("4.5%"), margin: DimensionHelper.wp("3%") },
  privacyIcon: { width: DimensionHelper.wp("4.5%"), height: DimensionHelper.wp("4.5%"), marginRight:DimensionHelper.wp("2%") },
  privacyPolicyView:{ flexDirection:"row", alignItems: "center" },
  //Buttons
  button: { backgroundColor: StyleConstants.baseColor, marginVertical: "8%", height: 50, justifyContent: "center", flexDirection: "row", },
  buttonText: { alignSelf: "center", color: StyleConstants.whiteColor, fontSize: StyleConstants.smallerFont },
  bigButton: { height: DimensionHelper.wp("12%"), borderRadius: DimensionHelper.wp("2%"), justifyContent: "center", alignItems: "center", alignSelf: "center", backgroundColor: StyleConstants.baseColor, marginTop: DimensionHelper.wp("8%") },
  bigButtonText: { alignSelf: "center", color: StyleConstants.whiteColor, fontSize: StyleConstants.smallFont, fontFamily: StyleConstants.RobotoMedium },
  bigLinkButton: {
    width: DimensionHelper.wp("90%"), height: DimensionHelper.wp("15%"), justifyContent: "center", backgroundColor: "white", alignSelf: "center", alignItems: "center", marginVertical: DimensionHelper.wp("2%"), borderRadius: DimensionHelper.wp("2%"), shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: DimensionHelper.wp("1.5%"), elevation: 5, shadowColor: StyleConstants.blueColor, flexDirection: "row"
  },
  bigLinkButtonText: { fontSize: DimensionHelper.wp("4.5%"), fontFamily: StyleConstants.RobotoMedium, color: StyleConstants.baseColor1 },
  blockButtons: { height: StyleConstants.deviceWidth * 0.13, width: "100%", flexDirection: "row" },
  blockButton: { backgroundColor: StyleConstants.baseColor1, justifyContent: "center", flex: 1, alignContent: "center", flexDirection: "row" },
  blockButtonText: { color: StyleConstants.whiteColor, fontSize: StyleConstants.smallFont, marginTop: (StyleConstants.deviceWidth * 0.13 - StyleConstants.smallFont) * 0.5 },


  //Splash
  splashMaincontainer: { alignItems: "center", justifyContent: "center", flex: 1, paddingTop:DimensionHelper.hp("45%") },

  //Lookup
  searchView: {
    width: DimensionHelper.wp("90%"), height: DimensionHelper.wp("15%"), alignSelf: "center", flexDirection: "row", marginVertical: DimensionHelper.wp("2%"), shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: DimensionHelper.wp("1.5%")
  },
  searchTextInput: { backgroundColor: StyleConstants.whiteColor, flex: 1, paddingHorizontal: "3%", fontSize: StyleConstants.smallFont, borderTopLeftRadius: DimensionHelper.wp("2%"), borderBottomLeftRadius: DimensionHelper.wp("2%"), elevation: 5 },
  searchButton: {
    backgroundColor: StyleConstants.baseColor, flex: 0.3, justifyContent: "center", alignItems: "center", paddingHorizontal: "5%", borderTopRightRadius: DimensionHelper.wp("2%"), borderBottomRightRadius: DimensionHelper.wp("2%"), elevation: 5
  },
  searchButtonText: { color: StyleConstants.whiteColor, fontSize: StyleConstants.fontSize, fontFamily: StyleConstants.RobotoMedium },
  flatlistMainView: {
    width: DimensionHelper.wp("90%"), backgroundColor: "white", alignSelf: "center", justifyContent: "flex-start", alignItems: "center", marginVertical: DimensionHelper.wp("2%"), borderRadius: DimensionHelper.wp("2%"), shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: DimensionHelper.wp("1.5%"), elevation: 5, flexDirection: "row"
  },
  personPhoto: { width: DimensionHelper.wp("16%"), height: DimensionHelper.wp("16%"), marginHorizontal: DimensionHelper.wp("3%"), marginVertical: DimensionHelper.wp("2%"), borderRadius: DimensionHelper.wp("1.5%") },
  personName: { width: DimensionHelper.wp("60%"), color: StyleConstants.baseColor1, fontSize: StyleConstants.fontSize1, fontFamily: StyleConstants.RobotoMedium },

  //Household
  serviceTimeButton: { width: DimensionHelper.wp("55%"), height: DimensionHelper.wp("16%"), marginHorizontal: DimensionHelper.wp("2%"), alignItems: "center", justifyContent: "center", borderRadius: DimensionHelper.wp("2%") },
  serviceTimeButtonText: { color: StyleConstants.whiteColor, fontSize: StyleConstants.smallerFont },
  serviceTimeText: { fontSize: StyleConstants.smallFont, color: StyleConstants.blueColor },
  expandedRow: {
    width: DimensionHelper.wp("90%"), flexDirection: "row", alignSelf: "center", justifyContent: "space-between", alignItems: "center", marginTop: DimensionHelper.wp("2%"), paddingBottom: DimensionHelper.wp("2%"), borderBottomWidth: 1, borderBottomColor: StyleConstants.lightGrayColor
  },
  serviceTimeView: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  timeIcon: { fontSize: DimensionHelper.wp("5%"), color: StyleConstants.blueColor, marginHorizontal: DimensionHelper.wp("1%") },
  groupName: { width: DimensionHelper.wp("60%"), textAlign: "left", fontSize: DimensionHelper.wp("3.4%"), color: StyleConstants.greenColor, marginVertical: DimensionHelper.wp("0.5%") },

  //Checkin Complete
  viewShot: { width: StyleConstants.deviceWidth * 0.9, height: StyleConstants.deviceWidth * 0.9 / 3.5 * 1.1 },
  webView: { width: StyleConstants.deviceWidth * 0.9, height: StyleConstants.deviceWidth * 0.9 / 3.5 * 1.1 },
  printImage: { width: StyleConstants.deviceWidth * 0.9, height: StyleConstants.deviceWidth * 0.9 / 3.5 * 1.1, },
  backIcon: { marginVertical: "5%", marginLeft: "3%" },
  modelView: { flex: 1, backgroundColor: StyleConstants.ghostWhite },

  //WhiteLogo
  headerLogoView: {
    borderBottomLeftRadius: DimensionHelper.wp("8%"), borderBottomRightRadius: DimensionHelper.wp("8%"), marginBottom: DimensionHelper.wp("2.5%"), backgroundColor: "white", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: DimensionHelper.wp("1.5%"), shadowColor: StyleConstants.blueColor, elevation: 5
  },
  headerLogoIcon: { width:DimensionHelper.wp("100%"), height:DimensionHelper.hp(16), marginBottom: DimensionHelper.wp("2%"), marginTop: DimensionHelper.wp("4%"), resizeMode: "contain", alignSelf: "center" },

  //Login Card Styles (Material UI inspired)
  loginContainer: {
    flex: 1,
    backgroundColor: StyleConstants.loginBackground,
    justifyContent: "center",
    alignItems: "center"
  },
  loginCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    width: DimensionHelper.wp("92%"),
    maxWidth: 600,
    padding: DimensionHelper.wp("7%"),
    paddingVertical: DimensionHelper.wp("5%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignSelf: "center"
  },
  loginTitle: {
    fontSize: DimensionHelper.wp("5%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "500",
    color: StyleConstants.darkColor,
    textAlign: "center",
    marginBottom: DimensionHelper.wp("4%")
  },
  loginInputView: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.12)",
    marginBottom: DimensionHelper.wp("3%"),
    paddingHorizontal: DimensionHelper.wp("3.5%"),
    height: DimensionHelper.wp("12%")
  },
  loginInputIcon: {
    marginRight: DimensionHelper.wp("2%"),
    opacity: 0.6
  },
  loginInput: {
    flex: 1,
    fontSize: DimensionHelper.wp("4%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: StyleConstants.darkColor
  },
  loginButton: {
    backgroundColor: StyleConstants.baseColor,
    borderRadius: 8,
    height: DimensionHelper.wp("11%"),
    justifyContent: "center",
    alignItems: "center",
    marginTop: DimensionHelper.wp("3%"),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  loginButtonText: {
    color: StyleConstants.whiteColor,
    fontSize: DimensionHelper.wp("4.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    textTransform: "none",
    letterSpacing: 0.5
  },
  privacyText: {
    fontSize: DimensionHelper.wp("3.2%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: "rgba(0, 0, 0, 0.6)",
    textAlign: "center",
    marginTop: DimensionHelper.wp("3%"),
    lineHeight: DimensionHelper.wp("4.5%")
  },
  privacyLink: {
    color: StyleConstants.baseColor,
    textDecorationLine: "underline"
  },

  //Church Selection Styles
  churchSelectionContainer: {
    flex: 1,
    backgroundColor: StyleConstants.loginBackground,
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingTop: DimensionHelper.wp("8%")
  },
  churchSelectionTitle: {
    fontSize: DimensionHelper.wp("5.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "500",
    color: StyleConstants.darkColor,
    textAlign: "center",
  },
  churchCard: {
    backgroundColor: StyleConstants.whiteColor,
    borderRadius: 12,
    marginBottom: DimensionHelper.wp("4%"),
    padding: DimensionHelper.wp("4%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center"
  },
  churchLogoContainer: {
    width: DimensionHelper.wp("20%"),
    height: DimensionHelper.wp("5%"),
    borderRadius: 6,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: DimensionHelper.wp("4%")
  },
  churchLogo: {
    width: DimensionHelper.wp("19%"),
    height: DimensionHelper.wp("4.75%"),
    borderRadius: 4,
    resizeMode: "cover"
  },
  churchPlaceholderIcon: {
    opacity: 0.6
  },
  churchName: {
    flex: 1,
    fontSize: DimensionHelper.wp("4.2%"),
    fontFamily: StyleConstants.RobotoMedium,
    color: StyleConstants.darkColor,
    lineHeight: DimensionHelper.wp("5%")
  },
  churchSelectionLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});

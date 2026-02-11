import React from "react";
import { View, Text } from "react-native";
import { StyleConstants, DimensionHelper } from "../helpers";

interface Props {
  icon: string;
  title: string;
  subtitle: string;
}

const Subheader = (props: Props) => (
  <View style={subheaderStyles.textSection}>
    <View style={subheaderStyles.headerTextContainer}>
      <View style={subheaderStyles.titleRow}>
        <View style={subheaderStyles.titleIconContainer}>
          <Text style={subheaderStyles.titleIcon}>{props.icon}</Text>
        </View>
        <View style={subheaderStyles.titleTextContainer}>
          <Text style={subheaderStyles.headerTitle}>{props.title}</Text>
          <Text style={subheaderStyles.headerSubtitle}>{props.subtitle}</Text>
        </View>
      </View>
    </View>
  </View>
);

const subheaderStyles = {
  // Text Section (Light blue background)
  textSection: {
    backgroundColor: "#568BDA", // Light blue background
    paddingHorizontal: DimensionHelper.wp("5%"),
    paddingTop: DimensionHelper.wp("5%"),
    paddingBottom: DimensionHelper.wp("5%"),
    borderBottomLeftRadius: DimensionHelper.wp("8%"),
    borderBottomRightRadius: DimensionHelper.wp("8%"),
    marginBottom: DimensionHelper.wp("2%"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    shadowColor: StyleConstants.baseColor
  },

  headerTextContainer: { width: "100%" },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%"
  },

  titleIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    width: DimensionHelper.wp("12%"),
    height: DimensionHelper.wp("12%"),
    justifyContent: "center",
    alignItems: "center",
    marginRight: DimensionHelper.wp("3%")
  },

  titleIcon: { fontSize: DimensionHelper.wp("6%") },

  titleTextContainer: { flex: 1 },

  headerTitle: {
    fontSize: DimensionHelper.wp("5.5%"),
    fontFamily: StyleConstants.RobotoMedium,
    fontWeight: "600",
    color: StyleConstants.whiteColor,
    marginBottom: DimensionHelper.wp("1%"),
    textAlign: "left"
  },

  headerSubtitle: {
    fontSize: DimensionHelper.wp("3.8%"),
    fontFamily: StyleConstants.RobotoRegular,
    color: "rgba(255,255,255,0.9)",
    textAlign: "left"
  }
};

export default Subheader;


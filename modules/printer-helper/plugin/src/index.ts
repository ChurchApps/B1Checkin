import { ConfigPlugin } from "expo/config-plugins";
import withBrotherIOS from "./withBrotherIOS";

const withPrinterHelper: ConfigPlugin = (config) => {
  config = withBrotherIOS(config);
  return config;
};

export default withPrinterHelper;

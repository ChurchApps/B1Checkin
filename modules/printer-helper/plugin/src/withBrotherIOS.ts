import { ConfigPlugin, withInfoPlist, withXcodeProject } from "expo/config-plugins";
import * as path from "path";
import * as fs from "fs";

const withBrotherIOS: ConfigPlugin = (config) => {
  config = withInfoPlist(config, (config) => {
    // Required for local network printer discovery on iOS 14+
    config.modResults["NSLocalNetworkUsageDescription"] =
      "B1 Checkin needs local network access to find and communicate with Brother label printers on your WiFi network.";

    // Required Bonjour services for printer discovery
    config.modResults["NSBonjourServices"] = [
      "_pdl-datastream._tcp",
      "_printer._tcp",
    ];

    return config;
  });

  // Copy label templates to iOS bundle resources
  config = withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const labelsSource = path.join(projectRoot, "assets", "labels");
    const iosLabelsDir = path.join(projectRoot, "ios", "B1Checkin", "labels");

    if (fs.existsSync(labelsSource)) {
      // Create labels directory in iOS project
      if (!fs.existsSync(iosLabelsDir)) {
        fs.mkdirSync(iosLabelsDir, { recursive: true });
      }

      // Copy label template files
      const files = fs.readdirSync(labelsSource);
      for (const file of files) {
        fs.copyFileSync(
          path.join(labelsSource, file),
          path.join(iosLabelsDir, file)
        );
      }

      // Add labels folder as resource to Xcode project
      const project = config.modResults;
      const groupName = "labels";
      const targetUuid = project.getFirstTarget().uuid;

      // Add files to the project
      for (const file of files) {
        const filePath = `B1Checkin/labels/${file}`;
        project.addResourceFile(filePath, { target: targetUuid });
      }
    }

    return config;
  });

  return config;
};

export default withBrotherIOS;

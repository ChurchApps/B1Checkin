const {
  withInfoPlist,
  withXcodeProject,
  IOSConfig
} = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

const withBrotherIOS = (config) => {
  config = withInfoPlist(config, (config) => {
    config.modResults["NSLocalNetworkUsageDescription"] =
      "B1 Checkin needs local network access to find and communicate with Brother label printers on your WiFi network.";

    config.modResults["NSBonjourServices"] = [
      "_pdl-datastream._tcp",
      "_printer._tcp"
    ];

    return config;
  });

  config = withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const labelsSource = path.join(projectRoot, "assets", "labels");
    const iosLabelsDir = path.join(projectRoot, "ios", "B1Checkin", "labels");

    if (fs.existsSync(labelsSource)) {
      if (!fs.existsSync(iosLabelsDir)) {
        fs.mkdirSync(iosLabelsDir, { recursive: true });
      }

      const files = fs.readdirSync(labelsSource);
      for (const file of files) {
        fs.copyFileSync(
          path.join(labelsSource, file),
          path.join(iosLabelsDir, file)
        );
      }

      const project = config.modResults;
      const targetUuid = project.getFirstTarget().uuid;
      const groupName = "B1Checkin/labels";

      // ensureGroupRecursively() fixes addResourceFile() crash on missing "Resources" group.
      IOSConfig.XcodeUtils.ensureGroupRecursively(project, groupName);

      for (const file of files) {
        IOSConfig.XcodeUtils.addResourceFileToGroup({
          filepath: groupName + "/" + file,
          groupName,
          project,
          isBuildFile: true,
          targetUuid,
          verbose: true
        });
      }
    }

    return config;
  });

  return config;
};

module.exports = withBrotherIOS;

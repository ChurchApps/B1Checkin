const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// React Native Firebase ships Objective-C headers that import React headers
// non-modularly (e.g. `#import <React/RCTConvert.h>`). When Firebase is built
// as a static framework (required by RNFirebase, enabled here via
// expo-build-properties `ios.useFrameworks: "static"`), Clang treats those
// includes as errors: `-Werror,-Wnon-modular-include-in-framework-module`.
//
// The standard remedy is to set CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES
// on every Pod target via a Podfile post_install hook. Because this is a CNG
// project (no committed Podfile), we inject that hook during prebuild.
const SETTING = "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES";

const SNIPPET = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        bc.build_settings['${SETTING}'] = 'YES'
      end
    end`;

const withFirebaseNonModularFix = (config) =>
  withDangerousMod(config, [
    "ios",
    (config) => {
      const podfile = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfile, "utf8");

      if (!contents.includes(SETTING)) {
        // Insert at the start of the existing post_install block so the
        // setting is applied to all generated Pod targets.
        contents = contents.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${SNIPPET}`
        );
        fs.writeFileSync(podfile, contents);
      }

      return config;
    }
  ]);

module.exports = withFirebaseNonModularFix;

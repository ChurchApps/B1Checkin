// Dynamic config that extends the static app.json.
// On EAS Build, GoogleService-Info.plist isn't in git (*.plist is gitignored), so it's
// provided via the EAS file env var GOOGLE_SERVICES_INFO_PLIST (secret visibility), which
// resolves to a downloaded file path during the build. Locally that var is unset, so we
// fall back to the plist sitting in the project root.
module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_INFO_PLIST ?? config.ios.googleServicesFile,
  },
});

// EAS Build provides GoogleService-Info.plist via env var; fall back to project root locally.
module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_INFO_PLIST ?? config.ios.googleServicesFile,
  },
});

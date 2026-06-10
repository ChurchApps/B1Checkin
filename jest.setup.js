jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

jest.mock("@react-native-firebase/app", () => ({ getApp: jest.fn() }));

jest.mock("@react-native-firebase/analytics", () => {
  const instance = { logEvent: jest.fn(), logScreenView: jest.fn(), setUserId: jest.fn(), setUserProperties: jest.fn() };
  const analytics = () => instance;
  analytics.getAnalytics = () => instance;
  return { __esModule: true, default: analytics, getAnalytics: () => instance, logEvent: jest.fn(), logScreenView: jest.fn() };
});

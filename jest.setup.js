jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

jest.mock("expo-secure-store", () => {
  const mem = {};
  return {
    isAvailableAsync: jest.fn(async () => true),
    setItemAsync: jest.fn(async (k, v) => { mem[k] = v; }),
    getItemAsync: jest.fn(async (k) => mem[k] ?? null),
    deleteItemAsync: jest.fn(async (k) => { delete mem[k]; })
  };
});

jest.mock("@react-native-firebase/app", () => ({ getApp: jest.fn() }));

jest.mock("@react-native-firebase/analytics", () => {
  const instance = { logEvent: jest.fn(), logScreenView: jest.fn(), setUserId: jest.fn(), setUserProperties: jest.fn() };
  const analytics = () => instance;
  analytics.getAnalytics = () => instance;
  return { __esModule: true, default: analytics, getAnalytics: () => instance, logEvent: jest.fn(), logScreenView: jest.fn() };
});

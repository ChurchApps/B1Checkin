import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { SessionHelper } from "../SessionHelper";
import { ApiHelper } from "../ApiHelper";

jest.mock("../ApiHelper", () => ({ ApiHelper: { postAnonymous: jest.fn() } }));

const church = { church: { id: "1", name: "Demo" }, apis: [{ keyName: "MembershipApi", jwt: "church.jwt", permissions: [] }, { keyName: "AttendanceApi", jwt: "attendance.jwt", permissions: [{ contentType: "Attendance", action: "Checkin" }] }] };
const withAttendance = (id: string, action: string) => ({ church: { id, name: id }, apis: [{ keyName: "AttendanceApi", jwt: "a.jwt", permissions: [{ contentType: "Attendance", action }] }] });

beforeEach(async () => {
  SessionHelper.churches = [];
  await AsyncStorage.clear();
  await SecureStore.deleteItemAsync("userJwt");
  jest.clearAllMocks();
});

describe("SessionHelper", () => {
  // ChurchAppsSupport#1426: being in a role is not enough to run the kiosk.
  it("keeps only churches where the account has Check-in or Attendance Edit", () => {
    const checkin = withAttendance("checkin", "Checkin");
    const edit = withAttendance("edit", "Edit");
    const viewOnly = withAttendance("viewOnly", "View");
    const otherRole = { church: { id: "giving", name: "giving" }, apis: [{ keyName: "GivingApi", jwt: "g.jwt", permissions: [{ contentType: "Donations", action: "Checkin" }] }] };
    const noApis = { church: { id: "none", name: "none" }, apis: [] };
    expect(SessionHelper.filterChurches([checkin, edit, viewOnly, otherRole, noApis])).toEqual([checkin, edit]);
  });

  it("drops a church without Check-in when a stored session is restored", async () => {
    await SecureStore.setItemAsync("userJwt", "user.jwt");
    (ApiHelper.postAnonymous as jest.Mock).mockResolvedValue({ user: { email: "staff@b1.church", jwt: "fresh.jwt" }, userChurches: [withAttendance("viewOnly", "View")] });
    expect(await SessionHelper.restore()).toEqual([]);
  });

  it("saves the user jwt in SecureStore and never writes @Password", async () => {
    await AsyncStorage.setItem("@Password", "leftover");
    await SessionHelper.save("user.jwt", "staff@b1.church", [church]);
    expect(await SecureStore.getItemAsync("userJwt")).toBe("user.jwt");
    expect(await AsyncStorage.getItem("@Password")).toBeNull();
    expect(await AsyncStorage.getItem("@UserChurches")).toBeNull();
    expect(await AsyncStorage.getItem("@Email")).toBe("staff@b1.church");
    expect(SessionHelper.churches).toEqual([church]);
  });

  it("restores by exchanging the stored jwt, not a password", async () => {
    await SecureStore.setItemAsync("userJwt", "user.jwt");
    (ApiHelper.postAnonymous as jest.Mock).mockResolvedValue({ user: { email: "staff@b1.church", jwt: "fresh.jwt" }, userChurches: [church] });
    const churches = await SessionHelper.restore();
    expect(churches).toEqual([church]);
    expect(ApiHelper.postAnonymous).toHaveBeenCalledWith("/users/login", { jwt: "user.jwt" }, "MembershipApi");
    expect(await SecureStore.getItemAsync("userJwt")).toBe("fresh.jwt");
  });

  it("migrates a leftover plaintext password then deletes it", async () => {
    await AsyncStorage.multiSet([["@Email", "staff@b1.church"], ["@Password", "secret"], ["@UserChurches", "[{}]"]]);
    (ApiHelper.postAnonymous as jest.Mock).mockResolvedValue({ user: { email: "staff@b1.church", jwt: "user.jwt" }, userChurches: [church] });
    const churches = await SessionHelper.restore();
    expect(churches).toEqual([church]);
    expect(ApiHelper.postAnonymous).toHaveBeenCalledWith("/users/login", { email: "staff@b1.church", password: "secret" }, "MembershipApi");
    expect(await AsyncStorage.getItem("@Password")).toBeNull();
    expect(await AsyncStorage.getItem("@UserChurches")).toBeNull();
    expect(await SecureStore.getItemAsync("userJwt")).toBe("user.jwt");
  });

  it("clears the jwt and leftover credential keys", async () => {
    await SessionHelper.save("user.jwt", "staff@b1.church", [church]);
    await SessionHelper.clear();
    expect(await SecureStore.getItemAsync("userJwt")).toBeNull();
    expect(await AsyncStorage.getItem("@Email")).toBeNull();
    expect(SessionHelper.churches).toEqual([]);
  });
});

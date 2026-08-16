import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { SessionHelper } from "../SessionHelper";
import { ApiHelper } from "../ApiHelper";

jest.mock("../ApiHelper", () => ({ ApiHelper: { postAnonymous: jest.fn() } }));

const church = { church: { id: "1", name: "Demo" }, apis: [{ keyName: "MembershipApi", jwt: "church.jwt", permissions: [] }] };

beforeEach(async () => {
  SessionHelper.churches = [];
  await AsyncStorage.clear();
  await SecureStore.deleteItemAsync("userJwt");
  jest.clearAllMocks();
});

describe("SessionHelper", () => {
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

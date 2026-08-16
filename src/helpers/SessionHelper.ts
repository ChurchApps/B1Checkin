import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { ApiHelper } from "./ApiHelper";
import { LoginResponseInterface, LoginUserChurchInterface } from "./Interfaces";

const JWT_KEY = "userJwt";
const LEFTOVER = ["@Password", "@Login", "@Email", "@UserChurches"];

export class SessionHelper {
  static churches: LoginUserChurchInterface[] = [];

  static filterChurches(churches?: LoginUserChurchInterface[]) {
    return churches?.filter(uc => uc.apis && uc.apis.length > 0) || [];
  }

  static async save(userJwt: string, email: string, churches: LoginUserChurchInterface[]) {
    this.churches = churches;
    if (await SecureStore.isAvailableAsync()) await SecureStore.setItemAsync(JWT_KEY, userJwt);
    await AsyncStorage.multiRemove(["@Password", "@UserChurches"]);
    await AsyncStorage.multiSet([["@Login", "true"], ["@Email", email]]);
  }

  static async clear() {
    this.churches = [];
    if (await SecureStore.isAvailableAsync()) await SecureStore.deleteItemAsync(JWT_KEY);
    await AsyncStorage.multiRemove(LEFTOVER);
  }

  static async restore(): Promise<LoginUserChurchInterface[] | null> {
    const jwt = (await SecureStore.isAvailableAsync()) ? await SecureStore.getItemAsync(JWT_KEY) : null;
    if (jwt) {
      const churches = await this.loginWithJwt(jwt);
      if (churches) return churches;
    }

    const leftover = await AsyncStorage.multiGet(["@Email", "@Password"]);
    const email = leftover[0][1];
    const password = leftover[1][1];
    await AsyncStorage.multiRemove(["@Password", "@UserChurches"]);
    if (email && password) {
      try {
        const data: LoginResponseInterface = await ApiHelper.postAnonymous("/users/login", { email, password }, "MembershipApi");
        if (!data.errors?.length && data.user?.jwt) {
          const churches = this.filterChurches(data.userChurches);
          await this.save(data.user.jwt, email, churches);
          return churches;
        }
      } catch {}
    }
    return null;
  }

  private static async loginWithJwt(jwt: string): Promise<LoginUserChurchInterface[] | null> {
    try {
      const data: LoginResponseInterface = await ApiHelper.postAnonymous("/users/login", { jwt }, "MembershipApi");
      if (data.errors?.length || !data.user?.jwt) return null;
      const churches = this.filterChurches(data.userChurches);
      await this.save(data.user.jwt, data.user.email || (await AsyncStorage.getItem("@Email")) || "", churches);
      return churches;
    } catch {
      return null;
    }
  }
}

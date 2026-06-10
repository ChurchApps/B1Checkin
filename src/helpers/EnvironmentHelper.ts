import { ApiHelper } from "./ApiHelper";

export class EnvironmentHelper {
  private static MembershipApi = "";
  private static AttendanceApi = "";

  static ContentRoot = "";

  static init = () => {
    const stage = process.env.EXPO_PUBLIC_STAGE || "prod";

    switch (stage) {
      case "dev": EnvironmentHelper.initDev(); break;
      case "staging": EnvironmentHelper.initStaging(); break;
      default: EnvironmentHelper.initProd(); break;
    }
    ApiHelper.apiConfigs = [{ keyName: "MembershipApi", url: EnvironmentHelper.MembershipApi, jwt: "", permissions: [] }, { keyName: "AttendanceApi", url: EnvironmentHelper.AttendanceApi, jwt: "", permissions: [] }];
  };

  //NOTE: None of these values are secret.
  static initDev = () => {
    // 127.0.0.1 (not localhost): browsers may resolve localhost to ::1 while the Api listens on IPv4 only
    EnvironmentHelper.MembershipApi = "http://127.0.0.1:8084/membership";
    EnvironmentHelper.AttendanceApi = "http://127.0.0.1:8084/attendance";
    EnvironmentHelper.ContentRoot = "https://content.staging.churchapps.org";
  };

  static initStaging = () => {
    EnvironmentHelper.MembershipApi = "https://api.staging.churchapps.org/membership";
    EnvironmentHelper.AttendanceApi = "https://api.staging.churchapps.org/attendance";
    EnvironmentHelper.ContentRoot = "https://content.staging.churchapps.org";
  };

  static initProd = () => {
    EnvironmentHelper.MembershipApi = "https://api.churchapps.org/membership";
    EnvironmentHelper.AttendanceApi = "https://api.churchapps.org/attendance";
    EnvironmentHelper.ContentRoot = "https://content.churchapps.org";
  };
}

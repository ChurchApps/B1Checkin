import { ApiHelper } from "./ApiHelper";


let CONTENT_ROOT = "https://content.staging.churchapps.org";
let MEMBERSHIP_API = "https://api.staging.churchapps.org/membership";
let ATTENDANCE_API = "https://api.staging.churchapps.org/attendance";

export class EnvironmentHelper {
  private static MembershipApi = "";
  private static AttendanceApi = "";

  static ContentRoot = "";


  static init = () => {
    // let stage = STAGE;
    let stage = "prod";


    //stage = "staging";

    switch (stage) {
      case "staging": EnvironmentHelper.initStaging(); break;
      case "prod": EnvironmentHelper.initProd(); break;
      default: EnvironmentHelper.initDev(); break;
    }
    ApiHelper.apiConfigs = [{ keyName: "MembershipApi", url: EnvironmentHelper.MembershipApi, jwt: "", permissions: [] }, { keyName: "AttendanceApi", url: EnvironmentHelper.AttendanceApi, jwt: "", permissions: [] },];
  };

  static initDev = () => {
    this.initStaging();
    EnvironmentHelper.MembershipApi = MEMBERSHIP_API || EnvironmentHelper.MembershipApi;
    EnvironmentHelper.AttendanceApi = ATTENDANCE_API || EnvironmentHelper.AttendanceApi;
    EnvironmentHelper.ContentRoot = CONTENT_ROOT || EnvironmentHelper.ContentRoot;
  };



  //NOTE: None of these values are secret.
  static initStaging = () => {
    EnvironmentHelper.MembershipApi = "https://api.staging.churchapps.org/membership";
    EnvironmentHelper.AttendanceApi = "https://api.staging.churchapps.org/attendance";
    EnvironmentHelper.ContentRoot = "https://content.staging.churchapps.org";
  };

  //NOTE: None of these values are secret.
  static initProd = () => {
    EnvironmentHelper.MembershipApi = "https://api.churchapps.org/membership";
    EnvironmentHelper.AttendanceApi = "https://api.churchapps.org/attendance";
    EnvironmentHelper.ContentRoot = "https://content.churchapps.org";
  };
}



import { ApiHelper } from "@churchapps/mobilehelper";


let CONTENT_ROOT = 'https://content.staging.churchapps.org'
let MEMBERSHIP_API = 'https://membershipapi.staging.churchapps.org'
let ATTENDANCE_API = 'https://attendanceapi.staging.churchapps.org'
// import { CONTENT_ROOT, MEMBERSHIP_API, ATTENDANCE_API, STAGE } from "@env";
export class EnvironmentHelper {
  private static MembershipApi = "";
  private static AttendanceApi = "";

  static ContentRoot = "";


  static init = () => {
    // let stage = STAGE;
    // let stage = "prod";
    let stage = "staging";
    switch (stage) {
      case "staging": EnvironmentHelper.initStaging(); break;
      case "prod": EnvironmentHelper.initProd(); break;
      default: EnvironmentHelper.initDev(); break;
    }
    ApiHelper.apiConfigs = [
      { keyName: "MembershipApi", url: EnvironmentHelper.MembershipApi, jwt: "", permisssions: [] },
      { keyName: "AttendanceApi", url: EnvironmentHelper.AttendanceApi, jwt: "", permisssions: [] },
    ];
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
    EnvironmentHelper.ContentRoot = "https://api.staging.churchapps.org/content";
  };

  //NOTE: None of these values are secret.
  static initProd = () => {
    EnvironmentHelper.MembershipApi = "https://membershipapi.churchapps.org";
    EnvironmentHelper.AttendanceApi = "https://attendanceapi.churchapps.org";
    EnvironmentHelper.ContentRoot = "https://content.churchapps.org";
  };
}



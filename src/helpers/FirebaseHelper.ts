import { Platform } from "react-native";
import analytics from "@react-native-firebase/analytics";

export class FirebaseHelper {
  static async addAnalyticsEvent(eventName: string, dataBody: any) {
    if (Platform.OS === "web") return;
    try {
      await analytics().logEvent(eventName, dataBody);
      console.log(`[FirebaseHelper] Analytics event logged: ${eventName}`, dataBody);
    } catch (error) {
      console.error(`[FirebaseHelper] Error logging event ${eventName}:`, error);
    }
  }

  static async addOpenScreenEvent(screenName: string) {
    if (Platform.OS === "web") return;
    try {
      await analytics().logScreenView({ screen_name: screenName, screen_class: screenName });
      console.log(`[FirebaseHelper] Screen opened: ${screenName}`);
    } catch (error) {
      console.error(`[FirebaseHelper] Error logging screen view ${screenName}:`, error);
    }
  }
}

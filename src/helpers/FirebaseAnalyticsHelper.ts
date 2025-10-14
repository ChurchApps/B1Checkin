import analytics from "@react-native-firebase/analytics";

export class FirebaseAnalyticsHelper {
  static async init(data: Record<string, any>) {
    try {
      // Set user properties for analytics
      if (data.userId) {
        await analytics().setUserId(data.userId.toString());
      }

      // Set custom user properties
      for (const [key, value] of Object.entries(data)) {
        if (key !== "userId" && value !== undefined && value !== null) {
          await analytics().setUserProperty(key, String(value));
        }
      }

      console.log("[FirebaseAnalyticsHelper] Analytics initialized with user data");
    } catch (error) {
      console.error("[FirebaseAnalyticsHelper] Error initializing analytics:", error);
    }
  }

  static async trackEvent(name: string, data: Record<string, any> = {}) {
    try {
      await analytics().logEvent(name, data);
      console.log(`[FirebaseAnalyticsHelper] Event tracked: ${name}`, data);
    } catch (error) {
      console.error(`[FirebaseAnalyticsHelper] Error tracking event ${name}:`, error);
    }
  }
}

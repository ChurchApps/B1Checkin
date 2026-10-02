export class GuestRegisterHelper {
  // Shared by the QR code and the on-kiosk WebView so the two can't drift apart.
  static getUrl = (subDomain: string, serviceId: string) => `https://${subDomain}.b1.church/guest-register?serviceId=${serviceId}`;

  // Keeps the kiosk WebView on the guest form; the B1App site header would otherwise let a guest browse away.
  static isAllowedNavigation = (url: string, subDomain: string) => {
    if (url === "about:blank") return true;
    const base = `https://${subDomain}.b1.church/guest-register`;
    return url === base || url.startsWith(base + "?");
  };
}

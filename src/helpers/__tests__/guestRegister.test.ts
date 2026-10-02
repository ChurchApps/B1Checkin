import { GuestRegisterHelper } from "../GuestRegisterHelper";

describe("GuestRegisterHelper.getUrl", () => {
  it("builds the same guest-register URL the QR code encodes", () => {
    expect(GuestRegisterHelper.getUrl("grace", "SER00000001")).toBe("https://grace.b1.church/guest-register?serviceId=SER00000001");
  });
});

describe("GuestRegisterHelper.isAllowedNavigation", () => {
  const allowed = (url: string) => GuestRegisterHelper.isAllowedNavigation(url, "grace");

  it("allows the guest-register page with or without a query string", () => {
    expect(allowed("https://grace.b1.church/guest-register")).toBe(true);
    expect(allowed("https://grace.b1.church/guest-register?serviceId=SER00000001")).toBe(true);
    expect(allowed("about:blank")).toBe(true);
  });

  it("blocks browsing away from the form", () => {
    expect(allowed("https://grace.b1.church/")).toBe(false);
    expect(allowed("https://grace.b1.church/login")).toBe(false);
    expect(allowed("https://grace.b1.church/guest-register-other")).toBe(false);
    expect(allowed("https://other.b1.church/guest-register")).toBe(false);
    expect(allowed("http://grace.b1.church/guest-register")).toBe(false);
    expect(allowed("https://grace.b1.church.evil.com/guest-register")).toBe(false);
    expect(allowed("https://example.com/")).toBe(false);
  });
});

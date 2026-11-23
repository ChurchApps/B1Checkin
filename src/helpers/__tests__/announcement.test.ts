import { AnnouncementHelper } from "../AnnouncementHelper";

describe("AnnouncementHelper", () => {
  beforeEach(() => AnnouncementHelper.reset());

  it("normalizes missing or non-string values to blank", () => {
    expect(AnnouncementHelper.normalize(undefined)).toBe("");
    expect(AnnouncementHelper.normalize(null)).toBe("");
    expect(AnnouncementHelper.normalize(42)).toBe("");
    expect(AnnouncementHelper.normalize("  Doors close at 10:15  ")).toBe("Doors close at 10:15");
  });

  it("never shows a blank announcement", () => {
    expect(AnnouncementHelper.shouldShow("", [])).toBe(false);
    expect(AnnouncementHelper.shouldShow("   ", [])).toBe(false);
    expect(AnnouncementHelper.shouldShow(undefined, [])).toBe(false);
  });

  it("shows once per household and again for the next household", () => {
    const smiths = [{ id: "PER00000001" }];
    expect(AnnouncementHelper.shouldShow("Hello", smiths)).toBe(true);
    AnnouncementHelper.confirm(smiths);
    // Returning to the same household screen (add guest, change rooms) doesn't ask again.
    smiths.push({ id: "PER00000099" });
    expect(AnnouncementHelper.shouldShow("Hello", smiths)).toBe(false);
    // Lookup loads a fresh list for the next family, even the same household checking in again.
    expect(AnnouncementHelper.shouldShow("Hello", [{ id: "PER00000001" }])).toBe(true);
  });
});

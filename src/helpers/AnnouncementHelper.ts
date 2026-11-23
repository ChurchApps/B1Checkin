// The church-wide check-in announcement, shown with an OK button before the household screen. Nothing is recorded.
export class AnnouncementHelper {
  // The household list it was last confirmed for. Lookup loads a fresh list for each household, so going back to the
  // household screen (add a guest, change rooms) doesn't ask again, but the next family does see it.
  private static confirmedFor: unknown = null;

  static normalize(text: unknown): string {
    return typeof text === "string" ? text.trim() : "";
  }

  static shouldShow(text: unknown, household: unknown): boolean {
    return AnnouncementHelper.normalize(text) !== "" && household !== AnnouncementHelper.confirmedFor;
  }

  static confirm(household: unknown) {
    AnnouncementHelper.confirmedFor = household;
  }

  static reset() {
    AnnouncementHelper.confirmedFor = null;
  }
}

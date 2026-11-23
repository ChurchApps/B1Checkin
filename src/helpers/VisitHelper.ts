import { CheckinType, PersonInterface, VisitInterface } from "./Interfaces";
import { EligibilityHelper } from "./EligibilityHelper";

export class VisitHelper {

  public static getByPersonId(visits: VisitInterface[], personId: string): VisitInterface | null {
    let result: VisitInterface | null = null;
    visits.forEach(v => { if (v.personId === personId) result = v; });
    return result;
  }

  // GET /visits/checkin returns the person's latest visit for the service with its id removed, and that
  // visit may be from an earlier week, so "checked in" means the visit is dated today. The Api stamps
  // visitDate with midnight of its own day (UTC in production), so today's visit is the one that began
  // less than 24 hours ago; that holds whatever time zone the kiosk or the Api runs in.
  public static isToday(visit: VisitInterface | null | undefined, now: Date = new Date()): boolean {
    if (!visit?.visitDate) return false;
    const date = new Date(visit.visitDate);
    if (isNaN(date.getTime())) return false;
    const elapsed = now.getTime() - date.getTime();
    return elapsed >= 0 && elapsed < 24 * 60 * 60 * 1000;
  }

  // The chip starts on Volunteer when the person's last visit to this service (from GET /visits/checkin)
  // was a volunteer visit. A just-added guest starts on Guest; Guest is never carried over from a past visit.
  public static getDefaultCheckinType(visits: VisitInterface[], personId: string, isGuest?: boolean): CheckinType {
    if (isGuest) return "guest";
    return VisitHelper.getByPersonId(visits, personId)?.checkinType === "volunteer" ? "volunteer" : "member";
  }

  // "Checked in by" is the person whose phone or name found the household, but only when they are clearly an adult:
  // not marked Child, not under 18 by birth date, and either a household Head/Spouse or a birth date that shows 18+.
  // Anything else (a child's name was searched, or nothing says adult) records no one.
  public static getCheckedInById(lookedUp: PersonInterface | null | undefined, today: Date = new Date()): string {
    if (!lookedUp?.id) return "";
    if (lookedUp.householdRole === "Child") return "";
    const birth = lookedUp.birthDate ? new Date(lookedUp.birthDate) : null;
    const knownBirth = birth && !isNaN(birth.getTime()) ? birth : null;
    if (knownBirth) return EligibilityHelper.ageInMonths(knownBirth, today) >= 18 * 12 ? lookedUp.id : "";
    // "Other" can be a child (a grandchild, a foster child), so without a birth date only Head and Spouse count.
    return lookedUp.householdRole === "Head" || lookedUp.householdRole === "Spouse" ? lookedUp.id : "";
  }

  // Stamped on every visit the kiosk posts, so a visit carried over from an earlier week never keeps its old value.
  public static stampCheckedInBy(visits: VisitInterface[], checkedInById: string) {
    visits.forEach(v => { v.checkedInById = checkedInById || undefined; });
  }

}

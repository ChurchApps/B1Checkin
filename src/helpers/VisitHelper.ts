import { VisitInterface } from "./Interfaces";

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

}


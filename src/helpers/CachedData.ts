import { VisitInterface, LoginUserChurchInterface, PersonInterface, ServiceTimeInterface, GroupServiceTimeInterface, GroupInterface, LabelTemplateInterface, CheckinType } from "./Interfaces";
import { AppearanceInterface, AvailablePrinter } from "./Interfaces";

export class CachedData {
  static pendingVisits: VisitInterface[] = [];
  static existingVisits: VisitInterface[] = [];

  static userChurch: LoginUserChurchInterface | null = null;
  static householdId: string = "";
  static householdMembers: PersonInterface[] = [];

  static serviceId: string = "";
  static serviceTimes: ServiceTimeInterface[] = [];
  static groupServiceTimes: GroupServiceTimeInterface[] = [];
  static groups: GroupInterface[] = [];

  static churchAppearance: AppearanceInterface | null = null;

  static printer: AvailablePrinter = { model: "none", ipAddress: "", brand: "" };

  static kioskPin: string = "";
  static kioskLocked: boolean = false;

  static labelTemplates: LabelTemplateInterface[] = [];
  static stationMode: "self" | "manned" = "self";

  // Per-person check-in type chosen at the household screen (personId -> type).
  static checkinTypes: Record<string, CheckinType> = {};
  // Church grade/age cutoff "MM-DD" (from GET /attendance/checkin/settings); null = use today.
  static gradePromotionDate: string | null = null;
}


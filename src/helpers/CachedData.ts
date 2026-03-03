import { VisitInterface, LoginUserChurchInterface, PersonInterface, ServiceTimeInterface, GroupServiceTimeInterface, GroupInterface } from "./Interfaces";
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

  static printer: AvailablePrinter = { model: "none", ipAddress: "" };

  static kioskPin: string = "";
  static kioskLocked: boolean = false;
}


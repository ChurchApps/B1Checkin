import { Platform } from "react-native";
import i18n from "i18next";
import { CachedData } from "./CachedData";
import { VisitSessionHelper } from "./VisitSessionHelper";
import { VisitInterface, PersonInterface, ServiceTimeInterface, GroupInterface, LabelBlockInterface } from "./Interfaces";
import { ArrayHelper } from "./ArrayHelper";
import { EligibilityHelper } from "./EligibilityHelper";
import { PrinterLog } from "./PrinterLog";
import { LabelContext, LabelRenderer } from "./LabelRenderer";

export class LabelHelper {

  private static generatePickupCode() {
    //Omitted vowels and numbers that are substituted for vowels to avoid bad words from being formed
    const characters = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "B",
      "C",
      "D",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L",
      "M",
      "N",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "V",
      "W",
      "X",
      "Y",
      "Z"
    ];
    let pickupCode = "";
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * characters.length);
      pickupCode += characters[idx];
    }
    return pickupCode;
  }

  private static async readHtml(fileName: string) {
    // Lazy require: react-native-fs has no web implementation, and printing never runs on web.
    const fs = require("react-native-fs");
    if (Platform.OS === "android") {
      return fs.readFileAssets("labels/" + fileName);
    }
    // iOS: Xcode copies resources FLAT into bundle root (not as a directory), so try root first.
    const base = fs.MainBundlePath;
    try {
      return await fs.readFile(base + "/" + fileName, "utf8");
    } catch {
      try {
        return await fs.readFile(base + "/labels/" + fileName, "utf8");
      } catch (err) {
        PrinterLog.add(`readHtml: ${fileName} not found in bundle root or labels/`);
        throw err;
      }
    }
  }

  private static replaceValues(html: string, visit: VisitInterface, childVisits: VisitInterface[], pickupCode: string) {
    const person: PersonInterface = ArrayHelper.getOne(CachedData.householdMembers || [], "id", visit.personId || "");
    let isChild: boolean = false;
    childVisits.forEach(cv => { if (cv.personId === person.id) isChild = true; });
    let result = html.replace(/\[Name\]/g, person.name?.display || person.displayName || "");
    result = result.replace(/\[Sessions\]/g, VisitSessionHelper.getDisplaySessions(visit.visitSessions || []).replace(/ ,/g, "<br/>"));
    result = result.replace(/\[PickupCode\]/g, (isChild) ? pickupCode : "");
    result = result.replace(/\[Allergies\]/g, (person.nametagNotes) ? person.nametagNotes : "");
    return result;
  }

  private static replaceValuesPickup(html: string, childVisits: VisitInterface[], pickupCode: string) {
    const childList: string[] = [];
    const allergiesList: string[] = [];
    childVisits.forEach(cv => {
      const person: PersonInterface = ArrayHelper.getOne(CachedData.householdMembers || [], "id", cv.personId || "");
      childList.push((person.name?.display || person.displayName || "Unknown") + " - " + VisitSessionHelper.getPickupSessions(cv.visitSessions || []));
      allergiesList.push(person.nametagNotes ?? "");
    });
    let childBullets = "";
    let allergiesBullets = "";
    childList.forEach(child => childBullets += "<li>" + child + "</li>");
    allergiesList.forEach(child => allergiesBullets += "<li>" + child + "</li>");
    let result = html.replace(/\[Children\]/g, childBullets);
    result = result.replace(/\[PickupCode\]/g, pickupCode);
    result = result.replace(/\[Allergies\]/g, allergiesBullets);
    return result;
  }

  private static getTemplateBlocks(labelType: string): LabelBlockInterface[] | null {
    const candidates = (CachedData.labelTemplates || []).filter(t => t.labelType === labelType);
    const template = candidates.find(t => t.isDefault) || candidates[0];
    if (!template?.content) return null;
    try {
      const blocks = JSON.parse(template.content);
      return Array.isArray(blocks) ? blocks : null;
    } catch {
      return null;
    }
  }

  private static getCommonContext(pickupCode: string): LabelContext {
    return {
      securityCode: pickupCode,
      date: new Date().toLocaleDateString(),
      churchName: CachedData.userChurch?.church?.name || ""
    };
  }

  // Month/day only, +/- windowDays, wraps across year end (e.g. Dec 30 vs Jan 2) and normalizes Feb 29 to Feb 28 in non-leap years.
  public static isBirthdayWithin(birthDate: Date | string | null | undefined, windowDays: number, today: Date = new Date()): boolean {
    if (!birthDate) return false;
    const bd = birthDate instanceof Date ? birthDate : new Date(birthDate);
    if (isNaN(bd.getTime())) return false;
    const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const oneDay = 86400000;
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    // Try the birthday landing in the prior/current/next year so a Dec<->Jan gap measures as a few days, not ~365.
    return [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].some(year => {
      const month = bd.getMonth();
      const day = month === 1 && bd.getDate() === 29 && !isLeap(year) ? 28 : bd.getDate();
      const birthdayUtc = Date.UTC(year, month, day);
      return Math.abs(birthdayUtc - todayUtc) / oneDay <= windowDays;
    });
  }

  // "YYYY-MM-DD..." strings are read as a local calendar date so the day never shifts with the kiosk's time zone.
  public static parseBirthDate(birthDate: Date | string | null | undefined): Date | null {
    if (!birthDate) return null;
    if (birthDate instanceof Date) return isNaN(birthDate.getTime()) ? null : birthDate;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
    const bd = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(birthDate);
    return isNaN(bd.getTime()) ? null : bd;
  }

  // Whole years, or months under age 2 so nursery labels are useful. Same month math as room guidance.
  public static formatAge(birthDate: Date | string | null | undefined, today: Date = new Date()): string {
    const bd = this.parseBirthDate(birthDate);
    if (!bd) return "";
    const months = EligibilityHelper.ageInMonths(bd, today);
    if (months < 0) return "";
    if (months < 24) return i18n.t("labels.ageMonths", { count: months });
    return String(Math.floor(months / 12));
  }

  public static formatBirthDate(birthDate: Date | string | null | undefined): string {
    return this.parseBirthDate(birthDate)?.toLocaleDateString() || "";
  }

  private static getCheckinType(visit: VisitInterface) {
    return visit.checkinType || CachedData.checkinTypes[visit.personId || ""];
  }

  // Stable value for conditions and barcodes: "Member", "Guest", or "Volunteer", as the designer offers it.
  public static checkinTypeValue(visit: VisitInterface): string {
    const type = this.getCheckinType(visit);
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : "";
  }

  // Text printed on the label, in the kiosk's language.
  public static printedCheckinType(visit: VisitInterface): string {
    const type = this.getCheckinType(visit);
    return type ? i18n.t(`household.type.${type}`) : "";
  }

  // Name and phone of the adult who checked this person in, from the household loaded for the check-in (blank when none).
  public static getCheckedInBy(visit: VisitInterface): { name: string; phone: string } {
    const adult: PersonInterface | null = visit.checkedInById ? ArrayHelper.getOne(CachedData.householdMembers || [], "id", visit.checkedInById) : null;
    if (!adult) return { name: "", phone: "" };
    const ci = adult.contactInfo || {};
    return { name: adult.name?.display || adult.displayName || "", phone: ci.mobilePhone || ci.homePhone || ci.workPhone || "" };
  }

  private static getNametagContext(visit: VisitInterface, isChild: boolean, pickupCode: string): LabelContext {
    const person: PersonInterface = ArrayHelper.getOne(CachedData.householdMembers || [], "id", visit.personId || "") || {};
    const checkedInBy = this.getCheckedInBy(visit);
    return {
      ...this.getCommonContext(isChild ? pickupCode : ""),
      "person.displayName": person.name?.display || person.displayName || "",
      "person.firstName": person.name?.first || person.firstName || "",
      "person.lastName": person.name?.last || person.lastName || "",
      "person.nickName": person.name?.nick || person.nickName || "",
      "person.nametagNotes": person.nametagNotes || "",
      "person.isBirthdayWeek": this.isBirthdayWithin(person.birthDate, 3) ? "true" : "",
      "person.age": this.formatAge(person.birthDate),
      "person.grade": person.grade || "",
      "person.birthDate": this.formatBirthDate(person.birthDate),
      checkinType: this.checkinTypeValue(visit),
      "checkedInBy.name": checkedInBy.name,
      "checkedInBy.phone": checkedInBy.phone,
      sessions: VisitSessionHelper.getDisplaySessions(visit.visitSessions || []).replace(/,/g, "\n")
    };
  }

  private static getPickupContext(childVisits: VisitInterface[], pickupCode: string): LabelContext {
    const children: string[] = [];
    const allergies: string[] = [];
    childVisits.forEach(cv => {
      const person: PersonInterface = ArrayHelper.getOne(CachedData.householdMembers || [], "id", cv.personId || "") || {};
      children.push((person.name?.display || person.displayName || "Unknown") + " - " + VisitSessionHelper.getPickupSessions(cv.visitSessions || []));
      if (person.nametagNotes) allergies.push((person.name?.display || person.displayName || "Unknown") + " - " + person.nametagNotes);
    });
    return {
      ...this.getCommonContext(pickupCode),
      children: children.join("\n"),
      childrenAllergies: allergies.join("\n")
    };
  }

  public static selectChildVisits(visits: VisitInterface[], serviceTimes: ServiceTimeInterface[]): VisitInterface[] {
    const result: VisitInterface[] = [];
    (visits || []).forEach(pv => {
      if (pv.checkinType === "volunteer") return;
      let isChild = false;
      pv.visitSessions?.forEach(vs => {
        const serviceTime: ServiceTimeInterface = ArrayHelper.getOne(serviceTimes || [], "id", vs.session?.serviceTimeId || "");
        const group: GroupInterface = ArrayHelper.getOne(serviceTime?.groups || [], "id", vs.session?.groupId || "");
        if (group?.parentPickup) { isChild = true; }
      });
      if (isChild) { result.push(pv); }
    });
    return result;
  }

  private static getChildVisits() {
    return LabelHelper.selectChildVisits(CachedData.pendingVisits, CachedData.serviceTimes || []);
  }

  private static shouldPrintNametag(visit: VisitInterface): boolean {
    let shouldPrint = false;
    visit.visitSessions?.forEach(vs => {
      const serviceTime: ServiceTimeInterface = ArrayHelper.getOne(CachedData.serviceTimes || [], "id", vs.session?.serviceTimeId || "");
      const group: GroupInterface = ArrayHelper.getOne(serviceTime?.groups || [], "id", vs.session?.groupId || "");
      if (group?.printNametag) { shouldPrint = true; }
    });
    return shouldPrint;
  }

  private static shouldPrintPickup(childVisits: VisitInterface[]): boolean {
    let shouldPrint = false;
    childVisits.forEach(cv => {
      cv.visitSessions?.forEach(vs => {
        const serviceTime: ServiceTimeInterface = ArrayHelper.getOne(CachedData.serviceTimes || [], "id", vs.session?.serviceTimeId || "");
        const group: GroupInterface = ArrayHelper.getOne(serviceTime?.groups || [], "id", vs.session?.groupId || "");
        if (group?.parentPickup) shouldPrint = true;
      });
    });
    return shouldPrint;
  }

  // Preserves adult-blank-code contract by temporarily swapping cached data.
  public static async getAllLabelsFor(visits: VisitInterface[], people: PersonInterface[], securityCode?: string) {
    const prevPending = CachedData.pendingVisits;
    const prevMembers = CachedData.householdMembers;
    CachedData.pendingVisits = visits;
    CachedData.householdMembers = people;
    try {
      return await this.getAllLabels(securityCode);
    } finally {
      CachedData.pendingVisits = prevPending;
      CachedData.householdMembers = prevMembers;
    }
  }

  public static async getAllLabels(securityCode?: string) {
    try {
      const pickupCode = securityCode || LabelHelper.generatePickupCode();
      const childVisits: VisitInterface[] = LabelHelper.getChildVisits();
      const nametagBlocks = this.getTemplateBlocks("nametag");
      const pickupBlocks = this.getTemplateBlocks("pickup");
      const labelTemplate = nametagBlocks ? "" : await this.readHtml("1_1x3_5.html");
      const pickupTemplate = pickupBlocks ? "" : await this.readHtml("pickup_1_1x3_5.html");
      const result: string[] = [];

      CachedData.pendingVisits.forEach(pv => {
        if (pv.visitSessions && pv.visitSessions.length > 0 && this.shouldPrintNametag(pv)) {
          const isChild = childVisits.some(cv => cv.personId === pv.personId);
          result.push(nametagBlocks
            ? LabelRenderer.render(nametagBlocks, this.getNametagContext(pv, isChild, pickupCode), { checkinType: this.printedCheckinType(pv) })
            : this.replaceValues(labelTemplate, pv, childVisits, pickupCode));
        }
      });

      if (childVisits.length > 0 && this.shouldPrintPickup(childVisits)) {
        result.push(pickupBlocks
          ? LabelRenderer.render(pickupBlocks, this.getPickupContext(childVisits, pickupCode))
          : this.replaceValuesPickup(pickupTemplate, childVisits, pickupCode));
      }
      PrinterLog.add(`getAllLabels: produced ${result.length} label(s)`);
      return result;
    } catch (error) {
      PrinterLog.add(`getAllLabels error: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Error getting labels:", error);
      return [];
    }
  }
}

import { Platform } from "react-native";
import { CachedData } from "./CachedData";
import { VisitSessionHelper } from "./VisitSessionHelper";
import { VisitInterface, PersonInterface, ServiceTimeInterface, GroupInterface, LabelBlockInterface } from "./Interfaces";
import { ArrayHelper } from "./ArrayHelper";
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

  private static getNametagContext(visit: VisitInterface, isChild: boolean, pickupCode: string): LabelContext {
    const person: PersonInterface = ArrayHelper.getOne(CachedData.householdMembers || [], "id", visit.personId || "") || {};
    return {
      ...this.getCommonContext(isChild ? pickupCode : ""),
      "person.displayName": person.name?.display || person.displayName || "",
      "person.firstName": person.name?.first || person.firstName || "",
      "person.lastName": person.name?.last || person.lastName || "",
      "person.nickName": person.name?.nick || person.nickName || "",
      "person.nametagNotes": person.nametagNotes || "",
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
            ? LabelRenderer.render(nametagBlocks, this.getNametagContext(pv, isChild, pickupCode))
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

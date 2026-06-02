import { Platform } from "react-native";
import fs from "react-native-fs";
import { CachedData } from "./CachedData";
import { VisitSessionHelper } from "./VisitSessionHelper";
import { VisitInterface, PersonInterface, ServiceTimeInterface, GroupInterface } from "./Interfaces";
import { ArrayHelper } from "./ArrayHelper";
import { PrinterLog } from "./PrinterLog";

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
    if (Platform.OS === "android") {
      return fs.readFileAssets("labels/" + fileName);
    }
    // iOS: the config plugin (withBrotherIOS) registers the templates via
    // addResourceFile, which Xcode copies FLAT into the bundle root — the
    // "labels" group is NOT preserved as a real directory. So read from the
    // bundle root first, falling back to a labels/ subdirectory for safety.
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

  private static getChildVisits() {
    const result: VisitInterface[] = [];
    CachedData.pendingVisits.forEach(pv => {
      let isChild = false;
      pv.visitSessions?.forEach(vs => {
        const serviceTime: ServiceTimeInterface = ArrayHelper.getOne(CachedData.serviceTimes || [], "id", vs.session?.serviceTimeId || "");
        const group: GroupInterface = ArrayHelper.getOne(serviceTime?.groups || [], "id", vs.session?.groupId || "");
        if (group?.parentPickup) { isChild = true; }
      });
      if (isChild) { result.push(pv); }
    });
    return result;
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

  public static async getAllLabels() {
    try {
      const pickupCode = LabelHelper.generatePickupCode();
      const childVisits: VisitInterface[] = LabelHelper.getChildVisits();
      const labelTemplate = await this.readHtml("1_1x3_5.html");
      const pickupTemplate = await this.readHtml("pickup_1_1x3_5.html");
      const result: string[] = [];

      CachedData.pendingVisits.forEach(pv => {
        if (pv.visitSessions && pv.visitSessions.length > 0 && this.shouldPrintNametag(pv)) {
          result.push(this.replaceValues(labelTemplate, pv, childVisits, pickupCode));
        }
      });

      if (childVisits.length > 0 && this.shouldPrintPickup(childVisits)) {
        result.push(this.replaceValuesPickup(pickupTemplate, childVisits, pickupCode));
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

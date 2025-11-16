import fs from "react-native-fs";
import { CachedData } from "./CachedData";
import { VisitSessionHelper } from "./VisitSessionHelper";
import { VisitInterface, PersonInterface, ServiceTimeInterface, GroupInterface } from "./Interfaces";
import { ArrayHelper } from "./ArrayHelper";

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
      let idx = Math.floor(Math.random() * characters.length);
      pickupCode += characters[idx];
    }
    return pickupCode;
  }

  private static readHtml(fileName: string) {
    //*** IMPORTANT: This is reading from /android/app/src/main/assets rather than the /assets folder.  I'd like to change this but am not sure how. */
    return fs.readFileAssets("labels/" + fileName);
  }

  private static replaceValues(html: string, visit: VisitInterface, childVisits: VisitInterface[], pickupCode: string) {
    const person: PersonInterface = ArrayHelper.getOne(CachedData.householdMembers || [], "id", visit.personId || "");
    let isChild: boolean = false;
    childVisits.forEach(cv => { if (cv.personId === person.id) { isChild = true; } });
    let result = html.replace(/\[Name\]/g, person.name?.display || person.displayName || "");
    result = result.replace(/\[Sessions\]/g, VisitSessionHelper.getDisplaySessions(visit.visitSessions || []).replace(/ ,/g, "<br/>"));
    result = result.replace(/\[PickupCode\]/g, (isChild) ? pickupCode : "");
    result = result.replace(/\[Allergies\]/g, (person.nametagNotes) ? person.nametagNotes : "");
    //console.log(result);
    return result;
  }


  private static replaceValuesPickup(html: string, childVisits: VisitInterface[], pickupCode: string) {
    let childList: string[] = [];
    let allergiesList: string[] = [];
    childVisits.forEach(cv => {
      const person: PersonInterface = ArrayHelper.getOne(CachedData.householdMembers || [], "id", cv.personId || "");
      childList.push((person.name?.display || person.displayName || "Unknown") + " - " + VisitSessionHelper.getPickupSessions(cv.visitSessions || []));
      allergiesList.push(person.nametagNotes ?? "");
    });
    let childBullets = "";
    let allergiesBullets = "";
    childList.forEach(child => { childBullets += "<li>" + child + "</li>"; });
    allergiesList.forEach(child => { allergiesBullets += "<li>" + child + "</li>"; });
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
        const group: GroupInterface = ArrayHelper.getOne(serviceTime.groups || [], "id", vs.session?.groupId || "");
        if (group.parentPickup) { isChild = true; }
      });
      if (isChild) { result.push(pv); }
    });
    return result;
  }

  private static shouldPrintNametag(visit: VisitInterface): boolean {
    let shouldPrint = false;
    visit.visitSessions?.forEach(vs => {
      const serviceTime: ServiceTimeInterface = ArrayHelper.getOne(CachedData.serviceTimes || [], "id", vs.session?.serviceTimeId || "");
      const group: GroupInterface = ArrayHelper.getOne(serviceTime.groups || [], "id", vs.session?.groupId || "");
      if (group.printNametag) { shouldPrint = true; }
    });
    return shouldPrint;
  }

  private static shouldPrintPickup(childVisits: VisitInterface[]): boolean {
    let shouldPrint = false;
    childVisits.forEach(cv => {
      cv.visitSessions?.forEach(vs => {
        const serviceTime: ServiceTimeInterface = ArrayHelper.getOne(CachedData.serviceTimes || [], "id", vs.session?.serviceTimeId || "");
        const group: GroupInterface = ArrayHelper.getOne(serviceTime.groups || [], "id", vs.session?.groupId || "");
        if (group.parentPickup) { shouldPrint = true; }
      });
    });
    return shouldPrint;
  }

  public static async getAllLabels() {
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
    return result;
  }
}



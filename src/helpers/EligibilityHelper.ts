import { GroupInterface, PersonInterface } from "./Interfaces";

// Mirrors the Api GradeMapping GRADES ordering; hoist to @churchapps/helpers on next publish.
export const GRADES = [
  "PreK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Graduated"
];

export type Eligibility = "eligible" | "ineligible" | "unknown";

export class EligibilityHelper {

  // Most recent occurrence of an "MM-DD" cutoff on or before `today`; invalid/unset => today.
  static resolveAsOfDate(gradePromotionDate: string | null | undefined, today: Date = new Date()): Date {
    if (!gradePromotionDate) return today;
    const parts = gradePromotionDate.split("-");
    if (parts.length !== 2) return today;
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    if (isNaN(month) || isNaN(day)) return today;
    let candidate = new Date(today.getFullYear(), month - 1, day);
    if (candidate.getTime() > today.getTime()) candidate = new Date(today.getFullYear() - 1, month - 1, day);
    return candidate;
  }

  static ageInMonths(birthDate: Date, asOfDate: Date): number {
    let months = (asOfDate.getFullYear() - birthDate.getFullYear()) * 12 + (asOfDate.getMonth() - birthDate.getMonth());
    if (asOfDate.getDate() < birthDate.getDate()) months -= 1;
    return months;
  }

  private static evalAge(person: { birthDate?: Date | string }, group: { minAgeMonths?: number; maxAgeMonths?: number }, asOfDate: Date): Eligibility {
    if (!person.birthDate) return "unknown";
    const birth = person.birthDate instanceof Date ? person.birthDate : new Date(person.birthDate);
    if (isNaN(birth.getTime())) return "unknown";
    const months = this.ageInMonths(birth, asOfDate);
    if (group.minAgeMonths != null && months < group.minAgeMonths) return "ineligible";
    if (group.maxAgeMonths != null && months > group.maxAgeMonths) return "ineligible";
    return "eligible";
  }

  private static evalGrade(person: { grade?: string }, group: { minGrade?: string; maxGrade?: string }): Eligibility {
    const gi = person.grade ? GRADES.indexOf(person.grade) : -1;
    if (gi === -1) return "unknown";
    const minI = group.minGrade ? GRADES.indexOf(group.minGrade) : -1;
    const maxI = group.maxGrade ? GRADES.indexOf(group.maxGrade) : -1;
    if (minI !== -1 && gi < minI) return "ineligible";
    if (maxI !== -1 && gi > maxI) return "ineligible";
    return "eligible";
  }

  // Never hides a room: missing data resolves to "unknown", rooms with no ranges are "unknown".
  static isEligible(
    person: Pick<PersonInterface, "birthDate" | "grade">,
    group: Pick<GroupInterface, "minAgeMonths" | "maxAgeMonths" | "minGrade" | "maxGrade">,
    asOfDate: Date
  ): Eligibility {
    const results: Eligibility[] = [];
    if (group.minAgeMonths != null || group.maxAgeMonths != null) results.push(this.evalAge(person, group, asOfDate));
    if (group.minGrade != null || group.maxGrade != null) results.push(this.evalGrade(person, group));
    if (results.length === 0) return "unknown";
    if (results.includes("ineligible")) return "ineligible";
    if (results.includes("eligible")) return "eligible";
    return "unknown";
  }
}

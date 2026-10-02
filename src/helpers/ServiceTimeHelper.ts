import { ServiceTimeInterface } from "./Interfaces";

export class ServiceTimeHelper {
  // Comma-separated names of the groups offered at a service time, de-duplicated in first-seen order.
  static getGroupSummary(serviceTime: ServiceTimeInterface): string {
    const seen = new Set<string>();
    const names: string[] = [];
    (serviceTime?.groups || []).forEach(g => {
      const name = (g?.name || "").trim();
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return;
      seen.add(key);
      names.push(name);
    });
    return names.join(", ");
  }
}

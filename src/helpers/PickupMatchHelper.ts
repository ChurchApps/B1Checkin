import { HouseholdPickupInterface } from "./Interfaces";

// Pure name matching for the not-authorized pickup guard. Case-insensitive + fuzzy so a
// typed "Rick Sanders" / "rick sander" / "Sanders, Rick" still trips the block.
export class PickupMatchHelper {

  static normalize(name: string): string {
    return (name || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private static levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const curr = [i];
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = curr;
    }
    return prev[n];
  }

  static isMatch(typed: string, candidate: string): boolean {
    const a = this.normalize(typed);
    const b = this.normalize(candidate);
    if (a.length < 2 || b.length < 2) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    // token overlap (handles reordering like "Sanders Rick") — all of the shorter name's tokens present
    const at = new Set(a.split(" "));
    const bt = b.split(" ");
    if (bt.length > 1 && bt.every(tok => at.has(tok))) return true;
    // small typo tolerance on the whole string
    if (this.levenshtein(a, b) <= 2) return true;
    return false;
  }

  static findNotAuthorized(typed: string, pickupPeople: HouseholdPickupInterface[]): HouseholdPickupInterface | null {
    for (const p of pickupPeople || []) {
      if (p.status === "notAuthorized" && this.isMatch(typed, p.name)) return p;
    }
    return null;
  }
}

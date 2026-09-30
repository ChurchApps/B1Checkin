const CODE_PATTERN = /^[23456789BCDFGHJKLMNPQRSTVWXYZ]{4}$/;
const REPEAT_MS = 4000;

export interface LastScan { code: string; at: number }

export class ScanCodeHelper {
  // Returns the security code in scanned text, or null if the text isn't one.
  static parse(data: string): string | null {
    const code = String(data || "").trim().toUpperCase();
    return CODE_PATTERN.test(code) ? code : null;
  }

  // The camera fires many times per second while a code is in view.
  static isRepeat(last: LastScan, code: string, now: number): boolean {
    return last.code === code && now - last.at < REPEAT_MS;
  }
}

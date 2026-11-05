import { ServiceTimeInterface } from "./Interfaces";

const DAY = 1440;
const WEEK = 7 * DAY;
const parseTime = (value?: string | null) => {
  const match = value?.match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

// Minutes into the day from a name like "10:30 AM Service"; null when the name has no time.
const parseNameTime = (name?: string | null) => {
  const match = name?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = Number(match[1]) % 24;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + Number(match[2]);
};

export class ServiceTimeHelper {
  // Earliest first: the scheduled day and start time when set, else the time in the name, else the name.
  // The Api orders by name as text, which puts "10:30 AM" before "9:00 AM".
  static sortByTime(times: ServiceTimeInterface[]): ServiceTimeInterface[] {
    const key = (st: ServiceTimeInterface) => {
      const start = parseTime(st.startTime);
      if (start !== null) return (st.dayOfWeek ?? 0) * DAY + start;
      return parseNameTime(st.name) ?? Infinity;
    };
    return [...times].sort((a, b) => {
      const ka = key(a), kb = key(b);
      if (ka !== kb) return ka < kb ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }

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

  // Mirrors the Api's CheckinGateHelper, but live on the device clock so a kiosk left running opens and closes on time.
  // ponytail: device time zone, not the church's — kiosks sit at the church.
  static isCheckinOpen(st: ServiceTimeInterface, now = new Date()): boolean {
    const start = parseTime(st.startTime);
    if (st.dayOfWeek == null || st.dayOfWeek < 0 || st.dayOfWeek > 6 || start === null) return true;
    const parsedEnd = parseTime(st.endTime);
    let end = parsedEnd ?? start;
    if (end < start) end += DAY;
    const windowStart = st.dayOfWeek * DAY + start - Math.max(0, st.checkinOpenMinutes ?? 0);
    // Neither an end time nor close minutes: open until the end of that day.
    const openAllDay = parsedEnd === null && st.checkinCloseMinutes == null;
    const windowEnd = openAllDay ? st.dayOfWeek * DAY + DAY - 1 : st.dayOfWeek * DAY + end + Math.max(0, st.checkinCloseMinutes ?? 0);
    const nowMinute = now.getDay() * DAY + now.getHours() * 60 + now.getMinutes();
    return [nowMinute - WEEK, nowMinute, nowMinute + WEEK].some(t => t >= windowStart && t <= windowEnd);
  }

  // Soonest upcoming check-in opening among the times, e.g. "Sun 9:30 AM"; empty when none are scheduled.
  static getOpensLabel(times: ServiceTimeInterface[], locale?: string, now = new Date()): string {
    const nowMinute = now.getDay() * DAY + now.getHours() * 60 + now.getMinutes();
    let best: number | null = null;
    let bestWait = Infinity;
    times.forEach(st => {
      const start = parseTime(st.startTime);
      if (st.dayOfWeek == null || start === null) return;
      const opens = st.dayOfWeek * DAY + start - Math.max(0, st.checkinOpenMinutes ?? 0);
      const wait = (((opens - nowMinute) % WEEK) + WEEK) % WEEK;
      if (wait < bestWait) { bestWait = wait; best = opens; }
    });
    if (best === null) return "";
    // 2024-01-07 was a Sunday; Date rolls the minute offset into the right weekday.
    return new Date(2024, 0, 7, 0, best).toLocaleString(locale, { weekday: "short", hour: "numeric", minute: "2-digit" });
  }
}

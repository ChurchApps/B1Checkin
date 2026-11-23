// PrinterLog pulls in the native printer module (no web/node impl); stub it so the pure
// label logic is unit-testable off-device.
jest.mock("../PrinterLog", () => ({ PrinterLog: { add: jest.fn(), attachNativeListeners: jest.fn() } }));

import { code128Codes, code128Svg, code39Binary, code39Pattern, code39Svg, qrSvg } from "../barcode";
import { LabelRenderer } from "../LabelRenderer";
import i18n from "i18next";
import en from "../../i18n/locales/en.json";
import { LabelHelper } from "../LabelHelper";
import { CachedData } from "../CachedData";
import { LabelBlockInterface, VisitInterface } from "../Interfaces";

const es = { household: { type: { member: "Miembro", guest: "Invitado", volunteer: "Voluntario" } } };
beforeAll(() => i18n.init({ lng: "en", fallbackLng: "en", resources: { en: { translation: en }, es: { translation: es } }, interpolation: { escapeValue: false } }));

describe("code39", () => {
  it("matches known patterns", () => {
    expect(code39Pattern("*")).toBe("nwnnwnwnn");
    expect(code39Pattern("A")).toBe("wnnnnwnnw");
    expect(code39Pattern("0")).toBe("nnnwwnwnn");
    expect(code39Pattern("1")).toBe("wnnwnnnnw");
    expect(code39Pattern("M")).toBe("wnwnnnnwn");
    expect(code39Pattern("%")).toBe("nnnwnwnwn");
  });

  it("has structurally valid unique patterns for all 44 characters", () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*";
    const seen = new Set<string>();
    for (const c of chars) {
      const pattern = code39Pattern(c);
      expect(pattern).toHaveLength(9);
      expect(pattern.split("").filter(e => e === "w")).toHaveLength(3);
      seen.add(pattern);
    }
    expect(seen.size).toBe(44);
  });

  it("encodes A with start/stop and inter-character gaps", () => {
    const star = "100010111011101";
    const a = "111010100010111";
    expect(code39Binary("A")).toBe(star + "0" + a + "0" + star);
  });

  it("produces SVG rects and empty output for empty input", () => {
    expect(code39Svg("BXRC")).toContain("<rect");
    expect(code39Svg("")).toBe("");
  });
});

describe("code128", () => {
  it("computes checksum for BXRC", () => {
    expect(code128Codes("BXRC")).toEqual([104, 34, 56, 50, 35, 25, 106]);
  });

  it("renders SVG", () => {
    expect(code128Svg("BXRC")).toContain("<svg");
  });
});

describe("qr", () => {
  it("renders module rects", () => {
    const svg = qrSvg("BXRC");
    expect(svg).toContain("<svg");
    expect(svg).toContain("<rect");
  });
});

describe("LabelRenderer", () => {
  const ctx = {
    "person.displayName": "Emma Johnson",
    "person.nametagNotes": "Peanut allergy",
    sessions: "9:00 AM: Preschool",
    securityCode: "BXRC"
  };

  it("substitutes fields with positioning and font styles", () => {
    const blocks: LabelBlockInterface[] = [{ type: "field", field: "person.displayName", x: 2, y: 0, w: 60, h: 40, fontSize: 28, bold: true, align: "center" }];
    const html = LabelRenderer.render(blocks, ctx);
    expect(html).toContain("Emma Johnson");
    expect(html).toContain("left:2%;top:0%;width:60%;height:40%;");
    expect(html).toContain("font-size:28vh;");
    expect(html).toContain("font-weight:bold;");
    expect(html).toContain("text-align:center;");
  });

  it("escapes static text", () => {
    const html = LabelRenderer.render([{ type: "text", text: "Kids <3 & Co", x: 0, y: 0, w: 100, h: 20 }], ctx);
    expect(html).toContain("Kids &lt;3 &amp; Co");
  });

  it("honors conditions", () => {
    const allergy: LabelBlockInterface = { type: "field", field: "person.nametagNotes", x: 0, y: 80, w: 100, h: 20, condition: { field: "person.nametagNotes", operator: "notEmpty" } };
    expect(LabelRenderer.render([allergy], ctx)).toContain("Peanut allergy");
    expect(LabelRenderer.render([allergy], { ...ctx, "person.nametagNotes": "" })).not.toContain("Peanut");

    const equals: LabelBlockInterface = { type: "text", text: "MATCH", x: 0, y: 0, w: 10, h: 10, condition: { field: "securityCode", operator: "equals", value: "BXRC" } };
    expect(LabelRenderer.render([equals], ctx)).toContain("MATCH");
    expect(LabelRenderer.render([equals], { ...ctx, securityCode: "ZZZZ" })).not.toContain("MATCH");

    const notEquals: LabelBlockInterface = { type: "text", text: "DIFF", x: 0, y: 0, w: 10, h: 10, condition: { field: "securityCode", operator: "notEquals", value: "BXRC" } };
    expect(LabelRenderer.render([notEquals], ctx)).not.toContain("DIFF");
  });

  it("renders pickup context with multi-line children", () => {
    const pickupCtx = { children: "Emma - 9:00 AM: Preschool\nNoah - 9:00 AM: Nursery", securityCode: "BXRC" };
    const html = LabelRenderer.render([{ type: "field", field: "children", x: 5, y: 30, w: 60, h: 60, fontSize: 10 }], pickupCtx);
    expect(html).toContain("Emma - 9:00 AM: Preschool<br/>Noah - 9:00 AM: Nursery");
  });

  it("renders barcode and qr blocks from the value key", () => {
    const blocks: LabelBlockInterface[] = [
      { type: "barcode", symbology: "code39", x: 60, y: 60, w: 38, h: 30 },
      { type: "qrcode", x: 0, y: 0, w: 30, h: 30, value: "securityCode" }
    ];
    const html = LabelRenderer.render(blocks, ctx);
    expect(html.match(/<svg/g)).toHaveLength(2);
  });

  it("renders boxes and resolves unknown fields to empty", () => {
    const html = LabelRenderer.render([
      { type: "box", x: 0, y: 0, w: 100, h: 10, fill: "#000000" },
      { type: "field", field: "form:abc123", x: 0, y: 50, w: 50, h: 10 }
    ], ctx);
    expect(html).toContain("background-color:#000000;");
    expect(html).toContain("<div style=\"position:absolute;left:0%;top:50%;width:50%;height:10%;font-size:10vh;text-align:left;\"></div>");
  });
});

describe("LabelHelper.isBirthdayWithin", () => {
  it("is true on the birthday itself and at the +/-3 day edges", () => {
    const today = new Date(2026, 5, 15); // Jun 15, 2026
    expect(LabelHelper.isBirthdayWithin(new Date(1990, 5, 15), 3, today)).toBe(true);
    expect(LabelHelper.isBirthdayWithin(new Date(1990, 5, 12), 3, today)).toBe(true);
    expect(LabelHelper.isBirthdayWithin(new Date(1990, 5, 18), 3, today)).toBe(true);
  });

  it("is false just outside the window", () => {
    const today = new Date(2026, 5, 15);
    expect(LabelHelper.isBirthdayWithin(new Date(1990, 5, 11), 3, today)).toBe(false);
    expect(LabelHelper.isBirthdayWithin(new Date(1990, 5, 19), 3, today)).toBe(false);
  });

  it("wraps across the year end (Dec 30 vs Jan 2)", () => {
    expect(LabelHelper.isBirthdayWithin(new Date(1990, 11, 30), 3, new Date(2026, 0, 2))).toBe(true);
    expect(LabelHelper.isBirthdayWithin(new Date(1990, 0, 2), 3, new Date(2025, 11, 30))).toBe(true);
    expect(LabelHelper.isBirthdayWithin(new Date(1990, 11, 20), 3, new Date(2026, 0, 2))).toBe(false);
  });

  it("treats a Feb 29 birthday as Feb 28 in a non-leap year", () => {
    expect(LabelHelper.isBirthdayWithin(new Date(1992, 1, 29), 3, new Date(2027, 1, 28))).toBe(true);
    expect(LabelHelper.isBirthdayWithin(new Date(1992, 1, 29), 3, new Date(2028, 1, 29))).toBe(true); // 2028 is a leap year
  });

  it("is false with no birth date or an invalid one, accepts string dates", () => {
    expect(LabelHelper.isBirthdayWithin(undefined, 3)).toBe(false);
    expect(LabelHelper.isBirthdayWithin(null, 3)).toBe(false);
    expect(LabelHelper.isBirthdayWithin("not-a-date", 3)).toBe(false);
    expect(LabelHelper.isBirthdayWithin("2026-06-15T12:00:00", 3, new Date(2026, 5, 15))).toBe(true);
  });
});

describe("LabelHelper age, birth date, and check-in type", () => {
  const today = new Date(2026, 10, 23); // Nov 23, 2026

  it("formats age in whole years, or months under 2", () => {
    expect(LabelHelper.formatAge("2022-03-14", today)).toBe("4");
    expect(LabelHelper.formatAge("2022-11-24", today)).toBe("3"); // birthday is tomorrow
    expect(LabelHelper.formatAge("2025-05-01T00:00:00.000Z", today)).toBe("18 mo");
    expect(LabelHelper.formatAge("2026-11-01", today)).toBe("0 mo");
  });

  it("leaves age and birth date blank with no, invalid, or future birth dates", () => {
    expect(LabelHelper.formatAge(undefined, today)).toBe("");
    expect(LabelHelper.formatAge("not-a-date", today)).toBe("");
    expect(LabelHelper.formatAge("2027-01-01", today)).toBe("");
    expect(LabelHelper.formatBirthDate(null)).toBe("");
  });

  it("keeps the calendar day of a UTC-midnight birth date", () => {
    expect(LabelHelper.formatBirthDate("2022-03-14T00:00:00.000Z")).toBe(new Date(2022, 2, 14).toLocaleDateString());
  });

  it("takes the check-in type from the visit, else the kiosk's per-person choice", () => {
    expect(LabelHelper.checkinTypeValue({ personId: "P1", checkinType: "volunteer" })).toBe("Volunteer");
    expect(LabelHelper.printedCheckinType({ personId: "P1", checkinType: "volunteer" })).toBe("Volunteer");
    CachedData.checkinTypes = { P2: "guest" };
    expect(LabelHelper.checkinTypeValue({ personId: "P2" })).toBe("Guest");
    expect(LabelHelper.checkinTypeValue({ personId: "P3" })).toBe("");
    expect(LabelHelper.printedCheckinType({ personId: "P3" })).toBe("");
    CachedData.checkinTypes = {};
  });

  it("matches check-in type conditions on the stable value but prints the translation on a non-English kiosk", async () => {
    await i18n.changeLanguage("es");
    try {
      const visit: VisitInterface = { personId: "P1", checkinType: "guest" };
      const ctx = { checkinType: LabelHelper.checkinTypeValue(visit) };
      const printed = { checkinType: LabelHelper.printedCheckinType(visit) };
      const blocks: LabelBlockInterface[] = [
        { type: "text", text: "WELCOME", x: 0, y: 0, w: 50, h: 20, condition: { field: "checkinType", operator: "equals", value: "Guest" } },
        { type: "text", text: "STAFF", x: 0, y: 20, w: 50, h: 20, condition: { field: "checkinType", operator: "equals", value: "Volunteer" } },
        { type: "field", field: "checkinType", x: 50, y: 0, w: 50, h: 20 },
        { type: "barcode", symbology: "code39", value: "checkinType", x: 0, y: 50, w: 50, h: 30 }
      ];
      const html = LabelRenderer.render(blocks, ctx, printed);
      expect(html).toContain("WELCOME");
      expect(html).not.toContain("STAFF");
      expect(html).toContain(">Invitado<");
      expect(html).not.toContain(">Guest<");
      expect(html).toContain(code39Svg("Guest"));
    } finally {
      await i18n.changeLanguage("en");
    }
  });

  it("fills the new fields on a designed nametag", async () => {
    CachedData.serviceTimes = [{ id: "ST1", groups: [{ id: "G1", printNametag: true, parentPickup: false }] }];
    CachedData.labelTemplates = [
      {
        labelType: "nametag",
        isDefault: true,
        content: JSON.stringify([
          { type: "field", field: "person.age", x: 0, y: 0, w: 25, h: 20 },
          { type: "field", field: "person.grade", x: 25, y: 0, w: 25, h: 20 },
          { type: "field", field: "person.birthDate", x: 50, y: 0, w: 25, h: 20 },
          { type: "field", field: "checkinType", x: 75, y: 0, w: 25, h: 20 }
        ])
      }, { labelType: "pickup", content: "[]" }
    ];
    const visit: VisitInterface = { personId: "P1", checkinType: "guest", visitSessions: [{ session: { groupId: "G1", serviceTimeId: "ST1", displayName: "Room" } }] };
    const now = new Date();
    const birthDate = new Date(now.getFullYear() - 7, now.getMonth() - 1, 1); // always 7 years and 1-2 months old
    const labels = await LabelHelper.getAllLabelsFor([visit], [{ id: "P1", birthDate, grade: "2" }], "BXRC");
    expect(labels).toHaveLength(1);
    expect(labels[0]).toContain(">7<");
    expect(labels[0]).toContain(">2<");
    expect(labels[0]).toContain(">" + birthDate.toLocaleDateString() + "<");
    expect(labels[0]).toContain(">Guest<");
    CachedData.serviceTimes = [];
    CachedData.labelTemplates = [];
  });
});

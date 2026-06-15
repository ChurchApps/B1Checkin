import { code128Codes, code128Svg, code39Binary, code39Pattern, code39Svg, qrSvg } from "../barcode";
import { LabelRenderer } from "../LabelRenderer";
import { LabelBlockInterface } from "../Interfaces";

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

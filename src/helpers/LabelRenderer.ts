import { LabelBlockInterface } from "./Interfaces";
import { code128Svg, code39Svg, qrSvg } from "./barcode";

export type LabelContext = Record<string, string>;

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export class LabelRenderer {

  private static passesCondition(block: LabelBlockInterface, ctx: LabelContext) {
    const c = block.condition;
    if (!c) return true;
    const value = ctx[c.field || ""] || "";
    switch (c.operator) {
      case "notEmpty": return value !== "";
      case "empty": return value === "";
      case "equals": return value === (c.value || "");
      case "notEquals": return value !== (c.value || "");
      default: return true;
    }
  }

  private static renderBlock(block: LabelBlockInterface, ctx: LabelContext) {
    let style = `position:absolute;left:${block.x || 0}%;top:${block.y || 0}%;width:${block.w || 0}%;height:${block.h || 0}%;`;
    let content = "";
    switch (block.type) {
      case "text":
      case "field": {
        const raw = block.type === "text" ? block.text || "" : ctx[block.field || ""] || "";
        style += `font-size:${block.fontSize || 10}vh;text-align:${block.align || "left"};`;
        if (block.bold) style += "font-weight:bold;";
        if (block.italic) style += "font-style:italic;";
        content = escapeHtml(raw).replace(/\n/g, "<br/>");
        break;
      }
      case "barcode":
      case "qrcode": {
        const value = ctx[block.value || "securityCode"] || "";
        const symbology = block.type === "qrcode" ? "qr" : block.symbology || "code128";
        content = symbology === "qr" ? qrSvg(value) : symbology === "code39" ? code39Svg(value) : code128Svg(value);
        break;
      }
      case "box":
        if (block.fill) style += `background-color:${block.fill};`;
        if (block.border) style += "border:1px solid #000;box-sizing:border-box;";
        break;
    }
    return `<div style="${style}">${content}</div>`;
  }

  public static render(blocks: LabelBlockInterface[], ctx: LabelContext) {
    const body = blocks.filter(b => this.passesCondition(b, ctx)).map(b => this.renderBlock(b, ctx)).join("");
    return `<html><head><style>body{margin:0px;background-color:#FFF;}</style></head><body>${body}</body></html>`;
  }
}

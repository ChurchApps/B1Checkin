import { create as qrCreate } from "qrcode";

const QUIET = 10;

const CODE39_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*";
const CODE39_PATTERNS = [
  "nnnwwnwnn",
  "wnnwnnnnw",
  "nnwwnnnnw",
  "wnwwnnnnn",
  "nnnwwnnnw",
  "wnnwwnnnn",
  "nnwwwnnnn",
  "nnnwnnwnw",
  "wnnwnnwnn",
  "nnwwnnwnn",
  "wnnnnwnnw",
  "nnwnnwnnw",
  "wnwnnwnnn",
  "nnnnwwnnw",
  "wnnnwwnnn",
  "nnwnwwnnn",
  "nnnnnwwnw",
  "wnnnnwwnn",
  "nnwnnwwnn",
  "nnnnwwwnn",
  "wnnnnnnww",
  "nnwnnnnww",
  "wnwnnnnwn",
  "nnnnwnnww",
  "wnnnwnnwn",
  "nnwnwnnwn",
  "nnnnnnwww",
  "wnnnnnwwn",
  "nnwnnnwwn",
  "nnnnwnwwn",
  "wwnnnnnnw",
  "nwwnnnnnw",
  "wwwnnnnnn",
  "nwnnwnnnw",
  "wwnnwnnnn",
  "nwwnwnnnn",
  "nwnnnnwnw",
  "wwnnnnwnn",
  "nwwnnnwnn",
  "nwnwnwnnn",
  "nwnwnnnwn",
  "nwnnnwnwn",
  "nnnwnwnwn",
  "nwnnwnwnn"
];

export const code39Pattern = (char: string) => CODE39_PATTERNS[CODE39_CHARS.indexOf(char)];

export const code39Binary = (text: string) => {
  const clean = text.toUpperCase().split("").filter(c => CODE39_CHARS.indexOf(c) >= 0 && c !== "*").join("");
  const chars = "*" + clean + "*";
  const parts: string[] = [];
  for (const c of chars) {
    let unit = "";
    code39Pattern(c).split("").forEach((width, i) => { unit += (width === "w" ? "111" : "1").replace(/1/g, i % 2 === 0 ? "1" : "0"); });
    parts.push(unit);
  }
  return parts.join("0");
};

const CODE128_WIDTHS = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
  "2331112"
];

export const code128Codes = (text: string) => {
  const values = text.split("").map(c => c.charCodeAt(0) - 32).filter(v => v >= 0 && v <= 95);
  let checksum = 104;
  values.forEach((v, i) => { checksum += v * (i + 1); });
  return [104, ...values, checksum % 103, 106];
};

const code128Binary = (text: string) => {
  let result = "";
  code128Codes(text).forEach(code => {
    CODE128_WIDTHS[code].split("").forEach((width, i) => { result += (i % 2 === 0 ? "1" : "0").repeat(Number(width)); });
  });
  return result;
};

const binaryToSvg = (binary: string) => {
  let rects = "";
  let run = 0;
  for (let i = 0; i <= binary.length; i++) {
    if (binary[i] === "1") { run++; } else if (run > 0) {
      rects += `<rect x="${QUIET + i - run}" y="0" width="${run}" height="100" fill="#000"/>`;
      run = 0;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${binary.length + QUIET * 2} 100" width="100%" height="100%" preserveAspectRatio="none">${rects}</svg>`;
};

export const code39Svg = (text: string) => (text ? binaryToSvg(code39Binary(text)) : "");

export const code128Svg = (text: string) => (text ? binaryToSvg(code128Binary(text)) : "");

export const qrSvg = (text: string) => {
  if (!text) return "";
  const qr = qrCreate(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  let rects = "";
  for (let r = 0; r < size; r++) {
    let run = 0;
    for (let c = 0; c <= size; c++) {
      if (c < size && data[r * size + c]) { run++; } else if (run > 0) {
        rects += `<rect x="${4 + c - run}" y="${4 + r}" width="${run}" height="1" fill="#000"/>`;
        run = 0;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size + 8} ${size + 8}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${rects}</svg>`;
};

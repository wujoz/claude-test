/* Parser kodów GS1 — odczyt GTIN, daty ważności, partii i wagi z:
   - kodów 2D (GS1 DataMatrix, GS1 QR) i GS1-128 z separatorem FNC1/GS (\x1d),
   - zapisu z nawiasami: (01)05901234123457(17)261231(10)ABC,
   - linków GS1 Digital Link: https://id.gs1.org/01/05901234123457/10/ABC?17=261231
   Zwykły EAN-13 nie zawiera daty — dla niego parse() zwraca null. */
const GS1 = (() => {
  const GS = '\x1d';
  const FIXED = { '00': 18, '01': 14, '02': 14, '03': 14, '04': 16, '11': 6, '12': 6, '13': 6, '14': 6, '15': 6, '16': 6, '17': 6, '18': 6, '19': 6, '20': 2 };
  const ALIASES = { gtin: '01', lot: '10', ser: '21', exp: '17', expdt: '17', bbd: '15', sellby: '16', proddate: '11', packdate: '13' };

  function aiLength(s) {
    const two = s.slice(0, 2);
    if (['23', '24', '25', '40', '41', '42', '71'].includes(two)) return 3;
    if (['31', '32', '33', '34', '35', '36', '39', '70', '72', '80', '81', '82'].includes(two)) return 4;
    return 2;
  }
  function dataLength(ai) {
    if (FIXED[ai] != null) return FIXED[ai];
    if (/^3[1-6]\d\d$/.test(ai)) return 6;
    if (/^41\d$/.test(ai)) return 13;
    return null; // zmienna długość — do separatora GS lub końca
  }

  /* RRMMDD -> RRRR-MM-DD; dzień 00 oznacza ostatni dzień miesiąca */
  function ymd(s) {
    if (!/^\d{6}$/.test(s || '')) return null;
    const y = 2000 + Number(s.slice(0, 2)), m = Number(s.slice(2, 4));
    let d = Number(s.slice(4, 6));
    if (m < 1 || m > 12) return null;
    const last = new Date(y, m, 0).getDate();
    if (d === 0) d = last;
    if (d > last) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function parseRaw(str) {
    const ais = {};
    let i = 0;
    while (i < str.length) {
      if (str[i] === GS) { i++; continue; }
      const aiLen = aiLength(str.slice(i, i + 2));
      const ai = str.slice(i, i + aiLen);
      if (!/^\d+$/.test(ai) || ai.length < aiLen) return null;
      i += aiLen;
      const fixed = dataLength(ai);
      let val;
      if (fixed) { val = str.slice(i, i + fixed); if (val.length < fixed) return null; i += fixed; }
      else { const end = str.indexOf(GS, i); val = str.slice(i, end < 0 ? str.length : end); i = end < 0 ? str.length : end + 1; }
      ais[ai] = val;
    }
    return ais;
  }

  function parseParens(str) {
    const ais = {};
    const re = /\((\d{2,4})\)([^(]*)/g;
    let m, found = false;
    while ((m = re.exec(str))) { ais[m[1]] = m[2].replace(/\x1d/g, '').trim(); found = true; }
    return found ? ais : null;
  }

  function parseDigitalLink(str) {
    let url;
    try { url = new URL(str); } catch (_) { return null; }
    const seg = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    const start = seg.findIndex((s, k) => /^(01|02|gtin)$/i.test(s) && /^\d{8,14}$/.test(seg[k + 1] || ''));
    if (start < 0) return null;
    const ais = {};
    for (let k = start; k + 1 < seg.length; k += 2) {
      const key = ALIASES[seg[k].toLowerCase()] || seg[k];
      if (/^\d{2,4}$/.test(key)) ais[key] = seg[k + 1];
    }
    url.searchParams.forEach((v, k) => {
      const key = ALIASES[k.toLowerCase()] || k;
      if (/^\d{2,4}$/.test(key)) ais[key] = v;
    });
    return ais;
  }

  function parse(text) {
    if (!text) return null;
    let s = String(text).trim();
    let ais = null;
    if (/^https?:\/\//i.test(s)) ais = parseDigitalLink(s);
    else {
      s = s.replace(/^\](C1|e0|d2|Q3|J1)/, '');       // identyfikator symbologii
      if (s.startsWith(GS)) s = s.slice(1);
      if (s.includes('(')) ais = parseParens(s);
      else if (s.includes(GS) || /^(01|02)\d{14}/.test(s)) ais = parseRaw(s);
    }
    if (!ais || !Object.keys(ais).length) return null;

    let gtin = ais['01'] || ais['02'] || null;
    if (gtin) { gtin = gtin.replace(/\D/g, ''); while (gtin.length > 13 && gtin[0] === '0') gtin = gtin.slice(1); }
    const out = {
      gtin, ais,
      expiry: ymd(ais['17']),        // należy spożyć do
      bestBefore: ymd(ais['15']),    // najlepiej spożyć przed
      sellBy: ymd(ais['16']),
      prodDate: ymd(ais['11']),
      packDate: ymd(ais['13']),
      batch: ais['10'] || null,
      count: ais['30'] ? Number(ais['30']) : (ais['37'] ? Number(ais['37']) : null),
      netWeightG: null,
    };
    const w = Object.keys(ais).find((k) => /^310\d$/.test(k));
    if (w) out.netWeightG = Math.round((Number(ais[w]) / Math.pow(10, Number(w[3]))) * 1000);
    if (!out.gtin && !out.expiry && !out.bestBefore) return null;
    return out;
  }

  /* Kod GS1 Digital Link dla etykiet (np. słoik z domową zupą) */
  function digitalLink({ gtin, expiry, batch }) {
    const d = (expiry || '').replace(/-/g, '').slice(2);
    let u = `https://id.gs1.org/01/${String(gtin || '').padStart(14, '0')}`;
    if (batch) u += `/10/${encodeURIComponent(batch)}`;
    if (d) u += `?17=${d}`;
    return u;
  }

  return { parse, ymd, digitalLink };
})();
if (typeof module !== 'undefined') module.exports = GS1;

/**
 * Sorteer teamcodes in logische volgorde:
 * Senioren (1,2,3) → Midweek (MW1) → A-jeugd → B → C → D → E → F → S-teams → Overig
 */
export function sorteerTeamCode(code: string): number {
  // Puur nummer (senioren): "1" → 100, "2" → 200
  if (/^\d+$/.test(code)) return parseInt(code) * 100;

  // MW (midweek): "MW1" → 500 + nummer
  const mw = code.match(/^MW(\d+)$/i);
  if (mw) return 500 + parseInt(mw[1]);

  // Letter + nummer (jeugd): "A1" → 1010, "B2" → 1120
  const m = code.match(/^([A-F])(\d+)$/);
  if (m) {
    const letter = m[1].charCodeAt(0) - 64; // A=1, B=2, ...
    return 1000 + letter * 100 + parseInt(m[2]) * 10;
  }

  // S-teams (selectie): "S1" → 7010
  const s = code.match(/^S(\d+)$/);
  if (s) return 7000 + parseInt(s[1]) * 10;

  // Overig
  return 9000;
}

/**
 * Categoriseer een teamcode naar weergave-categorie
 */
export function categoriseerTeam(code: string): string {
  if (/^\d+$/.test(code)) return "Senioren";
  if (/^MW/i.test(code)) return "Midweek";
  if (/^S\d/.test(code)) return "Senioren";
  if (code.startsWith("A")) return "A-jeugd";
  if (code.startsWith("B")) return "B-jeugd";
  if (code.startsWith("C")) return "C-jeugd";
  if (code.startsWith("D")) return "D-jeugd";
  if (code.startsWith("E")) return "E-jeugd";
  if (code.startsWith("F")) return "F-jeugd";
  return "Overig";
}

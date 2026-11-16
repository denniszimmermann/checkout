// Eine Folie ist eine Liste einfacher Elemente in cm auf 33,867 × 19,05 cm (16:9).
// Dieselbe Liste wird als Vorschau (SVG), als PowerPoint und als PDF ausgegeben.

export const FW = 33.867;
export const FH = 19.05;
/** Punkt -> cm */
export const PT = 2.54 / 72;

export type Run = { t: string; color?: string; bold?: boolean };

export type El =
  | { t: 'img'; src: string; x: number; y: number; w: number; h: number; flipH?: boolean }
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill?: string; alpha?: number; line?: string; lw?: number }
  | {
      t: 'text'; x: number; y: number; w: number; h: number; zeilen: Run[][]; size: number; color: string;
      bold?: boolean; align: 'l' | 'c' | 'r'; valign?: 't' | 'm' | 'b'; rot?: number; underline?: boolean;
    }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; color: string; lw: number; pfeile?: 'beide' | 'ende' };

export type Folie = { id: string; titel: string; els: El[]; kasseId?: string; platzId?: string };

type TextOpt = Partial<Pick<Extract<El, { t: 'text' }>, 'color' | 'bold' | 'align' | 'valign' | 'rot' | 'underline'>>;

export const text = (
  x: number, y: number, w: number, h: number, inhalt: string | Run[][], size: number, o: TextOpt = {},
): El => ({
  t: 'text', x, y, w, h, size,
  zeilen: typeof inhalt === 'string' ? inhalt.split('\n').map((z) => [{ t: z }]) : inhalt,
  color: o.color ?? '#4D4D4D', bold: o.bold, align: o.align ?? 'l', valign: o.valign ?? 'm', rot: o.rot,
  underline: o.underline,
});

export const rect = (
  x: number, y: number, w: number, h: number, fill?: string, line?: string, lw = 0.75, alpha?: number,
): El => ({ t: 'rect', x, y, w, h, fill, line, lw, alpha });

export const img = (src: string, x: number, y: number, w: number, h: number, flipH = false): El => ({
  t: 'img', src, x, y, w, h, flipH,
});

export const linie = (
  x1: number, y1: number, x2: number, y2: number, color = '#4D4D4D', lw = 0.5, pfeile?: 'beide' | 'ende',
): El => ({ t: 'line', x1, y1, x2, y2, color, lw, pfeile });

/** Spiegelt ein Element an der senkrechten Folienmitte (Texte bleiben lesbar). */
export function spiegeln(e: El): El {
  switch (e.t) {
    case 'img': return { ...e, x: FW - e.x - e.w, flipH: !e.flipH };
    case 'rect': return { ...e, x: FW - e.x - e.w };
    case 'line': return { ...e, x1: FW - e.x1, x2: FW - e.x2 };
    case 'text': {
      const align = e.align === 'l' ? 'r' : e.align === 'r' ? 'l' : 'c';
      const rot = e.rot && e.rot % 90 !== 0 ? 360 - e.rot : e.rot;
      return { ...e, x: FW - e.x - e.w, align, rot };
    }
  }
}

/** Schwarz oder Weiß, je nachdem was auf der Farbe besser lesbar ist */
export function kontrast(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.68 ? '#000000' : '#FFFFFF';
}

// ---- Gemeinsame Geometrie für die SVG-Ausgaben ----

export type TextZeile = { x: number; y: number; anchor: 'start' | 'middle' | 'end'; runs: Run[] };

/** Grundlinien der Textzeilen innerhalb des Textrahmens */
export function textLayout(e: Extract<El, { t: 'text' }>): { fs: number; zeilen: TextZeile[]; cx: number; cy: number } {
  const fs = e.size * PT;
  const lh = fs * 1.2;
  const gesamt = e.zeilen.length * lh;
  const top = e.valign === 't' ? e.y : e.valign === 'b' ? e.y + e.h - gesamt : e.y + (e.h - gesamt) / 2;
  const x = e.align === 'l' ? e.x : e.align === 'r' ? e.x + e.w : e.x + e.w / 2;
  const anchor = e.align === 'l' ? 'start' : e.align === 'r' ? 'end' : 'middle';
  return {
    fs, cx: e.x + e.w / 2, cy: e.y + e.h / 2,
    zeilen: e.zeilen.map((runs, i) => ({ x, y: top + i * lh + fs * 0.93, anchor, runs })),
  };
}

/** Pfeilspitzen einer Linie als Dreiecke ("x,y x,y x,y") */
export function pfeilSpitzen(e: Extract<El, { t: 'line' }>): string[] {
  if (!e.pfeile) return [];
  const len = Math.hypot(e.x2 - e.x1, e.y2 - e.y1) || 1;
  const ux = (e.x2 - e.x1) / len, uy = (e.y2 - e.y1) / len;
  const l = Math.max(0.16, e.lw * PT * 5), b = l * 0.38;
  const spitze = (px: number, py: number, dx: number, dy: number) =>
    `${px},${py} ${px - dx * l - dy * b},${py - dy * l + dx * b} ${px - dx * l + dy * b},${py - dy * l - dx * b}`;
  const out = [spitze(e.x2, e.y2, ux, uy)];
  if (e.pfeile === 'beide') out.push(spitze(e.x1, e.y1, -ux, -uy));
  return out;
}

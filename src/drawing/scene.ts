import { anordnen } from '@/domain/fit';
import {
  ModulTyp, Projekt, STOERSTELLEN_NAMEN, Stellflaeche, Warengruppe, cm,
} from '@/domain/types';

// Zeichnungen als einfache Formenliste in cm-Koordinaten. Dieselbe Liste wird
// in der App (react-native-svg) und im PDF (SVG-Text) dargestellt.

export type Form =
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill: string; stroke?: string; sw?: number; dash?: boolean; hit?: string }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; sw: number }
  | { t: 'text'; x: number; y: number; text: string; size: number; anchor: 'start' | 'middle' | 'end'; fill: string; bold?: boolean };

export type Szene = { w: number; h: number; formen: Form[] };

const TINTE = '#1B2A3A';
const GRAU = '#8A96A3';
const LEER = '#FFFFFF';
const SPERRE = '#E4E7EB';
const REST = '#FFF4E0';
const RESTLINIE = '#C77700';

const kuerzen = (text: string, breite: number, size: number) => {
  const max = Math.floor(breite / (size * 0.56));
  if (max < 2) return '';
  return text.length <= max ? text : text.slice(0, max - 1) + '…';
};

function masslinie(formen: Form[], x1: number, x2: number, y: number, text: string, size: number) {
  const sw = size * 0.08;
  formen.push({ t: 'line', x1, y1: y, x2, y2: y, stroke: GRAU, sw });
  for (const x of [x1, x2])
    formen.push({ t: 'line', x1: x, y1: y - size * 0.4, x2: x, y2: y + size * 0.4, stroke: GRAU, sw });
  const t = kuerzen(text, x2 - x1, size);
  if (t) formen.push({ t: 'text', x: (x1 + x2) / 2, y: y + size * 1.25, text: t, size, anchor: 'middle', fill: TINTE });
}

/** Frontansicht einer Stellfläche. hit = "<modulId>:<bodenIndex>" */
export function frontansicht(f: Stellflaeche, modulTypen: ModulTyp[], gruppen: Warengruppe[]): Szene {
  const formen: Form[] = [];
  const laenge = Math.max(f.laenge, 1);
  const a = anordnen(f.module, f.laenge, f.stoerstellen);
  const typ = (id: string) => modulTypen.find((t) => t.id === id);
  const hMax = Math.max(120, f.maxHoehe, ...a.module.map((m) => typ(m.modulTypId)?.hoehe ?? 0));
  const size = Math.max(7, Math.min(11, laenge / 40));
  const rand = size;
  const oben = size * 2.2;
  const boden = oben + hMax;
  const sw = size * 0.1;

  // Fußboden
  formen.push({ t: 'line', x1: rand, y1: boden, x2: rand + laenge, y2: boden, stroke: TINTE, sw: sw * 2 });

  for (const s of f.stoerstellen) {
    if (s.breite <= 0) continue;
    const x = rand + s.position;
    formen.push({
      t: 'rect', x, y: oben, w: s.breite, h: hMax,
      fill: s.blockiert ? SPERRE : 'none', stroke: GRAU, sw, dash: true,
    });
    const t = kuerzen(STOERSTELLEN_NAMEN[s.typ], s.breite, size);
    if (t) formen.push({ t: 'text', x: x + s.breite / 2, y: oben + size * 1.4, text: t, size, anchor: 'middle', fill: GRAU });
  }

  for (const l of a.luecken) {
    formen.push({ t: 'rect', x: rand + l.x, y: boden - 40, w: l.breite, h: 40, fill: REST, stroke: RESTLINIE, sw, dash: true });
    const t = kuerzen(`Rest ${cm(l.breite)}`, l.breite, size);
    if (t) formen.push({ t: 'text', x: rand + l.x + l.breite / 2, y: boden - 20 + size * 0.35, text: t, size, anchor: 'middle', fill: RESTLINIE });
  }

  for (const m of a.module) {
    if (m.x === null) continue;
    const t = typ(m.modulTypId);
    const h = t?.hoehe ?? 140;
    const x = rand + m.x;
    const y0 = boden - h;
    const n = Math.max(1, m.warengruppen.length);
    const sockel = 10;
    const fach = (h - sockel) / n;
    m.warengruppen.forEach((gid, i) => {
      const g = gruppen.find((x) => x.id === gid);
      const y = y0 + i * fach;
      formen.push({ t: 'rect', x, y, w: m.breite, h: fach, fill: g?.farbe ?? LEER, stroke: TINTE, sw: sw * 0.6, hit: `${m.id}:${i}` });
      const fs = Math.min(size, fach * 0.5);
      const text = kuerzen(g?.name ?? '– wählen –', m.breite - 4, fs);
      if (text) formen.push({ t: 'text', x: x + m.breite / 2, y: y + fach / 2 + fs * 0.35, text, size: fs, anchor: 'middle', fill: g ? TINTE : GRAU });
    });
    formen.push({ t: 'rect', x, y: boden - sockel, w: m.breite, h: sockel, fill: '#5B6B7B', stroke: TINTE, sw: sw * 0.6 });
    formen.push({ t: 'rect', x, y: y0, w: m.breite, h, fill: 'none', stroke: TINTE, sw: sw * 1.6 });
    const name = kuerzen(t?.name ?? 'Modul', m.breite, size);
    if (name) formen.push({ t: 'text', x: x + m.breite / 2, y: y0 - size * 0.5, text: name, size, anchor: 'middle', fill: TINTE, bold: true });
    masslinie(formen, x, x + m.breite, boden + size * 1.2, cm(m.breite), size);
  }

  masslinie(formen, rand, rand + laenge, boden + size * 3.6, `${cm(f.laenge)} cm`, size);
  return { w: laenge + rand * 2, h: boden + size * 5.6, formen };
}

/** Draufsicht der ganzen Kassenzone (schematisch, maßstäblich). */
export function draufsicht(p: Projekt, modulTypen: ModulTyp[], gruppen: Warengruppe[]): Szene {
  const formen: Form[] = [];
  const size = 10;
  const sw = 1;
  const rand = size * 1.5;
  const oben = size * 2.5;
  const typ = (id: string) => modulTypen.find((t) => t.id === id);
  const farbe = (gid: string | null | undefined) => gruppen.find((g) => g.id === gid)?.farbe ?? LEER;
  const tiefeVon = (f: Stellflaeche) =>
    Math.max(30, ...f.module.filter((m) => m.x !== null).map((m) => typ(m.modulTypId)?.tiefe ?? 0));

  let x = rand;
  let unten = oben;

  // Module einer Fläche als Streifen: laengs = Richtung der Flächenlänge
  const streifen = (f: Stellflaeche, x0: number, y0: number, senkrecht: boolean) => {
    const tiefe = tiefeVon(f);
    const box = (pos: number, len: number, t: number, fill: string, stroke: string, dash = false) =>
      formen.push(senkrecht
        ? { t: 'rect', x: x0 + tiefe - t, y: y0 + pos, w: t, h: len, fill, stroke, sw, dash }
        : { t: 'rect', x: x0 + pos, y: y0, w: len, h: t, fill, stroke, sw, dash });
    box(0, Math.max(f.laenge, 1), tiefe, 'none', GRAU, true);
    for (const s of f.stoerstellen) if (s.breite > 0) box(s.position, s.breite, tiefe, s.blockiert ? SPERRE : 'none', GRAU, true);
    for (const m of f.module) {
      if (m.x === null) continue;
      box(m.x, m.breite, typ(m.modulTypId)?.tiefe ?? tiefe, farbe(m.warengruppen.find((g) => g)), TINTE);
    }
    return tiefe;
  };

  for (const k of p.kassenplaetze) {
    const flaechen = p.stellflaechen.filter((f) => f.kassenplatzId === k.id);
    let hoehe = Math.max(k.tischLaenge, 1);
    for (const f of flaechen) {
      x += streifen(f, x, oben, true) + 2;
      hoehe = Math.max(hoehe, f.laenge);
    }
    const tb = Math.max(k.tischBreite, 20);
    formen.push({ t: 'rect', x, y: oben, w: tb, h: Math.max(k.tischLaenge, 1), fill: '#DCE6F0', stroke: TINTE, sw: sw * 1.5 });
    formen.push({ t: 'text', x: x + tb / 2, y: oben - size * 0.6, text: `Kasse ${k.nummer}`, size, anchor: 'middle', fill: TINTE, bold: true });
    if (k.tischLaenge > 0)
      formen.push({ t: 'text', x: x + tb / 2, y: oben + k.tischLaenge / 2, text: cm(k.tischLaenge), size, anchor: 'middle', fill: TINTE });
    x += tb;
    if (k.gangBreite > 0) {
      masslinie(formen, x, x + k.gangBreite, oben + Math.max(k.tischLaenge, 60) / 2, `Gang ${cm(k.gangBreite)}`, size * 0.9);
      x += k.gangBreite;
    } else x += 20;
    unten = Math.max(unten, oben + hoehe);
  }

  let breite = x;
  for (const f of p.stellflaechen.filter((f) => !p.kassenplaetze.some((k) => k.id === f.kassenplatzId))) {
    unten += size * 2.6;
    formen.push({ t: 'text', x: rand, y: unten - size * 0.5, text: f.name, size, anchor: 'start', fill: TINTE, bold: true });
    unten += streifen(f, rand, unten, false);
    breite = Math.max(breite, rand + f.laenge);
  }

  return { w: breite + rand, h: unten + rand, formen };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** SVG-Text für das PDF */
export function alsSvg(s: Szene): string {
  const teile = s.formen.map((f) => {
    if (f.t === 'rect')
      return `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" fill="${f.fill}" stroke="${f.stroke ?? 'none'}" stroke-width="${f.sw ?? 0}"${f.dash ? ` stroke-dasharray="${(f.sw ?? 1) * 4} ${(f.sw ?? 1) * 3}"` : ''}/>`;
    if (f.t === 'line')
      return `<line x1="${f.x1}" y1="${f.y1}" x2="${f.x2}" y2="${f.y2}" stroke="${f.stroke}" stroke-width="${f.sw}"/>`;
    return `<text x="${f.x}" y="${f.y}" font-size="${f.size}" text-anchor="${f.anchor}" fill="${f.fill}"${f.bold ? ' font-weight="bold"' : ''} font-family="Helvetica, Arial, sans-serif">${esc(f.text)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.w} ${s.h}" width="100%">${teile.join('')}</svg>`;
}

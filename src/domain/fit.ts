import { ModulTyp, PlatziertesModul, Stoerstelle, Vorlage, uid } from './types';

const EPS = 1e-6;

export type Abschnitt = { von: number; bis: number };

/** Freie Abschnitte der Stellfläche zwischen blockierenden Störstellen. */
export function freieAbschnitte(laenge: number, stoerstellen: Stoerstelle[]): Abschnitt[] {
  const sperren = stoerstellen
    .filter((s) => s.blockiert && s.breite > 0)
    .map((s) => ({ von: Math.max(0, s.position), bis: Math.min(laenge, s.position + s.breite) }))
    .filter((s) => s.bis > s.von)
    .sort((a, b) => a.von - b.von);
  const frei: Abschnitt[] = [];
  let pos = 0;
  for (const s of sperren) {
    if (s.von - pos > EPS) frei.push({ von: pos, bis: s.von });
    pos = Math.max(pos, s.bis);
  }
  if (laenge - pos > EPS) frei.push({ von: pos, bis: laenge });
  return frei;
}

export type Anordnung = {
  module: PlatziertesModul[];
  /** Summe der unbelegten, nicht gesperrten Länge */
  rest: number;
  /** Unbelegte Stücke für die Zeichnung */
  luecken: { x: number; breite: number }[];
};

/**
 * Stellt Module in ihrer Reihenfolge von links nach rechts auf.
 * Passt ein Modul nicht mehr vor die nächste Störstelle, rückt es dahinter.
 */
export function anordnen(
  module: PlatziertesModul[],
  laenge: number,
  stoerstellen: Stoerstelle[],
): Anordnung {
  const frei = freieAbschnitte(laenge, stoerstellen);
  const belegtBis = frei.map((a) => a.von);
  let seg = 0;
  const out = module.map((m) => {
    for (let s = seg; s < frei.length; s++) {
      if (belegtBis[s] + m.breite <= frei[s].bis + EPS) {
        const x = belegtBis[s];
        belegtBis[s] += m.breite;
        seg = s;
        return { ...m, x };
      }
    }
    return { ...m, x: null };
  });
  const luecken = frei
    .map((a, i) => ({ x: belegtBis[i], breite: a.bis - belegtBis[i] }))
    .filter((l) => l.breite > EPS);
  return { module: out, rest: luecken.reduce((s, l) => s + l.breite, 0), luecken };
}

export type FitErgebnis = Anordnung & { warnungen: string[] };

type Kandidat = { slotIdx: number; pflicht: boolean; prio: number; breiten: number[] };
type Wertung = { pflicht: number; breite: number; prio: number; anzahl: number };
type Loesung = { w: Wertung; wahl: (number | null)[] };

const besser = (a: Wertung, b: Wertung) => {
  if (a.pflicht !== b.pflicht) return a.pflicht > b.pflicht;
  if (Math.abs(a.breite - b.breite) > EPS) return a.breite > b.breite;
  if (Math.abs(a.prio - b.prio) > EPS) return a.prio > b.prio;
  return a.anzahl < b.anzahl;
};

/**
 * Passt eine Vorlage an die gemessene Länge an:
 * 1. Pflichtmodule haben Vorrang, 2. dann möglichst wenig Rest,
 * 3. bei Gleichstand gewinnen die wichtigeren optionalen Module.
 * Die Reihenfolge der Vorlage bleibt erhalten.
 */
export function fitTemplate(
  vorlage: Vorlage,
  laenge: number,
  stoerstellen: Stoerstelle[],
  modulTypen: ModulTyp[] = [],
): FitErgebnis {
  const frei = freieAbschnitte(laenge, stoerstellen);
  const kandidaten: Kandidat[] = [];
  vorlage.slots.forEach((slot, slotIdx) => {
    const n = slot.pflicht ? 1 : Math.max(1, slot.maxAnzahl);
    for (let i = 0; i < n; i++)
      kandidaten.push({
        slotIdx,
        pflicht: slot.pflicht,
        prio: slot.prioritaet,
        breiten: [...slot.breiten].sort((a, b) => a - b),
      });
  });

  const memo = new Map<string, Loesung>();
  const leer: Loesung = { w: { pflicht: 0, breite: 0, prio: 0, anzahl: 0 }, wahl: [] };

  const suche = (i: number, seg: number, pos: number): Loesung => {
    if (i >= kandidaten.length) return leer;
    const key = `${i}|${seg}|${Math.round(pos * 100)}`;
    const hit = memo.get(key);
    if (hit) return hit;
    const k = kandidaten[i];
    // Variante: Modul weglassen
    const ohne = suche(i + 1, seg, pos);
    let best: Loesung = { w: ohne.w, wahl: [null, ...ohne.wahl] };
    for (const b of k.breiten) {
      for (let s = seg; s < frei.length; s++) {
        const start = s === seg ? pos : frei[s].von;
        if (start + b <= frei[s].bis + EPS) {
          const r = suche(i + 1, s, start + b);
          const w: Wertung = {
            pflicht: r.w.pflicht + (k.pflicht ? 1 : 0),
            breite: r.w.breite + b,
            prio: r.w.prio + (k.pflicht ? 0 : b / Math.max(1, k.prio)),
            anzahl: r.w.anzahl + 1,
          };
          if (besser(w, best.w)) best = { w, wahl: [b, ...r.wahl] };
          break; // wie anordnen(): erster passender Abschnitt
        }
      }
    }
    memo.set(key, best);
    return best;
  };

  const start = frei.length ? frei[0].von : 0;
  const loesung = suche(0, 0, start);

  const warnungen: string[] = [];
  const module: PlatziertesModul[] = [];
  kandidaten.forEach((k, i) => {
    const slot = vorlage.slots[k.slotIdx];
    const b = loesung.wahl[i] ?? null;
    if (b === null) {
      if (k.pflicht) {
        const name = modulTypen.find((t) => t.id === slot.modulTypId)?.name ?? slot.modulTypId;
        warnungen.push(`Pflichtmodul „${name}“ passt nicht auf die Fläche.`);
      }
      return;
    }
    const boeden =
      modulTypen.find((t) => t.id === slot.modulTypId)?.boeden ?? slot.standardWarengruppen.length;
    module.push({
      id: uid(),
      slotId: slot.id,
      modulTypId: slot.modulTypId,
      breite: b,
      x: null,
      warengruppen: Array.from({ length: boeden }, (_, n) => slot.standardWarengruppen[n] ?? null),
    });
  });

  return { ...anordnen(module, laenge, stoerstellen), warnungen };
}

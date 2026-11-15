// Alle Maße in Zentimetern.

export type Warengruppe = { id: string; name: string; farbe: string };

export type ModulTyp = {
  id: string;
  name: string;
  hoehe: number;
  tiefe: number;
  boeden: number;
};

export type VorlagenSlot = {
  id: string;
  modulTypId: string;
  /** Erlaubte Rasterbreiten, z. B. [62.5, 100, 125] */
  breiten: number[];
  pflicht: boolean;
  /** 1 = wichtigste; nur für optionale Slots relevant */
  prioritaet: number;
  /** Wie oft der Slot höchstens gesetzt wird (Pflichtslots: 1) */
  maxAnzahl: number;
  /** Standard-Warengruppe je Boden, von oben nach unten */
  standardWarengruppen: (string | null)[];
};

export type Vorlage = {
  id: string;
  name: string;
  beschreibung: string;
  /** true = Platzhalter, noch nicht aus echten Unterlagen übernommen */
  beispiel: boolean;
  slots: VorlagenSlot[];
};

export type StoerstellenTyp = 'saeule' | 'tuer' | 'fluchtweg' | 'steckdose' | 'sonstiges';

export type Stoerstelle = {
  id: string;
  typ: StoerstellenTyp;
  /** Abstand vom linken Ende der Stellfläche */
  position: number;
  breite: number;
  /** true = hier darf kein Modul stehen */
  blockiert: boolean;
  notiz: string;
};

export type PlatziertesModul = {
  id: string;
  slotId: string;
  modulTypId: string;
  breite: number;
  /** Position vom linken Ende; null = passt nicht mehr auf die Fläche */
  x: number | null;
  /** Warengruppe je Boden, von oben nach unten */
  warengruppen: (string | null)[];
};

export type Stellflaeche = {
  id: string;
  name: string;
  kassenplatzId: string | null;
  laenge: number;
  maxHoehe: number;
  maxTiefe: number;
  stoerstellen: Stoerstelle[];
  vorlageId: string | null;
  module: PlatziertesModul[];
};

export type Kassenplatz = {
  id: string;
  nummer: number;
  tischLaenge: number;
  tischBreite: number;
  gangBreite: number;
};

export type Projekt = {
  id: string;
  markt: string;
  datum: string;
  notizen: string;
  kassenplaetze: Kassenplatz[];
  stellflaechen: Stellflaeche[];
};

export const STOERSTELLEN_NAMEN: Record<StoerstellenTyp, string> = {
  saeule: 'Säule',
  tuer: 'Tür',
  fluchtweg: 'Fluchtweg',
  steckdose: 'Steckdose',
  sonstiges: 'Sonstiges',
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** 62.5 -> "62,5" · 100 -> "100" */
export const cm = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');

import {
  Boden, Kasse, KassenTyp, PlatzArt, Platzierung, Projekt, STAMMDATEN_FELDER, Stammdaten,
  Warengruppe, uid,
} from './types';

// Warengruppen und Farben wie in der PowerPoint-Vorlage
export const WARENGRUPPEN: Warengruppe[] = [
  { id: 'gum', name: 'Gum', farbe: '#0099FF' },
  { id: 'bonbons', name: 'Bonbons', farbe: '#00B050' },
  { id: 'suesswaren', name: 'Süßwaren', farbe: '#C00000' },
  { id: 'nonfood', name: 'Non Food', farbe: '#948A54' },
  { id: 'spirituosen', name: 'Spirituosen', farbe: '#FFC000' },
  { id: 'tabak', name: 'Tabakwaren', farbe: '#7030A0' },
  { id: 'ferrero', name: 'Ferrero', farbe: '#FF0000' },
  { id: 'zeitungen', name: 'Zeitungen', farbe: '#E36C09' },
];

export const TIEFEN = ['150', '200', '210', '260', '310'];

export const FARBAUSWAHL = [
  '#0099FF', '#00B050', '#C00000', '#948A54', '#FFC000', '#7030A0', '#FF0000', '#E36C09',
  '#00B0F0', '#92D050', '#7F7F7F', '#1F4E79', '#F4B6C2', '#000000',
];

export const neuerBoden = (vorlage?: Boden): Boden => ({
  id: uid(), warengruppeId: vorlage?.warengruppeId ?? null, tiefe: vorlage?.tiefe ?? null,
});

const boeden = (n: number) => Array.from({ length: n }, () => neuerBoden());

export const neuePlatzierung = (art: PlatzArt, seite: 'links' | 'rechts' = 'links'): Platzierung => ({
  id: uid(), art, seite, spiegeln: false, stand: 'ueber',
  breite: art === 'gondelkopf' ? 62.5 : 100, hoehe: 140,
  boeden: boeden(art === 'gondelkopf' ? 6 : 4),
  seitenwand: 'keine', eckblenden: false, hakenLaenge: '', hakenMenge: '',
});

export const neueKasse = (typ: KassenTyp, name: string): Kasse => ({
  id: uid(), typ, name, laufbandLaenge: 0, laufbandHoehe: 86.5, laufbandBreite: 53.5,
  rueckwand: [], platzierungen: [],
});

export const leereStammdaten = (): Stammdaten =>
  Object.fromEntries(STAMMDATEN_FELDER.map((f) => [f.key, ''])) as Stammdaten;

export const heute = () => new Date().toISOString().slice(0, 10);

export const neuesProjekt = (markt: string): Projekt => ({
  id: uid(), stand: heute(), haendler: 'EDEKA', logo: 'edeka', logoBildId: null,
  stammdaten: { ...leereStammdaten(), markt },
  grundrissBildId: null, marker: [], fakten: null, kassen: [],
});

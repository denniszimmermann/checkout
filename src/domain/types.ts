// Alle Maße in Zentimetern.

export type Warengruppe = { id: string; name: string; farbe: string };

export type Boden = { id: string; warengruppeId: string | null; tiefe: string | null };

export type KassenTyp = 'info' | 'tandem' | 'einzel' | 'sco';
export type PlatzArt = 'laufband' | 'gondelkopf';
export type Seitenwand = 'keine' | 'links' | 'rechts' | 'beidseitig';

/** Eine Platzierung ergibt genau eine Folie. */
export type Platzierung = {
  id: string;
  art: PlatzArt;
  /** Laufbandseite laut Folientitel */
  seite: 'links' | 'rechts';
  /** Darstellung spiegeln (Regal auf der anderen Bildseite) */
  spiegeln: boolean;
  /** Regal steht auf dem Laufband oder auf dem Boden */
  stand: 'ueber' | 'boden';
  breite: number;
  hoehe: number;
  boeden: Boden[];
  seitenwand: Seitenwand;
  eckblenden: boolean;
  hakenLaenge: string;
  hakenMenge: string;
};

export type Kasse = {
  id: string;
  typ: KassenTyp;
  /** Bezeichnung wie auf dem Plan, z. B. "1" oder "5/6" */
  name: string;
  laufbandLaenge: number;
  laufbandHoehe: number;
  laufbandBreite: number;
  /** Rückwand hinter der Infokasse (z. B. Tabakwaren), von oben nach unten */
  rueckwand: Boden[];
  platzierungen: Platzierung[];
};

export type Marker = { id: string; art: 'nummer' | 'pfeil'; text: string; x: number; y: number };

export const STAMMDATEN_FELDER = [
  { key: 'markt', label: 'Name des Marktes' },
  { key: 'ansprechpartner', label: 'Ansprechpartner' },
  { key: 'telefon', label: 'Telefonnr. Ansprechpartner' },
  { key: 'adresse', label: 'Adresse (Straße, PLZ, Ort)' },
  { key: 'kundenNr', label: 'Ferrero Kunden Nr.' },
  { key: 'anlieferung', label: 'Gewünschte Anlieferung Material Ladenbau' },
  { key: 'aufbautermin', label: 'Gewünschter Aufbautermin' },
  { key: 'rampe', label: 'Anlieferung per LKW -> Rampe vorhanden (ja/nein)' },
  { key: 'pilot', label: 'Pilotmarkt oder Folgemarkt?' },
  { key: 'getraenkemarkt', label: 'Getränkemarkt (j/n)' },
  { key: 'umbau', label: 'Umbau oder Neueröffnung? (wenn Neueröffnung: Datum?)' },
  { key: 'kassenanzahl', label: 'Kassenanzahl' },
  { key: 'hersteller', label: 'Kassenband Hersteller' },
  { key: 'nummerierung', label: 'Kassen Nummerierung: Zählweise Start von links / rechts' },
  { key: 'infoNummeriert', label: 'Info Kasse mit nummeriert?' },
  { key: 'ralRahmen', label: 'RAL Farbe Rahmen' },
  { key: 'ralRegal', label: 'RAL Farbe Regalierung' },
  { key: 'ladenbau', label: 'Ladenbau' },
  { key: 'projektleiter', label: 'Ferrero Projektleiter' },
  { key: 'projektleiterTel', label: 'Telefon Projektleiter' },
  { key: 'epa', label: 'Elektronische Preisauszeichnung (ja/nein)' },
  { key: 'azGum', label: 'AZ-Schienen: Gum (Höhe in mm)' },
  { key: 'azSuess', label: 'AZ-Schienen: Süßware/Bonbons (Höhe in mm)' },
  { key: 'azNonFood', label: 'AZ-Schienen: Non-Food (Höhe in mm)' },
  { key: 'acryl', label: 'Acrylschienen (H 50 mm) mitliefern?' },
  { key: 'hakenLochwand', label: 'Lochwand-Haken (Länge in mm)' },
  { key: 'hakenSchlaufen', label: 'Schlaufenhaken (Länge in mm)' },
] as const;

export type StammdatenKey = (typeof STAMMDATEN_FELDER)[number]['key'];
export type Stammdaten = Record<StammdatenKey, string>;

export type Projekt = {
  id: string;
  /** Datum "Stand", JJJJ-MM-TT */
  stand: string;
  haendler: string;
  logo: 'edeka' | 'eigen' | 'kein';
  logoBildId: string | null;
  stammdaten: Stammdaten;
  grundrissBildId: string | null;
  marker: Marker[];
  /** null = Text wird aus den Kassen erzeugt */
  fakten: string | null;
  kassen: Kasse[];
};

export type Bild = { uri: string; w: number; h: number };
export type Bilder = Record<string, Bild>;

export const TYP_NAME: Record<KassenTyp, string> = {
  info: 'Infokasse', tandem: 'Tandemkasse', einzel: 'Einzelkasse', sco: 'SCO',
};
/** Schreibweise im Folientitel */
export const TYP_TITEL: Record<KassenTyp, string> = {
  info: 'Infokasse', tandem: 'Tandemkassen', einzel: 'Einzelkasse', sco: 'SCO',
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** 62.5 -> "62,5" · 100 -> "100" (Eingabefelder) */
export const cm = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
/** 100 -> "100,0 cm" (Beschriftung wie in der Vorlage) */
export const mass = (n: number) => `${n.toFixed(1).replace('.', ',')} cm`;
export const datumDe = (iso: string) => iso.split('-').reverse().join('.');

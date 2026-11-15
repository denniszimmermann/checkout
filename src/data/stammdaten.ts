import { ModulTyp, Vorlage, Warengruppe } from '@/domain/types';

// ACHTUNG: Beispieldaten. Sie werden durch die echten Vorlagen ersetzt,
// sobald die Unterlagen (PDF/Bilder/PowerPoint) vorliegen.

export const WARENGRUPPEN: Warengruppe[] = [
  { id: 'suess', name: 'Süßwaren', farbe: '#F8C8DC' },
  { id: 'riegel', name: 'Schokoriegel', farbe: '#E3C6A8' },
  { id: 'kaugummi', name: 'Kaugummi & Bonbons', farbe: '#C9E4C5' },
  { id: 'getraenke', name: 'Getränke gekühlt', farbe: '#BFE0F5' },
  { id: 'tabak', name: 'Tabakwaren', farbe: '#D9D2C5' },
  { id: 'batterien', name: 'Batterien', farbe: '#FBE7A1' },
  { id: 'zeitschriften', name: 'Zeitschriften', farbe: '#D7CDEB' },
  { id: 'karten', name: 'Geschenkkarten', farbe: '#FFD3B0' },
  { id: 'saison', name: 'Saisonware', farbe: '#F5B7B1' },
  { id: 'nonfood', name: 'Non-Food Impuls', farbe: '#CFD8DC' },
];

export const MODULTYPEN: ModulTyp[] = [
  { id: 'impuls', name: 'Impulsregal', hoehe: 140, tiefe: 40, boeden: 5 },
  { id: 'kuehler', name: 'Kühler', hoehe: 200, tiefe: 60, boeden: 4 },
  { id: 'tabak', name: 'Tabakschrank', hoehe: 200, tiefe: 45, boeden: 6 },
  { id: 'presse', name: 'Zeitschriftenregal', hoehe: 160, tiefe: 35, boeden: 5 },
  { id: 'karten', name: 'Kartenständer', hoehe: 170, tiefe: 30, boeden: 4 },
];

const RASTER = [62.5, 100, 125];

export const VORLAGEN: Vorlage[] = [
  {
    id: 'standard',
    name: 'Standard-Kassenplatz',
    beschreibung: 'Kühler, Süßwaren-Impuls, Auffüllung mit weiteren Impulsregalen',
    beispiel: true,
    slots: [
      {
        id: 'std-kuehler', modulTypId: 'kuehler', breiten: [62.5], pflicht: true, prioritaet: 1,
        maxAnzahl: 1, standardWarengruppen: ['getraenke', 'getraenke', 'getraenke', 'getraenke'],
      },
      {
        id: 'std-impuls', modulTypId: 'impuls', breiten: RASTER, pflicht: true, prioritaet: 1,
        maxAnzahl: 1, standardWarengruppen: ['kaugummi', 'riegel', 'riegel', 'suess', 'suess'],
      },
      {
        id: 'std-zusatz', modulTypId: 'impuls', breiten: RASTER, pflicht: false, prioritaet: 1,
        maxAnzahl: 3, standardWarengruppen: ['batterien', 'kaugummi', 'suess', 'suess', 'saison'],
      },
      {
        id: 'std-karten', modulTypId: 'karten', breiten: [62.5], pflicht: false, prioritaet: 2,
        maxAnzahl: 1, standardWarengruppen: ['karten', 'karten', 'karten', 'karten'],
      },
    ],
  },
  {
    id: 'tabak',
    name: 'Tabak-Kasse',
    beschreibung: 'Tabakschrank, Impulsregal, optional Zeitschriften',
    beispiel: true,
    slots: [
      {
        id: 'tab-schrank', modulTypId: 'tabak', breiten: [100, 125], pflicht: true, prioritaet: 1,
        maxAnzahl: 1, standardWarengruppen: ['tabak', 'tabak', 'tabak', 'tabak', 'tabak', 'tabak'],
      },
      {
        id: 'tab-impuls', modulTypId: 'impuls', breiten: RASTER, pflicht: true, prioritaet: 1,
        maxAnzahl: 1, standardWarengruppen: ['kaugummi', 'riegel', 'riegel', 'suess', 'batterien'],
      },
      {
        id: 'tab-presse', modulTypId: 'presse', breiten: [62.5, 100], pflicht: false, prioritaet: 1,
        maxAnzahl: 2,
        standardWarengruppen: ['zeitschriften', 'zeitschriften', 'zeitschriften', 'zeitschriften', 'zeitschriften'],
      },
    ],
  },
  {
    id: 'kompakt',
    name: 'Kompakt (SB-Kasse)',
    beschreibung: 'Nur schmale Impulsregale',
    beispiel: true,
    slots: [
      {
        id: 'kom-impuls', modulTypId: 'impuls', breiten: [62.5], pflicht: true, prioritaet: 1,
        maxAnzahl: 1, standardWarengruppen: ['kaugummi', 'riegel', 'riegel', 'suess', 'suess'],
      },
      {
        id: 'kom-zusatz', modulTypId: 'impuls', breiten: [62.5], pflicht: false, prioritaet: 1,
        maxAnzahl: 2, standardWarengruppen: ['batterien', 'kaugummi', 'suess', 'nonfood', 'nonfood'],
      },
    ],
  },
];

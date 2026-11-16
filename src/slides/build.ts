import {
  Bilder, Boden, Kasse, KassenTyp, Platzierung, Projekt, TYP_NAME, TYP_TITEL, Warengruppe,
  datumDe, mass,
} from '@/domain/types';

import { BILD, META } from './assets.gen';
import { El, FH, FW, Folie, Run, img, kontrast, linie, rect, spiegeln, text } from './model';

const GRAU = '#4D4D4D';
const BLAU = '#0070C0';
const ROT = '#FF0000';
const OFFEN = '#D9D9D9';

export type Kontext = { warengruppen: Warengruppe[]; bilder: Bilder };

// ---------- Bausteine ----------

function einpassen(bw: number, bh: number, x: number, y: number, w: number, h: number) {
  const s = Math.min(w / bw, h / bh);
  return { x: x + (w - bw * s) / 2, y: y + (h - bh * s) / 2, w: bw * s, h: bh * s };
}

function logo(p: Projekt, k: Kontext, x: number, y: number, w: number, h: number): El[] {
  if (p.logo === 'edeka') {
    const b = einpassen(META.logo_edeka.px[0], META.logo_edeka.px[1], x, y, w, h);
    return [img(BILD.logo_edeka, b.x, b.y, b.w, b.h)];
  }
  const eigen = p.logo === 'eigen' && p.logoBildId ? k.bilder[p.logoBildId] : undefined;
  if (!eigen) return [];
  const b = einpassen(eigen.w, eigen.h, x, y, w, h);
  return [img(eigen.uri, b.x, b.y, b.w, b.h)];
}

const fusszeile = (p: Projekt): Run[][] => {
  const adresse = p.stammdaten.adresse.split(',').map((s) => s.trim()).filter(Boolean).join(' I ');
  return [[{ t: p.haendler || p.stammdaten.markt, bold: true }, { t: adresse ? ` I ${adresse}` : '' }]];
};

/** Rahmen der Inhaltsfolien: Metallrand, weiße Fläche, Logo, Fußzeile */
function rahmen(p: Projekt, k: Kontext): El[] {
  return [
    img(BILD.metall, 0, 0, FW, FH),
    rect(0.65, 0.55, FW - 0.65, FH - 0.55, '#FFFFFF'),
    ...logo(p, k, 0.87, 0.76, 1.56, 1.98),
    text(0.56, 18.45, 26.4, 0.5, fusszeile(p), 7, { color: '#000000' }),
  ];
}

function folienTitel(betont: string, rest: string, zeile2: string): El {
  return text(18.3, 0.51, 15.2, 1.45, [
    [{ t: betont, color: BLAU, bold: true }, { t: rest ? ` ${rest}` : '', bold: true }],
    [{ t: zeile2 }],
  ], 14, { align: 'r', valign: 't' });
}

const DRAUF: Record<KassenTyp, { src: string; w: number; h: number }> = {
  info: { src: BILD.drauf_info, w: META.drauf_info.box[2], h: META.drauf_info.box[3] },
  sco: { src: BILD.drauf_sco, w: META.drauf_sco.box[2], h: META.drauf_sco.box[3] },
  tandem: { src: BILD.drauf_tandem, w: META.drauf_tandem.box[2], h: META.drauf_tandem.box[3] },
  einzel: { src: BILD.drauf_einzel, w: META.drauf_einzel.box[2], h: META.drauf_einzel.box[3] },
};

/** Kleine Kassenübersicht oben rechts, aktive Kasse rot markiert */
export function navigator(kassen: Kasse[], aktivId?: string): El[] {
  if (!kassen.length) return [];
  const zelle = Math.min(1.3, 6.5 / kassen.length);
  const x0 = 33.45 - zelle * kassen.length;
  const els: El[] = [];
  kassen.forEach((ka, i) => {
    const x = x0 + i * zelle;
    const aktiv = ka.id === aktivId;
    const d = DRAUF[ka.typ];
    const b = einpassen(d.w, d.h, x + 0.12, 2.75, zelle - 0.24, 1.45);
    els.push(text(x - 0.3, 2.3, zelle + 0.6, 0.4, ka.name || TYP_NAME[ka.typ], 6, {
      align: 'c', color: aktiv ? ROT : '#7F7F7F', bold: aktiv,
    }));
    els.push(img(d.src, b.x, b.y, b.w, b.h));
    if (aktiv) els.push(rect(x + 0.04, 2.7, zelle - 0.08, 1.55, undefined, ROT, 1.5));
  });
  return els;
}

type Achse = 'h' | 'v';
/** Maßpfeil mit Beschriftung. seite: -1 = Text oberhalb/links, 1 = unterhalb/rechts */
function massPfeil(achse: Achse, a: number, b: number, pos: number, label: string, seite: -1 | 1, size = 10): El[] {
  if (achse === 'h') {
    const w = Math.max(b - a, 4.5);
    return [
      linie(a, pos, b, pos, GRAU, 0.5, 'beide'),
      text((a + b) / 2 - w / 2, seite < 0 ? pos - 0.72 : pos + 0.08, w, 0.64, label, size, { align: 'c' }),
    ];
  }
  const zeilen = label.split('\n').length;
  const dicke = 0.5 * zeilen + 0.2;
  const cx = pos + seite * (dicke / 2 + 0.12);
  const lang = 6.6;
  return [
    linie(pos, a, pos, b, GRAU, 0.5, 'beide'),
    text(cx - lang / 2, (a + b) / 2 - dicke / 2, lang, dicke, label, size, { align: 'c', rot: 270 }),
  ];
}

/** Farbige Böden von oben nach unten */
function bodenReihen(
  boeden: Boden[], k: Kontext, x: number, y: number, w: number, h: number, mitTiefe = true,
): El[] {
  if (!boeden.length || h <= 0) return [];
  const rh = h / boeden.length;
  const size = Math.max(5, Math.min(10, rh * 11, w * 1.6));
  return boeden.flatMap((b, i) => {
    const g = k.warengruppen.find((x) => x.id === b.warengruppeId);
    const fill = g?.farbe ?? OFFEN;
    const label = g ? `${g.name}${mitTiefe && b.tiefe ? ` T${b.tiefe}` : ''}` : '';
    return [
      rect(x, y + i * rh, w, rh, fill, '#FFFFFF', 1.25),
      ...(label ? [text(x, y + i * rh, w, rh, label, size, { align: 'c', color: kontrast(fill), bold: true })] : []),
    ];
  });
}

function ankreuzfelder(pl: Platzierung): El[] {
  const wand = pl.seitenwand === 'keine' ? 'Seitenwand' : `Seitenwand ${pl.seitenwand}`;
  const zeilen: [boolean, string][] = [
    [pl.seitenwand !== 'keine', `${wand} (4-Kant Lochblech)`],
    [pl.eckblenden, 'Eckblende(n)'],
    [!!(pl.hakenLaenge || pl.hakenMenge), `Haken Länge ${pl.hakenLaenge || '____'}; Menge ${pl.hakenMenge || '____'}`],
  ];
  return zeilen.flatMap(([an, label], i) => {
    const y = 3.28 + i * 0.66;
    return [
      rect(1.06, y, 0.36, 0.42, '#FFFFFF', GRAU, 1),
      ...(an ? [text(1.06, y, 0.36, 0.42, 'x', 9, { align: 'c', color: '#000000', bold: true })] : []),
      text(1.52, y - 0.07, 6.5, 0.56, label, 7, { color: '#000000' }),
    ];
  });
}

// ---------- Kassenfolie: Laufbandseite ----------

type Szene = {
  src: string;
  /** Lage des Bildes auf der Folie */
  x: number; y: number; w: number; h: number;
  /** Oberkante Laufband, Fußboden, Laufbandende (Regalseite), Laufbandanfang (Kassiererin) */
  band: number; boden: number; ende: number; anfang: number;
  /** Ab hier ist rechts neben der Kasse Platz für die Höhenbemaßung */
  aussen: number;
  /** Fläche der Rückwand (nur Infokasse) */
  wand?: { x: number; y: number; w: number; h: number };
};

const SZENEN: Record<KassenTyp, Szene> = {
  tandem: { src: BILD.tandem, x: 7.02, y: 5.61, w: 21.705, h: 10.021, band: 9.95, boden: 15.63, ende: 28.72, anfang: 7.02, aussen: 28.72 },
  einzel: { src: BILD.einzel, x: 7.64, y: 5.75, w: 19.858, h: 9.883, band: 9.95, boden: 15.63, ende: 27.5, anfang: 7.64, aussen: 27.5 },
  sco: { src: BILD.einzel, x: 7.64, y: 5.75, w: 19.858, h: 9.883, band: 9.95, boden: 15.63, ende: 27.5, anfang: 7.64, aussen: 27.5 },
  info: {
    src: BILD.info, x: 5.2, y: 2.9, w: 21.405, h: 12.885, band: 10.0, boden: 15.78, ende: 24.89, anfang: 5.21, aussen: 26.75,
    wand: { x: 7.14, y: 3.51, w: 16.64, h: 6.44 },
  },
};

export function kasseLaufband(p: Projekt, ka: Kasse, pl: Platzierung, k: Kontext): Folie {
  const s = SZENEN[ka.typ];
  const bandH = ka.laufbandHoehe > 0 ? ka.laufbandHoehe : 86.5;
  const massstab = (s.boden - s.band) / bandH; // Folien-cm je cm
  const hoehe = pl.hoehe > 0 ? pl.hoehe : 140;
  const breite = pl.breite > 0 ? pl.breite : 100;
  const h = Math.min(hoehe * massstab, s.boden - 2.7);
  const w = Math.min(breite * massstab, s.ende - s.anfang);
  const rx = s.ende - w;
  const ry = s.boden - h;
  const ueber = pl.stand === 'ueber';

  const rahmenBild = img(BILD.regalrahmen, rx, ry, w, h);
  const z: El[] = [];
  if (s.wand) {
    const wd = s.wand;
    z.push(rect(wd.x - 0.45, wd.y - 0.55, wd.w + 0.9, s.band - wd.y + 0.55, '#E6CFA9'));
    z.push(rect(wd.x - 0.12, wd.y - 0.2, wd.w + 0.24, s.band - wd.y + 0.2, '#F3EEE8'));
    z.push(...bodenReihen(ka.rueckwand, k, wd.x, wd.y, wd.w, wd.h, false));
  }
  if (ueber) z.push(rahmenBild);
  z.push(img(s.src, s.x, s.y, s.w, s.h));
  if (!ueber) z.push(rahmenBild);

  const rand = Math.min(0.27, w * 0.06);
  const unten = ueber ? s.band - 0.06 : s.boden - Math.min(0.76, h * 0.08);
  z.push(...bodenReihen(pl.boeden, k, rx + rand, ry + 0.16, w - 2 * rand, unten - ry - 0.16));

  if (s.wand) z.push(rect(rx + w / 2 - 1.3, ry - 1.2, 2.6, 0.62, '#FFFFFF', undefined, 0, 0.85));
  z.push(...massPfeil('h', rx, rx + w, ry - 0.5, mass(breite), -1));
  z.push(...massPfeil('v', ry, s.boden, s.aussen + 0.75, `Regalhöhe ${mass(hoehe)}`, 1));
  z.push(...massPfeil('v', s.band, s.boden, s.anfang - 0.75, `Laufbandhöhe\n${mass(bandH)}`, -1));
  if (ka.laufbandBreite > 0) {
    const cx = s.anfang - 0.6, cy = s.boden + 1.35;
    z.push(linie(cx - 0.85, cy + 0.85, cx + 0.85, cy - 0.85, GRAU, 0.5, 'beide'));
    z.push(text(cx - 1.7, cy - 0.77, 3.4, 1.54, `Laufbandbreite\n\n${mass(ka.laufbandBreite)}`, 7.5, { align: 'c', rot: 315 }));
  }
  if (ka.laufbandLaenge > 0)
    z.push(...massPfeil('h', s.anfang, s.ende, s.boden + 0.75, `Laufbandlänge ${mass(ka.laufbandLaenge)}`, 1));

  const zeichnung = pl.spiegeln ? z.map(spiegeln) : z;
  return {
    id: pl.id, kasseId: ka.id, platzId: pl.id,
    titel: `Kasse ${ka.name} · Laufbandseite ${pl.seite}`,
    els: [
      ...rahmen(p, k),
      folienTitel(TYP_TITEL[ka.typ], `Laufbandseite ${pl.seite} „Vorschlag“`, `Kasse ${ka.name}`),
      ...navigator(p.kassen, ka.id),
      ...ankreuzfelder(pl),
      ...zeichnung,
    ],
  };
}

// ---------- Gondelkopf ----------

export function gondelkopf(p: Projekt, ka: Kasse, pl: Platzierung, k: Kontext): Folie {
  const [bx, by, bw, bh] = META.gondel.box;
  const z: El[] = [
    img(BILD.gondel, bx, by, bw, bh),
    ...bodenReihen(pl.boeden, k, 9.04, 3.67, 5.73, 11.69),
    ...massPfeil('v', 3.34, 16.0, 15.75, mass(pl.hoehe), 1),
    ...massPfeil('h', 8.9, 15.03, 16.62, mass(pl.breite), 1),
    ...massPfeil('v', 8.95, 16.0, 3.95, `Laufbandhöhe\n${mass(ka.laufbandHoehe)}`, -1),
  ];
  if (ka.laufbandBreite > 0) z.push(...massPfeil('h', 4.5, 8.9, 16.62, mass(ka.laufbandBreite), 1));
  return {
    id: pl.id, kasseId: ka.id, platzId: pl.id,
    titel: `Kasse ${ka.name} · Gondelkopf`,
    els: [
      ...rahmen(p, k),
      folienTitel(TYP_TITEL[ka.typ], 'Gondelköpfe „Vorschlag“', `Kasse ${ka.name}`),
      ...navigator(p.kassen, ka.id),
      ...(pl.spiegeln ? z.map(spiegeln) : z),
    ],
  };
}

// ---------- Titel, Stammdaten, Grundriss, Fakten, Abschnitt ----------

export function titelFolie(p: Projekt, k: Kontext): Folie {
  const [strasse, ...ort] = p.stammdaten.adresse.split(',').map((s) => s.trim()).filter(Boolean);
  const zeilen: Run[][] = [[{ t: p.stammdaten.markt, bold: true }]];
  if (strasse) zeilen.push([{ t: strasse }]);
  if (ort.length) zeilen.push([{ t: ort.join(', ') }]);
  return {
    id: 'titel', titel: 'Titel',
    els: [
      img(BILD.metall, 0, 0, FW, FH),
      rect(14.2, 7.7, FW - 14.2, 7.1, '#FFFFFF', undefined, 0, 0.55),
      rect(0, 18.2, FW, FH - 18.2, '#FFFFFF'),
      ...logo(p, k, 6.2, 4.5, 7.7, 10.4),
      text(14.5, 7.95, 18.5, 2.2, 'Kassenzone\nPlatzierungsvorschlag', 24, { bold: true, valign: 't' }),
      text(14.5, 10.25, 18.5, 0.9, `Stand ${datumDe(p.stand)}`, 16, { valign: 't' }),
      text(14.5, 11.55, 18.5, 2.8, zeilen, 14, { valign: 't' }),
    ],
  };
}

export function stammdatenFolie(p: Projekt, k: Kontext): Folie {
  const s = p.stammdaten;
  const els: El[] = [
    img(BILD.metall, 0, 0, FW, FH),
    rect(0.65, 0.55, FW - 0.65, FH - 0.55, '#FFFFFF'),
    text(0.9, 0.7, 15, 0.8, 'KASSENZONE', 18, { color: '#FFC000', bold: true }),
    text(0.9, 1.5, 15, 0.6, 'Bestandsaufnahme, Vermaßung, Planung', 12),
    rect(0.75, 2.75, FW - 0.75, 4.8, '#BFBFBF'),
    rect(26.4, 9.5, 7.3, 3.9, '#F2F2F2'),
    rect(26.4, 14.3, 7.3, 2.6, '#F2F2F2'),
    text(26.6, 9.55, 5.8, 0.5, 'AZ-Schienen:', 9, { bold: true }),
    text(26.6, 14.35, 5.8, 0.5, 'Haken:', 9, { bold: true }),
  ];
  /** Beschriftung + grau hinterlegter Wert */
  const feld = (label: string, wert: string, x: number, y: number, lw: number, vw: number) => {
    els.push(text(x, y, lw, 0.75, label, 7.5, { bold: true }));
    els.push(rect(x + lw, y, vw, 0.75, '#D9D9D9'));
    els.push(text(x + lw + 0.15, y, vw - 0.2, 0.75, wert || '-', 9));
  };
  feld('Name des Marktes:', s.markt, 1.0, 3.0, 4.4, 10.6);
  feld('Ansprechpartner:', s.ansprechpartner, 1.0, 4.05, 4.4, 10.6);
  feld('Telefonnr. Ansprechpartner:', s.telefon, 1.0, 5.1, 4.4, 10.6);
  feld('Adresse (Straße, PLZ, Ort):', s.adresse, 1.0, 6.15, 4.4, 10.6);
  feld('Ferrero Kunden Nr.:', s.kundenNr, 17.0, 3.0, 9.4, 6.9);
  feld('Gewünschte Anlieferung Material Ladenbau:', s.anlieferung, 17.0, 4.05, 9.4, 6.9);
  feld('Gewünschter Aufbautermin:', s.aufbautermin, 17.0, 5.1, 9.4, 6.9);
  feld('Anlieferung per LKW -> Rampe vorhanden (ja/nein):', s.rampe, 17.0, 6.15, 9.4, 6.9);

  feld('Pilotmarkt oder Folgemarkt?:', s.pilot, 1.0, 8.2, 5.6, 4.0);
  feld('Getränkemarkt (j/n):', s.getraenkemarkt, 11.2, 8.2, 3.9, 3.2);
  feld('Umbau oder Neueröffnung?:', s.umbau, 1.0, 9.3, 5.6, 11.7);
  feld('Kassenanzahl:', s.kassenanzahl || String(p.kassen.length || ''), 1.0, 10.4, 5.6, 3.0);
  feld('Kassenband Hersteller:', s.hersteller, 10.2, 10.4, 3.9, 4.2);
  feld('Kassen Nummerierung: Start von links / rechts', s.nummerierung, 1.0, 11.5, 8.6, 8.7);
  feld('Info Kasse mit nummeriert?', s.infoNummeriert, 1.0, 12.6, 5.6, 11.7);
  feld('RAL Farbe Rahmen:', s.ralRahmen, 1.0, 13.7, 5.6, 11.7);
  feld('RAL Farbe Regalierung:', s.ralRegal, 1.0, 14.8, 5.6, 11.7);
  feld('Ladenbau:', s.ladenbau, 1.0, 15.9, 5.6, 11.7);
  feld('Ferrero Projektleiter:', s.projektleiter, 1.0, 17.0, 5.6, 6.6);
  feld('Telefon:', s.projektleiterTel, 13.6, 17.0, 1.8, 2.9);

  feld('Elektronische Preisauszeichnung (ja/nein)', s.epa, 20.2, 8.2, 9.2, 4.3);
  feld('Gum (Höhe in mm)', s.azGum, 26.6, 10.15, 5.2, 1.7);
  feld('Süßware/Bonbons (Höhe in mm)', s.azSuess, 26.6, 10.95, 5.2, 1.7);
  feld('Non-Food (Höhe in mm)', s.azNonFood, 26.6, 11.75, 5.2, 1.7);
  feld('Acrylschienen (H 50 mm) mitliefern?', s.acryl, 26.6, 12.55, 5.2, 1.7);
  feld('Lochwand-Haken (Länge in mm)', s.hakenLochwand, 26.6, 14.95, 5.2, 1.7);
  feld('Schlaufenhaken (Länge in mm)', s.hakenSchlaufen, 26.6, 15.75, 5.2, 1.7);
  return { id: 'stammdaten', titel: 'Stammdaten', els };
}

/** Lage des Grundrissbildes auf der Folie */
export const GRUNDRISS_FLAECHE = { x: 3.2, y: 2.6, w: 27.5, h: 13.9 };

export function grundrissFolie(p: Projekt, k: Kontext): Folie {
  const bild = p.grundrissBildId ? k.bilder[p.grundrissBildId] : undefined;
  const f = GRUNDRISS_FLAECHE;
  const els: El[] = [...rahmen(p, k)];
  if (bild) {
    const b = einpassen(bild.w, bild.h, f.x, f.y, f.w, f.h);
    els.push(img(bild.uri, b.x, b.y, b.w, b.h));
    for (const m of p.marker) {
      if (!Number.isFinite(m.x) || !Number.isFinite(m.y)) continue;
      const mx = b.x + m.x * b.w, my = b.y + m.y * b.h;
      if (m.art === 'nummer')
        els.push(text(mx - 2, my - 0.8, 4, 1.6, m.text, 32, { align: 'c', color: ROT, bold: true }));
      else els.push(linie(mx, my + 1.5, mx, my - 1.5, '#6F9BD1', 6, 'ende'));
    }
  } else {
    els.push(rect(f.x, f.y, f.w, f.h, '#F2F2F2', '#BFBFBF', 1));
    els.push(text(f.x, f.y, f.w, f.h, 'Grundriss', 20, { align: 'c', color: '#A6A6A6' }));
  }
  els.push(text(12, 16.75, 9.9, 1.0, 'Laufrichtung', 16, { align: 'c', color: BLAU, bold: true }));
  return { id: 'grundriss', titel: 'Grundriss', els };
}

/** Automatischer Text der Folie „Fakten Einrichtung“ */
export function faktenAuto(p: Projekt): string {
  const anzahl = (t: KassenTyp) => p.kassen.filter((x) => x.typ === t).length;
  const teile = [
    anzahl('info') && `${anzahl('info')} Infokasse${anzahl('info') > 1 ? 'n' : ''}`,
    anzahl('tandem') && `${anzahl('tandem')} Tandemkasse${anzahl('tandem') > 1 ? 'n' : ''}`,
    anzahl('einzel') && `${anzahl('einzel')} Einzelkasse${anzahl('einzel') > 1 ? 'n' : ''}`,
    anzahl('sco') && `${anzahl('sco')} SCO`,
  ].filter(Boolean);
  const hoehen = (art: Platzierung['art']) =>
    [...new Set(p.kassen.flatMap((x) => x.platzierungen).filter((x) => x.art === art).map((x) => mass(x.hoehe)))].join(' / ');
  const zeilen = [
    `Kassenzone mit ${teile.join(', ') || '…'}${p.stammdaten.hersteller ? `; Hersteller: ${p.stammdaten.hersteller}` : ''}`,
  ];
  if (hoehen('laufband')) zeilen.push(`Plan => Regalierung Laufband => Höhe ${hoehen('laufband')}`);
  if (hoehen('gondelkopf')) zeilen.push(`Plan => Gondelköpfe vor Regalierung => Höhe ${hoehen('gondelkopf')}`);
  zeilen.push(`RAL Farbe Regalierung: ${p.stammdaten.ralRegal || 'tba'}`);
  return zeilen.join('\n');
}

export function faktenFolie(p: Projekt, k: Kontext): Folie {
  const zeilen = (p.fakten ?? faktenAuto(p)).split('\n').filter((z) => z.trim());
  return {
    id: 'fakten', titel: 'Fakten Einrichtung',
    els: [
      ...rahmen(p, k),
      text(5.9, 1.9, 22, 0.9, 'Fakten Einrichtung:', 16, { color: BLAU, bold: true, underline: true }),
      ...zeilen.map((z, i) => text(5.9, 3.2 + i * 1.22, 26, 0.9, `⇒  ${z}`, 14, { bold: true })),
    ],
  };
}

export function abschnittFolie(id: string, titel: string): Folie {
  return {
    id, titel,
    els: [
      img(BILD.metall, 0, 0, FW, FH),
      img(BILD.abschnitt, 0.65, 0.54, FW - 0.65, FH - 0.54),
      text(4, 8.2, FW - 8, 2.4, titel, 40, { align: 'c', color: '#404040', bold: true }),
    ],
  };
}

// ---------- Platzierungsübersicht ----------

export function uebersichtFolie(p: Projekt, k: Kontext): Folie {
  const els: El[] = [
    ...rahmen(p, k),
    text(18.3, 0.51, 15.2, 0.85, 'Platzierungsübersicht „Vorschlag“', 14, { align: 'r', bold: true, valign: 't' }),
  ];
  const n = p.kassen.length;
  if (n) {
    const luecke = 1.5;
    const summe = p.kassen.reduce((s, ka) => s + DRAUF[ka.typ].w, 0);
    const s = Math.min(0.8, (30.2 - luecke * (n - 1)) / summe);
    let x = (FW - (summe * s + luecke * (n - 1))) / 2;
    p.kassen.forEach((ka, i) => {
      const d = DRAUF[ka.typ];
      const w = d.w * s, h = d.h * s;
      els.push(text(x - 1.2, 3.25, w + 2.4, 0.8, ka.typ === 'info' ? `Infokasse ${ka.name}` : ka.name || TYP_NAME[ka.typ], 14, { align: 'c', bold: true }));
      els.push(img(d.src, x, 4.3, w, h));
      // Sortimente je Platzierung als farbige Balken unter der Kasse
      let y = 4.3 + 9.75 * 0.8 + 0.25;
      const bw = Math.max(w, 2.6), bx = x + (w - bw) / 2;
      for (const pl of ka.platzierungen) {
        const gruppen = [...new Set(pl.boeden.map((b) => b.warengruppeId).filter(Boolean))]
          .map((id) => k.warengruppen.find((g) => g.id === id)).filter((g): g is Warengruppe => !!g);
        if (!gruppen.length) continue;
        els.push(text(bx - 0.5, y, bw + 1, 0.34, pl.art === 'gondelkopf' ? 'Gondelkopf' : `Laufband ${pl.seite}`, 6, { align: 'c', color: '#7F7F7F' }));
        y += 0.36;
        for (const g of gruppen) {
          els.push(rect(bx, y, bw, 0.4, g.farbe, '#FFFFFF', 0.75));
          els.push(text(bx, y, bw, 0.4, g.name, 6.5, { align: 'c', color: kontrast(g.farbe), bold: true }));
          y += 0.4;
        }
        y += 0.12;
      }
      if (i < n - 1) els.push(linie(x + w + luecke / 2, 11.2, x + w + luecke / 2, 8.2, '#6F9BD1', 6, 'ende'));
      x += w + luecke;
    });
  }
  els.push(text(27.3, 17.2, 6, 0.9, 'Laufrichtung', 14, { align: 'r', color: BLAU, bold: true }));
  return { id: 'uebersicht', titel: 'Platzierungsübersicht', els };
}

// ---------- Foliensatz ----------

export function platzFolie(p: Projekt, ka: Kasse, pl: Platzierung, k: Kontext): Folie {
  return pl.art === 'gondelkopf' ? gondelkopf(p, ka, pl, k) : kasseLaufband(p, ka, pl, k);
}

export function deck(p: Projekt, k: Kontext): Folie[] {
  const von = (art: Platzierung['art']) =>
    p.kassen.flatMap((ka) => ka.platzierungen.filter((pl) => pl.art === art).map((pl) => platzFolie(p, ka, pl, k)));
  const laufband = von('laufband');
  const gondel = von('gondelkopf');
  return [
    titelFolie(p, k),
    stammdatenFolie(p, k),
    grundrissFolie(p, k),
    faktenFolie(p, k),
    ...(laufband.length ? [abschnittFolie('a-umbau', 'Umbauplan'), ...laufband] : []),
    ...(gondel.length ? [abschnittFolie('a-gondel', 'Gondelköpfe'), ...gondel] : []),
    uebersichtFolie(p, k),
  ];
}

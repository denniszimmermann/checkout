import { WARENGRUPPEN, neueKasse, neuePlatzierung, neuesProjekt } from '@/domain/standard';
import { Boden, Projekt } from '@/domain/types';

import { deck, faktenAuto, kasseLaufband, navigator } from './build';
import { El, FW, spiegeln, text } from './model';

const k = { warengruppen: WARENGRUPPEN, bilder: {} };
const boeden = (...ids: string[]): Boden[] => ids.map((id, i) => ({ id: `b${i}`, warengruppeId: id, tiefe: '210' }));
const texte = (els: El[]) => els.flatMap((e) => (e.t === 'text' ? [e.zeilen.map((z) => z.map((r) => r.t).join('')).join(' ')] : []));
const farbflaechen = (els: El[], farbe: string) => els.filter((e) => e.t === 'rect' && e.fill === farbe) as Extract<El, { t: 'rect' }>[];

function projekt(): Projekt {
  const p = neuesProjekt('Testmarkt');
  const tandem = neueKasse('tandem', '5/6');
  tandem.platzierungen = [
    { ...neuePlatzierung('laufband', 'links'), boeden: boeden('gum', 'gum', 'bonbons') },
    { ...neuePlatzierung('gondelkopf'), boeden: boeden('ferrero') },
  ];
  p.kassen = [neueKasse('info', '1'), tandem];
  return p;
}

describe('Kassenfolie Laufbandseite', () => {
  const p = projekt();
  const ka = p.kassen[1];
  const pl = ka.platzierungen[0];

  it('beschriftet Böden mit Warengruppe und Tiefe und trägt die Maße ein', () => {
    const t = texte(kasseLaufband(p, ka, pl, k).els);
    expect(t.filter((x) => x === 'Gum T210')).toHaveLength(2);
    expect(t).toContain('Bonbons T210');
    expect(t).toContain('100,0 cm');
    expect(t).toContain('Regalhöhe 140,0 cm');
    expect(t).toContain('Tandemkassen Laufbandseite links „Vorschlag“ Kasse 5/6');
  });

  it('teilt die Regalhöhe gleichmäßig auf die Böden auf', () => {
    const gum = farbflaechen(kasseLaufband(p, ka, pl, k).els, '#0099FF');
    const bonbons = farbflaechen(kasseLaufband(p, ka, pl, k).els, '#00B050');
    expect(gum).toHaveLength(2);
    expect(gum[0].h).toBeCloseTo(bonbons[0].h);
    expect(gum[1].y).toBeCloseTo(gum[0].y + gum[0].h);
  });

  it('nutzt bodenstehend die ganze Regalhöhe', () => {
    const ueber = farbflaechen(kasseLaufband(p, ka, pl, k).els, '#0099FF')[0].h;
    const boden = farbflaechen(kasseLaufband(p, ka, { ...pl, stand: 'boden' }, k).els, '#0099FF')[0].h;
    expect(boden).toBeGreaterThan(ueber * 1.5);
  });

  it('zeichnet das Regal maßstäblich breiter', () => {
    const schmal = farbflaechen(kasseLaufband(p, ka, pl, k).els, '#0099FF')[0].w;
    const breit = farbflaechen(kasseLaufband(p, ka, { ...pl, breite: 125 }, k).els, '#0099FF')[0].w;
    expect(breit / schmal).toBeGreaterThan(1.2);
  });

  it('spiegelt die Zeichnung auf die andere Seite', () => {
    const a = farbflaechen(kasseLaufband(p, ka, pl, k).els, '#0099FF')[0];
    const b = farbflaechen(kasseLaufband(p, ka, { ...pl, spiegeln: true }, k).els, '#0099FF')[0];
    expect(b.x).toBeCloseTo(FW - a.x - a.w);
  });
});

describe('Bausteine', () => {
  it('markiert im Navigator nur die aktive Kasse', () => {
    const p = projekt();
    const rahmen = navigator(p.kassen, p.kassen[1].id).filter((e) => e.t === 'rect');
    expect(rahmen).toHaveLength(1);
  });

  it('spiegeln() tauscht die Ausrichtung von Texten', () => {
    const e = spiegeln(text(1, 1, 4, 1, 'x', 10, { align: 'l' }));
    expect(e.t === 'text' && e.align).toBe('r');
  });

  it('erzeugt den Faktentext aus den Kassen', () => {
    expect(faktenAuto(projekt())).toContain('Kassenzone mit 1 Infokasse, 1 Tandemkasse');
  });

  it('baut den Foliensatz in der Reihenfolge der Vorlage', () => {
    expect(deck(projekt(), k).map((f) => f.titel)).toEqual([
      'Titel', 'Stammdaten', 'Grundriss', 'Fakten Einrichtung', 'Umbauplan',
      'Kasse 5/6 · Laufbandseite links', 'Gondelköpfe', 'Kasse 5/6 · Gondelkopf', 'Platzierungsübersicht',
    ]);
  });
});

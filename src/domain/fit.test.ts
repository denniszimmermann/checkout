import { anordnen, fitTemplate, freieAbschnitte } from './fit';
import { Stoerstelle, Vorlage } from './types';

const slot = (id: string, breiten: number[], pflicht: boolean, maxAnzahl = 1, prioritaet = 1) => ({
  id, modulTypId: id, breiten, pflicht, prioritaet, maxAnzahl, standardWarengruppen: ['a', 'b'],
});
const vorlage = (...slots: ReturnType<typeof slot>[]): Vorlage => ({
  id: 'v', name: 'v', beschreibung: '', beispiel: true, slots,
});
const saeule = (position: number, breite: number, blockiert = true): Stoerstelle => ({
  id: 's' + position, typ: 'saeule', position, breite, blockiert, notiz: '',
});
const breiten = (r: { module: { breite: number }[] }) => r.module.map((m) => m.breite);

describe('freieAbschnitte', () => {
  it('teilt die Länge an blockierenden Störstellen', () => {
    expect(freieAbschnitte(400, [saeule(150, 30)])).toEqual([
      { von: 0, bis: 150 }, { von: 180, bis: 400 },
    ]);
  });
  it('ignoriert nicht blockierende Störstellen', () => {
    expect(freieAbschnitte(400, [saeule(150, 30, false)])).toEqual([{ von: 0, bis: 400 }]);
  });
});

describe('fitTemplate', () => {
  it('füllt die Länge exakt aus, wenn es aufgeht', () => {
    const r = fitTemplate(vorlage(slot('p', [62.5], true), slot('o', [62.5, 100, 125], false, 3)), 287.5, []);
    expect(r.rest).toBeCloseTo(0);
    expect(breiten(r).reduce((a, b) => a + b, 0)).toBeCloseTo(287.5);
    expect(r.warnungen).toEqual([]);
  });

  it('weist das Restmaß aus', () => {
    const r = fitTemplate(vorlage(slot('p', [100], true), slot('o', [100], false, 5)), 350, []);
    expect(breiten(r)).toEqual([100, 100, 100]);
    expect(r.rest).toBeCloseTo(50);
    expect(r.luecken).toEqual([{ x: 300, breite: 50 }]);
  });

  it('wählt die Rasterkombination mit dem kleinsten Rest', () => {
    const r = fitTemplate(vorlage(slot('o', [62.5, 100, 125], false, 3)), 225, []);
    expect(r.rest).toBeCloseTo(0); // 100 + 125 bzw. 125 + 100
  });

  it('stellt Module nicht über eine Störstelle', () => {
    const r = fitTemplate(vorlage(slot('p', [100], true), slot('o', [100], false, 3)), 400, [saeule(150, 30)]);
    expect(r.module.map((m) => m.x)).toEqual([0, 180, 280]);
    expect(r.rest).toBeCloseTo(70); // 50 vor der Säule + 20 am Ende
  });

  it('warnt, wenn ein Pflichtmodul nicht passt', () => {
    const r = fitTemplate(vorlage(slot('p', [125], true), slot('o', [62.5], false)), 100, []);
    expect(r.warnungen).toHaveLength(1);
    expect(breiten(r)).toEqual([62.5]);
  });

  it('gibt Pflichtmodulen Vorrang vor geringerem Rest', () => {
    const r = fitTemplate(vorlage(slot('o', [100], false), slot('p', [62.5], true)), 100, []);
    expect(r.module.map((m) => m.slotId)).toEqual(['p']);
  });

  it('bevorzugt bei gleichem Rest die höhere Priorität', () => {
    const r = fitTemplate(vorlage(slot('unwichtig', [100], false, 1, 3), slot('wichtig', [100], false, 1, 1)), 100, []);
    expect(r.module.map((m) => m.slotId)).toEqual(['wichtig']);
  });

  it('übernimmt die Standard-Warengruppen je Boden', () => {
    const r = fitTemplate(vorlage(slot('p', [100], true)), 100, []);
    expect(r.module[0].warengruppen).toEqual(['a', 'b']);
  });
});

describe('anordnen', () => {
  it('markiert Module, die nicht mehr passen', () => {
    const m = (breite: number) => ({ id: '' + breite, slotId: 's', modulTypId: 't', breite, x: null, warengruppen: [] });
    const r = anordnen([m(100), m(125)], 200, []);
    expect(r.module.map((x) => x.x)).toEqual([0, null]);
    expect(r.rest).toBeCloseTo(100);
  });
});

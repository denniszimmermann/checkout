import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MODULTYPEN, VORLAGEN, WARENGRUPPEN } from '@/data/stammdaten';
import { anordnen, fitTemplate } from '@/domain/fit';
import {
  Kassenplatz, ModulTyp, Projekt, Stellflaeche, Stoerstelle, Warengruppe, uid,
} from '@/domain/types';

type State = {
  projekte: Projekt[];
  warengruppen: Warengruppe[];
  modulTypen: ModulTyp[];
  minGang: number;
  geladen: boolean;

  neuesProjekt: (markt: string) => string;
  dupliziereProjekt: (id: string) => void;
  loescheProjekt: (id: string) => void;
  aendereProjekt: (id: string, fn: (p: Projekt) => Projekt) => void;
  aendereFlaeche: (pid: string, fid: string, fn: (f: Stellflaeche) => Stellflaeche) => void;
  /** Vorlage auf die Fläche anwenden bzw. neu berechnen */
  wendeVorlageAn: (pid: string, fid: string, vorlageId: string) => string[];

  setWarengruppen: (w: Warengruppe[]) => void;
  setModulTypen: (m: ModulTyp[]) => void;
  setMinGang: (n: number) => void;
};

export const heute = () => new Date().toISOString().slice(0, 10);

export const neuerKassenplatz = (nummer: number): Kassenplatz => ({
  id: uid(), nummer, tischLaenge: 0, tischBreite: 0, gangBreite: 0,
});
export const neueFlaeche = (name: string, kassenplatzId: string | null): Stellflaeche => ({
  id: uid(), name, kassenplatzId, laenge: 0, maxHoehe: 0, maxTiefe: 0,
  stoerstellen: [], vorlageId: null, module: [],
});
export const neueStoerstelle = (): Stoerstelle => ({
  id: uid(), typ: 'saeule', position: 0, breite: 0, blockiert: true, notiz: '',
});

/** Positionen nach jeder Änderung an Maßen oder Modulen neu bestimmen */
const neuAnordnen = (f: Stellflaeche): Stellflaeche => ({
  ...f, module: anordnen(f.module, f.laenge, f.stoerstellen).module,
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      projekte: [],
      warengruppen: WARENGRUPPEN,
      modulTypen: MODULTYPEN,
      minGang: 90,
      geladen: false,

      neuesProjekt: (markt) => {
        const k = neuerKassenplatz(1);
        const p: Projekt = {
          id: uid(), markt, datum: heute(), notizen: '',
          kassenplaetze: [k], stellflaechen: [neueFlaeche('Stellfläche Kasse 1', k.id)],
        };
        set((s) => ({ projekte: [p, ...s.projekte] }));
        return p.id;
      },
      dupliziereProjekt: (id) =>
        set((s) => {
          const p = s.projekte.find((x) => x.id === id);
          if (!p) return s;
          const kopie: Projekt = { ...JSON.parse(JSON.stringify(p)), id: uid(), markt: p.markt + ' (Kopie)' };
          return { projekte: [kopie, ...s.projekte] };
        }),
      loescheProjekt: (id) => set((s) => ({ projekte: s.projekte.filter((p) => p.id !== id) })),
      aendereProjekt: (id, fn) =>
        set((s) => ({ projekte: s.projekte.map((p) => (p.id === id ? fn(p) : p)) })),
      aendereFlaeche: (pid, fid, fn) =>
        get().aendereProjekt(pid, (p) => ({
          ...p,
          stellflaechen: p.stellflaechen.map((f) => (f.id === fid ? neuAnordnen(fn(f)) : f)),
        })),
      wendeVorlageAn: (pid, fid, vorlageId) => {
        const v = VORLAGEN.find((x) => x.id === vorlageId);
        const f = get().projekte.find((p) => p.id === pid)?.stellflaechen.find((x) => x.id === fid);
        if (!v || !f) return [];
        const r = fitTemplate(v, f.laenge, f.stoerstellen, get().modulTypen);
        get().aendereFlaeche(pid, fid, (x) => ({ ...x, vorlageId, module: r.module }));
        return r.warnungen;
      },

      setWarengruppen: (warengruppen) => set({ warengruppen }),
      setModulTypen: (modulTypen) => set({ modulTypen }),
      setMinGang: (minGang) => set({ minGang }),
    }),
    {
      name: 'kassenzonen-planer-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ projekte, warengruppen, modulTypen, minGang }) => ({
        projekte, warengruppen, modulTypen, minGang,
      }),
      onRehydrateStorage: () => () => useStore.setState({ geladen: true }),
    },
  ),
);

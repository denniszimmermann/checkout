import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TIEFEN, WARENGRUPPEN, neuesProjekt } from '@/domain/standard';
import { Bild, Bilder, Kasse, Platzierung, Projekt, Warengruppe, uid } from '@/domain/types';

type State = {
  projekte: Projekt[];
  warengruppen: Warengruppe[];
  tiefen: string[];
  geladen: boolean;

  projektAnlegen: (markt: string) => string;
  projektDuplizieren: (id: string) => void;
  projektLoeschen: (id: string) => void;
  aendereProjekt: (id: string, fn: (p: Projekt) => Projekt) => void;
  aendereKasse: (pid: string, kid: string, fn: (k: Kasse) => Kasse) => void;
  aenderePlatz: (pid: string, kid: string, plid: string, fn: (p: Platzierung) => Platzierung) => void;
  setWarengruppen: (w: Warengruppe[]) => void;
  setTiefen: (t: string[]) => void;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      projekte: [],
      warengruppen: WARENGRUPPEN,
      tiefen: TIEFEN,
      geladen: false,

      projektAnlegen: (markt) => {
        const p = neuesProjekt(markt);
        set((s) => ({ projekte: [p, ...s.projekte] }));
        return p.id;
      },
      projektDuplizieren: (id) =>
        set((s) => {
          const p = s.projekte.find((x) => x.id === id);
          if (!p) return s;
          const kopie: Projekt = JSON.parse(JSON.stringify(p));
          kopie.id = uid();
          kopie.stammdaten.markt = `${p.stammdaten.markt} (Kopie)`;
          return { projekte: [kopie, ...s.projekte] };
        }),
      projektLoeschen: (id) => set((s) => ({ projekte: s.projekte.filter((p) => p.id !== id) })),
      aendereProjekt: (id, fn) => set((s) => ({ projekte: s.projekte.map((p) => (p.id === id ? fn(p) : p)) })),
      aendereKasse: (pid, kid, fn) =>
        get().aendereProjekt(pid, (p) => ({ ...p, kassen: p.kassen.map((k) => (k.id === kid ? fn(k) : k)) })),
      aenderePlatz: (pid, kid, plid, fn) =>
        get().aendereKasse(pid, kid, (k) => ({
          ...k, platzierungen: k.platzierungen.map((x) => (x.id === plid ? fn(x) : x)),
        })),
      setWarengruppen: (warengruppen) => set({ warengruppen }),
      setTiefen: (tiefen) => set({ tiefen }),
    }),
    {
      name: 'kassenzonen-planer-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ projekte, warengruppen, tiefen }) => ({ projekte, warengruppen, tiefen }),
      onRehydrateStorage: () => () => useStore.setState({ geladen: true }),
    },
  ),
);

// ---- Bilder (Logo, Grundriss) liegen getrennt, damit die Projektdaten klein bleiben ----

const SCHLUESSEL = 'kassenzonen-bild-';

type BildState = {
  bilder: Bilder;
  speichern: (b: Bild) => Promise<string>;
  laden: (id: string | null) => Promise<void>;
};

export const useBilder = create<BildState>((set, get) => ({
  bilder: {},
  speichern: async (b) => {
    const id = uid();
    set((s) => ({ bilder: { ...s.bilder, [id]: b } }));
    await AsyncStorage.setItem(SCHLUESSEL + id, JSON.stringify(b));
    return id;
  },
  laden: async (id) => {
    if (!id || get().bilder[id]) return;
    const roh = await AsyncStorage.getItem(SCHLUESSEL + id);
    if (roh) set((s) => ({ bilder: { ...s.bilder, [id]: JSON.parse(roh) } }));
  },
}));

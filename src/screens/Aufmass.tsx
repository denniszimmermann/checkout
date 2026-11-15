import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { Projekt, STOERSTELLEN_NAMEN, Stellflaeche, StoerstellenTyp } from '@/domain/types';
import { neueFlaeche, neueStoerstelle, neuerKassenplatz, useStore } from '@/store/store';
import {
  Auswahl, AuswahlFeld, F, Karte, Knopf, LoeschKnopf, Option, TextFeld, Titel, Zeile, ZahlFeld,
} from '@/ui/kit';

type Menue = { titel: string; optionen: Option[]; gewaehlt: string | null; onWahl: (id: string) => void };

export function Aufmass({ projekt: p }: { projekt: Projekt }) {
  const { aendereProjekt, aendereFlaeche } = useStore();
  const [menue, setMenue] = useState<Menue | null>(null);
  const aendere = (fn: (p: Projekt) => Projekt) => aendereProjekt(p.id, fn);
  const flaeche = (fid: string, patch: Partial<Stellflaeche>) => aendereFlaeche(p.id, fid, (f) => ({ ...f, ...patch }));

  const kassenOptionen: Option[] = [
    ...p.kassenplaetze.map((k) => ({ id: k.id, name: `Kasse ${k.nummer}` })),
    { id: '', name: 'Frei stehend (keiner Kasse zugeordnet)' },
  ];

  return (
    <>
      <Karte>
        <Zeile>
          <TextFeld label="Markt / Standort" value={p.markt} onChange={(markt) => aendere((x) => ({ ...x, markt }))} />
          <TextFeld label="Datum (JJJJ-MM-TT)" value={p.datum} onChange={(datum) => aendere((x) => ({ ...x, datum }))} />
        </Zeile>
        <TextFeld label="Notizen" mehrzeilig value={p.notizen} onChange={(notizen) => aendere((x) => ({ ...x, notizen }))} />
      </Karte>

      <Titel>Kassenplätze</Titel>
      {p.kassenplaetze.map((k) => {
        const setze = (patch: Partial<typeof k>) =>
          aendere((x) => ({ ...x, kassenplaetze: x.kassenplaetze.map((y) => (y.id === k.id ? { ...y, ...patch } : y)) }));
        return (
          <Karte key={k.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: F.tinte }}>Kasse {k.nummer}</Text>
              <LoeschKnopf
                onLoeschen={() =>
                  aendere((x) => ({
                    ...x,
                    kassenplaetze: x.kassenplaetze.filter((y) => y.id !== k.id),
                    stellflaechen: x.stellflaechen.map((f) => (f.kassenplatzId === k.id ? { ...f, kassenplatzId: null } : f)),
                  }))
                }
              />
            </View>
            <Zeile>
              <ZahlFeld label="Tischlänge" value={k.tischLaenge} onChange={(tischLaenge) => setze({ tischLaenge })} />
              <ZahlFeld label="Tischbreite" value={k.tischBreite} onChange={(tischBreite) => setze({ tischBreite })} />
              <ZahlFeld label="Gangbreite" value={k.gangBreite} onChange={(gangBreite) => setze({ gangBreite })} />
            </Zeile>
          </Karte>
        );
      })}
      <Knopf
        art="leicht" text="+ Kassenplatz"
        onPress={() =>
          aendere((x) => {
            const nummer = Math.max(0, ...x.kassenplaetze.map((k) => k.nummer)) + 1;
            const k = neuerKassenplatz(nummer);
            return {
              ...x,
              kassenplaetze: [...x.kassenplaetze, k],
              stellflaechen: [...x.stellflaechen, neueFlaeche(`Stellfläche Kasse ${nummer}`, k.id)],
            };
          })
        }
      />

      <Titel>Stellflächen für Regale / Möbel</Titel>
      {p.stellflaechen.map((f) => (
        <Karte key={f.id}>
          <Zeile>
            <TextFeld label="Bezeichnung" value={f.name} onChange={(name) => flaeche(f.id, { name })} />
            <AuswahlFeld
              label="Zuordnung"
              wert={kassenOptionen.find((o) => o.id === (f.kassenplatzId ?? ''))?.name ?? 'Frei stehend'}
              onPress={() =>
                setMenue({
                  titel: 'Zuordnung', optionen: kassenOptionen, gewaehlt: f.kassenplatzId ?? '',
                  onWahl: (id) => flaeche(f.id, { kassenplatzId: id || null }),
                })
              }
            />
          </Zeile>
          <Zeile>
            <ZahlFeld label="Länge" value={f.laenge} onChange={(laenge) => flaeche(f.id, { laenge })} />
            <ZahlFeld label="Max. Höhe" value={f.maxHoehe} onChange={(maxHoehe) => flaeche(f.id, { maxHoehe })} />
            <ZahlFeld label="Max. Tiefe" value={f.maxTiefe} onChange={(maxTiefe) => flaeche(f.id, { maxTiefe })} />
          </Zeile>
          <Text style={{ color: F.grau, fontSize: 13 }}>Max. Höhe/Tiefe leer lassen, wenn es keine Begrenzung gibt.</Text>

          {f.stoerstellen.map((st) => {
            const setze = (patch: Partial<typeof st>) =>
              flaeche(f.id, { stoerstellen: f.stoerstellen.map((y) => (y.id === st.id ? { ...y, ...patch } : y)) });
            return (
              <View key={st.id} style={{ borderTopWidth: 1, borderColor: F.linie, paddingTop: 10, gap: 10 }}>
                <Zeile>
                  <AuswahlFeld
                    label="Störstelle" wert={STOERSTELLEN_NAMEN[st.typ]}
                    onPress={() =>
                      setMenue({
                        titel: 'Art der Störstelle', gewaehlt: st.typ,
                        optionen: Object.entries(STOERSTELLEN_NAMEN).map(([id, name]) => ({ id, name })),
                        onWahl: (id) => setze({ typ: id as StoerstellenTyp, blockiert: id !== 'steckdose' }),
                      })
                    }
                  />
                  <ZahlFeld label="Abstand von links" value={st.position} onChange={(position) => setze({ position })} />
                  <ZahlFeld label="Breite" value={st.breite} onChange={(breite) => setze({ breite })} />
                </Zeile>
                <Zeile style={{ alignItems: 'center' }}>
                  <TextFeld label="Notiz" value={st.notiz} onChange={(notiz) => setze({ notiz })} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46 }}>
                    <Switch accessibilityLabel="Fläche freihalten" value={st.blockiert} onValueChange={(blockiert) => setze({ blockiert })} />
                    <Text style={{ color: F.tinte }}>freihalten</Text>
                  </View>
                  <LoeschKnopf text="Entfernen" onLoeschen={() => flaeche(f.id, { stoerstellen: f.stoerstellen.filter((y) => y.id !== st.id) })} />
                </Zeile>
              </View>
            );
          })}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <Knopf klein art="leicht" text="+ Störstelle" onPress={() => flaeche(f.id, { stoerstellen: [...f.stoerstellen, neueStoerstelle()] })} />
            <LoeschKnopf text="Stellfläche löschen" onLoeschen={() => aendere((x) => ({ ...x, stellflaechen: x.stellflaechen.filter((y) => y.id !== f.id) }))} />
          </View>
        </Karte>
      ))}
      <Knopf
        art="leicht" text="+ Stellfläche"
        onPress={() => aendere((x) => ({ ...x, stellflaechen: [...x.stellflaechen, neueFlaeche(`Stellfläche ${x.stellflaechen.length + 1}`, null)] }))}
      />

      <Auswahl
        sichtbar={!!menue} titel={menue?.titel ?? ''} optionen={menue?.optionen ?? []} gewaehlt={menue?.gewaehlt}
        onWahl={(id) => menue?.onWahl(id)} onZu={() => setMenue(null)}
      />
    </>
  );
}

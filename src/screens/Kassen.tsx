import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { neueKasse, neuePlatzierung, neuerBoden } from '@/domain/standard';
import {
  Boden, Kasse, KassenTyp, PlatzArt, Platzierung, Projekt, Seitenwand, TYP_NAME, uid,
} from '@/domain/types';
import { FolienAnsicht } from '@/slides/FolienAnsicht';
import { platzFolie } from '@/slides/build';
import { useBilder, useStore } from '@/store/store';
import {
  Auswahl, AuswahlFeld, F, Karte, Knopf, LoeschKnopf, Option, TextFeld, Titel, Zeile, ZahlFeld,
} from '@/ui/kit';

type Menue = { titel: string; optionen: Option[]; gewaehlt: string | null; onWahl: (id: string) => void };
const LEER = '__leer__';

const ART_NAME = (pl: Platzierung) => (pl.art === 'gondelkopf' ? 'Gondelkopf' : `Laufbandseite ${pl.seite}`);
const WAND: Record<Seitenwand, string> = { keine: 'Keine', links: 'Links', rechts: 'Rechts', beidseitig: 'Beidseitig' };

function tauschen<T>(liste: T[], i: number, j: number): T[] {
  if (j < 0 || j >= liste.length) return liste;
  const k = [...liste];
  [k[i], k[j]] = [k[j], k[i]];
  return k;
}

export function KassenSeite({ projekt: p, breite }: { projekt: Projekt; breite: number }) {
  const { warengruppen, tiefen, aendereProjekt, aendereKasse, aenderePlatz } = useStore();
  const bilder = useBilder((s) => s.bilder);
  const [menue, setMenue] = useState<Menue | null>(null);
  const [offen, setOffen] = useState<string | null>(p.kassen[0]?.id ?? null);
  const kontext = { warengruppen, bilder };

  const gruppe = (id: string | null) => warengruppen.find((g) => g.id === id);

  /** Editor für eine Bodenliste (Regal oder Rückwand) */
  const bodenListe = (boeden: Boden[], setze: (b: Boden[]) => void, mitTiefe: boolean) => (
    <View style={{ gap: 6 }}>
      {boeden.map((b, i) => {
        const g = gruppe(b.warengruppeId);
        const patch = (x: Partial<Boden>) => setze(boeden.map((y) => (y.id === b.id ? { ...y, ...x } : y)));
        return (
          <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Text style={{ width: 18, color: F.grau, fontSize: 14, textAlign: 'center' }}>{i + 1}</Text>
            <AuswahlFeld
              label="" kompakt wert={g?.name ?? 'Warengruppe wählen'} farbe={g?.farbe ?? '#FFFFFF'} style={{ minWidth: 150 }}
              a11y={`Boden ${i + 1} Warengruppe`}
              onPress={() =>
                setMenue({
                  titel: `Boden ${i + 1} von oben: Warengruppe`, gewaehlt: b.warengruppeId ?? LEER,
                  optionen: [...warengruppen.map((x) => ({ id: x.id, name: x.name, farbe: x.farbe })), { id: LEER, name: 'Offen lassen', farbe: '#D9D9D9' }],
                  onWahl: (id) => patch({ warengruppeId: id === LEER ? null : id }),
                })
              }
            />
            {mitTiefe ? (
              <AuswahlFeld
                label="" kompakt wert={b.tiefe ? `T${b.tiefe}` : 'Tiefe'} style={{ flex: 0, minWidth: 92, width: 92 }}
                a11y={`Boden ${i + 1} Tiefe`}
                onPress={() =>
                  setMenue({
                    titel: `Boden ${i + 1} von oben: Tiefe`, gewaehlt: b.tiefe ?? LEER,
                    optionen: [...tiefen.map((t) => ({ id: t, name: `T${t}`, info: `${t} mm` })), { id: LEER, name: 'Ohne Angabe' }],
                    onWahl: (id) => patch({ tiefe: id === LEER ? null : id }),
                  })
                }
              />
            ) : null}
            <Knopf klein art="leicht" text="↑" a11y={`Boden ${i + 1} nach oben`} onPress={() => setze(tauschen(boeden, i, i - 1))} style={{ paddingHorizontal: 10 }} />
            <Knopf klein art="leicht" text="↓" a11y={`Boden ${i + 1} nach unten`} onPress={() => setze(tauschen(boeden, i, i + 1))} style={{ paddingHorizontal: 10 }} />
            <Knopf klein art="rot" text="✕" a11y={`Boden ${i + 1} entfernen`} onPress={() => setze(boeden.filter((y) => y.id !== b.id))} style={{ paddingHorizontal: 10 }} />
          </View>
        );
      })}
      <Knopf klein art="leicht" text="+ Boden" onPress={() => setze([...boeden, neuerBoden(boeden[boeden.length - 1])])} />
    </View>
  );

  const platzKarte = (ka: Kasse, pl: Platzierung) => {
    const setze = (patch: Partial<Platzierung>) => aenderePlatz(p.id, ka.id, pl.id, (x) => ({ ...x, ...patch }));
    return (
      <View key={pl.id} style={{ borderTopWidth: 1, borderColor: F.linie, paddingTop: 12, gap: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: F.tinte }}>Folie: {ART_NAME(pl)}</Text>
        <View style={{ borderWidth: 1, borderColor: F.linie }}>
          <FolienAnsicht folie={platzFolie(p, ka, pl, kontext)} breite={breite - 32} />
        </View>
        <Zeile>
          <AuswahlFeld
            label="Platzierung" wert={ART_NAME(pl)}
            onPress={() =>
              setMenue({
                titel: 'Platzierung', gewaehlt: pl.art === 'gondelkopf' ? 'g' : pl.seite,
                optionen: [{ id: 'links', name: 'Laufbandseite links' }, { id: 'rechts', name: 'Laufbandseite rechts' }, { id: 'g', name: 'Gondelkopf' }],
                onWahl: (id) => setze(id === 'g' ? { art: 'gondelkopf' } : { art: 'laufband', seite: id as 'links' | 'rechts' }),
              })
            }
          />
          {pl.art === 'laufband' ? (
            <AuswahlFeld
              label="Regal steht" wert={pl.stand === 'ueber' ? 'Auf dem Laufband' : 'Auf dem Boden'}
              onPress={() =>
                setMenue({
                  titel: 'Regal steht', gewaehlt: pl.stand,
                  optionen: [{ id: 'ueber', name: 'Auf dem Laufband', info: 'Böden nur oberhalb des Laufbands' }, { id: 'boden', name: 'Auf dem Boden', info: 'Böden über die ganze Regalhöhe' }],
                  onWahl: (id) => setze({ stand: id as Platzierung['stand'] }),
                })
              }
            />
          ) : null}
        </Zeile>
        <Zeile>
          <ZahlFeld label="Regalbreite" value={pl.breite} onChange={(breite) => setze({ breite })} />
          <ZahlFeld label="Regalhöhe" value={pl.hoehe} onChange={(hoehe) => setze({ hoehe })} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46 }}>
            <Switch accessibilityLabel="Darstellung spiegeln" value={pl.spiegeln} onValueChange={(spiegeln) => setze({ spiegeln })} />
            <Text style={{ color: F.tinte }}>spiegeln</Text>
          </View>
        </Zeile>

        <Text style={{ fontSize: 13, color: F.grau }}>Böden von oben nach unten</Text>
        {bodenListe(pl.boeden, (boeden) => setze({ boeden }), true)}

        {pl.art === 'laufband' ? (
          <>
            <Zeile>
              <AuswahlFeld
                label="Seitenwand (4-Kant Lochblech)" wert={WAND[pl.seitenwand]}
                onPress={() =>
                  setMenue({
                    titel: 'Seitenwand', gewaehlt: pl.seitenwand,
                    optionen: (Object.keys(WAND) as Seitenwand[]).map((id) => ({ id, name: WAND[id] })),
                    onWahl: (id) => setze({ seitenwand: id as Seitenwand }),
                  })
                }
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46 }}>
                <Switch accessibilityLabel="Eckblenden" value={pl.eckblenden} onValueChange={(eckblenden) => setze({ eckblenden })} />
                <Text style={{ color: F.tinte }}>Eckblende(n)</Text>
              </View>
            </Zeile>
            <Zeile>
              <TextFeld label="Haken Länge" value={pl.hakenLaenge} onChange={(hakenLaenge) => setze({ hakenLaenge })} />
              <TextFeld label="Haken Menge" value={pl.hakenMenge} onChange={(hakenMenge) => setze({ hakenMenge })} />
            </Zeile>
          </>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Knopf
            klein art="leicht" text="Folie duplizieren"
            onPress={() => aendereKasse(p.id, ka.id, (k) => ({
              ...k, platzierungen: [...k.platzierungen, { ...pl, id: uid(), boeden: pl.boeden.map((b) => ({ ...b, id: uid() })) }],
            }))}
          />
          <LoeschKnopf text="Folie löschen" onLoeschen={() => aendereKasse(p.id, ka.id, (k) => ({ ...k, platzierungen: k.platzierungen.filter((x) => x.id !== pl.id) }))} />
        </View>
      </View>
    );
  };

  const neuePlatz = (ka: Kasse) =>
    setMenue({
      titel: `Neue Folie für Kasse ${ka.name}`, gewaehlt: null,
      optionen: [{ id: 'links', name: 'Laufbandseite links' }, { id: 'rechts', name: 'Laufbandseite rechts' }, { id: 'g', name: 'Gondelkopf' }],
      onWahl: (id) => aendereKasse(p.id, ka.id, (k) => ({
        ...k, platzierungen: [...k.platzierungen, id === 'g' ? neuePlatzierung('gondelkopf') : neuePlatzierung('laufband' as PlatzArt, id as 'links' | 'rechts')],
      })),
    });

  return (
    <>
      <Titel>Kassen in Laufrichtung (von links nach rechts)</Titel>
      {p.kassen.length === 0 ? <Text style={{ color: F.grau, fontSize: 15 }}>Lege die Kassen so an, wie sie im Markt nebeneinander stehen.</Text> : null}
      {p.kassen.map((ka, i) => {
        const setze = (patch: Partial<Kasse>) => aendereKasse(p.id, ka.id, (x) => ({ ...x, ...patch }));
        const auf = offen === ka.id;
        return (
          <Karte key={ka.id}>
            <Pressable
              accessibilityRole="button" accessibilityLabel={`Kasse ${ka.name} ${auf ? 'zuklappen' : 'aufklappen'}`}
              onPress={() => setOffen(auf ? null : ka.id)}
              style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 8 }}
            >
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: F.tinte }}>
                {TYP_NAME[ka.typ]} {ka.name}
              </Text>
              <Text style={{ color: F.grau }}>{ka.platzierungen.length} Folie{ka.platzierungen.length === 1 ? '' : 'n'}  {auf ? '▴' : '▾'}</Text>
            </Pressable>
            {auf ? (
              <>
                <Zeile>
                  <AuswahlFeld
                    label="Kassentyp" wert={TYP_NAME[ka.typ]}
                    onPress={() =>
                      setMenue({
                        titel: 'Kassentyp', gewaehlt: ka.typ,
                        optionen: (Object.keys(TYP_NAME) as KassenTyp[]).map((id) => ({ id, name: TYP_NAME[id] })),
                        onWahl: (id) => setze({ typ: id as KassenTyp }),
                      })
                    }
                  />
                  <TextFeld label="Bezeichnung (z. B. 5/6)" value={ka.name} onChange={(name) => setze({ name })} />
                </Zeile>
                <Zeile>
                  <ZahlFeld label="Laufbandlänge" value={ka.laufbandLaenge} onChange={(laufbandLaenge) => setze({ laufbandLaenge })} />
                  <ZahlFeld label="Laufbandhöhe" value={ka.laufbandHoehe} onChange={(laufbandHoehe) => setze({ laufbandHoehe })} />
                  <ZahlFeld label="Laufbandbreite" value={ka.laufbandBreite} onChange={(laufbandBreite) => setze({ laufbandBreite })} />
                </Zeile>
                {ka.typ === 'info' ? (
                  <>
                    <Text style={{ fontSize: 13, color: F.grau }}>Rückwand hinter der Infokasse (von oben nach unten)</Text>
                    {bodenListe(ka.rueckwand, (rueckwand) => setze({ rueckwand }), false)}
                  </>
                ) : null}
                {ka.platzierungen.map((pl) => platzKarte(ka, pl))}
                <Knopf text="+ Folie für diese Kasse" onPress={() => neuePlatz(ka)} />
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Knopf klein art="leicht" text="← nach links" onPress={() => aendereProjekt(p.id, (x) => ({ ...x, kassen: tauschen(x.kassen, i, i - 1) }))} />
                  <Knopf klein art="leicht" text="nach rechts →" onPress={() => aendereProjekt(p.id, (x) => ({ ...x, kassen: tauschen(x.kassen, i, i + 1) }))} />
                  <Knopf
                    klein art="leicht" text="Kasse duplizieren"
                    onPress={() => aendereProjekt(p.id, (x) => {
                      const kopie: Kasse = JSON.parse(JSON.stringify(ka));
                      kopie.id = uid();
                      kopie.name = `${ka.name} (Kopie)`;
                      kopie.rueckwand.forEach((b) => (b.id = uid()));
                      kopie.platzierungen.forEach((pl) => { pl.id = uid(); pl.boeden.forEach((b) => (b.id = uid())); });
                      return { ...x, kassen: [...x.kassen.slice(0, i + 1), kopie, ...x.kassen.slice(i + 1)] };
                    })}
                  />
                  <LoeschKnopf text="Kasse löschen" onLoeschen={() => aendereProjekt(p.id, (x) => ({ ...x, kassen: x.kassen.filter((y) => y.id !== ka.id) }))} />
                </View>
              </>
            ) : null}
          </Karte>
        );
      })}
      <Knopf
        art="leicht" text="+ Kasse"
        onPress={() =>
          setMenue({
            titel: 'Neue Kasse', gewaehlt: null,
            optionen: (Object.keys(TYP_NAME) as KassenTyp[]).map((id) => ({ id, name: TYP_NAME[id] })),
            onWahl: (id) => {
              const ka = neueKasse(id as KassenTyp, id === 'sco' ? 'SCO' : String(p.kassen.filter((x) => x.typ !== 'sco').length + 1));
              aendereProjekt(p.id, (x) => ({ ...x, kassen: [...x.kassen, ka] }));
              setOffen(ka.id);
            },
          })
        }
      />

      <Auswahl
        sichtbar={!!menue} titel={menue?.titel ?? ''} optionen={menue?.optionen ?? []} gewaehlt={menue?.gewaehlt}
        onWahl={(id) => menue?.onWahl(id)} onZu={() => setMenue(null)}
      />
    </>
  );
}

import { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { VORLAGEN } from '@/data/stammdaten';
import { anordnen, fitTemplate } from '@/domain/fit';
import { PlatziertesModul, Projekt, Stellflaeche, cm, uid } from '@/domain/types';
import { pruefeProjekt, pruefeStellflaeche } from '@/domain/validate';
import { Zeichnung } from '@/drawing/Zeichnung';
import { draufsicht, frontansicht } from '@/drawing/scene';
import { useStore } from '@/store/store';
import { Auswahl, AuswahlFeld, F, Hinweise, Karte, Knopf, LoeschKnopf, Option, Titel } from '@/ui/kit';

type Menue = { titel: string; optionen: Option[]; gewaehlt: string | null; onWahl: (id: string) => void };
const LEER = '__leer__';
const ALLE = '__alle__';

export function Planung({ projekt: p }: { projekt: Projekt }) {
  const { modulTypen, warengruppen, minGang, aendereFlaeche, wendeVorlageAn } = useStore();
  const [menue, setMenue] = useState<Menue | null>(null);
  const fenster = useWindowDimensions();
  const breite = Math.min(fenster.width, 900) - 32 - 30;

  const typName = (id: string) => modulTypen.find((t) => t.id === id)?.name ?? 'Modul';
  const gruppe = (id: string | null) => warengruppen.find((g) => g.id === id);
  const aendereModul = (f: Stellflaeche, mid: string, fn: (m: PlatziertesModul) => PlatziertesModul) =>
    aendereFlaeche(p.id, f.id, (x) => ({ ...x, module: x.module.map((m) => (m.id === mid ? fn(m) : m)) }));

  const waehleWarengruppe = (f: Stellflaeche, mid: string, boden: number) => {
    const m = f.module.find((x) => x.id === mid);
    if (!m) return;
    setMenue({
      titel: `${typName(m.modulTypId)} · Boden ${boden + 1} von oben`,
      gewaehlt: m.warengruppen[boden] ?? LEER,
      optionen: [
        ...warengruppen.map((g) => ({ id: g.id, name: g.name, farbe: g.farbe })),
        { id: LEER, name: 'Leer lassen', farbe: '#FFFFFF' },
        ...(m.warengruppen[boden]
          ? [{ id: ALLE, name: `„${gruppe(m.warengruppen[boden])?.name}“ auf alle Böden dieses Moduls`, info: 'Übernimmt die aktuelle Auswahl' }]
          : []),
      ],
      onWahl: (id) =>
        aendereModul(f, mid, (x) => ({
          ...x,
          warengruppen:
            id === ALLE
              ? x.warengruppen.map(() => x.warengruppen[boden])
              : x.warengruppen.map((g, i) => (i === boden ? (id === LEER ? null : id) : g)),
        })),
    });
  };

  const waehleVorlage = (f: Stellflaeche) =>
    setMenue({
      titel: `Vorlage für ${f.name} (${cm(f.laenge)} cm)`,
      gewaehlt: f.vorlageId,
      optionen: VORLAGEN.map((v) => {
        const r = fitTemplate(v, f.laenge, f.stoerstellen, modulTypen);
        const passt = r.warnungen.length ? 'Pflichtmodul passt nicht' : `Rest ${cm(r.rest)} cm`;
        return {
          id: v.id, name: v.name + (v.beispiel ? ' (Beispiel)' : ''),
          info: `${r.module.length} Module · ${passt} · ${v.beschreibung}`,
        };
      }),
      onWahl: (id) => wendeVorlageAn(p.id, f.id, id),
    });

  const projektHinweise = pruefeProjekt(p, modulTypen, minGang).filter((h) => h.startsWith('Kasse '));

  return (
    <>
      <Titel>Draufsicht</Titel>
      <Karte>
        <Zeichnung szene={draufsicht(p, modulTypen, warengruppen)} breite={breite} minMassstab={0.5} maxMassstab={1} />
        <Hinweise texte={projektHinweise} />
      </Karte>

      {p.stellflaechen.map((f) => {
        const vorlage = VORLAGEN.find((v) => v.id === f.vorlageId);
        const a = anordnen(f.module, f.laenge, f.stoerstellen);
        return (
          <View key={f.id} style={{ gap: 12 }}>
            <Titel>{f.name}</Titel>
            <Karte>
              {f.laenge <= 0 ? (
                <Text style={{ color: F.grau, fontSize: 15 }}>Bitte zuerst im Aufmaß die Länge eintragen.</Text>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <AuswahlFeld label="Vorlage" wert={vorlage ? vorlage.name : 'Vorlage wählen …'} onPress={() => waehleVorlage(f)} />
                    {vorlage ? <Knopf art="leicht" text="Neu berechnen" onPress={() => wendeVorlageAn(p.id, f.id, vorlage.id)} /> : null}
                  </View>
                  <Text style={{ color: F.grau, fontSize: 14 }}>
                    Länge {cm(f.laenge)} cm · belegt {cm(a.module.reduce((s, m) => s + (m.x === null ? 0 : m.breite), 0))} cm · Rest {cm(a.rest)} cm
                  </Text>
                  <Zeichnung
                    szene={frontansicht(f, modulTypen, warengruppen)} breite={breite} minMassstab={1.5}
                    onHit={(hit) => { const [mid, boden] = hit.split(':'); waehleWarengruppe(f, mid, Number(boden)); }}
                  />
                  <Hinweise texte={pruefeStellflaeche(f, modulTypen)} />

                  {a.module.map((m, nr) => {
                    const slot = vorlage?.slots.find((s) => s.id === m.slotId);
                    return (
                      <View key={m.id} style={{ borderTopWidth: 1, borderColor: F.linie, paddingTop: 10, gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text style={{ flex: 1, minWidth: 90, fontSize: 16, fontWeight: '700', color: m.x === null ? F.rot : F.tinte }}>
                            {nr + 1}. {typName(m.modulTypId)}
                          </Text>
                          <Knopf
                            klein art="leicht" text={`${cm(m.breite)} cm ▾`}
                            onPress={() =>
                              setMenue({
                                titel: 'Modulbreite', gewaehlt: String(m.breite),
                                optionen: (slot?.breiten ?? [m.breite]).map((b) => ({ id: String(b), name: `${cm(b)} cm` })),
                                onWahl: (id) => aendereModul(f, m.id, (x) => ({ ...x, breite: Number(id) })),
                              })
                            }
                          />
                          <LoeschKnopf text="Entfernen" onLoeschen={() => aendereFlaeche(p.id, f.id, (x) => ({ ...x, module: x.module.filter((y) => y.id !== m.id) }))} />
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {m.warengruppen.map((g, i) => (
                            <Pressable
                              key={i} accessibilityRole="button"
                              accessibilityLabel={`Boden ${i + 1}: ${gruppe(g)?.name ?? 'leer'}`}
                              onPress={() => waehleWarengruppe(f, m.id, i)}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: F.linie, backgroundColor: gruppe(g)?.farbe ?? '#fff' }}
                            >
                              <Text style={{ color: F.grau, fontSize: 13 }}>{i + 1}</Text>
                              <Text style={{ color: F.tinte, fontSize: 14 }}>{gruppe(g)?.name ?? '– wählen –'} ▾</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    );
                  })}

                  {vorlage ? (
                    <Knopf
                      klein art="leicht" text="+ Modul hinzufügen"
                      onPress={() =>
                        setMenue({
                          titel: 'Modul hinzufügen', gewaehlt: null,
                          optionen: vorlage.slots.map((s) => ({
                            id: s.id, name: typName(s.modulTypId),
                            info: `Breiten: ${s.breiten.map(cm).join(' / ')} cm`,
                          })),
                          onWahl: (id) => {
                            const s = vorlage.slots.find((x) => x.id === id);
                            if (!s) return;
                            const boeden = modulTypen.find((t) => t.id === s.modulTypId)?.boeden ?? s.standardWarengruppen.length;
                            const neu: PlatziertesModul = {
                              id: uid(), slotId: s.id, modulTypId: s.modulTypId, breite: Math.min(...s.breiten), x: null,
                              warengruppen: Array.from({ length: boeden }, (_, n) => s.standardWarengruppen[n] ?? null),
                            };
                            aendereFlaeche(p.id, f.id, (x) => ({ ...x, module: [...x.module, neu] }));
                          },
                        })
                      }
                    />
                  ) : null}
                </>
              )}
            </Karte>
          </View>
        );
      })}

      <Auswahl
        sichtbar={!!menue} titel={menue?.titel ?? ''} optionen={menue?.optionen ?? []} gewaehlt={menue?.gewaehlt}
        onWahl={(id) => menue?.onWahl(id)} onZu={() => setMenue(null)}
      />
    </>
  );
}

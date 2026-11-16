import React, { useRef, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';

import { Marker, Projekt, uid } from '@/domain/types';
import { useBilder, useStore } from '@/store/store';
import { bildWaehlen } from '@/ui/bild';
import { F, Karte, Knopf, LoeschKnopf, TextFeld, Titel, Zeile } from '@/ui/kit';

export function GrundrissSeite({ projekt: p, breite }: { projekt: Projekt; breite: number }) {
  const aendereProjekt = useStore((s) => s.aendereProjekt);
  const { bilder, speichern } = useBilder();
  const [modus, setModus] = useState<Marker['art']>('nummer');
  const flaeche = useRef<React.ComponentRef<typeof View>>(null);
  const bild = p.grundrissBildId ? bilder[p.grundrissBildId] : undefined;
  const aendere = (patch: Partial<Projekt>) => aendereProjekt(p.id, (x) => ({ ...x, ...patch }));

  const waehlen = async (quelle: 'mediathek' | 'kamera') => {
    const neu = await bildWaehlen(quelle);
    if (neu) aendere({ grundrissBildId: await speichern(neu), marker: [] });
  };

  // Vorschlag für die nächste Nummer: erste Kasse, die noch keinen Marker hat
  const naechste = p.kassen.find((k) => !p.marker.some((m) => m.art === 'nummer' && m.text === k.name))?.name
    ?? String(p.marker.filter((m) => m.art === 'nummer').length + 1);

  const w = breite - 30;
  const h = bild ? (w * bild.h) / bild.w : 0;

  return (
    <>
      <Titel>Grundriss</Titel>
      <Karte>
        <Zeile>
          <Knopf art="leicht" text={bild ? 'Anderes Bild wählen' : 'Bild wählen'} onPress={() => waehlen('mediathek')} />
          {Platform.OS !== 'web' ? <Knopf art="leicht" text="Foto aufnehmen" onPress={() => waehlen('kamera')} /> : null}
        </Zeile>
        {!bild ? (
          <Text style={{ color: F.grau, fontSize: 15 }}>
            Wähle den Grundriss als Bild oder fotografiere den Plan. Danach setzt du durch Antippen die Kassennummern und die Laufrichtung.
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Knopf klein art={modus === 'nummer' ? 'voll' : 'leicht'} text={`Nummer „${naechste}“ setzen`} onPress={() => setModus('nummer')} />
              <Knopf klein art={modus === 'pfeil' ? 'voll' : 'leicht'} text="Laufrichtung setzen" onPress={() => setModus('pfeil')} />
            </View>
            <Pressable
              accessibilityLabel="Grundriss – antippen, um eine Markierung zu setzen"
              ref={flaeche}
              onPress={(e) => {
                const { pageX, pageY } = e.nativeEvent;
                // Position relativ zum Bild; über die Fensterkoordinaten, das ist auf iOS und im Browser gleich.
                flaeche.current?.measureInWindow((bx, by) => {
                  const x = (pageX - bx) / w, y = (pageY - by) / h;
                  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
                  const m: Marker = {
                    id: uid(), art: modus, text: modus === 'nummer' ? naechste : '',
                    x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)),
                  };
                  aendere({ marker: [...p.marker, m] });
                });
              }}
              style={{ width: w, height: h }}
            >
              <Image source={{ uri: bild.uri }} style={{ width: w, height: h }} resizeMode="stretch" />
              {p.marker.map((m) => (
                <View key={m.id} pointerEvents="none" style={{ position: 'absolute', left: m.x * w - 30, top: m.y * h - 16, width: 60, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, lineHeight: 32, fontWeight: '800', color: m.art === 'nummer' ? '#FF0000' : '#3B78C2' }}>
                    {m.art === 'nummer' ? m.text : '↑'}
                  </Text>
                </View>
              ))}
            </Pressable>
          </>
        )}
      </Karte>

      {p.marker.length ? (
        <>
          <Titel>Markierungen</Titel>
          <Karte>
            {p.marker.map((m) => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                {m.art === 'nummer' ? (
                  <TextFeld label="Kassennummer" value={m.text} onChange={(text) => aendere({ marker: p.marker.map((x) => (x.id === m.id ? { ...x, text } : x)) })} />
                ) : (
                  <Text style={{ flex: 1, fontSize: 16, color: F.tinte, paddingBottom: 12 }}>↑ Laufrichtung</Text>
                )}
                <LoeschKnopf text="Entfernen" onLoeschen={() => aendere({ marker: p.marker.filter((x) => x.id !== m.id) })} />
              </View>
            ))}
          </Karte>
        </>
      ) : null}
    </>
  );
}

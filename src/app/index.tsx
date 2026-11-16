import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { datumDe } from '@/domain/types';
import { useStore } from '@/store/store';
import { F, Karte, Knopf, LoeschKnopf, TextFeld, Titel, Zeile } from '@/ui/kit';

export default function Projekte() {
  const { projekte, geladen, projektAnlegen, projektDuplizieren, projektLoeschen } = useStore();
  const [markt, setMarkt] = useState('');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 1000, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
      <Karte>
        <Zeile>
          <TextFeld label="Name des Marktes" value={markt} onChange={setMarkt} />
          <Knopf
            text="Projekt anlegen"
            onPress={() => {
              const id = projektAnlegen(markt.trim() || 'Neuer Markt');
              setMarkt('');
              router.push(`/projekt/${id}`);
            }}
          />
        </Zeile>
      </Karte>

      <Titel>Platzierungsvorschläge</Titel>
      {geladen && projekte.length === 0 ? (
        <Text style={{ color: F.grau, fontSize: 15 }}>Noch kein Projekt. Lege oben den ersten Markt an.</Text>
      ) : null}
      {projekte.map((p) => {
        const folien = p.kassen.reduce((n, k) => n + k.platzierungen.length, 0);
        return (
          <Karte key={p.id}>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/projekt/${p.id}`)}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: F.tinte }}>{p.stammdaten.markt || 'Ohne Namen'}</Text>
              <Text style={{ color: F.grau, marginTop: 2 }}>
                Stand {datumDe(p.stand)} · {p.kassen.length} Kassen · {folien} Kassenfolien
              </Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Knopf klein text="Öffnen" onPress={() => router.push(`/projekt/${p.id}`)} />
              <Knopf klein art="leicht" text="Duplizieren" onPress={() => projektDuplizieren(p.id)} />
              <LoeschKnopf onLoeschen={() => projektLoeschen(p.id)} />
            </View>
          </Karte>
        );
      })}

      <Knopf art="leicht" text="Einstellungen: Warengruppen & Tiefen" onPress={() => router.push('/einstellungen')} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

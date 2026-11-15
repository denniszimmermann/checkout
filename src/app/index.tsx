import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useStore } from '@/store/store';
import { F, Karte, Knopf, LoeschKnopf, TextFeld, Titel, Zeile } from '@/ui/kit';

export default function Projekte() {
  const { projekte, geladen, neuesProjekt, dupliziereProjekt, loescheProjekt } = useStore();
  const [markt, setMarkt] = useState('');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 900, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
      <Karte>
        <Zeile>
          <TextFeld label="Neuer Markt / Standort" value={markt} onChange={setMarkt} />
          <Knopf
            text="Projekt anlegen"
            onPress={() => {
              const id = neuesProjekt(markt.trim() || 'Neuer Markt');
              setMarkt('');
              router.push(`/projekt/${id}`);
            }}
          />
        </Zeile>
      </Karte>

      <Titel>Projekte</Titel>
      {geladen && projekte.length === 0 ? (
        <Text style={{ color: F.grau, fontSize: 15 }}>Noch keine Planung. Lege oben das erste Projekt an.</Text>
      ) : null}
      {projekte.map((p) => {
        const module = p.stellflaechen.reduce((n, f) => n + f.module.length, 0);
        return (
          <Karte key={p.id}>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/projekt/${p.id}`)}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: F.tinte }}>{p.markt}</Text>
              <Text style={{ color: F.grau, marginTop: 2 }}>
                {p.datum.split('-').reverse().join('.')} · {p.kassenplaetze.length} Kassen · {module} Module
              </Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Knopf klein text="Öffnen" onPress={() => router.push(`/projekt/${p.id}`)} />
              <Knopf klein art="leicht" text="Duplizieren" onPress={() => dupliziereProjekt(p.id)} />
              <LoeschKnopf onLoeschen={() => loescheProjekt(p.id)} />
            </View>
          </Karte>
        );
      })}

      <Knopf art="leicht" text="Einstellungen: Warengruppen & Module" onPress={() => router.push('/einstellungen')} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

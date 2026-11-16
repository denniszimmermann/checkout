import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FARBAUSWAHL, TIEFEN, WARENGRUPPEN } from '@/domain/standard';
import { uid } from '@/domain/types';
import { useStore } from '@/store/store';
import { Auswahl, F, Karte, Knopf, LoeschKnopf, TextFeld, Titel } from '@/ui/kit';

export default function Einstellungen() {
  const { warengruppen, tiefen, setWarengruppen, setTiefen } = useStore();
  const [farbeFuer, setFarbeFuer] = useState<string | null>(null);
  const [tiefenText, setTiefenText] = useState(tiefen.join(', '));

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 1000, width: '100%', alignSelf: 'center', paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
    >
      <Titel>Warengruppen (Auswahlmenü je Boden)</Titel>
      <Karte>
        {warengruppen.map((g) => (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Pressable
              accessibilityRole="button" accessibilityLabel={`Farbe für ${g.name} ändern`} onPress={() => setFarbeFuer(g.id)}
              style={{ width: 46, height: 46, borderRadius: 8, backgroundColor: g.farbe, borderWidth: 1, borderColor: '#8A96A3' }}
            />
            <TextFeld label="Name" value={g.name} onChange={(name) => setWarengruppen(warengruppen.map((x) => (x.id === g.id ? { ...x, name } : x)))} />
            <LoeschKnopf text="✕" onLoeschen={() => setWarengruppen(warengruppen.filter((x) => x.id !== g.id))} />
          </View>
        ))}
        <Knopf
          art="leicht" text="+ Warengruppe"
          onPress={() => setWarengruppen([...warengruppen, { id: uid(), name: 'Neue Warengruppe', farbe: FARBAUSWAHL[warengruppen.length % FARBAUSWAHL.length] }])}
        />
      </Karte>

      <Titel>Tiefen (Auswahlmenü je Boden)</Titel>
      <Karte>
        <TextFeld
          label="Tiefen in mm, durch Komma getrennt" value={tiefenText}
          onChange={(t) => {
            setTiefenText(t);
            setTiefen([...new Set(t.split(/[,;\s]+/).map((x) => x.replace(/\D/g, '')).filter(Boolean))]);
          }}
        />
        <Text style={{ color: F.grau, fontSize: 13 }}>Auf den Folien als {tiefen.map((t) => `T${t}`).join(', ') || '–'}.</Text>
      </Karte>

      <Knopf
        art="leicht" text="Auf die Werte der Vorlage zurücksetzen"
        onPress={() => { setWarengruppen(WARENGRUPPEN); setTiefen(TIEFEN); setTiefenText(TIEFEN.join(', ')); }}
      />

      <Auswahl
        sichtbar={!!farbeFuer} titel="Farbe" gewaehlt={warengruppen.find((g) => g.id === farbeFuer)?.farbe}
        optionen={FARBAUSWAHL.map((f) => ({ id: f, name: f, farbe: f }))}
        onWahl={(farbe) => setWarengruppen(warengruppen.map((x) => (x.id === farbeFuer ? { ...x, farbe } : x)))}
        onZu={() => setFarbeFuer(null)}
      />
    </ScrollView>
  );
}

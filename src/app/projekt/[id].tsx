import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { FolienSeite } from '@/screens/Folien';
import { GrundrissSeite } from '@/screens/Grundriss';
import { KassenSeite } from '@/screens/Kassen';
import { StammdatenSeite } from '@/screens/Stammdaten';
import { useBilder, useStore } from '@/store/store';
import { F } from '@/ui/kit';

const TABS = ['Stammdaten', 'Grundriss', 'Kassen', 'Folien'] as const;

export default function ProjektSeite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projekt = useStore((s) => s.projekte.find((p) => p.id === id));
  const geladen = useStore((s) => s.geladen);
  const laden = useBilder((s) => s.laden);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Stammdaten');
  const fenster = useWindowDimensions();
  const breite = Math.min(fenster.width, 1000) - 32;

  const logoId = projekt?.logoBildId ?? null;
  const grundrissId = projekt?.grundrissBildId ?? null;
  useEffect(() => {
    laden(logoId);
    laden(grundrissId);
  }, [laden, logoId, grundrissId]);

  if (!projekt)
    return <Text style={{ padding: 24, color: F.grau }}>{geladen ? 'Projekt nicht gefunden.' : 'Lädt …'}</Text>;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: projekt.stammdaten.markt || 'Projekt' }} />
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: F.linie }}>
        {TABS.map((t) => (
          <Pressable
            key={t} accessibilityRole="tab" accessibilityState={{ selected: t === tab }} onPress={() => setTab(t)}
            style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderColor: t === tab ? F.blau : 'transparent' }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: t === tab ? F.blau : F.grau }}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 1000, width: '100%', alignSelf: 'center', paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
      >
        {tab === 'Stammdaten' ? <StammdatenSeite projekt={projekt} /> : null}
        {tab === 'Grundriss' ? <GrundrissSeite projekt={projekt} breite={breite} /> : null}
        {tab === 'Kassen' ? <KassenSeite projekt={projekt} breite={breite} /> : null}
        {tab === 'Folien' ? <FolienSeite projekt={projekt} breite={breite} /> : null}
      </ScrollView>
    </View>
  );
}

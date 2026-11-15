import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Aufmass } from '@/screens/Aufmass';
import { Export } from '@/screens/Export';
import { Planung } from '@/screens/Planung';
import { useStore } from '@/store/store';
import { F } from '@/ui/kit';

const TABS = ['Aufmaß', 'Planung', 'Export'] as const;

export default function ProjektSeite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projekt = useStore((s) => s.projekte.find((p) => p.id === id));
  const geladen = useStore((s) => s.geladen);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Aufmaß');

  if (!projekt)
    return <Text style={{ padding: 24, color: F.grau }}>{geladen ? 'Projekt nicht gefunden.' : 'Lädt …'}</Text>;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: projekt.markt }} />
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: F.linie }}>
        {TABS.map((t) => (
          <Pressable
            key={t} accessibilityRole="tab" accessibilityState={{ selected: t === tab }} onPress={() => setTab(t)}
            style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderColor: t === tab ? F.blau : 'transparent' }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: t === tab ? F.blau : F.grau }}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 900, width: '100%', alignSelf: 'center', paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
      >
        {tab === 'Aufmaß' ? <Aufmass projekt={projekt} /> : null}
        {tab === 'Planung' ? <Planung projekt={projekt} /> : null}
        {tab === 'Export' ? <Export projekt={projekt} /> : null}
      </ScrollView>
    </View>
  );
}

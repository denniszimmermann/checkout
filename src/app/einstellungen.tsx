import { ScrollView, Text, View } from 'react-native';

import { MODULTYPEN, WARENGRUPPEN } from '@/data/stammdaten';
import { uid } from '@/domain/types';
import { useStore } from '@/store/store';
import { F, Karte, Knopf, LoeschKnopf, TextFeld, Titel, Zeile, ZahlFeld } from '@/ui/kit';

const FARBEN = ['#F8C8DC', '#E3C6A8', '#C9E4C5', '#BFE0F5', '#D9D2C5', '#FBE7A1', '#D7CDEB', '#FFD3B0', '#F5B7B1', '#CFD8DC'];

export default function Einstellungen() {
  const { warengruppen, modulTypen, minGang, setWarengruppen, setModulTypen, setMinGang } = useStore();

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, maxWidth: 900, width: '100%', alignSelf: 'center', paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
    >
      <Titel>Warengruppen</Titel>
      <Karte>
        {warengruppen.map((g) => (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <View style={{ width: 28, height: 46, justifyContent: 'center' }}>
              <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: g.farbe, borderWidth: 1, borderColor: '#8A96A3' }} />
            </View>
            <TextFeld label="Name" value={g.name} onChange={(name) => setWarengruppen(warengruppen.map((x) => (x.id === g.id ? { ...x, name } : x)))} />
            <LoeschKnopf text="✕" onLoeschen={() => setWarengruppen(warengruppen.filter((x) => x.id !== g.id))} />
          </View>
        ))}
        <Knopf
          art="leicht" text="+ Warengruppe"
          onPress={() => setWarengruppen([...warengruppen, { id: uid(), name: 'Neue Warengruppe', farbe: FARBEN[warengruppen.length % FARBEN.length] }])}
        />
      </Karte>

      <Titel>Modulkatalog</Titel>
      {modulTypen.map((t) => {
        const setze = (patch: Partial<typeof t>) => setModulTypen(modulTypen.map((x) => (x.id === t.id ? { ...x, ...patch } : x)));
        return (
          <Karte key={t.id}>
            <TextFeld label="Bezeichnung" value={t.name} onChange={(name) => setze({ name })} />
            <Zeile>
              <ZahlFeld label="Höhe" value={t.hoehe} onChange={(hoehe) => setze({ hoehe })} />
              <ZahlFeld label="Tiefe" value={t.tiefe} onChange={(tiefe) => setze({ tiefe })} />
              <ZahlFeld label="Böden" einheit="Stk." value={t.boeden} onChange={(n) => setze({ boeden: Math.max(1, Math.min(12, Math.round(n))) })} />
            </Zeile>
          </Karte>
        );
      })}
      <Text style={{ color: F.grau, fontSize: 13 }}>
        Eine geänderte Bodenzahl gilt für Module, die danach neu gesetzt werden („Neu berechnen“).
      </Text>

      <Titel>Prüfwerte</Titel>
      <Karte>
        <ZahlFeld label="Mindest-Gangbreite (Warnung bei Unterschreitung)" value={minGang} onChange={setMinGang} />
      </Karte>

      <Knopf art="leicht" text="Warengruppen & Module auf Beispieldaten zurücksetzen"
        onPress={() => { setWarengruppen(WARENGRUPPEN); setModulTypen(MODULTYPEN); }} />
    </ScrollView>
  );
}

import { ReactNode, useEffect, useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle,
} from 'react-native';

import { cm } from '@/domain/types';

export const F = {
  bg: '#F2F4F7', karte: '#FFFFFF', tinte: '#1B2A3A', grau: '#5B6B7B', linie: '#D5DCE4',
  blau: '#1F4E79', blauHell: '#E3EDF7', rot: '#B3261E', warnBg: '#FFF4E0', warn: '#8A5200',
};

export function Karte({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.karte, style]}>{children}</View>;
}

export function Titel({ children }: { children: ReactNode }) {
  return <Text style={s.titel}>{children}</Text>;
}

type KnopfProps = {
  text: string; onPress: () => void; art?: 'voll' | 'leicht' | 'rot'; klein?: boolean; style?: ViewStyle; a11y?: string;
};
export function Knopf({ text, onPress, art = 'voll', klein, style, a11y }: KnopfProps) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={a11y}
      onPress={onPress}
      style={({ pressed }) => [
        s.knopf, klein && s.knopfKlein,
        art === 'voll' && { backgroundColor: F.blau },
        art === 'leicht' && { backgroundColor: F.blauHell },
        art === 'rot' && { backgroundColor: '#FBE9E7' },
        pressed && { opacity: 0.6 }, style,
      ]}
    >
      <Text style={[s.knopfText, klein && { fontSize: 14 }, art === 'voll' ? { color: '#fff' } : art === 'rot' ? { color: F.rot } : { color: F.blau }]}>
        {text}
      </Text>
    </Pressable>
  );
}

/** Löschen mit Rückfrage durch zweites Antippen */
export function LoeschKnopf({ onLoeschen, text = 'Löschen' }: { onLoeschen: () => void; text?: string }) {
  const [sicher, setSicher] = useState(false);
  useEffect(() => {
    if (!sicher) return;
    const t = setTimeout(() => setSicher(false), 3000);
    return () => clearTimeout(t);
  }, [sicher]);
  return (
    <Knopf klein art="rot" text={sicher ? 'Wirklich löschen?' : text}
      onPress={() => (sicher ? onLoeschen() : setSicher(true))} />
  );
}

export function TextFeld(p: { label: string; value: string; onChange: (v: string) => void; mehrzeilig?: boolean; style?: ViewStyle }) {
  return (
    <View style={[{ flex: 1, minWidth: 140 }, p.style]}>
      <Text style={s.label}>{p.label}</Text>
      <TextInput
        accessibilityLabel={p.label} value={p.value} onChangeText={p.onChange} multiline={p.mehrzeilig}
        style={[s.eingabe, p.mehrzeilig && { minHeight: 70, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

/** Maßeingabe in cm, akzeptiert Komma und Punkt */
export function ZahlFeld(p: { label: string; value: number; onChange: (v: number) => void; einheit?: string }) {
  const [text, setText] = useState(p.value ? cm(p.value) : '');
  // Weicht der gespeicherte Wert von der Eingabe ab (z. B. nach Zurücksetzen), gilt der gespeicherte.
  const aktuell = parseFloat(text.replace(',', '.')) || 0;
  const anzeige = Math.abs(aktuell - p.value) > 1e-6 ? (p.value ? cm(p.value) : '') : text;
  return (
    <View style={{ flex: 1, minWidth: 96 }}>
      <Text style={s.label}>{p.label}</Text>
      <View style={s.zahlZeile}>
        <TextInput
          accessibilityLabel={p.label} value={anzeige} keyboardType="decimal-pad" selectTextOnFocus
          placeholder="0" placeholderTextColor="#A9B4BF"
          onChangeText={(t) => {
            const sauber = t.replace(/[^0-9.,]/g, '');
            setText(sauber);
            const n = parseFloat(sauber.replace(',', '.'));
            p.onChange(Number.isFinite(n) && n >= 0 ? n : 0);
          }}
          style={s.zahl}
        />
        <Text style={s.einheit}>{p.einheit ?? 'cm'}</Text>
      </View>
    </View>
  );
}

export type Option = { id: string; name: string; farbe?: string; info?: string };

/** Auswahlmenü als Blatt von unten */
export function Auswahl(p: {
  sichtbar: boolean; titel: string; optionen: Option[]; gewaehlt?: string | null;
  onWahl: (id: string) => void; onZu: () => void;
}) {
  return (
    <Modal visible={p.sichtbar} transparent animationType="slide" onRequestClose={p.onZu}>
      <Pressable style={s.schleier} onPress={p.onZu} accessibilityLabel="Schließen" />
      <View style={s.blatt}>
        <Text style={s.blattTitel}>{p.titel}</Text>
        <ScrollView>
          {p.optionen.map((o) => (
            <Pressable
              key={o.id} accessibilityRole="button"
              onPress={() => { p.onWahl(o.id); p.onZu(); }}
              style={({ pressed }) => [s.option, o.id === p.gewaehlt && { backgroundColor: F.blauHell }, pressed && { opacity: 0.6 }]}
            >
              {o.farbe ? <View style={[s.chip, { backgroundColor: o.farbe }]} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={s.optionText}>{o.name}</Text>
                {o.info ? <Text style={s.optionInfo}>{o.info}</Text> : null}
              </View>
              {o.id === p.gewaehlt ? <Text style={{ color: F.blau, fontSize: 18 }}>✓</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
        <Knopf art="leicht" text="Abbrechen" onPress={p.onZu} style={{ marginTop: 8 }} />
      </View>
    </Modal>
  );
}

/** Feld, das ein Auswahlmenü öffnet */
export function AuswahlFeld(p: { label: string; wert: string; farbe?: string; onPress: () => void; style?: ViewStyle; kompakt?: boolean; a11y?: string }) {
  return (
    <View style={[{ flex: 1, minWidth: p.kompakt ? 0 : 140 }, p.style]}>
      {p.kompakt ? null : <Text style={s.label}>{p.label}</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel={`${p.a11y ?? p.label}: ${p.wert}`} onPress={p.onPress} style={[s.eingabe, s.auswahlFeld]}>
        {p.farbe ? <View style={[s.chip, { backgroundColor: p.farbe }]} /> : null}
        <Text style={{ flex: 1, fontSize: 16, color: F.tinte }} numberOfLines={1}>{p.wert}</Text>
        <Text style={{ color: F.grau }}>▾</Text>
      </Pressable>
    </View>
  );
}

export function Hinweise({ texte }: { texte: string[] }) {
  if (!texte.length) return null;
  return (
    <View style={s.warn}>
      {texte.map((t, i) => <Text key={i} style={{ color: F.warn, fontSize: 14, lineHeight: 20 }}>• {t}</Text>)}
    </View>
  );
}

export const Zeile = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }, style]}>{children}</View>
);

const s = StyleSheet.create({
  karte: { backgroundColor: F.karte, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: F.linie },
  titel: { fontSize: 13, fontWeight: '700', color: F.grau, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8 },
  knopf: { minHeight: 46, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  knopfKlein: { minHeight: 38, paddingHorizontal: 12 },
  knopfText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 13, color: F.grau, marginBottom: 4 },
  eingabe: { borderWidth: 1, borderColor: F.linie, borderRadius: 10, paddingHorizontal: 12, minHeight: 46, fontSize: 16, color: F.tinte, backgroundColor: '#fff' },
  zahlZeile: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: F.linie, borderRadius: 10, backgroundColor: '#fff', paddingRight: 8 },
  zahl: { flex: 1, minWidth: 0, minHeight: 46, paddingLeft: 10, paddingRight: 2, fontSize: 17, fontWeight: '600', color: F.tinte, fontVariant: ['tabular-nums'] },
  einheit: { color: F.grau, fontSize: 13 },
  schleier: { flex: 1, backgroundColor: 'rgba(15,25,35,0.4)' },
  blatt: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 28, maxHeight: '75%' },
  blattTitel: { fontSize: 17, fontWeight: '700', color: F.tinte, marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  optionText: { fontSize: 16, color: F.tinte },
  optionInfo: { fontSize: 13, color: F.grau, marginTop: 2 },
  chip: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#8A96A3' },
  auswahlFeld: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warn: { backgroundColor: F.warnBg, borderRadius: 10, padding: 10, gap: 2 },
});

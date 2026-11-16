import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Projekt } from '@/domain/types';
import { FolienAnsicht } from '@/slides/FolienAnsicht';
import { deck } from '@/slides/build';
import { deckAlsPptx } from '@/slides/toPptx';
import { deckAlsHtml } from '@/slides/toSvg';
import { useBilder, useStore } from '@/store/store';
import { F, Karte, Knopf, Titel, Zeile } from '@/ui/kit';

const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

const dateiname = (p: Projekt) =>
  `${p.stand.replace(/-/g, '')}-Kassenzone-${(p.stammdaten.markt || 'Markt').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}`;

export function FolienSeite({ projekt: p, breite }: { projekt: Projekt; breite: number }) {
  const warengruppen = useStore((s) => s.warengruppen);
  const bilder = useBilder((s) => s.bilder);
  const [status, setStatus] = useState('');
  const folien = deck(p, { warengruppen, bilder });
  const titel = `Kassenzone Platzierungsvorschlag ${p.stammdaten.markt}`;

  const fehler = (was: string, e: unknown) => setStatus(`${was} konnte nicht erstellt werden: ${e instanceof Error ? e.message : String(e)}`);

  const powerpoint = async () => {
    try {
      setStatus('PowerPoint wird erstellt …');
      const base64 = await deckAlsPptx(folien, titel);
      if (Platform.OS === 'web') {
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: PPTX }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dateiname(p)}.pptx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        const datei = new File(Paths.cache, `${dateiname(p)}.pptx`);
        if (datei.exists) datei.delete();
        datei.create();
        datei.write(base64, { encoding: 'base64' });
        await Sharing.shareAsync(datei.uri, { mimeType: PPTX, UTI: 'org.openxmlformats.presentationml.presentation', dialogTitle: titel });
      }
      setStatus('');
    } catch (e) {
      fehler('Die PowerPoint-Datei', e);
    }
  };

  const pdf = async () => {
    try {
      const html = deckAlsHtml(folien, titel);
      if (Platform.OS === 'web') {
        const w = window.open('', '_blank');
        if (!w) return setStatus('Bitte Pop-ups für diese Seite erlauben.');
        w.document.write(html);
        w.document.close();
        w.onload = () => w.print();
        return;
      }
      setStatus('PDF wird erstellt …');
      const { uri } = await Print.printToFileAsync({ html, width: 960, height: 540, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: titel });
      setStatus('');
    } catch (e) {
      fehler('Das PDF', e);
    }
  };

  return (
    <>
      <Karte>
        <Zeile>
          <Knopf text="PowerPoint teilen" onPress={powerpoint} />
          <Knopf art="leicht" text="PDF teilen" onPress={pdf} />
        </Zeile>
        {status ? <Text style={{ color: F.grau }}>{status}</Text> : null}
      </Karte>
      <Titel>{folien.length} Folien</Titel>
      {folien.map((f, i) => (
        <View key={f.id} style={{ gap: 4 }}>
          <Text style={{ color: F.grau, fontSize: 13 }}>{i + 1} · {f.titel}</Text>
          <View style={{ borderWidth: 1, borderColor: F.linie, backgroundColor: '#fff' }}>
            <FolienAnsicht folie={f} breite={breite - 2} />
          </View>
        </View>
      ))}
    </>
  );
}

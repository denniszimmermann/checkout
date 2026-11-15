import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, Text } from 'react-native';

import { Projekt } from '@/domain/types';
import { pruefeProjekt } from '@/domain/validate';
import { buildPdfHtml } from '@/pdf/buildPdfHtml';
import { useStore } from '@/store/store';
import { F, Hinweise, Karte, Knopf, Titel } from '@/ui/kit';

export function Export({ projekt: p }: { projekt: Projekt }) {
  const { modulTypen, warengruppen, minGang } = useStore();
  const [status, setStatus] = useState('');
  const hinweise = pruefeProjekt(p, modulTypen, minGang);

  const erstellen = async () => {
    const html = buildPdfHtml(p, modulTypen, warengruppen, minGang);
    try {
      if (Platform.OS === 'web') {
        // Im Browser: Dokument in neuem Fenster öffnen und Druckdialog (PDF) anbieten
        const w = window.open('', '_blank');
        if (!w) return setStatus('Bitte Pop-ups für diese Seite erlauben.');
        w.document.write(html);
        w.document.close();
        w.print();
        return;
      }
      setStatus('PDF wird erstellt …');
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: `Kassenzone ${p.markt}` });
        setStatus('');
      } else setStatus(`PDF gespeichert unter ${uri}`);
    } catch (e) {
      setStatus(`PDF konnte nicht erstellt werden: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <>
      <Titel>PDF</Titel>
      <Karte>
        <Text style={{ color: F.tinte, fontSize: 15, lineHeight: 21 }}>
          Das PDF enthält die Draufsicht, das Aufmaß und je Stellfläche die Frontansicht mit Bemaßung und Sortimentsliste.
        </Text>
        {hinweise.length ? <Text style={{ color: F.grau }}>Offene Hinweise (werden im PDF mit ausgegeben):</Text> : null}
        <Hinweise texte={hinweise} />
        <Knopf text="PDF erstellen und teilen" onPress={erstellen} />
        {status ? <Text style={{ color: F.grau }}>{status}</Text> : null}
      </Karte>
    </>
  );
}

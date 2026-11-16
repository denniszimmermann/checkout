import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Projekt, STAMMDATEN_FELDER } from '@/domain/types';
import { faktenAuto } from '@/slides/build';
import { useBilder, useStore } from '@/store/store';
import { bildWaehlen } from '@/ui/bild';
import { Auswahl, AuswahlFeld, F, Karte, Knopf, TextFeld, Titel, Zeile } from '@/ui/kit';

const LOGO = { edeka: 'EDEKA (Standard)', eigen: 'Eigenes Logo', kein: 'Kein Logo' } as const;

const GRUPPEN: { titel: string; von: number; bis: number }[] = [
  { titel: 'Markt', von: 0, bis: 8 },
  { titel: 'Kassenzone', von: 8, bis: 20 },
  { titel: 'Preisauszeichnung, AZ-Schienen, Haken', von: 20, bis: STAMMDATEN_FELDER.length },
];

export function StammdatenSeite({ projekt: p }: { projekt: Projekt }) {
  const aendereProjekt = useStore((s) => s.aendereProjekt);
  const speichern = useBilder((s) => s.speichern);
  const [logoMenue, setLogoMenue] = useState(false);
  const aendere = (patch: Partial<Projekt>) => aendereProjekt(p.id, (x) => ({ ...x, ...patch }));

  const eigenesLogo = async (quelle: 'mediathek' | 'kamera') => {
    const bild = await bildWaehlen(quelle);
    if (bild) aendere({ logo: 'eigen', logoBildId: await speichern(bild) });
  };

  return (
    <>
      <Titel>Titelfolie</Titel>
      <Karte>
        <Zeile>
          <TextFeld label="Händler (Fußzeile)" value={p.haendler} onChange={(haendler) => aendere({ haendler })} />
          <TextFeld label="Stand (JJJJ-MM-TT)" value={p.stand} onChange={(stand) => aendere({ stand })} />
        </Zeile>
        <Zeile>
          <AuswahlFeld label="Händlerlogo" wert={LOGO[p.logo]} onPress={() => setLogoMenue(true)} />
          {p.logo === 'eigen' ? <Knopf art="leicht" text="Logo aus Fotos wählen" onPress={() => eigenesLogo('mediathek')} /> : null}
        </Zeile>
        {p.logo === 'eigen' && !p.logoBildId ? <Text style={{ color: F.warn }}>Noch kein Logo gewählt.</Text> : null}
      </Karte>

      {GRUPPEN.map((g) => (
        <View key={g.titel} style={{ gap: 12 }}>
          <Titel>{g.titel}</Titel>
          <Karte>
            {STAMMDATEN_FELDER.slice(g.von, g.bis).map((f) => (
              <TextFeld
                key={f.key} label={f.label} value={p.stammdaten[f.key]}
                onChange={(v) => aendere({ stammdaten: { ...p.stammdaten, [f.key]: v } })}
              />
            ))}
          </Karte>
        </View>
      ))}

      <Titel>Folie „Fakten Einrichtung“</Titel>
      <Karte>
        <TextFeld
          label={p.fakten === null ? 'Text (automatisch aus den Kassen erzeugt)' : 'Text (eine Zeile je Punkt)'}
          mehrzeilig value={p.fakten ?? faktenAuto(p)} onChange={(fakten) => aendere({ fakten })}
        />
        {p.fakten !== null ? <Knopf klein art="leicht" text="Wieder automatisch erzeugen" onPress={() => aendere({ fakten: null })} /> : null}
      </Karte>

      <Auswahl
        sichtbar={logoMenue} titel="Händlerlogo" gewaehlt={p.logo}
        optionen={[
          { id: 'edeka', name: LOGO.edeka },
          { id: 'eigen', name: LOGO.eigen, info: Platform.OS === 'web' ? 'Bilddatei auswählen' : 'Aus den Fotos auswählen' },
          { id: 'kein', name: LOGO.kein },
        ]}
        onWahl={(id) => (id === 'eigen' ? (p.logoBildId ? aendere({ logo: 'eigen' }) : eigenesLogo('mediathek')) : aendere({ logo: id as Projekt['logo'] }))}
        onZu={() => setLogoMenue(false)}
      />
    </>
  );
}

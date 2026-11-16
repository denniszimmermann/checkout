# Kassenzonen-Planer

App für iPhone und iPad, die aus dem Aufmaß einer Kassenzone einen
**„Kassenzone Platzierungsvorschlag“ als Foliensatz** erzeugt, im Aufbau der bisherigen
PowerPoint-Vorlage: Titel, Stammdaten, Grundriss mit Kassennummern, Fakten, je Kasse die
Laufbandseiten mit Regal und farbigen Böden, Gondelköpfe und Platzierungsübersicht.

- **Stammdaten**: Formular wie die Stammdatenfolie, Händlerlogo je Projekt.
- **Grundriss**: Bild wählen oder fotografieren, Kassennummern und Laufrichtung antippen.
- **Kassen**: Kassentyp, Maße, je Folie Regalbreite/-höhe und die Böden;
  Warengruppe und Tiefe je Boden über Auswahlmenüs. Die Folie wird live angezeigt.
- **Folien**: Vorschau aller Folien, Ausgabe als bearbeitbare PowerPoint-Datei und als PDF.

Alle Daten bleiben auf dem Gerät. SCO-Folien und die Kosten-Folie sind noch nicht enthalten.

## Auf dem iPhone/iPad ausprobieren

1. Auf dem Gerät die kostenlose App **Expo Go** aus dem App Store installieren.
2. Auf einem Rechner mit Node.js (im selben WLAN):

```bash
npm install
```

```bash
npx expo start
```

3. Den angezeigten QR-Code mit der Kamera des iPhones/iPads scannen.

## Entwicklung

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run lint
```

- `src/domain/` – Datenmodell, Standard-Warengruppen und -Tiefen
- `src/slides/build.ts` – baut jede Folie als Liste einfacher Elemente (cm-Koordinaten)
- `src/slides/FolienAnsicht.tsx`, `toPptx.ts`, `toSvg.ts` – dieselbe Folie als Vorschau, PowerPoint, PDF
- `src/slides/assets.gen.ts` – Grafiken aus der PowerPoint-Vorlage (erzeugt, nicht von Hand ändern)
- `src/screens/`, `src/app/` – Bildschirme
- `scripts/vorlage-*.py` – erzeugen `assets.gen.ts` aus der Vorlage (benötigt LibreOffice, Poppler,
  python-pptx, Pillow, numpy): erst die Vorlage mit `vorlage-strip.py` einmal auf weißem und einmal
  auf schwarzem Hintergrund freistellen und rendern, dann `vorlage-assets.py` ausführen

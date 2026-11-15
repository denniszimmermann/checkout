# Kassenzonen-Planer

App für iPhone und iPad zur Planung von Kassenzonen: Aufmaß eintragen, Vorlage an die
gemessene Länge anpassen lassen, Warengruppen je Boden über Auswahlmenüs festlegen,
Ergebnis als maßstäbliche Zeichnung und PDF weitergeben. Alle Daten bleiben auf dem Gerät.

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

- `src/domain/` – Datenmodell und Anpassungslogik (`fit.ts`, mit Tests)
- `src/data/stammdaten.ts` – Warengruppen, Modulkatalog und Vorlagen (**derzeit Beispieldaten**)
- `src/drawing/` – Front- und Draufsicht (für App und PDF aus derselben Formenliste)
- `src/pdf/` – PDF-Dokument
- `src/screens/`, `src/app/` – Bildschirme

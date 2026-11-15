import { VORLAGEN } from '@/data/stammdaten';
import { anordnen } from '@/domain/fit';
import { ModulTyp, Projekt, STOERSTELLEN_NAMEN, Warengruppe, cm } from '@/domain/types';
import { pruefeProjekt } from '@/domain/validate';
import { alsSvg, draufsicht, frontansicht } from '@/drawing/scene';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildPdfHtml(p: Projekt, modulTypen: ModulTyp[], gruppen: Warengruppe[], minGang: number): string {
  const gname = (id: string | null) => gruppen.find((g) => g.id === id)?.name ?? '–';
  const gfarbe = (id: string | null) => gruppen.find((g) => g.id === id)?.farbe ?? '#fff';
  const warnungen = pruefeProjekt(p, modulTypen, minGang);

  const kassen = p.kassenplaetze
    .map((k) => `<tr><td>Kasse ${k.nummer}</td><td>${cm(k.tischLaenge)}</td><td>${cm(k.tischBreite)}</td><td>${cm(k.gangBreite)}</td></tr>`)
    .join('');

  const flaechen = p.stellflaechen
    .map((f) => {
      const a = anordnen(f.module, f.laenge, f.stoerstellen);
      const vorlage = VORLAGEN.find((v) => v.id === f.vorlageId)?.name ?? 'keine Vorlage';
      const kasse = p.kassenplaetze.find((k) => k.id === f.kassenplatzId);
      const zeilen = a.module
        .filter((m) => m.x !== null)
        .map((m, nr) => {
          const t = modulTypen.find((x) => x.id === m.modulTypId);
          const kopf = `<td rowspan="${m.warengruppen.length}">${nr + 1}</td><td rowspan="${m.warengruppen.length}">${esc(t?.name ?? 'Modul')}</td><td rowspan="${m.warengruppen.length}">${cm(m.breite)}</td>`;
          return m.warengruppen
            .map((g, i) => `<tr>${i === 0 ? kopf : ''}<td>${i + 1}</td><td><span class="chip" style="background:${gfarbe(g)}"></span>${esc(gname(g))}</td></tr>`)
            .join('');
        })
        .join('');
      const stoer = f.stoerstellen.length
        ? `<p class="klein">Störstellen: ${f.stoerstellen.map((s) => `${STOERSTELLEN_NAMEN[s.typ]} bei ${cm(s.position)} cm, ${cm(s.breite)} cm breit${s.notiz ? ` (${esc(s.notiz)})` : ''}`).join(' · ')}</p>`
        : '';
      return `<section>
        <h2>${esc(f.name)}${kasse ? ` – Kasse ${kasse.nummer}` : ''}</h2>
        <p class="klein">Länge ${cm(f.laenge)} cm · Vorlage: ${esc(vorlage)} · Rest ${cm(a.rest)} cm</p>
        ${alsSvg(frontansicht(f, modulTypen, gruppen))}
        ${stoer}
        ${zeilen ? `<table><tr><th>Nr.</th><th>Modul</th><th>Breite (cm)</th><th>Boden</th><th>Warengruppe</th></tr>${zeilen}</table>` : ''}
      </section>`;
    })
    .join('');

  return `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1B2A3A; font-size: 11px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  h2 { font-size: 14px; margin: 18px 0 4px; border-bottom: 1px solid #C5CED8; padding-bottom: 3px; }
  section { page-break-inside: avoid; }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; }
  th, td { border: 1px solid #C5CED8; padding: 3px 6px; text-align: left; vertical-align: top; }
  th { background: #EEF2F6; }
  .klein { color: #5B6B7B; margin: 2px 0 6px; }
  .chip { display: inline-block; width: 9px; height: 9px; border: 1px solid #8A96A3; margin-right: 5px; }
  .warn { background: #FFF4E0; border: 1px solid #C77700; padding: 6px 10px; margin-top: 10px; }
  svg { max-height: 120mm; }
</style></head><body>
  <h1>Kassenzonenplanung ${esc(p.markt)}</h1>
  <p class="klein">Aufmaß vom ${esc(p.datum.split('-').reverse().join('.'))} · alle Maße in cm</p>
  ${p.notizen ? `<p>${esc(p.notizen)}</p>` : ''}
  ${warnungen.length ? `<div class="warn"><b>Hinweise</b><br>${warnungen.map(esc).join('<br>')}</div>` : ''}
  <section><h2>Draufsicht</h2>${alsSvg(draufsicht(p, modulTypen, gruppen))}</section>
  <section><h2>Aufmaß Kassenplätze</h2>
  <table><tr><th>Platz</th><th>Tischlänge</th><th>Tischbreite</th><th>Gangbreite</th></tr>${kassen}</table></section>
  ${flaechen}
</body></html>`;
}

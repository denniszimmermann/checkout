import { El, FH, FW, Folie, PT, pfeilSpitzen, textLayout } from './model';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Bilder werden einmal im Dokument hinterlegt und je Folie nur referenziert. */
class BildListe {
  ids = new Map<string, string>();
  id(src: string) {
    if (!this.ids.has(src)) this.ids.set(src, `b${this.ids.size}`);
    return this.ids.get(src)!;
  }
  defs() {
    return [...this.ids].map(([src, id]) =>
      `<image id="${id}" href="${src}" width="1" height="1" preserveAspectRatio="none"/>`).join('');
  }
}

function elSvg(e: El, bilder: BildListe): string {
  switch (e.t) {
    case 'img': {
      const tr = e.flipH ? `translate(${e.x + e.w},${e.y}) scale(${-e.w},${e.h})` : `translate(${e.x},${e.y}) scale(${e.w},${e.h})`;
      return `<use href="#${bilder.id(e.src)}" transform="${tr}"/>`;
    }
    case 'rect':
      return `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="${e.fill ?? 'none'}"${e.alpha != null ? ` fill-opacity="${e.alpha}"` : ''}${e.line ? ` stroke="${e.line}" stroke-width="${(e.lw ?? 0.75) * PT}"` : ''}/>`;
    case 'line':
      return `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="${e.color}" stroke-width="${e.lw * PT}"/>` +
        pfeilSpitzen(e).map((pts) => `<polygon points="${pts}" fill="${e.color}"/>`).join('');
    case 'text': {
      const l = textLayout(e);
      const zeilen = l.zeilen.map((z) =>
        `<text x="${z.x}" y="${z.y}" text-anchor="${z.anchor}" xml:space="preserve">${z.runs.map((r) =>
          `<tspan fill="${r.color ?? e.color}" font-weight="${r.bold ?? e.bold ? 'bold' : 'normal'}">${esc(r.t)}</tspan>`).join('')}</text>`).join('');
      return `<g font-family="Arial, Helvetica, sans-serif" font-size="${l.fs}"${e.underline ? ' text-decoration="underline"' : ''}${e.rot ? ` transform="rotate(${e.rot} ${l.cx} ${l.cy})"` : ''}>${zeilen}</g>`;
    }
  }
}

/** HTML-Dokument mit einer Querformat-Seite je Folie (für den PDF-Export) */
export function deckAlsHtml(folien: Folie[], titel: string): string {
  const bilder = new BildListe();
  const seiten = folien.map((f) =>
    `<svg class="folie" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FW} ${FH}">${f.els.map((e) => elSvg(e, bilder)).join('')}</svg>`).join('\n');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(titel)}</title>
<style>
  @page { size: 960pt 540pt; margin: 0; }
  html, body { margin: 0; padding: 0; }
  svg.folie { display: block; width: 960pt; height: 540pt; page-break-after: always; break-after: page; }
</style></head><body>
<svg width="0" height="0" style="position:absolute"><defs>${bilder.defs()}</defs></svg>
${seiten}
</body></html>`;
}

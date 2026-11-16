import PptxGenJS from 'pptxgenjs';

import { El, FH, FW, Folie } from './model';

const zoll = (cm: number) => cm / 2.54;
const farbe = (hex: string) => hex.replace('#', '').toUpperCase();
const bildDaten = (uri: string) => uri.replace(/^data:/, '');

function element(pptx: PptxGenJS, slide: PptxGenJS.Slide, e: El) {
  switch (e.t) {
    case 'img':
      slide.addImage({ data: bildDaten(e.src), x: zoll(e.x), y: zoll(e.y), w: zoll(e.w), h: zoll(e.h), flipH: !!e.flipH });
      break;
    case 'rect':
      slide.addShape(pptx.ShapeType.rect, {
        x: zoll(e.x), y: zoll(e.y), w: zoll(e.w), h: zoll(e.h),
        fill: e.fill ? { color: farbe(e.fill), transparency: e.alpha != null ? Math.round((1 - e.alpha) * 100) : 0 } : { type: 'none' },
        line: e.line ? { color: farbe(e.line), width: e.lw ?? 0.75 } : { type: 'none' },
      });
      break;
    case 'line': {
      const x = Math.min(e.x1, e.x2), y = Math.min(e.y1, e.y2);
      // PowerPoint zeichnet Linien von links oben nach rechts unten; sonst wird gespiegelt.
      const flipH = e.x2 < e.x1, flipV = e.y2 < e.y1;
      slide.addShape(pptx.ShapeType.line, {
        x: zoll(x), y: zoll(y), w: zoll(Math.abs(e.x2 - e.x1)), h: zoll(Math.abs(e.y2 - e.y1)), flipH, flipV,
        line: {
          color: farbe(e.color), width: e.lw,
          beginArrowType: e.pfeile === 'beide' ? 'triangle' : 'none',
          endArrowType: e.pfeile ? 'triangle' : 'none',
        },
      });
      break;
    }
    case 'text': {
      const runs = e.zeilen.flatMap((zeile, zi) =>
        (zeile.length ? zeile : [{ t: '' }]).map((r, ri) => ({
          text: r.t,
          options: {
            color: farbe(r.color ?? e.color), bold: !!(r.bold ?? e.bold),
            breakLine: ri === zeile.length - 1 && zi < e.zeilen.length - 1,
          },
        })));
      slide.addText(runs, {
        x: zoll(e.x), y: zoll(e.y), w: zoll(e.w), h: zoll(e.h),
        fontFace: 'Arial', fontSize: e.size, margin: 0, fit: 'none', wrap: false,
        align: e.align === 'l' ? 'left' : e.align === 'r' ? 'right' : 'center',
        valign: e.valign === 't' ? 'top' : e.valign === 'b' ? 'bottom' : 'middle',
        rotate: e.rot ?? 0,
        underline: e.underline ? { style: 'sng' } : undefined,
      });
      break;
    }
  }
}

/** Bearbeitbare PowerPoint-Datei, Base64-kodiert */
export async function deckAlsPptx(folien: Folie[], titel: string): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'BREIT', width: zoll(FW), height: zoll(FH) });
  pptx.layout = 'BREIT';
  pptx.title = titel;
  for (const f of folien) {
    const slide = pptx.addSlide();
    for (const e of f.els) element(pptx, slide, e);
  }
  return (await pptx.write({ outputType: 'base64' })) as string;
}

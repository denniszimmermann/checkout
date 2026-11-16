import { memo } from 'react';
import { Platform } from 'react-native';
import Svg, { G, Image, Line, Polygon, Rect, TSpan, Text as SvgText } from 'react-native-svg';

import { FH, FW, Folie, PT, pfeilSpitzen, textLayout } from './model';

const SCHRIFT = Platform.OS === 'web' ? 'Arial, Helvetica, sans-serif' : 'Helvetica';

/** Maßstäbliche Vorschau einer Folie */
export const FolienAnsicht = memo(function FolienAnsicht({ folie, breite }: { folie: Folie; breite: number }) {
  return (
    <Svg width={breite} height={(breite * FH) / FW} viewBox={`0 0 ${FW} ${FH}`}>
      {folie.els.map((e, i) => {
        switch (e.t) {
          case 'img':
            return (
              <Image
                key={i} href={e.src} x={0} y={0} width={1} height={1} preserveAspectRatio="none"
                transform={e.flipH ? `translate(${e.x + e.w},${e.y}) scale(${-e.w},${e.h})` : `translate(${e.x},${e.y}) scale(${e.w},${e.h})`}
              />
            );
          case 'rect':
            return (
              <Rect
                key={i} x={e.x} y={e.y} width={e.w} height={e.h} fill={e.fill ?? 'none'} fillOpacity={e.alpha ?? 1}
                stroke={e.line ?? 'none'} strokeWidth={e.line ? (e.lw ?? 0.75) * PT : 0}
              />
            );
          case 'line':
            return (
              <G key={i}>
                <Line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.color} strokeWidth={e.lw * PT} />
                {pfeilSpitzen(e).map((pts, n) => <Polygon key={n} points={pts} fill={e.color} />)}
              </G>
            );
          case 'text': {
            const l = textLayout(e);
            return (
              <G key={i} transform={e.rot ? `rotate(${e.rot} ${l.cx} ${l.cy})` : undefined}>
                {l.zeilen.map((z, n) => (
                  <SvgText
                    key={n} x={z.x} y={z.y} textAnchor={z.anchor} fontSize={l.fs} fontFamily={SCHRIFT}
                    textDecoration={e.underline ? 'underline' : 'none'}
                  >
                    {z.runs.map((r, m) => (
                      <TSpan key={m} fill={r.color ?? e.color} fontWeight={r.bold ?? e.bold ? 'bold' : 'normal'}>{r.t}</TSpan>
                    ))}
                  </SvgText>
                ))}
              </G>
            );
          }
        }
      })}
    </Svg>
  );
});

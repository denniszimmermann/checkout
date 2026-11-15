import { Platform, ScrollView } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { Szene } from './scene';

const SCHRIFT = Platform.OS === 'web' ? 'Helvetica, Arial, sans-serif' : undefined;

type Props = {
  szene: Szene;
  /** verfügbare Breite in Punkten */
  breite: number;
  /** Mindestmaßstab in Punkten je cm; darunter wird seitlich gescrollt */
  minMassstab?: number;
  /** Höchstmaßstab, damit kleine Zeichnungen nicht riesig werden */
  maxMassstab?: number;
  onHit?: (hit: string) => void;
};

export function Zeichnung({ szene, breite, minMassstab = 0, maxMassstab = 3, onHit }: Props) {
  const massstab = Math.max(Math.min(breite / szene.w, maxMassstab), minMassstab);
  const w = szene.w * massstab;
  const h = szene.h * massstab;
  const svg = (
    <Svg width={w} height={h} viewBox={`0 0 ${szene.w} ${szene.h}`}>
      {szene.formen.map((f, i) => {
        if (f.t === 'rect') {
          const hit = f.hit;
          return (
            <Rect
              key={i} x={f.x} y={f.y} width={f.w} height={f.h} fill={f.fill}
              stroke={f.stroke ?? 'none'} strokeWidth={f.sw ?? 0}
              strokeDasharray={f.dash ? [(f.sw ?? 1) * 4, (f.sw ?? 1) * 3] : undefined}
              onPress={hit && onHit ? () => onHit(hit) : undefined}
            />
          );
        }
        if (f.t === 'line')
          return <Line key={i} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke={f.stroke} strokeWidth={f.sw} />;
        return (
          <SvgText
            key={i} x={f.x} y={f.y} fontSize={f.size} textAnchor={f.anchor} fill={f.fill}
            fontWeight={f.bold ? 'bold' : 'normal'} fontFamily={SCHRIFT} pointerEvents="none"
          >
            {f.text}
          </SvgText>
        );
      })}
    </Svg>
  );
  if (w <= breite + 0.5) return svg;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      {svg}
    </ScrollView>
  );
}

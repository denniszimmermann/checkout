import { anordnen } from './fit';
import { ModulTyp, Projekt, Stellflaeche, cm } from './types';

export function pruefeStellflaeche(f: Stellflaeche, modulTypen: ModulTyp[]): string[] {
  const w: string[] = [];
  if (f.laenge <= 0) w.push('Länge fehlt.');
  for (const s of f.stoerstellen)
    if (s.position + s.breite > f.laenge + 1e-6)
      w.push(`Störstelle bei ${cm(s.position)} cm ragt über die Fläche hinaus.`);
  const a = anordnen(f.module, f.laenge, f.stoerstellen);
  a.module.forEach((m) => {
    const t = modulTypen.find((x) => x.id === m.modulTypId);
    const name = t?.name ?? 'Modul';
    if (m.x === null) w.push(`„${name}“ (${cm(m.breite)} cm) passt nicht mehr auf die Fläche.`);
    if (t && f.maxHoehe > 0 && t.hoehe > f.maxHoehe)
      w.push(`„${name}“ ist ${cm(t.hoehe)} cm hoch – erlaubt sind ${cm(f.maxHoehe)} cm.`);
    if (t && f.maxTiefe > 0 && t.tiefe > f.maxTiefe)
      w.push(`„${name}“ ist ${cm(t.tiefe)} cm tief – erlaubt sind ${cm(f.maxTiefe)} cm.`);
    if (m.warengruppen.some((g) => g === null)) w.push(`„${name}“ hat Böden ohne Warengruppe.`);
  });
  return [...new Set(w)];
}

export function pruefeProjekt(p: Projekt, modulTypen: ModulTyp[], minGang: number): string[] {
  const w: string[] = [];
  for (const k of p.kassenplaetze)
    if (k.gangBreite > 0 && k.gangBreite < minGang)
      w.push(`Kasse ${k.nummer}: Gang ${cm(k.gangBreite)} cm unterschreitet ${cm(minGang)} cm.`);
  for (const f of p.stellflaechen)
    for (const x of pruefeStellflaeche(f, modulTypen)) w.push(`${f.name}: ${x}`);
  return w;
}

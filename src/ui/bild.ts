import * as ImagePicker from 'expo-image-picker';

import { Bild } from '@/domain/types';

/** Bild aus der Mediathek oder mit der Kamera holen; null bei Abbruch */
export async function bildWaehlen(quelle: 'mediathek' | 'kamera'): Promise<Bild | null> {
  const optionen: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5, base64: true };
  if (quelle === 'kamera') {
    const erlaubt = await ImagePicker.requestCameraPermissionsAsync();
    if (!erlaubt.granted) return null;
  }
  const r = quelle === 'kamera'
    ? await ImagePicker.launchCameraAsync(optionen)
    : await ImagePicker.launchImageLibraryAsync(optionen);
  const a = r.canceled ? null : r.assets[0];
  if (!a) return null;
  const uri = a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri;
  if (!uri.startsWith('data:')) return null;
  return { uri, w: a.width || 4, h: a.height || 3 };
}

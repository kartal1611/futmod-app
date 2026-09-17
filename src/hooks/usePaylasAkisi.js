import { useState } from 'react';
import { Alert, Image } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

/**
 * Drives the "paylaş" flow used across the app: tap → pick one of the
 * screen's shareable templates (each backed by an off-screen ref) → preview
 * the actual captured PNG → share or save it. A screen with only one
 * template skips straight to capturing it (no picker step needed).
 *
 * `sablonlar` shape: { key: { baslik, emoji, ref } }
 */
export function usePaylasAkisi(sablonlar) {
  const [acik, setAcik] = useState(false);
  const [secim, setSecim] = useState(null);
  const [onizlemeUri, setOnizlemeUri] = useState(null);
  const [onizlemeBoyut, setOnizlemeBoyut] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const anahtarlar = Object.keys(sablonlar);
  const tekSablonMu = anahtarlar.length === 1;

  const sablonSec = async (key) => {
    const sablon = sablonlar[key];
    if (!sablon?.ref?.current) return;
    setSecim(key);
    setYukleniyor(true);
    setOnizlemeUri(null);
    try {
      const uri = await captureRef(sablon.ref, { format: 'png', quality: 1 });
      const boyut = await new Promise((resolve, reject) => {
        Image.getSize(uri, (w, h) => resolve({ w, h }), reject);
      });
      setOnizlemeBoyut(boyut);
      setOnizlemeUri(uri);
    } catch (err) {
      Alert.alert('Hata', 'Görsel oluşturulamadı: ' + err.message);
      setSecim(null);
    } finally {
      setYukleniyor(false);
    }
  };

  const ac = () => {
    setAcik(true);
    setSecim(null);
    setOnizlemeUri(null);
    if (tekSablonMu) sablonSec(anahtarlar[0]);
  };

  const kapat = () => {
    setAcik(false);
    setSecim(null);
    setOnizlemeUri(null);
  };

  const geriDon = () => {
    if (tekSablonMu) { kapat(); return; }
    setSecim(null);
    setOnizlemeUri(null);
  };

  const paylas = async () => {
    if (!onizlemeUri) return;
    try {
      const musait = await Sharing.isAvailableAsync();
      if (!musait) {
        Alert.alert('Paylaşım desteklenmiyor', 'Bu cihazda paylaşım özelliği kullanılamıyor.');
        return;
      }
      await Sharing.shareAsync(onizlemeUri, { mimeType: 'image/png', dialogTitle: 'FutMod\'de Paylaş' });
    } catch (err) {
      Alert.alert('Hata', err.message);
    }
  };

  const kaydet = async () => {
    if (!onizlemeUri || kaydediliyor) return;
    setKaydediliyor(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin gerekli', 'Görseli galerine kaydetmek için izin vermelisin.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(onizlemeUri);
      Alert.alert('Kaydedildi', 'Görsel galerine kaydedildi.');
    } catch (err) {
      Alert.alert('Hata', 'Kaydedilemedi: ' + err.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  return {
    sablonlar, anahtarlar, tekSablonMu,
    acik, secim, onizlemeUri, onizlemeBoyut, yukleniyor, kaydediliyor,
    ac, kapat, geriDon, sablonSec, paylas, kaydet,
  };
}

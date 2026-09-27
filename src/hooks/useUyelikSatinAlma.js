// Apple StoreKit2 abonelik satın alma (tek ürün: "Üyelik", Trade sekmesini açar).
// Doğrulama sunucuda yapılır (core/iap/appleVerifier.js) — burası sadece
// StoreKit ile konuşur, JWS'i sunucuya gönderir ve sonucu bekler.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useIAP, getAvailablePurchases, finishTransaction as finishTransactionRaw } from 'expo-iap';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const UYELIK_SKU = 'futmod_vip_trade_monthly'; // App Store Connect'teki gerçek subscription productId

export function useUyelikSatinAlma() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [satinAliniyor, setSatinAliniyor] = useState(false);
  const [geriYukleniyor, setGeriYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);
  const dogrulananlar = useRef(new Set()); // aynı işlemi iki kez doğrulamayı önler (onPurchaseSuccess + restore çakışabilir)

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    restorePurchases,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      await dogrula(purchase);
    },
    onPurchaseError: (err) => {
      setSatinAliniyor(false);
      if (err?.code !== 'user-cancelled' && err?.code !== 'UserCancelled') setHata(err?.message || 'Satın alma başarısız oldu.');
    },
  });

  const dogrula = useCallback(async (purchase) => {
    const jws = purchase?.purchaseToken;
    const anahtar = purchase?.transactionId || purchase?.id || jws;
    if (!jws || (anahtar && dogrulananlar.current.has(anahtar))) {
      setSatinAliniyor(false);
      return;
    }
    if (anahtar) dogrulananlar.current.add(anahtar);
    try {
      await api.iapVerify(jws);
      await finishTransaction({ purchase, isConsumable: false });
      await refreshUser();
    } catch (err) {
      setHata(err.message || 'Satın alma sunucuda doğrulanamadı.');
    } finally {
      setSatinAliniyor(false);
      setGeriYukleniyor(false);
    }
  }, [finishTransaction, refreshUser]);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !connected) return;
    fetchProducts({ skus: [UYELIK_SKU], type: 'subs' }).catch(() => {});
  }, [connected, fetchProducts]);

  const satinAl = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setHata('Üyelik satın alma şu an yalnızca iOS uygulamasında açık.');
      return;
    }
    setHata(null);
    setSatinAliniyor(true);
    try {
      const { appAccountToken } = await api.iapAccountToken();
      await requestPurchase({ type: 'subs', request: { apple: { sku: UYELIK_SKU, appAccountToken } } });
      // Sonuç onPurchaseSuccess / onPurchaseError ile gelir; burada bekleme yok.
    } catch (err) {
      setSatinAliniyor(false);
      setHata(err.message || 'Satın alma başlatılamadı.');
    }
  }, [requestPurchase]);

  const satinAlimlariGeriYukle = useCallback(async () => {
    setHata(null);
    setGeriYukleniyor(true);
    try {
      await restorePurchases().catch(() => {}); // sadece iOS listesini tazeler, asıl doğrulama aşağıda
      const purchases = await getAvailablePurchases();
      const eslesen = (purchases || []).filter((p) => p.productId === UYELIK_SKU || p.id === UYELIK_SKU);
      if (!eslesen.length) {
        setHata('Bu Apple hesabında aktif bir Üyelik satın alımı bulunamadı.');
        return;
      }
      for (const purchase of eslesen) {
        const jws = purchase.purchaseToken;
        if (!jws) continue;
        try {
          await api.iapVerify(jws);
          await finishTransactionRaw({ purchase, isConsumable: false });
        } catch { /* bu satın alım için devam, diğerini dene */ }
      }
      await refreshUser();
    } catch (err) {
      setHata(err.message || 'Satın alımlar geri yüklenemedi.');
    } finally {
      setGeriYukleniyor(false);
    }
  }, [restorePurchases, refreshUser]);

  const urun = subscriptions?.find((s) => s.id === UYELIK_SKU) || null;

  return { urun, satinAl, satinAliniyor, satinAlimlariGeriYukle, geriYukleniyor, hata, setHata };
}

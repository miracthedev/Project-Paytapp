"use client";
import React, { useMemo, useState, useEffect } from "react";
import { UtensilsCrossed, Lock } from "lucide-react";
import { OrderItemCard } from "@/components/order/OrderItemCard";
import { PaymentSheet } from "@/components/order/PaymentSheet";
import { SuccessScreen } from "@/components/order/SuccessScreen";
import { formatTL, RESTAURANT_NAME, TABLE_LABEL, OrderItem } from "@/lib/models/order-data";
import { toggleItemLock } from "@/lib/api";

const NEXT_PUBLIC_FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL;

/**
In this function, we simply create a color for a user name.
This is genius, as username won't change, so do the color!
It's used when we are mapping the fetched order items.
*/
const getUserStyle = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    bg: `hsl(${hue}, 80%, 96%)`,
    border: `hsl(${hue}, 60%, 50%)`,
  };
};


/**
Now this bad boi returns our main billpage

@param selected an useState hook that used for 
*/

export default function BillPage() {
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [splits, setSplits] = useState<Record<number, number>>({});
  const [customs, setCustoms] = useState<Record<number, number | null>>({});
  const [locked, setLocked] = useState<Record<number, boolean>>({});

  // Sadece API'den 409 hatası döndüğünde anlık gösterim için kullanılacak
  const [lockedByOthersLocal, setLockedByOthersLocal] = useState<Record<number, string>>({});

  const [sheetOpen, setSheetOpen] = useState(false);
  const [paidTotal, setPaidTotal] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Session ID Mantığı
    let currentSessionId = sessionStorage.getItem("table_session_id");
    if (!currentSessionId) {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        currentSessionId = crypto.randomUUID();
      } else {
        currentSessionId = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
          (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
        );
      }
      sessionStorage.setItem("table_session_id", currentSessionId);
    }
    setSessionId(currentSessionId);
    setIsMounted(true);

    // 2. FastAPI'den Veri Çekme Fonksiyonu
    const fetchItems = async () => {
      try {
        console.log("Şu an buraya istek atılıyor:", `${NEXT_PUBLIC_FASTAPI_URL}/order-items/`); // Bize gerçeği söyleyecek satır

        const response = await fetch(`${NEXT_PUBLIC_FASTAPI_URL}/order-items/`);
        if (!response.ok) throw new Error("Veri çekilemedi");

        const data = await response.json();
        setOrderItems(data);
      } catch (error) {
        console.error("API Hatası:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
    const interval = setInterval(fetchItems, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleToggleLock(itemId: number, isCurrentlySelected: boolean) {
    const isAttemptingToLock = !isCurrentlySelected;

    try {
      await toggleItemLock(String(itemId), sessionId, isAttemptingToLock);
      setSelected((prev) => ({ ...prev, [itemId]: isAttemptingToLock }));

      // Eğer başarılı kilitleme yaptıysak, lokal hata state'inden çıkar
      setLockedByOthersLocal((prev) => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
    } catch (error) {
      console.error("Lock failed:", error);
      // İyimser Kilit Hatası: Bizden önce başkası kapmış
      setLockedByOthersLocal((prev) => ({
        ...prev,
        [itemId]: "Başka Müşteri"
      }));
      alert("Bu ürün şu anda masadaki başka biri tarafından ödeniyor.");
    }
  }

  const shareOf = (id: number, price: number) => customs[id] ?? price / (splits[id] ?? 1);

  // 1. tableTotal Düzeltmesi
  const tableTotal = useMemo(() =>
    orderItems.reduce((sum, item) => sum + Number(item.sh_price_total), 0),
    [orderItems]);

  // 2. selectedTotal Düzeltmesi
  const selectedTotal = useMemo(() =>

    orderItems.filter((item) => {

      // Checks if the current item either paid or locked by someone rn.
      if (item.is_paid || locked[item.id]) return false;

      // params for checking where these items locked from.
      //locked_by_session is not null and does not equal to current sessionId, therefore this item must be locked from API(some other guest)
      //lockedByLocal 
      const lockedByAPI = item.locked_by_session && item.locked_by_session !== sessionId;
      const lockedByLocal = Boolean(lockedByOthersLocal[item.id]);

      if (lockedByAPI || lockedByLocal) return false;

      return selected[item.id] || item.locked_by_session === sessionId;
    }).reduce(
      // Burada da Number() kullandık
      (sum, item) => sum + (customs[item.id] ?? Number(item.sh_price_singular) / (splits[item.id] ?? 1)),
      0
    ),
    [orderItems, selected, splits, customs, locked, lockedByOthersLocal, sessionId]
  );

  if (!isMounted) {
    return <div className="min-h-screen bg-background" />;
  }

  if (paidTotal !== null) {
    return (
      <SuccessScreen
        amount={paidTotal}
        onDone={() => {
          setPaidTotal(null);
          setSelected({});
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-48">
        <header className="sticky top-0 z-20 bg-primary px-5 py-4 text-primary-foreground shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary-foreground/15">
              <UtensilsCrossed className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-extrabold">{RESTAURANT_NAME}</p>
              <p className="text-sm opacity-90">Hoş geldiniz</p>
            </div>
            <span className="rounded-full bg-primary-foreground px-4 py-1.5 text-sm font-bold text-primary">
              {TABLE_LABEL}
            </span>
          </div>
        </header>

        <main className="px-5 pt-6">
          <h1 className="text-3xl font-extrabold leading-tight text-foreground">Siparişler & Hesap</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Yediğiniz ürünleri işaretleyin, sadece kendi payınızı ödeyin.
          </p>

          <div className="mt-6 space-y-4">
            {isLoading && orderItems.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">Siparişler yükleniyor...</div>
            ) : (
              orderItems.map((item) => {
                // Başkası kilitlemiş mi kontrolü (API veya Lokal Hata)
                const lockedByAPI = item.locked_by_session && item.locked_by_session !== sessionId;
                const lockedByLocal = Boolean(lockedByOthersLocal[item.id]);
                const isLockedByOther = lockedByAPI || lockedByLocal;

                // Kilitleyen kişinin ismini ve sabit rengini al
                const lockerName = lockedByAPI
                  ? (item.locked_by_name || "Başka Müşteri")
                  : (lockedByLocal ? lockedByOthersLocal[item.id] : "");

                const userStyle = isLockedByOther ? getUserStyle(lockerName) : null;

                // Biz mi seçtik? (Manuel tık VEYA API'de bize ait bir kilit varsa)
                const isSelectedByMe = Boolean(selected[item.id]) || item.locked_by_session === sessionId;

                return (
                  <div
                    key={item.id}
                    className="relative rounded-2xl transition-all duration-300 overflow-hidden"
                    style={isLockedByOther && userStyle ? { backgroundColor: userStyle.bg, border: `2px solid ${userStyle.border}` } : { border: '2px solid transparent' }}
                  >
                    {isLockedByOther && userStyle && (
                      <div
                        className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-xl z-10 flex items-center gap-1 shadow-sm"
                        style={{ backgroundColor: userStyle.border }}
                      >
                        <Lock size={12} />
                        {lockerName} ödüyor
                      </div>
                    )}

                    <div className={isLockedByOther ? "opacity-50 pointer-events-none grayscale-[0.2]" : ""}>
                      <OrderItemCard
                        item={item}
                        selected={isSelectedByMe} // Otomatik senkronizasyon uygulandı
                        split={splits[item.id] ?? 1}
                        customAmount={customs[item.id] ?? null}
                        share={shareOf(item.id, item.sh_price_singular)}
                        lockedAway={isLockedByOther || Boolean(locked[item.id])}
                        onToggle={() => handleToggleLock(item.id, isSelectedByMe)}
                        onSplitChange={(value) => setSplits((prev) => ({ ...prev, [item.id]: value }))}
                        onCustomChange={(value) => setCustoms((prev) => ({ ...prev, [item.id]: value }))}
                        onWinDice={() => {
                          setCustoms((prev) => ({ ...prev, [item.id]: null }));
                          setSplits((prev) => ({ ...prev, [item.id]: 1 }));
                          setSelected((prev) => ({ ...prev, [item.id]: true }));
                        }}
                        onWinCoin={() => {
                          setSelected((prev) => ({ ...prev, [item.id]: false }));
                          setLocked((prev) => ({ ...prev, [item.id]: true }));
                        }}
                        onUnlock={() => setLocked((prev) => ({ ...prev, [item.id]: false }))}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-card shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-md px-5 py-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Toplam Masa Hesabı</p>
              <p className="text-base font-semibold text-muted-foreground">{formatTL(tableTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Seçilen Tutar</p>
              <p className="text-3xl font-extrabold text-primary">{formatTL(selectedTotal)}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={selectedTotal <= 0}
            onClick={() => setSheetOpen(true)}
            className="mt-4 min-h-16 w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            Seçilenleri Öde
          </button>
        </div>
      </div>

      <PaymentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        amount={selectedTotal}
        onPay={(total) => {
          setSheetOpen(false);
          setPaidTotal(total);
        }}
      />
    </div>
  );
}
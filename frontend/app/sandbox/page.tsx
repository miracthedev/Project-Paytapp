"use client";
import React, { useMemo, useState, useEffect } from "react";
import { UtensilsCrossed, Lock } from "lucide-react";
import { OrderItemCard } from "@/components/order/OrderItemCard";
import { PaymentSheet } from "@/components/order/PaymentSheet";
import { SuccessScreen } from "@/components/order/SuccessScreen";
import { formatTL, ORDER_ITEMS, RESTAURANT_NAME, TABLE_LABEL, OrderItem } from "@/lib/models/order-data";
import { toggleItemLock } from "@/lib/api";

// Yardımcı Fonksiyon: Başka bir kullanıcının kilitlediği ürünler için rastgele renk ve isim üretir
const generateRandomUser = () => {
  const hue = Math.floor(Math.random() * 360);
  const userNumber = Math.floor(Math.random() * 99) + 1;
  return {
    username: `Müşteri ${userNumber}`,
    bg: `hsl(${hue}, 80%, 96%)`,      // Açık pastel arkaplan
    border: `hsl(${hue}, 60%, 50%)`,  // Belirgin kenarlık ve badge rengi
  };
};

export default function BillPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [splits, setSplits] = useState<Record<string, number>>({});
  const [customs, setCustoms] = useState<Record<string, number | null>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({}); // Oyunlardan gelen kilitler
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paidTotal, setPaidTotal] = useState<number | null>(null);

  // YENİ: Masadaki "BAŞKA" biri tarafından seçilmiş (kilitlenmiş) ürünlerin state'i
  const [lockedByOthers, setLockedByOthers] = useState<Record<string, { username: string, bg: string, border: string }>>({});

  const [sessionId, setSessionId] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  //////////////////////////////////////////////////////////////////////////
  // first: checks if we have session_id, cuz user may refreshed the page.
  // second: if we do not have session_id:
  //        - if -> crypto is available to use, uses it, mostly on HTTPS
  //        - else -> fallbacks to manually creating UUID, like HTTP
  // then sets the session_id for sessionStorage, ensuring even in refresh the session will not be deleted,
  // but in closing of page IT WILL BE DELETED.
  //
  // finally: we set or session_id for our codebase as well and set isMounted -> true.
  useEffect(() => {
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

    // DEMO: Arayüzü test edebilmeniz için sayfa yüklendiğinde rastgele bir ürünü başkası seçmiş gibi gösterelim
    // TODO: Prodda burayi sil!!!!
    setLockedByOthers({
      "salata": generateRandomUser()
    });
  }, []);


  /* 
  This async function receives 2 prop: itemId and isCurrentlySelected,
  first: checks if user 
  
  */
  async function handleToggleLock(itemId: string, isCurrentlySelected: boolean) {
    const isAttemptingToLock = !isCurrentlySelected;

    try {
      // 1. API'ye kilitleme isteği at
      await toggleItemLock(itemId, sessionId, isAttemptingToLock);

      // 2. Başarılı olursa bizim ekranımızda "Seçili" (Yeşil) hale getir
      setSelected((prev) => ({ ...prev, [itemId]: isAttemptingToLock }));

    } catch (error) {
      // 3. API hata verirse (Başka biri bizden önce tıkladıysa):
      console.error("Lock failed:", error);

      // Ürünü o kullanıcının rengi ve ismiyle kilitle
      setLockedByOthers((prev) => ({
        ...prev,
        [itemId]: generateRandomUser()
      }));

      alert("Bu ürün şu anda masadaki başka biri tarafından ödeniyor.");
    }
  }

  const shareOf = (id: string, price: number) => customs[id] ?? price / (splits[id] ?? 1);

  const tableTotal = useMemo(() => ORDER_ITEMS.reduce((sum, item) => sum + item.price, 0), []);

  const selectedTotal = useMemo(
    () =>
      // Hesaplamaya başkasının kilitlediği (lockedByOthers) ürünleri dahil ETME
      ORDER_ITEMS.filter((item) => !item.paid && !locked[item.id] && !lockedByOthers[item.id] && selected[item.id]).reduce(
        (sum, item) => sum + (customs[item.id] ?? item.price / (splits[item.id] ?? 1)),
        0
      ),
    [selected, splits, customs, locked, lockedByOthers]
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
        {/* Header */}
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

        {/* Liste */}
        <main className="px-5 pt-6">
          <h1 className="text-3xl font-extrabold leading-tight text-foreground">Siparişler & Hesap</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Yediğiniz ürünleri işaretleyin, sadece kendi payınızı ödeyin.
          </p>

          <div className="mt-6 space-y-4">
            {ORDER_ITEMS.map((item) => {
              // Bu ürünü masadaki BAŞKA biri seçmiş mi kontrol et
              const otherUser = lockedByOthers[item.id];
              const isLockedByOther = Boolean(otherUser);

              return (
                <div
                  key={item.id}
                  className="relative rounded-2xl transition-all duration-300 overflow-hidden"
                  // Eğer başkası seçtiyse onun arka plan ve kenarlık rengini uygula
                  style={isLockedByOther ? { backgroundColor: otherUser.bg, border: `2px solid ${otherUser.border}` } : { border: '2px solid transparent' }}
                >
                  {/* Başkası seçtiyse sağ üstte çıkacak ufak İsim Etiketi */}
                  {isLockedByOther && (
                    <div
                      className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-xl z-10 flex items-center gap-1 shadow-sm"
                      style={{ backgroundColor: otherUser.border }}
                    >
                      <Lock size={12} />
                      {otherUser.username} ödüyor
                    </div>
                  )}

                  {/* Eğer başkası seçtiyse karta tıklanmayı engelle ve rengini hafif soldur */}
                  <div className={isLockedByOther ? "opacity-50 pointer-events-none grayscale-[0.2]" : ""}>
                    <OrderItemCard
                      item={item}
                      selected={Boolean(selected[item.id])}
                      split={splits[item.id] ?? 1}
                      customAmount={customs[item.id] ?? null}
                      share={shareOf(item.id, item.price)}
                      lockedAway={isLockedByOther || Boolean(locked[item.id])}
                      onToggle={() => handleToggleLock(item.id, Boolean(selected[item.id]))}
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
            })}
          </div>
        </main>
      </div>

      {/* Sticky Bottom Bar */}
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
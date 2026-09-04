"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useMemo, useState, useEffect, useRef } from "react";
import { UtensilsCrossed, Lock, Gamepad2 } from "lucide-react";
import { PaymentMethodModal } from "@/components/billing/PaymentMethodModal";
import { OrderItemCard } from "@/components/order/OrderItemCard";
import { PaymentSheet } from "@/components/order/PaymentSheet";
import { SuccessScreen } from "@/components/order/SuccessScreen";
import { formatTL, RESTAURANT_NAME, TABLE_LABEL, OrderItem } from "@/lib/models/order-data";
import { toggleItemLock } from "@/lib/api";
import { toast } from "sonner";

const NEXT_PUBLIC_FASTAPI_API_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL;

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

// Toastlar için ortak, küçültülmüş ve temaya uygun stil değişkenleri
const TOAST_CLASS = "bg-card border border-primary/30 text-foreground text-xs p-3 shadow-lg rounded-xl";
const TOAST_DESC_CLASS = "text-muted-foreground text-[11px] mt-0.5";

export default function BillPage() {
    const ws = useRef<WebSocket | null>(null);

    const [liveActions, setLiveActions] = useState<Record<string, { guestName: string, color: string }>>({});
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [splits, setSplits] = useState<Record<number, number>>({});
    const [customs, setCustoms] = useState<Record<number, number | null>>({});
    const [locked, setLocked] = useState<Record<number, boolean>>({});

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [lockedByOthersLocal, setLockedByOthersLocal] = useState<Record<number, string>>({});

    // Oyun Modu State'leri
    const [isGameModeActive, setIsGameModeActive] = useState(false);
    const [consentRequest, setConsentRequest] = useState<{ requester: string, targetMode: boolean } | null>(null);
    const [guestName, setGuestName] = useState<string>("Misafir");

    const [sheetOpen, setSheetOpen] = useState(false);
    const [paidTotal, setPaidTotal] = useState<number | null>(null);
    const [sessionId, setSessionId] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let currentSessionId = sessionStorage.getItem("guest_id");
        if (!currentSessionId) {
            if (typeof crypto !== "undefined" && crypto.randomUUID) {
                currentSessionId = crypto.randomUUID();
            } else {
                currentSessionId = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
                    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
                );
            }
            sessionStorage.setItem("guest_id", currentSessionId);
        }
        setSessionId(currentSessionId);
        setGuestName(`Misafir-${currentSessionId.slice(0, 4)}`);

        setIsMounted(true);

        const currentTicketId = sessionStorage.getItem("ticket_id");
        if (!currentTicketId) {
            console.error("Ticket ID bulunamadı!");
            return;
        }

        const fetchItems = async () => {
            try {
                const response = await fetch(`${NEXT_PUBLIC_FASTAPI_API_URL}/order-items/ticket/${currentTicketId}`);
                if (!response.ok) throw new Error(`ERROR: ${response.statusText}`);

                const data = await response.json();
                setOrderItems(data);
            } catch (error) {
                console.error("API Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
        const interval = setInterval(fetchItems, 5000);
        return () => clearInterval(interval);
    }, []);

    // WebSocket Bağlantısı ve Konsensüs (Oyun Modu) Dinleme
    useEffect(() => {
        const currentTicketId = sessionStorage.getItem("ticket_id");
        if (!currentTicketId || !sessionId) return;

        const apiUrl = NEXT_PUBLIC_FASTAPI_API_URL || "http://localhost:8000";
        const wsUrl = apiUrl.replace("http://", "ws://").replace("https://", "wss://");

        ws.current = new WebSocket(`${wsUrl}/ws/${currentTicketId}/${sessionId}`);

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(" WEBSOCKET'TEN MESAJ GELDİ:", data);

            if (data.type === "ATTACK") {
                toast("⚠️ Kilit Saldırısı!", {
                    description: `${data.attacker_name}, '${data.product_name}' siparişini senden araklamaya çalışıyor!`,
                    duration: 4000,
                    className: "bg-card border border-destructive/50 text-foreground text-xs p-3 shadow-lg rounded-xl",
                    descriptionClassName: TOAST_DESC_CLASS,
                });
            } else if (data.type === "ACTION") {
                setLiveActions(prev => ({
                    ...prev,
                    [data.target]: { guestName: data.guest_name, color: data.color }
                }));

                setTimeout(() => {
                    setLiveActions(prev => {
                        const newActions = { ...prev };
                        delete newActions[data.target];
                        return newActions;
                    });
                }, 2000);
            } else if (data.type === "CONSENT_REQUEST") {
                console.log("✨ CONSENT_REQUEST İŞLENİYOR. Gelen requester:", data.requesterName, "Benim adım:", guestName);
                if (data.requesterName !== guestName) {
                    setConsentRequest({
                        requester: data.requesterName,
                        targetMode: data.targetMode
                    });
                }
            } else if (data.type === "CONSENT_RESULT") {
                if (data.success) {
                    setIsGameModeActive(data.targetMode);
                    toast(data.targetMode ? "🎮 Oyun Modu Açıldı!" : "🛑 Oyun Modu Kapatıldı", {
                        description: data.targetMode ? "Artık her kartta oyunlar aktif!" : "Menü standart haline döndürüldü.",
                        className: TOAST_CLASS,
                        descriptionClassName: TOAST_DESC_CLASS
                    });
                }
            }
            else {
                console.log("❌ İstek bana ait olduğu için dialog açılmadı.");
            }
        };

        return () => {
            ws.current?.close();
        };
    }, [sessionId, guestName]);

    // Oyun Modu Değiştirme Butonuna Basıldığında (Consent Başlat)
    const handleToggleGameModeRequest = () => {
        const targetMode = !isGameModeActive;
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: "CONSENT_REQUEST",
                requesterName: guestName,
                targetMode: targetMode
            }));
        }
        toast("⏳ Onay İsteği Gönderildi", {
            description: "Masadaki diğer misafirlerin onay vermesi bekleniyor...",
            className: TOAST_CLASS,
            descriptionClassName: TOAST_DESC_CLASS
        });
    };

    async function handleToggleLock(item: OrderItem, isCurrentlySelected: boolean) {
        const lockedByAPI = item.locked_by_session_id && item.locked_by_session_id !== sessionId;
        const lockedByLocal = Boolean(lockedByOthersLocal[item.id]);

        if (lockedByAPI || lockedByLocal) {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: "ATTACK",
                    target_guest: item.locked_by_session_id,
                    attacker_name: guestName,
                    product_name: item.sh_product_name
                }));
            }

            toast("🛑 Başarısız", {
                description: "Bu ürün zaten kilitli, kullanıcıya uyarı gönderildi.",
                duration: 2500,
                className: TOAST_CLASS,
                descriptionClassName: TOAST_DESC_CLASS
            });
            return;
        }

        const isAttemptingToLock = !isCurrentlySelected;
        setSelected((prev) => ({ ...prev, [item.id]: isAttemptingToLock }));

        try {
            await toggleItemLock(String(item.id), sessionId, isAttemptingToLock);

            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: "ACTION",
                    target: item.id,
                    guest_name: guestName,
                    color: "#b45309"
                }));
            }

            setLockedByOthersLocal((prev) => {
                const copy = { ...prev };
                delete copy[item.id];
                return copy;
            });
        } catch (error) {
            console.error("Lock failed:", error);
            setSelected((prev) => ({ ...prev, [item.id]: isCurrentlySelected }));

            setLockedByOthersLocal((prev) => ({
                ...prev,
                [item.id]: "Başka Müşteri"
            }));

            toast("⚠️ Hata", {
                description: "Bu ürün şu anda masadaki başka biri tarafından ödeniyor.",
                duration: 3000,
                className: "bg-card border border-destructive/50 text-foreground text-xs p-3 shadow-lg rounded-xl",
                descriptionClassName: TOAST_DESC_CLASS
            });
        }
    }

    const shareOf = (id: number, price: number) => customs[id] ?? price / (splits[id] ?? 1);

    const tableTotal = useMemo(() =>
        orderItems.reduce((sum, item) => sum + Number(item.sh_price_total), 0),
        [orderItems]);

    const selectedTotal = useMemo(() =>
        orderItems.filter((item) => {
            if (item.is_paid || locked[item.id]) return false;
            const lockedByAPI = item.locked_by_session_id && item.locked_by_session_id !== sessionId;
            const lockedByLocal = Boolean(lockedByOthersLocal[item.id]);
            if (lockedByAPI || lockedByLocal) return false;
            return selected[item.id] || item.locked_by_session_id === sessionId;
        }).reduce(
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

                    {/* Altyazı ve İstediğin RGB Animasyonlu Oyun Modu Butonu */}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-base text-muted-foreground">
                            Yediğiniz ürünleri işaretleyin, sadece kendi payınızı ödeyin.
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm italic text-muted-foreground">ya da...</span>
                            <button
                                onClick={handleToggleGameModeRequest}
                                className="animate-rgb-border flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground bg-card shadow-sm transition-transform hover:scale-105 active:scale-95"
                            >
                                <Gamepad2 size={14} className="text-primary animate-pulse" />
                                <span>{isGameModeActive ? "Oyun Modu: Açık" : "Oyun Modu: Kapalı"}</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {isLoading && orderItems.length === 0 ? (
                            <div className="py-10 text-center text-muted-foreground">Siparişler yükleniyor...</div>
                        ) : (
                            orderItems.map((item) => {
                                const lockedByAPI = item.locked_by_session_id && item.locked_by_session_id !== sessionId;
                                const lockedByLocal = Boolean(lockedByOthersLocal[item.id]);
                                const isLockedByOther = lockedByAPI || lockedByLocal;

                                const lockerName = lockedByAPI
                                    ? (item.locked_by_name || "Başka Müşteri")
                                    : (lockedByLocal ? lockedByOthersLocal[item.id] : "");

                                const userStyle = isLockedByOther ? getUserStyle(lockerName) : null;
                                const isSelectedByMe = Boolean(selected[item.id]) || item.locked_by_session_id === sessionId;

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

                                        <div className={isLockedByOther ? "opacity-50 pointer-events-none grayscale-[0.2] relative" : "relative"}>
                                            {liveActions[item.id] && (
                                                <div
                                                    className="absolute -top-2 -right-2 z-20 rounded-full px-2 py-0.5 text-xs font-bold text-white shadow-md animate-in zoom-in fade-in"
                                                    style={{ backgroundColor: liveActions[item.id].color }}
                                                >
                                                    {liveActions[item.id].guestName}
                                                </div>
                                            )}

                                            <OrderItemCard
                                                item={item}
                                                selected={isSelectedByMe}
                                                split={splits[item.id] ?? 1}
                                                customAmount={customs[item.id] ?? null}
                                                share={shareOf(item.id, Number(item.sh_price_singular))}
                                                lockedAway={isLockedByOther || Boolean(locked[item.id])}

                                                // İŞTE EKSİK OLAN O KRİTİK PROP:
                                                isGameModeActive={isGameModeActive}

                                                onToggle={() => handleToggleLock(item, isSelectedByMe)}
                                                onSplitChange={(value) => setSplits((prev) => ({ ...prev, [item.id]: value }))}
                                                onCustomChange={(value) => setCustoms((prev) => ({ ...prev, [item.id]: value }))}
                                                onWinDice={isGameModeActive ? () => {
                                                    setCustoms((prev) => ({ ...prev, [item.id]: null }));
                                                    setSplits((prev) => ({ ...prev, [item.id]: 1 }));
                                                    setSelected((prev) => ({ ...prev, [item.id]: true }));
                                                } : undefined}
                                                onWinCoin={isGameModeActive ? () => {
                                                    setSelected((prev) => ({ ...prev, [item.id]: false }));
                                                    setLocked((prev) => ({ ...prev, [item.id]: true }));
                                                } : undefined}
                                                onUnlock={() => setLocked((prev) => ({ ...prev, [item.id]: false }))}
                                                onStealAttempt={() => {
                                                    // Zarla çalma başarılı olduğunda ürün zorla senin üzerine kilitlenecek
                                                    handleToggleLock(item, false);
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>

            <div className="fixed bottom-0 left-0 z-40 w-full border-t border-border bg-background px-5 py-4 pb-8 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Toplam Masa Hesabı</p>
                        <p className="text-base font-bold text-foreground">
                            {formatTL(tableTotal)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Seçilen Tutar</p>
                        <p className="text-2xl font-extrabold text-primary">
                            {formatTL(selectedTotal)}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    disabled={selectedTotal <= 0}
                    className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                >
                    Siparişi Tamamla
                </button>
            </div>

            <PaymentMethodModal
                open={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onConfirm={async (method) => {
                    console.log("Seçilen Ödeme Yöntemi:", method);
                    setIsPaymentModalOpen(false);
                }}
            />

            {/* OYUN MODU ONAY DİALOG KUTUSU */}
            <Dialog open={!!consentRequest} onOpenChange={(open: Boolean) => !open && setConsentRequest(null)}>
                <DialogContent className="bg-background border-2 border-border sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold flex items-center gap-2 text-foreground">
                            <Gamepad2 className="text-primary" /> Oyun Modu İsteği
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground mt-2">
                            <span className="font-bold text-primary">{consentRequest?.requester}</span> masada oyun modunu <strong className="text-foreground">{consentRequest?.targetMode ? "açmak" : "kapatmak"}</strong> istiyor.
                            <br />Onaylıyor musun?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-3 mt-4 sm:justify-end">
                        <button
                            onClick={() => {
                                if (ws.current && ws.current.readyState === WebSocket.OPEN && consentRequest) {
                                    ws.current.send(JSON.stringify({
                                        type: "CONSENT_RESPONSE",
                                        vote: false,
                                        targetMode: consentRequest.targetMode,
                                        voter: guestName
                                    }));
                                }
                                setConsentRequest(null);
                                toast("🛑 İtiraz Edildi", { description: "Oyun modu değiştirilmeyecek." });
                            }}
                            className="flex-1 min-h-12 rounded-xl border-2 border-border bg-background px-4 font-bold text-muted-foreground transition-colors hover:bg-muted"
                        >
                            Reddet
                        </button>
                        <button
                            onClick={() => {
                                if (ws.current && ws.current.readyState === WebSocket.OPEN && consentRequest) {
                                    ws.current.send(JSON.stringify({
                                        type: "CONSENT_RESPONSE",
                                        vote: true,
                                        targetMode: consentRequest.targetMode,
                                        voter: guestName
                                    }));
                                }
                                setConsentRequest(null);
                                toast("✅ Onaylandı", { description: "Diğer misafirlerin yanıtı bekleniyor..." });
                            }}
                            className="flex-1 min-h-12 rounded-xl border-2 border-primary bg-primary px-4 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Kabul Et
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
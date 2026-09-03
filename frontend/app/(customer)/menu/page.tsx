"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Router eklendi
import { UtensilsCrossed, ShoppingCart, Loader2 } from "lucide-react";
import { CategoryAccordion } from "@/components/menu/CategoryAccordion";
import { MENU_CATEGORIES } from "@/lib/models/menu-data";
import { addOrderItem } from "@/lib/api"; // API fonksiyonunu import edin

export default function MenuPage() {
    const router = useRouter();
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // Yükleme durumu eklendi

    // Session verilerini tutmak için state
    const [ticketId, setTicketId] = useState<number | null>(null);
    const [guestId, setGuestId] = useState<string | null>(null);

    // Component yüklendiğinde session'dan bilgileri al
    useEffect(() => {
        const storedTicketId = sessionStorage.getItem("ticket_id");
        const storedGuestId = sessionStorage.getItem("guest_id");

        if (storedTicketId) setTicketId(Number(storedTicketId));
        if (storedGuestId) setGuestId(storedGuestId);
    }, []);

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        setQuantities((prev) => {
            if (prev[itemId] === newQuantity) return prev;
            return {
                ...prev,
                [itemId]: newQuantity,
            };
        });
    };

    const handlePlaceOrder = async () => {
        console.log("Sepetteki anahtarlar (Ürün ID'leri olmalı):", quantities);
        if (!ticketId || !guestId) {
            alert("Oturum bilgileri eksik, lütfen masadaki QR kodu tekrar okutun.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Sadece adeti 0'dan büyük olan ürünleri filtrele
            const orderPromises = Object.entries(quantities)
                .filter(([_, quantity]) => quantity > 0)
                .map(([productIdStr, quantity]) => {
                    const productId = Number(productIdStr);

                    // Eğer productId bir sayı değilse (NaN ise) uyar ve işlemi iptal et
                    if (isNaN(productId)) {
                        console.error("Geçersiz Ürün ID'si tespit edildi:", productIdStr);
                        throw new Error("Geçersiz ürün kimliği!");
                    }

                    return addOrderItem(ticketId, productId, quantity, guestId);
                });

            // Tüm siparişleri paralel olarak backend'e gönder
            await Promise.all(orderPromises);

            // Başarılı olursa sepeti temizle ve Adisyon sayfasına yönlendir
            setQuantities({});
            router.push("/billing");
        } catch (error) {
            console.error("Sipariş hatası:", error);
            alert("Siparişiniz iletilemedi, lütfen garsona haber verin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalSelectedItems = Object.values(quantities).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Header Kısmı (Aynı Kalıyor) */}
            <header className="sticky top-0 z-20 bg-primary px-5 py-4 text-primary-foreground shadow-md">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary-foreground/15">
                        <UtensilsCrossed className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xl font-extrabold">Meydan Ocakbaşı</p>
                        <p className="text-sm opacity-90">Hoş geldiniz</p>
                    </div>
                    <span className="rounded-full bg-primary-foreground px-4 py-1.5 text-sm font-bold text-primary">
                        Masa 5
                    </span>
                </div>
            </header>

            <main className="px-5 pt-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold leading-tight text-foreground">Menü</h1>
                    {/* DÜZELTME: href="/" yerine href="/billing" yapıldı */}
                    <Link
                        href="/billing"
                        className="text-sm font-bold text-primary underline underline-offset-4"
                    >
                        Adisyona Dön
                    </Link>
                </div>

                <ul className="space-y-4">
                    {MENU_CATEGORIES.map((category) => (
                        <CategoryAccordion
                            key={category.id}
                            category={category}
                            open={openCategory === category.id}
                            onToggle={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                            quantities={quantities}
                            onQuantityChange={handleQuantityChange}
                        />
                    ))}
                </ul>
            </main>

            {/* DÜZELTME: Floating Button artık form gönderimi yapıyor */}
            {totalSelectedItems > 0 && (
                <div className="fixed bottom-6 right-6 z-30">
                    <button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                        className="flex items-center gap-3 rounded-full bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-xl transition-transform hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
                    >
                        <span>{isSubmitting ? "Gönderiliyor..." : "Siparişi Ver"}</span>
                        {isSubmitting ? (
                            <Loader2 className="size-6 animate-spin" />
                        ) : (
                            <div className="relative">
                                <ShoppingCart className="size-6" />
                                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                                    {totalSelectedItems}
                                </span>
                            </div>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
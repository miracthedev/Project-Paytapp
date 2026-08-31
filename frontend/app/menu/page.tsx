"use client";

import { useState } from "react";
import Link from "next/link";
import { UtensilsCrossed, ShoppingCart } from "lucide-react";
import { CategoryAccordion } from "@/components/menu/CategoryAccordion";
import { MENU_CATEGORIES } from "@/lib/models/menu-data";

export default function MenuPage() {
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        setQuantities((prev) => {
            // Eğer yeni değer zaten mevcut değerle aynıysa (çift tıklama bug'ı), 
            // state'i hiç bozma ve boşuna render etme.
            if (prev[itemId] === newQuantity) return prev;

            return {
                ...prev,
                [itemId]: newQuantity,
            };
        });
    };

    // Toplam seçili adet
    const totalSelectedItems = Object.values(quantities).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-background pb-32">
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
                    <Link
                        href="/"
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

            {/* Floating Button */}
            {totalSelectedItems > 0 && (
                <div className="fixed bottom-6 right-6 z-30">
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-full bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-xl transition-transform hover:scale-105"
                    >
                        <span>Ödemeye Geç</span>
                        <div className="relative">
                            <ShoppingCart className="size-6" />
                            <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                                {totalSelectedItems}
                            </span>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
}
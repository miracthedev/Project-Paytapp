"use client";
import React, { useState } from "react";
import { Apple, CreditCard, Smartphone, X } from "lucide-react";
import { formatTL } from "@/lib/models/order-data";
import { cn } from "@/lib/utils";

const TIPS = [0, 5, 10, 15] as const;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    onPay: (total: number) => void;
};

export function PaymentSheet({ open, onOpenChange, amount, onPay }: Props) {
    const [tip, setTip] = useState<number>(10);

    if (!open) return null;

    const tipAmount = (amount * tip) / 100;
    const total = amount + tipAmount;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
            <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <h2 className="text-2xl font-bold text-foreground">Ödeme</h2>
                    <button onClick={() => onOpenChange(false)} className="rounded-full p-2 hover:bg-muted">
                        <X className="size-5" />
                    </button>
                </div>

                <div className="mt-4 rounded-2xl bg-muted p-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Seçilen tutar</span>
                        <span className="font-semibold text-foreground">{formatTL(amount)}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                        <span>Bahşiş (%{tip})</span>
                        <span className="font-semibold text-foreground">{formatTL(tipAmount)}</span>
                    </div>
                    <div className="mt-3 flex justify-between border-t border-border pt-3">
                        <span className="text-base font-semibold text-foreground">Toplam</span>
                        <span className="text-2xl font-extrabold text-primary">{formatTL(total)}</span>
                    </div>
                </div>

                <div className="mt-5">
                    <h3 className="text-sm font-semibold text-foreground">Bahşiş bırakmak ister misiniz?</h3>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                        {TIPS.map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setTip(value)}
                                className={cn(
                                    "min-h-12 rounded-xl border-2 text-base font-bold transition-colors",
                                    tip === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"
                                )}
                            >
                                {value === 0 ? "Yok" : `%${value}`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 space-y-2.5">
                    <button
                        type="button"
                        onClick={() => onPay(total)}
                        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-lg font-bold text-primary-foreground hover:bg-primary/90"
                    >
                        <CreditCard className="size-5" /> Kredi Kartı ile Öde
                    </button>
                    <button
                        type="button"
                        onClick={() => onPay(total)}
                        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-black text-lg font-bold text-white hover:bg-gray-900"
                    >
                        <Apple className="size-5" /> Apple Pay
                    </button>
                    <button
                        type="button"
                        onClick={() => onPay(total)}
                        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-border bg-background text-lg font-bold hover:bg-muted"
                    >
                        <Smartphone className="size-5" /> Google Pay
                    </button>
                </div>
            </div>
        </div>
    );
}
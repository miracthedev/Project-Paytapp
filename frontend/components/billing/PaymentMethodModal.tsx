
"use client";

import { Wallet, CreditCard, Utensils, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type PaymentMethod = "CASH" | "CREDIT_CARD" | "MEAL_CARD";

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: (method: PaymentMethod) => Promise<void>;
};

export function PaymentMethodModal({ open, onClose, onConfirm }: Props) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!open) return null;

    const handleConfirm = async () => {
        if (!selectedMethod) return;
        setIsSubmitting(true);
        try {
            await onConfirm(selectedMethod);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 px-4 pb-6 pt-4 backdrop-blur-sm sm:items-center sm:p-0">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card p-6 shadow-2xl sm:p-8">
                <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
                >
                    <X className="size-6" />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-extrabold text-foreground">Siparişi Tamamla</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Kilitlediğiniz ürünleri garsona nasıl ödeyeceğinizi seçin. Siparişiniz mutfağa iletilmek üzere bekleme odasına alınacaktır.
                    </p>
                </div>

                <div className="grid gap-3">
                    <button
                        onClick={() => setSelectedMethod("CREDIT_CARD")}
                        className={cn(
                            "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                            selectedMethod === "CREDIT_CARD"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:bg-muted"
                        )}
                    >
                        <CreditCard className="size-7 shrink-0" />
                        <div>
                            <p className="font-bold">Kredi / Banka Kartı</p>
                            <p className="text-sm opacity-80">Garson pos cihazı ile gelir</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedMethod("CASH")}
                        className={cn(
                            "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                            selectedMethod === "CASH"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:bg-muted"
                        )}
                    >
                        <Wallet className="size-7 shrink-0" />
                        <div>
                            <p className="font-bold">Nakit</p>
                            <p className="text-sm opacity-80">Masada nakit ödeme yaparsınız</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedMethod("MEAL_CARD")}
                        className={cn(
                            "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                            selectedMethod === "MEAL_CARD"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background hover:bg-muted"
                        )}
                    >
                        <Utensils className="size-7 shrink-0" />
                        <div>
                            <p className="font-bold">Yemek Kartı (Sodexo, Multinet vb.)</p>
                            <p className="text-sm opacity-80">Geçerli yemek kartları ile ödeme</p>
                        </div>
                    </button>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={!selectedMethod || isSubmitting}
                    className="mt-8 flex w-full min-h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isSubmitting ? <Loader2 className="size-6 animate-spin" /> : "Onayla ve Bekleme Odasına Geç"}
                </button>
            </div>
        </div>
    );
}
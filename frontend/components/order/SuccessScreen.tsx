import React from "react";
import { Check } from "lucide-react";
import { formatTL } from "@/lib/models/order-data";

export function SuccessScreen({ amount, onDone }: { amount: number; onDone: () => void }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
            <div className="flex size-28 items-center justify-center rounded-full bg-green-100">
                <div className="flex size-20 items-center justify-center rounded-full bg-green-600">
                    <Check className="size-12 text-white" strokeWidth={3} />
                </div>
            </div>
            <h1 className="mt-8 text-3xl font-extrabold text-foreground">Ödemeniz başarıyla alındı.</h1>
            <p className="mt-2 text-2xl font-bold text-primary">Afiyet olsun!</p>
            <p className="mt-6 text-lg text-muted-foreground">
                Ödenen tutar: <span className="font-bold text-foreground">{formatTL(amount)}</span>
            </p>
            <button
                type="button"
                onClick={onDone}
                className="mt-10 min-h-16 w-full max-w-sm rounded-2xl bg-primary text-xl font-bold text-primary-foreground hover:bg-primary/90"
            >
                Hesaba Dön
            </button>
        </div>
    );
}
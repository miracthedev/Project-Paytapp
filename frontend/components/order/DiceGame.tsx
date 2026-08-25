"use client";
import React, { useState } from "react";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Dices } from "lucide-react";
import { formatTL } from "@/lib/models/order-data";
import { cn } from "@/lib/utils";

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    amount: number;
    onWin: () => void;
};

export function DiceGame({ open, onOpenChange, itemName, amount, onWin }: Props) {
    const [value, setValue] = useState<number | null>(null);
    const [rolling, setRolling] = useState(false);

    if (!open) return null;

    const roll = () => {
        if (rolling) return;
        setRolling(true);
        setValue(null);
        let ticks = 0;
        const timer = setInterval(() => {
            ticks += 1;
            setValue(Math.floor(Math.random() * 6) + 1);
            if (ticks >= 12) {
                clearInterval(timer);
                const final = Math.floor(Math.random() * 6) + 1;
                setValue(final);
                setRolling(false);
                if (final === 6) onWin();
            }
        }, 90);
    };

    const Icon = (value ? DICE_ICONS[value - 1] : Dices) ?? Dices;
    const won = !rolling && value === 6;
    const lost = !rolling && value !== null && value !== 6;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
                <h2 className="text-2xl font-bold text-foreground">Hesap Kapatma Zarı</h2>
                <p className="mt-2 text-base text-muted-foreground">
                    <span className="font-semibold text-foreground">{itemName}</span> ({formatTL(amount)})
                    <br />6 gelirse bu ürünün hesabı sizin!
                </p>

                <div className={cn(
                    "mx-auto my-6 flex size-32 items-center justify-center rounded-3xl border-2 transition-colors",
                    won ? "border-green-600 bg-green-50" : lost ? "border-border bg-muted" : "border-primary bg-primary/5",
                    rolling && "animate-pulse"
                )}>
                    <Icon className={cn("size-20", won ? "text-green-600" : "text-primary")} strokeWidth={1.75} />
                </div>

                <p className="my-4 min-h-12 text-base font-semibold text-foreground">
                    {rolling
                        ? "Zar dönüyor..."
                        : won
                            ? "6 geldi! Bu ürünü siz üstlendiniz."
                            : lost
                                ? `${value} geldi. Bu sefer olmadı, tekrar deneyin.`
                                : "Zar atın ve şansınızı deneyin."}
                </p>

                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={won ? () => onOpenChange(false) : roll}
                        disabled={rolling}
                        className="min-h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        {won ? "Tamam" : lost ? "Tekrar At" : "Zar At"}
                    </button>
                    {!won && (
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="min-h-12 w-full rounded-2xl border-2 border-border bg-background text-base font-semibold hover:bg-muted"
                        >
                            Vazgeç
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
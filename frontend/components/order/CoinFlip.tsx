"use client";
import React, { useRef, useState } from "react";
import { TurkishCoin } from "./TurkishCoin";
import { formatTL } from "@/lib/models/order-data";
import { cn } from "@/lib/utils";

type Side = "yazi" | "tura";
type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    amount: number;
    onWin: () => void;
};

const LABEL: Record<Side, string> = { yazi: "Yazı", tura: "Tura" };

export function CoinFlip({ open, onOpenChange, itemName, amount, onWin }: Props) {
    const [choice, setChoice] = useState<Side | null>(null);
    const [result, setResult] = useState<Side | null>(null);
    const [flipping, setFlipping] = useState(false);
    const timer = useRef<NodeJS.Timeout | null>(null);

    if (!open) return null;

    const reset = () => {
        if (timer.current) clearTimeout(timer.current);
        setChoice(null);
        setResult(null);
        setFlipping(false);
    };

    const flip = (side: Side) => {
        if (flipping) return;
        setChoice(side);
        setResult(null);
        setFlipping(true);
        timer.current = setTimeout(() => {
            const final: Side = Math.random() < 0.5 ? "yazi" : "tura";
            setResult(final);
            setFlipping(false);
            if (final === side) onWin();
        }, 2200);
    };

    const won = !flipping && result !== null && result === choice;
    const lost = !flipping && result !== null && result !== choice;
    const face: Side = flipping ? "tura" : (result ?? "yazi");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
                <h2 className="text-2xl font-bold text-foreground">Yazı Tura – Hesabı Kitle</h2>
                <p className="mt-2 text-base text-muted-foreground">
                    <span className="font-semibold text-foreground">{itemName}</span> ({formatTL(amount)})
                    <br />
                    Tahmininiz tutarsa bu ürün masadaki diğer kişiye kitlenir.
                </p>

                <div className="coin-stage mx-auto my-6 flex size-36 items-center justify-center rounded-full">
                    <div className={cn("size-32", flipping ? "coin-spin" : result ? "coin-settle" : "")}>
                        <TurkishCoin side={face} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {(["yazi", "tura"] as const).map((side) => (
                        <button
                            key={side}
                            type="button"
                            disabled={flipping || won}
                            onClick={() => flip(side)}
                            className={cn(
                                "min-h-14 rounded-2xl border-2 text-lg font-bold transition-all disabled:opacity-60",
                                choice === side ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"
                            )}
                        >
                            {LABEL[side]}
                        </button>
                    ))}
                </div>

                <p className="my-4 min-h-12 text-base font-semibold text-foreground">
                    {flipping
                        ? "Para havada dönüyor..."
                        : won
                            ? `${result ? LABEL[result] : ""} geldi! Ürün diğer kişiye kitlendi.`
                            : lost
                                ? `${result ? LABEL[result] : ""} geldi. Bu ürün sizde kaldı!`
                                : "Bir taraf seçin, parayı havaya atın."}
                </p>

                <div className="space-y-2">
                    {won ? (
                        <button
                            type="button"
                            onClick={() => { reset(); onOpenChange(false); }}
                            className="min-h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground hover:bg-primary/90"
                        >
                            Tamam
                        </button>
                    ) : (
                        <>
                            {lost && choice && (
                                <button
                                    type="button"
                                    onClick={() => flip(choice)}
                                    className="min-h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground hover:bg-primary/90"
                                >
                                    Tekrar At
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => { reset(); onOpenChange(false); }}
                                className="min-h-12 w-full rounded-2xl border-2 border-border bg-background text-base font-semibold hover:bg-muted"
                            >
                                Vazgeç
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
"use client";
import React, { useState } from "react";
import { Check, CircleDollarSign, Dices, Lock, Users } from "lucide-react";
import { formatTL, type OrderItem } from "@/lib/models/order-data";
import { cn } from "@/lib/utils";
import { DiceGame } from "./DiceGame";
import { CoinFlip } from "./CoinFlip";

const SPLIT_OPTIONS = [1, 2, 3, 4] as const;

type Props = {
    item: OrderItem;
    selected: boolean;
    split: number;
    customAmount: number | null;
    share: number;
    lockedAway: boolean;
    onToggle: () => void;
    onSplitChange: (value: number) => void;
    onCustomChange: (value: number | null) => void;
    onWinDice: () => void;
    onWinCoin: () => void;
    onUnlock: () => void;
};

export function OrderItemCard({
    item, selected, split, customAmount, share, lockedAway,
    onToggle, onSplitChange, onCustomChange, onWinDice, onWinCoin, onUnlock
}: Props) {
    const [customOpen, setCustomOpen] = useState(customAmount !== null);
    const [diceOpen, setDiceOpen] = useState(false);
    const [coinOpen, setCoinOpen] = useState(false);

    // KİTLENDİ (LOCKED)
    if (lockedAway && !item.paid) {
        return (
            <li className="rounded-2xl border-2 border-dashed border-border bg-muted/50 p-4">
                <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="size-16 shrink-0 rounded-xl object-cover grayscale" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold text-muted-foreground">{item.name}</p>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                            <Lock className="size-3.5" /> Diğer kişiye kitlendi
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onUnlock}
                        className="min-h-11 shrink-0 rounded-xl border-2 border-border bg-background px-4 text-sm font-semibold hover:bg-muted"
                    >
                        Geri al
                    </button>
                </div>
            </li>
        );
    }

    // ÖDENDİ (PAID)
    if (item.paid) {
        return (
            <li className="rounded-2xl border border-border bg-muted/60 p-4 opacity-70">
                <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="size-16 shrink-0 rounded-xl object-cover grayscale" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold text-muted-foreground line-through">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} adet</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold text-muted-foreground">{formatTL(item.price)}</p>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-0.5 text-xs font-bold text-green-700">
                            <Check className="size-3.5" /> Ödendi
                        </span>
                    </div>
                </div>
            </li>
        );
    }

    return (
        <li className={cn(
            "rounded-2xl border-2 bg-card p-4 transition-all shadow-sm",
            selected ? "border-primary bg-primary/5" : "border-border"
        )}>
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-4 text-left focus:outline-none"
            >
                <span className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-background"
                )}>
                    {selected && <Check className="size-4" strokeWidth={3} />}
                </span>
                <img src={item.image} alt={item.name} className="size-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold leading-tight text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} adet</p>
                    {item.note && <p className="text-xs text-muted-foreground italic">{item.note}</p>}
                </div>
                <div className="text-right">
                    <p className="text-lg font-extrabold text-foreground">{formatTL(share)}</p>
                    {customAmount !== null ? (
                        <p className="text-xs text-muted-foreground">Özel tutar</p>
                    ) : split > 1 ? (
                        <p className="text-xs text-muted-foreground">{item.price} ₺ / {split}</p>
                    ) : null}
                </div>
            </button>

            {item.shared && (
                <div className="mt-3 border-t border-border pt-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <Users className="size-4" /> Bu ürünü bölüş
                    </span>
                    <div className="mt-2 grid grid-cols-5 gap-1.5">
                        {SPLIT_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => { onCustomChange(null); setCustomOpen(false); onSplitChange(opt); }}
                                className={cn(
                                    "min-h-11 rounded-full border-2 text-sm font-bold transition-colors",
                                    customAmount === null && split === opt
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background hover:bg-muted"
                                )}
                            >
                                {opt === 1 ? "Tümü" : `1/${opt}`}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setCustomOpen(!customOpen)}
                            className={cn(
                                "min-h-11 rounded-full border-2 text-sm font-bold transition-colors",
                                customAmount !== null ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"
                            )}
                        >
                            Özel
                        </button>
                    </div>

                    {customOpen && (
                        <div className="mt-3">
                            <label className="text-xs font-medium text-muted-foreground">Ödemek istediğiniz tutar (₺)</label>
                            <input
                                type="number"
                                min={0}
                                max={item.price}
                                value={customAmount ?? ""}
                                placeholder={`En fazla ${item.price} ₺`}
                                onChange={(e) => onCustomChange(e.target.value === "" ? null : Math.min(Math.max(Number(e.target.value), 0), item.price))}
                                className="mt-1 min-h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-lg font-bold focus:border-primary focus:outline-none"
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <button
                    type="button"
                    onClick={() => setDiceOpen(true)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/10 text-sm font-bold text-primary hover:bg-primary/20"
                >
                    <Dices className="size-4" /> Zar At
                </button>
                <button
                    type="button"
                    onClick={() => setCoinOpen(true)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-border bg-background text-sm font-bold hover:bg-muted"
                >
                    <CircleDollarSign className="size-4" /> Yazı Tura
                </button>
            </div>

            <DiceGame open={diceOpen} onOpenChange={setDiceOpen} itemName={item.name} amount={item.price} onWin={onWinDice} />
            <CoinFlip open={coinOpen} onOpenChange={setCoinOpen} itemName={item.name} amount={item.price} onWin={onWinCoin} />
        </li>
    );
}
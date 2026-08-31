import { Minus, Plus } from "lucide-react";
import { formatTL } from "@/lib/models/order-data"; // Kendi yolunuza göre ayarlayın
import type { MenuProduct } from "@/lib/models/menu-data"; // Kendi yolunuza göre ayarlayın

type Props = {
    item: MenuProduct;
    quantity: number;
    onChange: (quantity: number) => void;
};

export function MenuItemRow({ item, quantity, onChange }: Props) {
    return (
        <li className="flex items-center gap-3 border-b border-border py-4 last:border-b-0">
            <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-foreground">{item.name}</p>
                <p className="mt-0.5 text-base text-muted-foreground">{item.description}</p>
                <p className="mt-1 text-lg font-extrabold text-primary">{formatTL(item.price)}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(Math.max(0, quantity - 1));
                    }}
                    disabled={quantity === 0}
                    aria-label={`${item.name} adetini azalt`}
                    className="flex size-12 items-center justify-center rounded-full border-2 border-border bg-background text-foreground transition-colors hover:bg-accent disabled:opacity-35"
                >
                    <Minus className="size-6" aria-hidden />
                </button>

                <span
                    aria-live="polite"
                    className="min-w-10 text-center text-xl font-extrabold text-foreground"
                >
                    {quantity}
                </span>

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(quantity + 1);
                    }}
                    aria-label={`${item.name} adetini artır`}
                    className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <Plus className="size-6" aria-hidden />
                </button>
            </div>
        </li>
    );
}
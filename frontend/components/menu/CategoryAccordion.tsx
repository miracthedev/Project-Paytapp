import { ChevronDown } from "lucide-react";
import { MenuItemRow } from "./MenuItemRow";
import type { MenuCategory } from "@/lib/models/menu-data";
import { cn } from "@/lib/utils";

type Props = {
    category: MenuCategory;
    open: boolean;
    onToggle: () => void;
    quantities: Record<string, number>;
    onQuantityChange: (itemId: string, quantity: number) => void;
};

export function CategoryAccordion({
    category,
    open,
    onToggle,
    quantities,
    onQuantityChange,
}: Props) {
    const panelId = `kategori-${category.id}`;
    const count = category.items.reduce((sum, item) => sum + (quantities[item.id] ?? 0), 0);

    return (
        <li className="overflow-hidden rounded-2xl border-2 border-border bg-card">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={panelId}
                className="w-full text-left transition-colors hover:bg-accent/40"
            >
                <img
                    src={category.image}
                    alt={`${category.name} kategorisi`}
                    loading="lazy"
                    width={800}
                    height={512}
                    className="h-36 w-full object-cover"
                />
                <div className="flex min-h-16 items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xl font-extrabold text-foreground">{category.name}</p>
                        <p className="text-base text-muted-foreground">
                            {category.items.length} ürün
                            {count > 0 ? ` • ${count} adet seçildi` : ""}
                        </p>
                    </div>
                    <ChevronDown
                        aria-hidden
                        className={cn(
                            "size-7 shrink-0 text-foreground transition-transform",
                            open && "rotate-180",
                        )}
                    />
                </div>
            </button>
            {open && (
                <div id={panelId} className="border-t-2 border-border px-4">
                    <ul>
                        {category.items.map((item) => (
                            <MenuItemRow
                                key={item.id}
                                item={item}
                                quantity={quantities[item.id] ?? 0}
                                onChange={(value) => onQuantityChange(item.id, value)}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </li>
    );
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// UTC -> Türkiye saati
const localTime = (time: Date) => {
    time.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
} 
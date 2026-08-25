import React from "react";
import { cn } from "@/lib/utils";

type Props = {
    side: "yazi" | "tura";
    className?: string;
};

export function TurkishCoin({ side, className }: Props) {
    return (
        <div
            className={cn(
                // Resmin etrafındaki beyazlıkları kesmek için yuvarlak yapıyoruz
                // 3D dönüşte gerçekçi durması için gölge (shadow) ekliyoruz
                "rounded-full shadow-md",
                className
            )}
            role="img"
            aria-label={side === "yazi" ? "Bir Türk Lirası Yazı" : "Bir Türk Lirası Tura"}
            style={{
                // Görsel public/assets/resim_2.png yolunda olmalıdır
                backgroundImage: `url('/assets/turkish_lira.jpg')`,

                // Resmi konteynerin 2 katı genişliğe yayıyoruz (böylece sadece yarısı görünür)
                backgroundSize: "200% 100%",

                // Yazı istenirse resmin solunu, Tura istenirse sağını gösteriyoruz
                backgroundPosition: side === "yazi" ? "left center" : "right center",

                backgroundRepeat: "no-repeat",
                width: "100%",
                height: "100%",
            }}
        />
    );
}
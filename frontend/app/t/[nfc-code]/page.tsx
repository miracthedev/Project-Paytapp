"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function TableRedirectPage() {
    const router = useRouter();
    const params = useParams();
    const nfc_code = params.nfc_code;

    useEffect(() => {
        async function authenticateTable() {
            try {
                // FastAPI'ye statik kodu gönder
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tables/auth/${nfc_code}`);

                if (!response.ok) {
                    throw new Error("Masa aktif değil veya kod geçersiz.");
                }

                const data = await response.json();

                // Backend'den gelen güvenli token'ı ve masa bilgisini sakla
                sessionStorage.setItem("table_id", data.table_id);
                sessionStorage.setItem("session_token", data.session_token); // Hesap kapanana kadar geçerli

                // Backend nereye git diyorsa oraya git (Fiziksel kopyaları koruyan mantık)
                router.replace(data.redirect_url || "/menu");

            } catch (error) {
                console.error(error);
                // Geçersiz veya eski bir URL denendiğinde güvenli alana at
                router.replace("/");
            }
        }

        if (nfc_code) {
            authenticateTable();
        }
    }, [nfc_code, router]);

    // Yönlendirme çok hızlı olacağı için ekranda şık bir bekleme animasyonu
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-lg font-semibold text-foreground">Masaya bağlanılıyor...</p>
            </div>
        </div>
    );
}
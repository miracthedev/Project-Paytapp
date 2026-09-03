"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function TableRedirectPage() {
    const router = useRouter();
    const params = useParams();
    const nfc_code = params.nfc_code;

    useEffect(() => {
        async function joinTable() {
            try {
                // 1. Müşteri daha önce bu masaya oturduysa kimliğini (session) al
                const existingGuestId = sessionStorage.getItem("guest_id");

                // 2. FastAPI'ye "Scan" isteği at !!
                const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_API_URL}/tables/nfc/${nfc_code}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    // Eğer mevcut bir guest_id varsa gönder, yoksa null gider (backend yeni üretir)
                    body: JSON.stringify({ guest_id: existingGuestId })
                });

                if (!response.ok) {
                    throw new Error(`Masa aktif değil veya bağlanılamadı. ${JSON.stringify(response)}`);
                }

                const data = await response.json();

                // 3. Backend'den dönen kritik oturum bilgilerini tarayıcıya kaydet
                sessionStorage.setItem("table_id", data.table_id);             // Örn: 5
                sessionStorage.setItem("ticket_id", data.ticket_id);           // Örn: 1042 (Masanın ortak adisyonu)
                sessionStorage.setItem("guest_id", data.guest_id);             // Örn: "uuid-v4..." (Bu telefonun eşsiz kimliği)
                sessionStorage.setItem("guest_name", data.guest_name);         // Örn: "Müşteri 1" veya "Müşteri 2"

                // 4. Menüye yönlendir
                router.replace("/menu");

            } catch (error) {
                console.error("Bağlantı hatası:", error);
                alert("Bu masa şu anda kullanılamıyor.");
                router.replace("/");
            }
        }

        if (nfc_code) {
            joinTable();
        }
    }, [nfc_code, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-lg font-semibold text-foreground">Masaya bağlanılıyor...</p>
            </div>
        </div>
    );
}
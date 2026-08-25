"use client";
import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, Typography, Button, Box } from "@mui/material";
import { Casino } from "@mui/icons-material";
import { formatTL } from "../lib/models/order-data";
import { TurkishCoin } from "./order/TurkishCoin";

// --- YAZI TURA BİLEŞENİ ---
export function CoinFlip({ open, onOpenChange, itemName, amount, onWin }: any) {
    const [choice, setChoice] = useState<"Yazı" | "Tura" | null>(null);
    const [result, setResult] = useState<"Yazı" | "Tura" | null>(null);
    const [flipping, setFlipping] = useState(false);
    const [victim, setVictim] = useState<string | null>(null); // Kitlenen kişinin adı

    // Şimdilik kullanılacak rastgele (placeholder) isim havuzu
    const PLACEHOLDER_NAMES = ["Ahmet", "Ayşe", "Mehmet", "Zeynep", "Burak", "Merve", "Cem"];

    const flip = (selectedSide: "Yazı" | "Tura") => {
        if (flipping) return;
        setChoice(selectedSide);
        setResult(null);
        setVictim(null);
        setFlipping(true);

        setTimeout(() => {
            const final = Math.random() < 0.5 ? "Yazı" : "Tura";
            setResult(final);
            setFlipping(false);

            // Eğer tahmin doğruysa (Kazanıldı)
            if (final === selectedSide) {
                // Rastgele bir kurban seç
                const randomVictim = PLACEHOLDER_NAMES[Math.floor(Math.random() * PLACEHOLDER_NAMES.length)];
                setVictim(randomVictim);

                // 3 saniye bekle, sonra hesabı kitle ve pencereyi kapat
                setTimeout(() => {
                    onWin();
                    onOpenChange(false);
                    // Bir sonraki açılış için state'leri sıfırla
                    setTimeout(() => {
                        setChoice(null);
                        setResult(null);
                        setVictim(null);
                    }, 300);
                }, 3000);
            }
        }, 2000); // 2 saniye havada dönme süresi
    };

    const isWon = !flipping && result !== null && result === choice;
    const currentFace = flipping ? "tura" : (result === "Yazı" ? "yazi" : (result === "Tura" ? "tura" : "yazi"));

    // Dialog manuel kapatıldığında state'i sıfırlamak için
    const handleClose = () => {
        if (flipping || isWon) return; // Dönerken veya kazanma ekranındayken manuel kapanmasın
        onOpenChange(false);
        setTimeout(() => {
            setChoice(null);
            setResult(null);
            setVictim(null);
        }, 300);
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>Yazı Tura - Hesabı Kitle</DialogTitle>
            <DialogContent sx={{ textAlign: "center", pb: 3 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    <b>{itemName}</b> ({formatTL(amount)})<br />Tahmininiz tutarsa hesap diğer kişiye kitlenir!
                </Typography>

                {/* 3D ANİMASYONLU GERÇEK PARA ALANI */}
                <Box className="coin-stage" sx={{ height: 140, display: "flex", justifyContent: "center", alignItems: "center", mb: 3 }}>
                    <Box
                        className={flipping ? "coin-spin" : result ? "coin-settle" : ""}
                        sx={{ width: 120, height: 120 }}
                    >
                        <TurkishCoin side={currentFace} />
                    </Box>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                    {flipping
                        ? "Para havada dönüyor..."
                        : isWon
                            ? `Tebrikler, ${result} geldi!`
                            : result
                                ? `Maalesef ${result} geldi.`
                                : "Tarafını Seç"}
                </Typography>

                {/* BAŞARI EKRANI YAZISI VE BEKLEME */}
                {isWon && victim ? (
                    <Box sx={{ mt: 2, animation: "pulse 1.5s infinite" }}>
                        <Typography variant="h5" color="success.main" sx={{ fontWeight: "extrabold", mb: 1 }}>
                            Hesap {victim}'e kitlendi! 🎯
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ana ekrana yönlendiriliyor...
                        </Typography>
                    </Box>
                ) : null}

                {/* BUTONLAR (Sadece başlanmadıysa veya kaybedildiyse gösterilir) */}
                {!isWon && (
                    <Box sx={{ mt: 2 }}>
                        {!result && !flipping ? (
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Button variant="outlined" size="large" fullWidth onClick={() => flip("Yazı")}>Yazı</Button>
                                <Button variant="outlined" size="large" fullWidth onClick={() => flip("Tura")}>Tura</Button>
                            </Box>
                        ) : (
                            <Button variant="contained" size="large" fullWidth onClick={handleClose}>
                                Neyse, Ödeyeceğiz Artık
                            </Button>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

// --- ZAR ATMA BİLEŞENİ ---
export function DiceGame({ open, onOpenChange, itemName, amount, onWin }: any) {
    const [value, setValue] = useState<number | null>(null);
    const [rolling, setRolling] = useState(false);

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
        }, 100);
    };

    const isWon = !rolling && value === 6;

    const handleClose = () => {
        if (rolling) return;
        onOpenChange(false);
        setTimeout(() => setValue(null), 300);
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>Zar At - Hesabı Kapat</DialogTitle>
            <DialogContent sx={{ textAlign: "center", pb: 3 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    <b>{itemName}</b> ({formatTL(amount)})<br />6 gelirse bu ürünün hesabı sizin!
                </Typography>

                <Box sx={{ height: 120, display: "flex", justifyContent: "center", alignItems: "center", mb: 3 }}>
                    {rolling ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "pulse 1s infinite" }}>
                            <Casino sx={{ fontSize: 80, color: "primary.main" }} />
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Casino sx={{ fontSize: 80, color: isWon ? "success.main" : "primary.main" }} />
                            <Typography variant="h3" sx={{ fontWeight: "bold" }}>{value || "?"}</Typography>
                        </Box>
                    )}
                </Box>

                <Button variant="contained" size="large" fullWidth disabled={rolling} onClick={isWon ? handleClose : roll}>
                    {isWon ? "Harika! Ürünü Üstlendiniz" : value ? "Tekrar At" : "Zar At"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
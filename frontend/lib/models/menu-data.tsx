export type MenuProduct = {
    id: number;
    name: string;
    description: string;
    price: number;
};

export type MenuCategory = {
    id: string;
    name: string;
    image: string;
    items: MenuProduct[];
};

export const MENU_CATEGORIES: MenuCategory[] = [
    {
        id: "corbalar",
        name: "Çorbalar",
        image: "/assets/menu/corbalar.jpg",
        items: [
            // 2. DÜZELTME: Ürün ID'leri tam sayıya çevrildi
            { id: 1, name: "Mercimek Çorbası", description: "Tereyağı, limon ve pul biberle servis edilir", price: 120 },
            { id: 2, name: "Ezogelin Çorbası", description: "Bulgurlu, naneli klasik lezzet", price: 130 },
            { id: 3, name: "İşkembe Çorbası", description: "Sarımsaklı sirke ve pul biber ile", price: 160 },
        ],
    },
    {
        id: "mezeler",
        name: "Ara Sıcaklar & Mezeler",
        image: "/assets/menu/mezeler.jpg",
        items: [
            { id: 4, name: "Humus", description: "Nohut ezmesi, tahin, zeytinyağı", price: 150 },
            { id: 5, name: "İçli Köfte", description: "Cevizli ve kıymalı, kızarmış (Adet)", price: 90 },
        ],
    },
    {
        id: "anayemekler",
        name: "Ana Yemekler",
        image: "/assets/menu/ana-yemekler.jpg",
        items: [
            { id: 6, name: "Adana Kebap", description: "Zırh kıyması, közlenmiş domates ve biber ile", price: 420 },
            { id: 7, name: "Tavuk Şiş", description: "Özel sosla marine edilmiş tavuk göğsü", price: 320 },
        ],
    }
];
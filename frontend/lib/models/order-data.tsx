export type OrderItem = {
    id: string;
    name: string;
    note?: string;
    quantity: number;
    price: number;
    image: string;
    paid: boolean;
    shared?: boolean;
};

export const RESTAURANT_NAME = "Meydan Ocakbaşı";
export const TABLE_LABEL = "Masa 5";

export const ORDER_ITEMS: OrderItem[] = [
    {
        id: "1", // TEST 1: Veritabanında boş. Tıkladığında BAŞARIYLA KİLİTLENMELİ.
        name: "Folk Valley Kebabı",
        note: "incl. w/Ekber Dayi",
        quantity: 2,
        price: 32,
        image: "assets/folk_cat.jpg",
        paid: false,
        shared: true
    },
    {
        id: "2", // TEST 2: Veritabanında User A tarafından KİLİTLİ. Tıkladığında 409 HATASI VERMELİ ve başkası ödüyor demeli.
        name: "Karışık Meze Tabağı",
        note: "Masaya ortak geldi",
        quantity: 1,
        price: 420,
        image: "/assets/meze.jpg",
        paid: false,
        shared: true,
    },
    {
        id: "4", // TEST 3: Veritabanında kilit süresi DOLMUŞ (Terk edilmiş). Tıkladığında KİLİDİ ÇALABİLMELİSİN.
        name: "Adana Kebap",
        quantity: 2,
        price: 960,
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80",
        paid: false,
    },
    {
        id: "5", // TEST 4: Veritabanında hatalı kilit var. Tıkladığında BAŞARIYLA KİLİTLENMELİ.
        name: "Çoban Salata",
        note: "Masaya ortak geldi",
        quantity: 1,
        price: 180,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80",
        paid: false,
        shared: true,
    },
    {
        id: "99", // TEST 5: Veritabanında BÖYLE BİR ID YOK. Tıkladığında 404 SİSTEMSEL HATA vermeli.
        name: "Ayran",
        quantity: 3,
        price: 135,
        image: "https://images.unsplash.com/photo-1628543100650-70f90e53a258?w=500&q=80",
        paid: false,
    },
    {
        id: "baklava", // Sadece string bırakalım, backend 422 Unprocessable Entity hatası versin görelim.
        name: "Fıstıklı Baklava",
        quantity: 1,
        price: 260,
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&q=80",
        paid: true,
    },
    {
        id: "kahve",
        name: "Türk Kahvesi",
        quantity: 2,
        price: 170,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80",
        paid: true,
    },
];

export function formatTL(value: number) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2,
    }).format(value);
}
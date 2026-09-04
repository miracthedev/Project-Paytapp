// 1. Backend'deki OrderItemPublic modeli ile BİREBİR aynı tip
export type OrderItem = {
    id: number;
    ticket_id: number;
    product_id: number | null;
    sh_product_name: string;
    sh_price_singular: number;
    sh_price_total: number;
    note?: string | null;
    quantity: number;
    image_url?: string | null;
    intended_payment_method?: string | null; // Backend'e uyumlu eklendi
    status: string;                          // Backend'e uyumlu eklendi (Örn: "CART", "CONFIRMING", "SENT")
    is_paid: boolean;
    paid_by_session_id?: string | null;      // "_id" takısı eklendi
    paid_by_name?: string | null;
    locked_by_session_id?: string | null;    // "_id" takısı eklendi
    locked_by_name?: string | null;
    locked_until?: string | null; // Tarihler JSON'da string (ISO format) olarak gelir
    added_at: string;
};

export const RESTAURANT_NAME = "Meydan Ocakbaşı";
export const TABLE_LABEL = "Masa 5";

// 2. Mock verilerimizi yeni API standartlarına göre güncelledik
export const ORDER_ITEMS: OrderItem[] = [
    {
        id: 1,
        ticket_id: 1,
        product_id: 101,
        sh_product_name: "Folk Valley Kebabı",
        note: "incl. w/Ekber Dayi",
        quantity: 2,
        sh_price_singular: 32,
        sh_price_total: 2 * 32,
        image_url: "assets/folk_cat.jpg",
        status: "CART",
        is_paid: false,
        added_at: new Date().toISOString(),
    },
    {
        id: 2,
        ticket_id: 1,
        product_id: 102,
        sh_product_name: "Karışık Meze Tabağı",
        note: "Masaya ortak geldi",
        quantity: 1,
        sh_price_singular: 420,
        sh_price_total: 1 * 420,
        image_url: "/assets/meze.jpg",
        status: "CART",
        is_paid: false,
        // TEST: Bu ürün başkası tarafından kilitlenmiş gibi gösterelim
        locked_by_session_id: "fake-session-uuid", // _id eklendi
        locked_by_name: "Müşteri 42",
        locked_until: new Date(Date.now() + 3 * 60000).toISOString(),
        added_at: new Date().toISOString(),
    },
    {
        id: 4,
        ticket_id: 1,
        product_id: 104,
        sh_product_name: "Adana Kebap",
        quantity: 2,
        sh_price_singular: 960,
        sh_price_total: 2 * 960,
        image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80",
        status: "CART",
        is_paid: false,
        added_at: new Date().toISOString(),
    },
    {
        id: 6,
        ticket_id: 1,
        product_id: 106,
        sh_product_name: "Fıstıklı Baklava",
        quantity: 1,
        sh_price_singular: 260,
        sh_price_total: 1 * 260,
        image_url: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&q=80",
        status: "CART",
        is_paid: true,
        paid_by_session_id: "another-fake-uuid", // _id eklendi
        paid_by_name: "Ahmet",
        added_at: new Date().toISOString(),
    }
];

export function formatTL(value: number) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2,
    }).format(value);
}
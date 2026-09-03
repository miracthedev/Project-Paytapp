
// TODO
const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL;
const NEXT_PUBLIC_FASTAPI_API_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL;
// const NEXT_PUBLIC_FASTAPI_API_URL = "http://127.0.0.1:8000";






export async function loginUser(email: string, password: string) {
    // 1. Format the payload as x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    // 2. Send the POST request to your /login route
    const response = await fetch(`${NEXT_PUBLIC_FASTAPI_API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Invalid email or password");
    }

    // 1. AWAIT the parsing and store the actual data in a variable
    const data = await response.json();

    // 2. Log the actual data to your console
    console.log("My API Response:", data);

    // 3. Parse and return the JSON response
    return data;
}

export async function fetchOrderItems(ticketId: string | number) {
    const response = await fetch(`${NEXT_PUBLIC_FASTAPI_API_URL}/order-items/ticket/${ticketId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch order items. Status: ${response.status}`);
    }

    return response.json();
}

export async function fetchRestaurants(token?: string) {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    // If a token is provided (meaning the route is protected), attach the ID badge
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${NEXT_API_URL}/restaurants/`, {
        method: "GET",
        headers,
    });

    if (!response.ok) {
        throw new Error("Failed to fetch restaurants");
    }

    return response.json();
}

/*
Hereby, this function shall have 3 input, where itemId, seeeeshionId and lock

# lockedUntil
if lock -> true, returns a countdown of 3 mins for lock,
   lock -> false, returns null

# lockedBy
if lock -> true, returns sessionId, which basicall means showing which user locked this
   lock -> false, returns null

## These variables set to  null if not locked, because it means asking for unlocking this item.

/**
 * Toggles the lock status of a specific order item.
 * Time calculations and validations are strictly handled by the backend.
 * 
 * @param itemId - The ID of the OrderItem
 * @param sessionId - The unique GuestSession ID (UUID)
 * @param lock - true to lock, false to unlock
 */
export async function toggleItemLock(itemId: string | number, sessionId: string, lock: boolean) {
    // # token
    // SSR koruması ile token alımı
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    // Eğer kullanıcı giriş yapmışsa (Garson/Admin) token ekle
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Dikkat: API rotasının sonuna "/lock" eklendi ve body temizlendi
    const response = await fetch(`${NEXT_PUBLIC_FASTAPI_API_URL}/order-items/${itemId}/lock`, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify({
            guest_id: sessionId,
            lock: lock
        }),
    });

    // catcher for errors
    if (!response.ok) {
        const errorData = await response.text();
        console.error(`API Hatası (Status ${response.status}):`, errorData);

        // raises "409 CONFLICT" Exception
        if (response.status === 409) {
            throw new Error("Conflict: Item already locked by someone else.");
        } else {
            throw new Error(`SYSTEM ERR: ${response.status}`);
        }
    }

    return response.json();
}

// lib/api.ts içine ekleyin
export async function addOrderItem(ticketId: number, productId: number, quantity: number, guestId: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_API_URL}/order-items/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ticket_id: ticketId,
            product_id: productId,
            quantity: quantity,
            guest_id: guestId,
            note: ""
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("FastAPI 422 Detayı:", JSON.stringify(errorData, null, 2));
        throw new Error(`Sipariş eklenemedi: ${response.status}`);
    }

    return response.json();
}
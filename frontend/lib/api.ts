import { Restaurant } from "./models/restaurant";

const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL;
const FASTAPI_API_URL = process.env.FASTAPI_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function loginUser(email: string, password: string) {
    // 1. Format the payload as x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    // 2. Send the POST request to your /login route
    const response = await fetch(`${FASTAPI_API_URL}/login`, {
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



export async function toggleItemLock(itemId: string | number, sessionId: string, lock: boolean) {
    const lockedUntil = lock ? new Date(Date.now() + 3 * 60000).toISOString() : null;
    const lockedBy = lock ? sessionId : null;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Header'ları dinamik yapıyoruz
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    // Eğer kullanıcı giriş yapmışsa (Garson/Admin) token ekle
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${FASTAPI_API_URL}/order-items/${itemId}`, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify({
            locked_by_session: lockedBy,
            locked_until: lockedUntil
        }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error(`API Hatası (Status ${response.status}):`, errorData);

        if (response.status === 409) {
            throw new Error("Conflict: Item already locked by someone else.");
        } else {
            throw new Error(`Sistemsel Hata: ${response.status}`);
        }
    }

    return response.json();
}
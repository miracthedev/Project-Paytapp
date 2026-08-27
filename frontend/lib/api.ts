
// TODO
const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL;
const NEXT_API_FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || "http://127.0.0.1:8000";
// const NEXT_API_FASTAPI_URL = "http://127.0.0.1:8000";






export async function loginUser(email: string, password: string) {
    // 1. Format the payload as x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    // 2. Send the POST request to your /login route
    const response = await fetch(`${NEXT_API_FASTAPI_URL}/login`, {
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

export async function fetchOrderItems() {

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



*/
export async function toggleItemLock(itemId: string | number, sessionId: string, lock: boolean) {
    const lockedUntil = lock ? new Date(Date.now() + 3 * 60000).toISOString() : null; //3 mins lock!
    const lockedBy = lock ? sessionId : null;

    // # token
    // if typeof window is undefined, this means Next.js is on SSR right now, accessing the window results in a crash.
    // so it accesses the token IF AND ONLY IF SSR finished and window is accessible.

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Initializing a Record (dictionary) with an value,
    // p.s. KEYS of a Record can only have these types "number", "string", "symbol"
    // VALUES can have any type.
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };


    // Eğer kullanıcı giriş yapmışsa (Garson/Admin) token ekle
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }


    // This snippet will update lock status of specified order item, with "PATCH" method.
    // May or may not include auth, depending on who made the request (user/admin or guest)
    const response = await fetch(`${NEXT_API_FASTAPI_URL}/order-items/${itemId}`, {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify({
            locked_by_session: lockedBy,
            locked_until: lockedUntil
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
// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("")
    const [token, setToken] = useState("")

    const handleLogin = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            // 1. Send the request
            const data = await loginUser(email, password);

            // 2. Extract the token from the response model
            const token = data.access_token;

            // 3. Store the token (Browser Storage)
            localStorage.setItem("token", token);

            setSuccess("Success!")

            // 4. Update Client State (e.g., passing it into your Zustand auth slice)
            // useAuthStore.getState().setToken(token);

            console.log("Token retrieved successfully:", token);
            setToken(token)

            // 5. Redirect the user to the dashboard...

        } catch (err) {
            console.error("The exact error is:", err);
            setError("Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-4">
                {error && <div className="text-red-500">{error}</div>}
                {success && <div className="text-green-500">{success} here is token: {token}</div>}

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="rounded border p-2 text-black"
                    required
                    // Tell Bitwarden to back off
                    data-bwignore="true"
                />

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="rounded border p-2 text-black"
                    required
                    // Tell Bitwarden to back off
                    data-bwignore="true"
                />
                <button type="submit" className="rounded bg-blue-600 p-2 text-white">
                    Sign In
                </button>
            </form>
        </div>
    );
}
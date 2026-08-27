

const FASTAPI_API_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL;
const NEXT_API_URL = process.env.NEXT_PUBLIC_API_URL;

export default async function EndpointTestPage({
    params,
    searchParams,
}: {
    params: Promise<{ endpoint: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const endpointSlug = resolvedParams.endpoint;

    // Extract special sandbox queries
    const method = (resolvedSearchParams.method as string)?.toUpperCase() || "GET";
    const token = resolvedSearchParams.token as string | undefined;

    // Filter out "method" and "token" so we don't send them to FastAPI as URL parameters
    const forwardParams = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
        if (key !== "method" && key !== "token" && value !== undefined) {
            if (Array.isArray(value)) {
                value.forEach((v) => forwardParams.append(key, v));
            } else {
                forwardParams.append(key, value);
            }
        }
    }

    const queryString = forwardParams.toString();
    const backendUrl = `${FASTAPI_API_URL}/${endpointSlug}${queryString ? `?${queryString}` : ""}`;

    // Prepare headers, injecting the token if it was provided in the URL
    const headers: HeadersInit = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let data = null;
    let error = null;

    try {
        const res = await fetch(backendUrl, {
            method: method,
            headers: headers,
            cache: "no-store",
        });

        if (!res.ok) {
            error = `HTTP Error: ${res.status} ${res.statusText}`;
        } else {
            data = await res.json();
        }
    } catch (err: any) {
        error = err.message || "Failed to connect to FastAPI";
    }

    return (
        <div className="p-8 max-w-3xl mx-auto mt-10 bg-card rounded-xl border shadow-sm">
            <h1 className="text-2xl font-extrabold mb-2 text-foreground">
                Testing: <span className="text-primary">{method} /{endpointSlug}</span>
            </h1>

            <div className="mb-6 text-sm text-muted-foreground flex flex-col gap-1">
                <p>
                    <strong>Target URL: </strong>
                    <a href={backendUrl} target="_blank" rel="noreferrer" className="underline hover:text-primary">
                        {backendUrl}
                    </a>
                </p>
                <p>
                    <strong>Forwarded Queries: </strong>
                    {queryString ? `?${queryString}` : "None"}
                </p>
                <p>
                    <strong>Auth Status: </strong>
                    {token ? <span className="text-green-500">Token Attached</span> : <span className="text-red-500">No Token (Unauthenticated)</span>}
                </p>
            </div>

            {error ? (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                    <strong>Error:</strong> {error}
                </div>
            ) : (
                <div className="bg-[#1e1e1e] text-green-400 p-4 rounded-lg overflow-x-auto shadow-inner">
                    <pre className="text-sm">
                        <code>{JSON.stringify(data, null, 2)}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}
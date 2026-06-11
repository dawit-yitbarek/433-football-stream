// API Configuration
// Centralized API endpoint management

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.3:5000';
const API_TIMEOUT_MS = 15000; // 15 seconds

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    TIMEOUT_MS: API_TIMEOUT_MS,
    ENDPOINTS: {
        MATCHES: '/api/matches',
    },
} as const;

// Helper function to fetch with timeout
export async function fetchWithTimeout(
    url: string,
    options?: RequestInit,
    timeoutMs: number = API_CONFIG.TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Retry fetch with exponential backoff
export async function fetchWithRetry(
    url: string,
    options?: RequestInit,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<Response> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetchWithTimeout(url, options);
            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < maxRetries - 1) {
                // Exponential backoff: 1s, 2s, 4s
                const delayMs = baseDelayMs * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError || new Error('Failed to fetch after retries');
}

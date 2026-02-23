/**
 * Assistant API client.
 *
 * Typed POST wrapper for /api/assistant/chat with 15s timeout.
 * No external dependencies — native fetch only.
 */

import { getApiBaseUrl } from '../api/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssistantContext {
    territory?: string;
    lang?: 'fr' | 'en';
    page?: string;
    wizard?: Record<string, unknown>;
}

export interface AssistantRequest {
    message: string;
    context?: AssistantContext;
}

export interface AssistantCitation {
    label: string;
    url?: string;
}

export interface AssistantResponse {
    answer: string;
    citations?: AssistantCitation[];
    meta: {
        model: string;
        rulepack: string;
        requestId: string;
    };
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class AssistantError extends Error {
    status: number;
    code: string;
    userMessage: string;

    constructor(status: number, code: string, userMessage: string) {
        super(userMessage);
        this.name = 'AssistantError';
        this.status = status;
        this.code = code;
        this.userMessage = userMessage;
    }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASSISTANT_TIMEOUT_MS = 15_000;
const ENDPOINT = '/api/assistant/chat';

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * Send a message to the assistant API.
 *
 * @throws {AssistantError} on HTTP error, timeout, or network failure
 */
export async function sendMessage(
    message: string,
    context?: AssistantContext,
    options?: { signal?: AbortSignal },
): Promise<AssistantResponse> {
    const url = `${getApiBaseUrl()}${ENDPOINT}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ASSISTANT_TIMEOUT_MS);

    // Honour caller-provided signal (e.g. React unmount).
    if (options?.signal) {
        options.signal.addEventListener('abort', () => controller.abort(), {
            once: true,
        });
    }

    const body: AssistantRequest = { message };
    if (context) body.context = context;

    let response: Response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new AssistantError(
                0,
                'timeout',
                'L\'assistant met trop de temps à répondre. Veuillez réessayer.',
            );
        }
        throw new AssistantError(
            0,
            'network_error',
            'Impossible de contacter l\'assistant. Vérifiez votre connexion.',
        );
    } finally {
        clearTimeout(timeoutId);
    }

    // ---------- Parse response ----------
    let data: Record<string, unknown>;
    try {
        data = (await response.json()) as Record<string, unknown>;
    } catch {
        throw new AssistantError(
            response.status,
            'invalid_response',
            'Réponse invalide du serveur.',
        );
    }

    // ---------- HTTP errors ----------
    if (!response.ok) {
        const code = (typeof data.error === 'string' ? data.error : 'unknown') as string;
        const msg = (typeof data.message === 'string' ? data.message : undefined) as string | undefined;

        if (response.status === 429) {
            throw new AssistantError(429, code, msg || 'Trop de messages envoyés. Veuillez patienter.');
        }
        if (response.status === 400) {
            throw new AssistantError(400, code, msg || 'Message invalide.');
        }
        throw new AssistantError(
            response.status,
            code,
            msg || 'Une erreur est survenue. Veuillez réessayer.',
        );
    }

    return data as unknown as AssistantResponse;
}

import { vi } from 'vitest';
vi.stubEnv('KV_REST_API_URL', 'http://localhost');
vi.stubEnv('KV_REST_API_TOKEN', 'mock-token');
vi.stubEnv('NODE_ENV', 'development'); // triggers mock mode (no Gemini key needed)

/**
 * Assistant Chat Integration Tests
 *
 * Tests the POST /api/assistant/chat endpoint.
 * Uses mock mode (no GEMINI_API_KEY) to validate input parsing,
 * sensitive data blocking, and response structure.
 */
import { describe, it, expect } from 'vitest';
import chatHandler from '../../api/_handlers/assistant/chat.js';

function createMockReq({ method = 'POST', body = {}, headers = {} } = {}) {
    return {
        method,
        url: '/api/assistant/chat',
        body,
        requestId: 'test-request-id',
        headers: {
            host: 'localhost:3000',
            'content-type': 'application/json',
            'x-forwarded-for': '127.0.0.1',
            ...headers,
        },
    };
}

function createMockRes() {
    const res = {
        statusCode: 200,
        headers: {},
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        },
        setHeader(key, value) {
            this.headers[key] = value;
        },
        end(data) {
            if (data) this.body = data;
            return this;
        },
    };
    return res;
}

describe('Assistant Chat API', () => {
    it('GET method returns 405', async () => {
        const req = createMockReq({ method: 'GET' });
        const res = createMockRes();

        await chatHandler(req, res);

        expect(res.statusCode).toBe(405);
        expect(res.body).toHaveProperty('error', 'method_not_allowed');
    });

    it('returns 400 for empty message', async () => {
        const req = createMockReq({ body: { message: '' } });
        const res = createMockRes();

        await chatHandler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'invalid_message');
    });

    it('returns 400 for missing message field', async () => {
        const req = createMockReq({ body: {} });
        const res = createMockRes();

        await chatHandler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'invalid_message');
    });

    it('returns 400 for message exceeding 800 characters', async () => {
        const req = createMockReq({ body: { message: 'a'.repeat(801) } });
        const res = createMockRes();

        await chatHandler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'message_too_long');
    });

    it('blocks sensitive data — NIR (numéro sécurité sociale)', async () => {
        const req = createMockReq({ body: { message: 'Mon numéro est 1 85 05 78 123 456 72' } });
        const res = createMockRes();

        await chatHandler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'sensitive_data_detected');
    });

    it('blocks sensitive data — IBAN FR', async () => {
        const req = createMockReq({ body: { message: 'Mon IBAN FR76 1234 5678 9012 3456 7890 123' } });
        const res = createMockRes();

        await chatHandler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'sensitive_data_detected');
    });

    it('blocks sensitive data — credit card number', async () => {
        const req = createMockReq({ body: { message: 'Ma carte 4970 1234 5678 9012' } });
        const res = createMockRes();

        await chatHandler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'sensitive_data_detected');
    });

    it('accepts valid message in mock mode and returns answer', async () => {
        // Ensure no Gemini key so mock mode is used
        const originalKey = process.env.GEMINI_API_KEY;
        delete process.env.GEMINI_API_KEY;
        delete process.env.GOOGLE_API_KEY;

        const req = createMockReq({ body: { message: 'Quelles aides pour le logement ?' } });
        const res = createMockRes();

        await chatHandler(req, res);

        // Restore
        if (originalKey) process.env.GEMINI_API_KEY = originalKey;

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('answer');
        expect(res.body.answer.length).toBeGreaterThan(10);
        expect(res.body).toHaveProperty('mock', true);
        expect(res.body).toHaveProperty('meta');
        expect(res.body.meta).toHaveProperty('model', 'mock-dev');
    });

    it('validates context object', async () => {
        const req = createMockReq({
            body: {
                message: 'Bonjour',
                context: { lang: 'invalid' },
            },
        });
        const res = createMockRes();

        await chatHandler(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'invalid_context');
    });

    it('accepts valid context', async () => {
        delete process.env.GEMINI_API_KEY;
        delete process.env.GOOGLE_API_KEY;

        const req = createMockReq({
            body: {
                message: 'Aide RSA',
                context: { lang: 'fr', territory: '67000' },
            },
        });
        const res = createMockRes();

        await chatHandler(req, res);

        expect(res.statusCode).toBe(200);
    });
});

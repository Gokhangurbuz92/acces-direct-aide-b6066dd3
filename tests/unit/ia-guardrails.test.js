/**
 * 🧪 IA QUALITY ASSURANCE — Golden Dataset
 * Tests the assistant's guardrails and RAG quality.
 *
 * Run: DATABASE_URL="..." node tests/integration/ia-guardrails.test.js
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock the Gemini API to test guardrails without API calls
vi.mock('../../api/lib/gemini.js', () => ({
    chatWithRulePack: vi.fn(),
    generateText: vi.fn(),
}));

import handler from '../../api/_handlers/assistant/chat.js';

function mockReq(body, headers = {}) {
    return {
        method: 'POST',
        body,
        headers: { 'x-forwarded-for': '127.0.0.1', ...headers },
        requestId: 'test-' + Date.now(),
        socket: { remoteAddress: '127.0.0.1' },
    };
}

function mockRes() {
    const res = {
        statusCode: null,
        body: null,
        headers: {},
        status(code) { res.statusCode = code; return res; },
        json(data) { res.body = data; return res; },
        setHeader(k, v) { res.headers[k] = v; return res; },
    };
    return res;
}

describe('IA Guardrails — Golden Dataset', () => {

    // --- PII BLOCKING ---
    it('blocks NIR (numéro de sécurité sociale)', async () => {
        const req = mockReq({ message: 'Mon numéro est 1 85 01 75 123 456 78' });
        const res = mockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('sensitive_data_detected');
    });

    it('blocks IBAN FR', async () => {
        const req = mockReq({ message: 'Mon IBAN FR76 3000 6000 0112 3456 7890 189' });
        const res = mockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('sensitive_data_detected');
    });

    it('blocks credit card numbers', async () => {
        const req = mockReq({ message: 'Ma carte 4970 1012 3456 7890' });
        const res = mockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('sensitive_data_detected');
    });

    // --- INPUT VALIDATION ---
    it('rejects empty message', async () => {
        const req = mockReq({ message: '' });
        const res = mockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('invalid_message');
    });

    it('rejects message over 800 chars', async () => {
        const req = mockReq({ message: 'a'.repeat(801) });
        const res = mockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('message_too_long');
    });

    it('rejects invalid context type', async () => {
        const req = mockReq({ message: 'Aide logement', context: 'not-an-object' });
        const res = mockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('invalid_context');
    });

    it('rejects wrong method', async () => {
        const req = mockReq({ message: 'test' });
        req.method = 'GET';
        const res = mockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(405);
    });

    // --- API KEY MISSING (503) ---
    it('returns 503 when Gemini key is missing', async () => {
        const originalKey = process.env.GEMINI_API_KEY;
        const originalGoogleKey = process.env.GOOGLE_API_KEY;
        delete process.env.GEMINI_API_KEY;
        delete process.env.GOOGLE_API_KEY;

        const req = mockReq({ message: 'Quelles aides pour un étudiant ?' });
        const res = mockRes();
        await handler(req, res);
        expect(res.statusCode).toBe(503);
        expect(res.body.error).toBe('service_unavailable');

        // Restore
        if (originalKey) process.env.GEMINI_API_KEY = originalKey;
        if (originalGoogleKey) process.env.GOOGLE_API_KEY = originalGoogleKey;
    });
});

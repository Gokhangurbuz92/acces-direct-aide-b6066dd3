import logger from '../_utils/logger.js';
// @ts-nocheck

/**
 * TTS API — Server-side proxy for Gemini TTS
 *
 * POST /api/tts
 *
 * Converts text to speech using Gemini gemini-2.5-flash-preview-tts.
 * Returns a WAV audio blob. API key stays server-side.
 *
 * Body: { text: string, voice?: string }
 */

const TTS_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';

/**
 * Convert PCM16 raw data to WAV Blob.
 */
function pcmToWav(pcmData, sampleRate) {
    const buffer = Buffer.alloc(44 + pcmData.length * 2);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + pcmData.length * 2, 4);
    buffer.write('WAVE', 8);

    // fmt  sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // sub-chunk size
    buffer.writeUInt16LE(1, 20); // PCM format
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
    buffer.writeUInt16LE(2, 32); // block align
    buffer.writeUInt16LE(16, 34); // bits per sample

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(pcmData.length * 2, 40);

    for (let i = 0; i < pcmData.length; i++) {
        buffer.writeInt16LE(pcmData[i], 44 + i * 2);
    }

    return buffer;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'TTS non configuré (clé API manquante).' });
    }

    const { text, voice = 'Sulafat' } = req.body || {};

    if (!text || typeof text !== 'string' || text.length > 500) {
        return res.status(400).json({ error: 'Texte requis (max 500 caractères).' });
    }

    try {
        const payload = {
            contents: [
                {
                    parts: [
                        { text: `Lis ceci de manière posée et rassurante, en français : ${text}` },
                    ],
                },
            ],
            generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        };

        const response = await fetch(
            `${TTS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            logger.error('[TTS] Gemini error:', response.status, errorText.slice(0, 200));
            return res.status(502).json({ error: 'Erreur du service de synthèse vocale.' });
        }

        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioBase64 = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType || '';

        if (!audioBase64) {
            return res.status(502).json({ error: 'Réponse audio vide.' });
        }

        // Parse sample rate from MIME type (e.g. "audio/L16;rate=24000")
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

        // Decode base64 → PCM16 → WAV
        const raw = Buffer.from(audioBase64, 'base64');
        const pcm16 = new Int16Array(
            raw.buffer,
            raw.byteOffset,
            raw.byteLength / 2
        );
        const wavBuffer = pcmToWav(pcm16, sampleRate);

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', wavBuffer.length);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        return res.end(wavBuffer);
    } catch (error) {
        logger.error('[TTS] Erreur:', error.message);
        return res.status(500).json({ error: 'Erreur interne TTS.' });
    }
}

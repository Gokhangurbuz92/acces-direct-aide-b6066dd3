
import http from 'http';
import url from 'url';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ override: true });

// Handlers
import publicMsgHandler from './api/_handlers/public/messages.js';
import proMsgHandler from './api/_handlers/pro/messages.js';
import uploadHandler, { config as uploadConfig } from './api/_handlers/upload.js';
import downloadHandler from './api/_handlers/download.js';
import purgeHandler from './api/_handlers/cron/purge.js';

import proLoginHandler from './api/_handlers/pro/auth/login.js';
import proAppointmentsHandler from './api/_handlers/pro/appointments/index.js';
// __dev is at root of api
import devSetupHandler from './api/__dev/create-test-appointment.js';

import guidesHandler from './api/_handlers/guides.js';
import toolsHandler from './api/_handlers/tools.js';

import suggestStructureHandler from './api/_handlers/public/suggest-structure.js';
import statsHandler from './api/_handlers/public/stats.js';
import adminPartnershipsHandler from './api/_handlers/admin/partnerships.js'; // Assuming in _handlers/admin
import sitemapHandler from './api/_handlers/sitemap.js';
import robotsHandler from './api/_handlers/robots.js';

// Core content APIs
import aidesHandler from './api/_handlers/aides.js';
import structuresHandler from './api/_handlers/structures.js';
import demarchesHandler from './api/_handlers/demarches.js';
import actualitesHandler from './api/_handlers/actualites.js';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query;

    console.log(`[DevServer] ${req.method} ${parsedUrl.pathname}`);

    // Helper for JSON
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return res;
    };
    res.send = (data) => {
        res.end(data);
        return res;
    };

    // Body Parsing (Simple, except for upload which handles its own)
    // uploadHandler uses busboy, so we pipe raw req.
    // others need json body.

    const isUpload = parsedUrl.pathname === '/api/upload';

    if (!isUpload && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const bodyStr = Buffer.concat(chunks).toString();
        try {
            req.body = JSON.parse(bodyStr);
        } catch (e) {
            req.body = {};
        }
    }

    try {
        if (parsedUrl.pathname === '/api/public/messages') {
            await publicMsgHandler(req, res);
        } else if (parsedUrl.pathname === '/api/pro/messages') {
            await proMsgHandler(req, res);
        } else if (parsedUrl.pathname === '/api/upload') {
            await uploadHandler(req, res);
        } else if (parsedUrl.pathname === '/api/download') {
            await downloadHandler(req, res);
        } else if (parsedUrl.pathname === '/api/cron/purge') {
            await purgeHandler(req, res);
        } else if (parsedUrl.pathname === '/api/pro/auth/login' || parsedUrl.pathname === '/api/pro/login') { // Frontend uses /api/pro/login usually? Recheck ProLayout but I think I used /api/pro/me and login page uses /api/pro/login.
            // Wait, ProLogin page uses what? I didn't see ProLogin file.
            // ProLayout.jsx checks /api/pro/me.
            // I need /api/pro/me too!
            // ProLogin.jsx (new file I need to check path) likely uses /api/pro/auth/login.
            // I'll map both for safety.
            await proLoginHandler(req, res);
        } else if (parsedUrl.pathname === '/api/pro/appointments') {
            await proAppointmentsHandler(req, res);
        } else if (parsedUrl.pathname.startsWith('/api/__dev')) {
            // Block dev routes in production
            if (process.env.NODE_ENV === 'production') {
                return res.status(404).json({ error: "Not Found" });
            }
            await devSetupHandler(req, res);
        } else if (parsedUrl.pathname === '/api/guides' || parsedUrl.pathname.startsWith('/api/guides')) {
            await guidesHandler(req, res);
        } else if (parsedUrl.pathname === '/api/tools' || parsedUrl.pathname.startsWith('/api/tools')) {
            await toolsHandler(req, res);
        } else if (parsedUrl.pathname.startsWith('/api/aides')) {
            await aidesHandler(req, res);
        } else if (parsedUrl.pathname === '/api/public/suggest-structure') {
            await suggestStructureHandler(req, res);
        } else if (parsedUrl.pathname === '/api/public/stats') {
            await statsHandler(req, res);
        } else if (parsedUrl.pathname === '/api/admin/partnerships') {
            await adminPartnershipsHandler(req, res);
        } else if (parsedUrl.pathname === '/sitemap.xml' || parsedUrl.pathname.endsWith('/api/sitemap')) {
            await sitemapHandler(req, res);
        } else if (parsedUrl.pathname === '/robots.txt' || parsedUrl.pathname.endsWith('/api/robots')) {
            await robotsHandler(req, res);
        } else if (parsedUrl.pathname === '/api/structures' || parsedUrl.pathname.startsWith('/api/structures/')) {
            await structuresHandler(req, res);
        } else if (parsedUrl.pathname === '/api/demarches' || parsedUrl.pathname.startsWith('/api/demarches/')) {
            await demarchesHandler(req, res);
        } else if (parsedUrl.pathname === '/api/actualites' || parsedUrl.pathname.startsWith('/api/actualites/')) {
            await actualitesHandler(req, res);
        } else {
            // [MVP] SPA Fallback for Dev Server Tests - DEV ONLY
            // If it's not an API route AND we are NOT in production, return 200 OK placeholder.
            // In production, always return 404 for unknown routes.
            const isProduction = process.env.NODE_ENV === 'production';

            if (!parsedUrl.pathname.startsWith('/api') && parsedUrl.pathname !== '/robots.txt' && parsedUrl.pathname !== '/sitemap.xml' && !isProduction) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<html><body>SPA Placeholder (DEV ONLY)</body></html>');
            } else {
                res.status(404).json({ error: "Not Found" });
            }
        }
    } catch (e) {
        console.error("Handler Error:", e);
        if (!res.headersSent) res.status(500).json({ error: e.message });
    }
});

server.listen(PORT, () => {
    console.log(`Dev Server listening on ${PORT}`);
});

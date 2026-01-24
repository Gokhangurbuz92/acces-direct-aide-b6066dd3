
import http from 'http';
import url from 'url';
import dotenv from 'dotenv';
import { routes } from './api/routes.js';

dotenv.config({ override: true });


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

    // Body Parsing
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

    // Routing Logic
    // Normalise path similarly to api/index.js
    let path = parsedUrl.pathname || "";
    path = path.replace(/^\/api(\/|$)/, "/");
    path = path.replace(/^\/+/, "");
    path = path.replace(/\/+$/, "");

    try {
        let handlerPath = null;

        // Find matching route
        for (const route of routes) {
            if (route.match === 'exact') {
                if (path === route.path) {
                    handlerPath = route.handler;
                    break;
                }
            } else if (route.match === 'prefix') {
                if (path === route.path || path.startsWith(route.path + '/')) {
                    handlerPath = route.handler;
                    break;
                }
            }
        }

        // Also check for dev-specific routes
        if (!handlerPath && path.startsWith('__dev/')) {
            if (process.env.NODE_ENV !== 'production') {
                // Map to api/_handlers/__dev/...
                // Need to check specific files or just one?
                if (path === '__dev/create-test-appointment') {
                    handlerPath = './_handlers/__dev/create-test-appointment.js';
                }
            }
        }

        if (handlerPath) {
            // Lazy load the handler
            // Note: handlerPath is relative to api/index.js (./_handlers/...)
            // But we are in root. So we need to adjust path.
            // routes.js has './_handlers/...'
            // We need './api/_handlers/...'
            const importPath = './api/' + handlerPath.replace(/^\.\//, '');

            try {
                const handlerModule = await import(importPath);
                if (handlerModule && handlerModule.default) {
                    await handlerModule.default(req, res);
                } else {
                    res.status(500).json({ error: 'Handler module missing default export' });
                }
            } catch (err) {
                console.error(`[DevServer] Failed to load handler for ${path}: ${err.message}`);
                if (err.code === 'ERR_MODULE_NOT_FOUND') {
                    res.status(501).json({ error: 'Handler not implemented or missing dependencies', details: err.message });
                } else {
                    res.status(500).json({ error: 'Internal Handler Error', details: err.message });
                }
            }

        } else {
            // [MVP] SPA Fallback for Dev Server Tests - DEV ONLY
            // If it's not an API route AND we are NOT in production, return 200 OK placeholder.
            const isProduction = process.env.NODE_ENV === 'production';
            if (!parsedUrl.pathname.startsWith('/api') && parsedUrl.pathname !== '/robots.txt' && parsedUrl.pathname !== '/sitemap.xml' && !isProduction) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<html><body>SPA Placeholder (DEV ONLY)</body></html>');
            } else {
                res.status(404).json({ error: "Not Found" });
            }
        }

    } catch (e) {
        console.error("Server Error:", e);
        if (!res.headersSent) res.status(500).json({ error: e.message });
    }
});

server.listen(PORT, () => {
    console.log(`Dev Server listening on ${PORT}`);
});

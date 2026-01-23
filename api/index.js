
import url from 'url';
import { routes } from './routes.js';

export default async function handler(req, res) {
    const urlObj = new URL(req.url, `https://${req.headers.host}`);
    let path = urlObj.pathname || "";

    console.log(`Router: Requesting ${req.url} -> Pathname: ${path}`);

    // Normalise:
    path = path.replace(/^\/api(\/|$)/, "/"); // Remove /api prefix
    path = path.replace(/^\/+/, ""); // Remove leading slashes
    path = path.replace(/\/+$/, ""); // Remove trailing slashes

    console.log(`Router: Normalized Path: "${path}"`);

    if (urlObj.searchParams.get("debug") === "1") {
        return res.status(200).json({ pathname: urlObj.pathname, path });
    }

    // Dynamic import mapping
    // This allows us to route requests to the correct file in _handlers
    // without defining each one manually


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

        if (handlerPath) {
            const handlerModule = await import(handlerPath);
            if (handlerModule && handlerModule.default) {
                return await handlerModule.default(req, res);
            } else {
                return res.status(500).json({ error: 'Handler module missing default export' });
            }
        }

        return res.status(404).json({ error: 'Route not found in Monolith Router' });

    } catch (error) {
        console.error('Router Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}

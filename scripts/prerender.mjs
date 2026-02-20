import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');
const serverOutDir = path.resolve(__dirname, '../dist/server');

async function prerender() {
    console.log("Starting SSG Prerender...");

    // 1. Build the server bundle
    await build({
        build: {
            ssr: 'src/entry-server.jsx',
            outDir: 'dist/server',
            emptyOutDir: true
        },
        ssr: { noExternal: true }
    });

    // 2. Load the exported render function and seo object
    const serverPath = path.resolve(serverOutDir, 'entry-server.js');
    const { render, seo } = await import(serverPath);

    // 3. Read the client-built index.html as a template
    const templatePath = path.resolve(distPath, 'index.html');
    const template = fs.readFileSync(templatePath, 'utf-8');

    // Routes to prerender
    const routes = ['/', '/aides'];

    for (const url of routes) {
        try {
            console.log(`Prerendering ${url} ...`);

            // Render the app for this route
            const appHtml = await render(url);

            // Inject the rendered HTML
            let html = template.replace(
                '<div id="root"></div>',
                `<div id="root">${appHtml}</div>`
            );

            // Inject SEO Meta
            const routeSeo = seo[url] || {
                title: "AccesDirectAide",
                description: "Accéder à vos droits simplement."
            };

            html = html.replace(
                /<title>.*?<\/title>/,
                `<title>${routeSeo.title}</title>`
            );

            const descTag = `<meta name="description" content="${routeSeo.description}" />`;
            if (html.includes('<meta name="description"')) {
                html = html.replace(/<meta name="description" content=".*?"\s*\/?>/, descTag);
            } else {
                html = html.replace('</head>', `  ${descTag}\n</head>`);
            }

            // Determine output path
            const isHome = url === '/';
            const outputDir = isHome ? distPath : path.resolve(distPath, url.substring(1));

            if (!isHome) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const filePath = path.resolve(outputDir, 'index.html');
            fs.writeFileSync(filePath, html);
            console.log(`✓ Prerendered ${filePath}`);
        } catch (e) {
            console.error(`Error prerendering ${url}:`, e);
            process.exit(1);
        }
    }

    // 4. Cleanup the temporary server bundle
    fs.rmSync(serverOutDir, { recursive: true, force: true });
    console.log("SSG Prerender complete.");
}

prerender();

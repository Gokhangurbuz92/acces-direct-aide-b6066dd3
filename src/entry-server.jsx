import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'node:stream';
import App from './App.jsx';
export { seo } from './lib/seo.ts';

export function render(url) {
    return new Promise((resolve, reject) => {
        let html = '';
        const writable = new Writable({
            write(chunk, encoding, callback) {
                html += chunk;
                callback();
            }
        });

        const { pipe } = renderToPipeableStream(
            <React.StrictMode>
                <App url={url} />
            </React.StrictMode>,
            {
                onAllReady() {
                    pipe(writable);
                },
                onError(error) {
                    reject(error);
                }
            }
        );

        writable.on('finish', () => resolve(html));
    });
}

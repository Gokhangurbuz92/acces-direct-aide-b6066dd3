import { build } from 'vite';

async function run() {
    try {
        const { render } = await import('./dist/server/entry-server.js');
        console.log("RENDER IMPORT SUCCESS", typeof render);

        const homepage = await render('');
        console.log(homepage.substring(0, 150));
    } catch (e) {
        console.error("OVERALL ERR:", e);
    }
}
run();

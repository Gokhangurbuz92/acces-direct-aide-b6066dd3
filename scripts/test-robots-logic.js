
import handler from '../api/robots.js';

async function testRobots() {
    const req = {};
    const res = {
        headers: {},
        status(code) { this.statusCode = code; return this; },
        setHeader(name, value) { this.headers[name] = value; },
        send(text) { this.body = text; }
    };

    await handler(req, res);
    console.log('Robots Content:');
    console.log(res.body);

    if (res.body.includes('Disallow: /admin') && res.body.includes('Sitemap:')) {
        console.log('✅ Robots Logic OK');
    } else {
        console.error('❌ Robots Logic Fail');
        process.exit(1);
    }
}

testRobots();

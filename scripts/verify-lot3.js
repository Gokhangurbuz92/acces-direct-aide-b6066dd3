
// import fetch from 'node-fetch';
// Since we are in Node 20, fetch is global.
// We will use local server if running, BUT we might not have server running.
// We can use direct DB checks or mocked handlers.
// Lot 2 verification used direct handlers. Let's do that for API logic, simpler.

import aidesHandler from '../api/aides.js';
import demarchesHandler from '../api/demarches.js';
import structuresHandler from '../api/structures.js';
import sitemapHandler from '../api/sitemap.js';
import robotsHandler from '../api/robots.js';
import prisma from '../api/_utils/prisma.js';



// Mock Req/Res
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.jsonData = data;
        return res;
    };
    res.send = (data) => {
        res.textData = data;
        return res;
    };
    res.setHeader = () => { };
    res.end = () => { };
    return res;
};

async function verify() {
    console.log("🛡️ LOT 3 VERIFICATION 🛡️");

    // 1. Testing Search API (FTS coverage)...");

    // Aides
    const reqSearchA = { method: 'GET', query: { q: 'logement', limit: '5' }, headers: {} };
    const resSearchA = mockRes();
    await aidesHandler(reqSearchA, resSearchA);
    const countA = (resSearchA.jsonData || []).length;
    console.log(`   Aides 'logement': Found ${countA} results.`);
    if (resSearchA.statusCode !== 200 || !Array.isArray(resSearchA.jsonData)) {
        console.error("❌ Aides Search Failed:", resSearchA.jsonData || resSearchA.statusCode);
        process.exit(1);
    }


    // Demarches
    const reqSearchD = { method: 'GET', query: { q: 'logement', limit: '5' }, headers: {} };
    const resSearchD = mockRes();
    await demarchesHandler(reqSearchD, resSearchD);
    const countD = (resSearchD.jsonData || []).length;
    console.log(`   Demarches 'logement': Found ${countD} results.`);

    // Structures
    const reqSearchS = { method: 'GET', query: { q: 'logement', limit: '5' }, headers: {} };
    const resSearchS = mockRes();
    await structuresHandler(reqSearchS, resSearchS);
    const countS = (resSearchS.jsonData || []).length;
    console.log(`   Structures 'logement': Found ${countS} results.`);

    if (countA > 0 && countD > 0 && countS > 0) {
        console.log("✅ Search Coverage Verified (Aides, Demarches, Structures).");
    } else {
        console.error("❌ Search Coverage Incomplete (Ensure seed data exists).");
    }

    // 2. Slug Lookup
    console.log("\n2. Testing Slug Lookup...");
    // Find a slug first
    const anyAide = await prisma.aide.findFirst({ where: { statut: 'publie', slug: { not: null } } });
    if (anyAide && anyAide.slug) {
        const reqSlug = {
            method: 'GET',
            query: { slug: anyAide.slug },
            headers: {}
        };
        const resSlug = mockRes();
        await aidesHandler(reqSlug, resSlug);
        if (resSlug.statusCode === 200 && resSlug.jsonData.length > 0) {
            console.log(`✅ Slug Lookup '${anyAide.slug}': Success.`);
        } else {
            console.error(`❌ Slug Lookup Failed for ${anyAide.slug}`);
        }
    } else {
        console.warn("⚠️ No published aide with slug to test.");
    }

    // 3. Sitemap
    console.log("\n3. Testing Sitemap Generation...");
    const reqSitemap = { method: 'GET', headers: {} };
    const resSitemap = mockRes();
    await sitemapHandler(reqSitemap, resSitemap);

    if (resSitemap.statusCode === 200 && resSitemap.textData.includes('<urlset')) {
        console.log("✅ Sitemap XML generated.");
        if (resSitemap.textData.includes('/aide/')) {
            console.log("   Contains /aide/ URLs.");
        }
    } else {
        console.error("❌ Sitemap Generation Failed.");
    }

    console.log("\n4. Testing Robots.txt...");
    const reqRobots = { method: 'GET', headers: {} };
    const resRobots = mockRes();
    await robotsHandler(reqRobots, resRobots);
    if (resRobots.statusCode === 200 && resRobots.textData.includes('Disallow: /admin')) {
        console.log("✅ Robots.txt generated (Blocks admin).");
    } else {
        console.error("❌ Robots.txt Failed.");
    }

    console.log("\n✅ LOT 3 VERIFICATION COMPLETE.");
    await prisma.$disconnect();
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

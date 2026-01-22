
import http from 'http';

console.log("Setting up Turnkey Demo Data... (Target: localhost:3000)");

const req = http.request(
    {
        hostname: 'localhost',
        port: 3000,
        path: '/api/__dev/create-test-appointment',
        method: 'GET'
    },
    (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const json = JSON.parse(data);
                    console.log("\n✅ SUCCESS: Turnkey Data Ready");
                    console.log("\n---------------------------------------------------");
                    console.log("1. BENEFICIARY LINK (Open in Tab 1):");
                    console.log(`   ${json.beneficiaryUrl}`);
                    console.log("\n2. PRO LOGIN (Open in Tab 2):");
                    console.log(`   URL:      http://localhost:5173/pro/login`);
                    console.log(`   Email:    ${json.proEmail}`);
                    console.log(`   Password: ${json.proPassword}`);
                    console.log("---------------------------------------------------\n");
                    console.log("Instructions: Log in as Pro -> 'Mes rendez-vous' -> Select default appointment -> 'Messages' tab.");
                } catch (e) {
                    console.error("Invalid JSON:", data);
                }
            } else {
                console.error("Error:", res.statusCode, data);
                console.log("Hint: Ensure 'npm run dev' is running!");
            }
        });
    }
);

req.on('error', (e) => {
    console.error("Connection Error:", e.message);
    console.log("Hint: Ensure 'npm run dev' is running on port 3000.");
});

req.end();

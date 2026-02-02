import prisma from '../api/_utils/prisma.js';



const tests = [
    { name: 'Taxonomy Categories', model: 'aidCategory' },
    { name: 'Life Situations', model: 'lifeSituation' },
    { name: 'Published Aides', model: 'aide', where: { statut: 'publie' } },
    { name: 'Published Demarches', model: 'demarche', where: { statut: 'publie' } },
    { name: 'Active Structures', model: 'structure', where: { statut: 'actif' } },
];

async function main() {
    console.log('🔍 Verifying Content Population\n');
    console.log('='.repeat(60));

    const results = [];

    for (const test of tests) {
        const count = await prisma[test.model].count({ where: test.where || {} });
        const status = count > 0 ? '✅' : '❌';
        results.push({ ...test, count, status });
        console.log(`${status} ${test.name}: ${count}`);
    }

    console.log('='.repeat(60));

    // Expected minimums
    const expectations = {
        'Taxonomy Categories': 10,
        'Life Situations': 10,
        'Published Aides': 30,
        'Published Demarches': 30,
        'Active Structures': 10,
    };

    console.log('\n📊 Expectations vs Reality:\n');

    let allPassed = true;
    for (const result of results) {
        const expected = expectations[result.name] || 0;
        const passed = result.count >= expected;
        const emoji = passed ? '✅' : '⚠️';
        console.log(`${emoji} ${result.name}: ${result.count} / ${expected} (min)`);
        if (!passed) allPassed = false;
    }

    console.log('\n' + '='.repeat(60));

    if (allPassed) {
        console.log('\n🎉 All content population checks passed!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some checks did not meet expectations');
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error('\n❌ Verification failed:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

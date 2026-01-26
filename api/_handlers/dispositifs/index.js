import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
    const url = new URL(request.url);
    const departement = url.searchParams.get('departement');
    const publicCible = url.searchParams.get('public');

    const where = {
        statut: 'publie'
    };

    if (departement) {
        where.departement = departement;
    }

    if (publicCible) {
        where.public = {
            has: publicCible
        };
    }

    try {
        const dispositifs = await prisma.dispositif.findMany({
            where,
            orderBy: { titre: 'asc' }
        });

        return new Response(JSON.stringify(dispositifs), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch dispositifs' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

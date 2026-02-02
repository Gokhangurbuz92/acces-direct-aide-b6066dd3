
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import slugify from '@sindresorhus/slugify'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

async function main() {
    const jsonPath = path.join(__dirname, '../data/structures-alsace.json')
    const rawData = fs.readFileSync(jsonPath, 'utf-8')
    const structures = JSON.parse(rawData)

    console.log(`Doing import of ${structures.length} structures...`)

    for (const s of structures) {
        const slug = slugify(s.nom)

        // Create or Update map
        const data = {
            nom: s.nom,
            slug: slug,
            type_structure: s.type_structure,
            description_courte: s.description_courte,
            adresse: s.adresse,
            code_postal: s.code_postal,
            ville: s.ville,
            departement: s.departement,
            telephone: s.telephone,
            email: s.email,
            services: s.services || [],
            publics_accueillis: s.publics_accueillis || [],
            status: 'actif'
        }

        try {
            await prisma.structure.upsert({
                where: { slug: slug },
                update: data,
                create: data
            })
            console.log(`✅ Upserted: ${s.nom}`)
        } catch (e) {
            console.error(`❌ Error importing ${s.nom}:`, e)
        }
    }

    console.log('Import finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

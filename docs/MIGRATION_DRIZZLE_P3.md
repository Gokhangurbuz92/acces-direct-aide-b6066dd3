# Étude de Faisabilité : Migration vers Drizzle ORM (Phase P3)

## 1. Contexte et Problématique Actuelle (Le "Cold Start")

L'audit des dépendances de la Phase P2.2 a révélé que `@prisma/client` est le goulot d'étranglement majeur des temps de réponse Serverless (Vercel Cold Starts).
Prisma repose sur un moteur binaire (Rust Query Engine) qui pèse environ **15 Mo**. À chaque démarrage à froid d'une fonction Vercel (ce qui arrive fréquemment pour un trafic irrégulier), ce moteur doit être chargé en mémoire, ce qui ajoute **plusieurs centaines de millisecondes** au temps de réponse initial, dégradant l'UX et pénalisant les scores SEO (Core Web Vitals).

## 2. La Solution : Drizzle ORM

[Drizzle ORM](https://orm.drizzle.team) est un ORM TypeScript natif, "headless" et extrêmement léger.
Contrairement à Prisma, Drizzle n'utilise pas de Query Engine binaire. Il compile ses requêtes directement en SQL brut. Le package central pèse environ **~7.4 Ko**, ce qui rend les cold starts presque invisibles dans les environnements Edge/Serverless.

### Avantages de Drizzle ORM
1. **Poids minime (Zéro Query Engine)** : Démarrage quasi-instantané des fonctions Vercel.
2. **Performances brutes** : Exécution SQL plus prédictible, sans l'overhead de conversion Prisma.
3. **Compatibilité Edge** : Tourne nativement sur Vercel Edge Functions et Cloudflare Workers.
4. **SQL-like Syntax** : Proche du SQL, ce qui facilite les requêtes analytiques complexes (souvent laborieuses en Prisma).

## 3. Analyse de l'Implémentation Actuelle (Prisma)

Un diagnostic du code révèle une utilisation massive et avancée de Prisma sur le projet "Accès Direct Aide" :
- **Requêtes standards** : `findUnique`, `findFirst`, `findMany`, `create`, `update`, `upsert`.
- **Transactions** : Utilisation de `prisma.$transaction([])` pour garantir l'atomicité lors des écritures multi-tables (ex: inscription ProUser + Création de Structure).
- **Relations incluses** : Fort usage de l'opérateur `include` (ex: `include: { structure: true }`).
- **Raw queries (pgvector)** : Utilisation de `prisma.$queryRawUnsafe` pour la distance sémantique (similarité Cosinus) via pgvector dans le système RAG.

## 4. Stratégie de Migration (Phase P3)

La migration de Prisma vers Drizzle ne doit pas se faire brutalement. Elle requiert une approche progressive (Strangler Fig Pattern).

### Étape 1 : Co-habitation (Le Double Client)
1. Conserver le fichier `schema.prisma` et le client Prisma pour la gestion des migrations (Prisma Migrate) dans un premier temps. Drizzle peut lire des tables existantes sans gérer la structure.
2. Instancier `drizzle-orm/neon-http` dans le projet aux côtés de Prisma.
3. Créer le schéma Drizzle (`src/db/schema.ts`) qui reflète exactement les tables générées par Prisma.

### Étape 2 : Remplacement Chirurgical (Routes critiques d'abord)
Migrer en priorité les routes exposées au public (celles qui ont le plus besoin d'un temps de réponse rapide) :
- Les handlers `GET` pour la recherche d'aides (ex: recherche lexicale).
- L'ingestion IA (RAG) : Transformer le `$queryRawUnsafe` de Prisma en requête `sql` de Drizzle pour optimiser la logique vectorielle.
- Le diagnostic et les simulateurs.

La syntaxe Prisma :
```typescript
const user = await prisma.proUser.findFirst({ where: { email } });
```
Sera convertie en syntaxe Drizzle :
```typescript
const user = await db.select().from(proUsers).where(eq(proUsers.email, email)).limit(1);
```

### Étape 3 : Remplacement des Écritures et Transactions
Les routes d'authentification (`register`, `login`) et de prise de rendez-vous impliquent des transactions complexes.
```typescript
// Drizzle Transaction
await db.transaction(async (tx) => {
  const [structure] = await tx.insert(structures).values({...}).returning();
  await tx.insert(proUsers).values({ structureId: structure.id, ... });
});
```

### Étape 4 : Architecture Hybride P3 -> P4 (Le Compromis GAGNANT)
À la fin de la Phase P3, et face aux centaines de références résiduelles à Prisma dans les modules d'ingestion et d'administration, la stratégie a évolué vers une **architecture hybride** stable :
- **Drizzle** alimente les routes frontales et hautement concurrentielles (le "hot path").
- **Prisma** est conservé en arrière-plan (le "cold path" : CRONs, scripts d'ingestion lourds, requêtes analytiques).
L'ablation totale de Prisma devient ainsi l'objectif progressif et itératif de la **Phase P4**, permettant de sécuriser le produit en production.

## 5. Conclusion
Le passage partiel et chirurgical à Drizzle ORM avec Neon Database est un succès. Les routes critiques bénéficient désormais de temps de réponse drastiquement réduits sans l'overhead du Query Engine, tandis que le socle de données métier lourd (CRUD admin) n'a subi aucune régression. La Phase P3 est officiellement clôturée, pavant la voie à la Phase P4 ("Ablation Progressive").

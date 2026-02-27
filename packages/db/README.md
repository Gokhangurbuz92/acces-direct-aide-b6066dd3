# @ada/db

Client Prisma centralisé pour le monorepo Accès Direct Aide.

## Usage

```js
// Depuis packages/ ou nouveau code
import { prisma } from '@ada/db';

const aides = await prisma.aide.findMany({ where: { statut: 'publie' } });
```

## Note

Le code existant dans `api/` continue d'utiliser `api/_utils/prisma.js` (le singleton historique avec env loading avancé). Ce package est destiné au **nouveau code** dans `packages/`.

## Scripts

```bash
npm run db:generate -w @ada/db   # Générer le client Prisma
npm run db:studio -w @ada/db     # Ouvrir Prisma Studio
```

# 🧪 Guide des Tests E2E (Playwright)

Notre suite de tests End-to-End (E2E) utilise Playwright. Pour garantir une exécution ultra-rapide (moins d'une minute pour +130 tests) et une fiabilité à 100 % (zéro *flaky test*), nous utilisons une architecture basée sur l'interception et le mock des requêtes API.

Ce guide détaille comment lancer les tests et les bonnes pratiques pour en écrire de nouveaux.

## 🚀 Comment lancer les tests

Pour lancer les tests localement sans dépendre d'une base de données locale ou d'API externes, utilisez la variable d'environnement `USE_MOCKS=true`.

```bash
# Lancer toute la suite de tests en mode "headless" (rapide)
USE_MOCKS=true npx playwright test

# Lancer un fichier spécifique
USE_MOCKS=true npx playwright test e2e/mon-test.spec.js

# Lancer les tests avec l'interface graphique Playwright (idéal pour le debug)
USE_MOCKS=true npx playwright test --ui
```

> [!NOTE]
> Si vous lancez `npx playwright test` sans `USE_MOCKS`, les tests tenteront de taper sur la véritable base de données locale.

### Mode Intégration (Neon Branch)

Pour exécuter les tests E2E contre une **vraie base de données Neon** (branche éphémère), utilisez le projet `integration` avec l'URL de prévisualisation Vercel :

```bash
# Cibler une preview Vercel (la DB Neon branch est auto-injectée)
PLAYWRIGHT_BASE_URL=https://my-pr-123.vercel.app npx playwright test --project=integration

# En CI (GitHub Actions), PLAYWRIGHT_BASE_URL est injecté automatiquement par Vercel
npx playwright test --project=integration
```

> [!IMPORTANT]
> Le projet `integration` exécute un sous-ensemble de tests (smoke, vital-paths, aides-flow, booking) sans mocks. Les mocks ne sont PAS chargés car `USE_MOCKS` n'est pas défini.

## 🏗️ Architecture des Mocks

### 1. Mocks Globaux (`e2e/_mocks/publicApiMocks.js`)

Tous les mocks standards (Aides, Démarches, Structures, Actualités) sont définis dans ce fichier. Ils sont automatiquement injectés avant chaque test si `USE_MOCKS=true`.
C'est ce qui permet aux tests de navigation basiques de fonctionner sans configuration supplémentaire.

### 2. Surcharger un Mock (Test-level overrides)

Si un test nécessite un état spécifique (ex: une erreur 500, une liste vide, ou des données très particulières), vous pouvez écraser le mock global directement dans votre test :

```javascript
test('Affiche un état vide si aucun résultat', async ({ page }) => {
  if (process.env.USE_MOCKS === 'true') {
    // Écrase le mock global spécifiquement pour ce test
    await page.route('**/api/aides**', route => route.fulfill({
      json: { items: [], pagination: { total: 0 } }
    }));
  }
  await page.goto('/aides?q=introuvable');
  await expect(page.getByTestId('empty-state')).toBeVisible();
});
```

### 3. Désactiver un Mock (`page.unroute()`)

Si vous avez besoin d'annuler une interception réseau spécifique mise en place par le mock global, utilisez `await page.unroute('**/api/mon-endpoint**')`.

```javascript
test('Pagination & Refresh', async ({ page }) => {
  // Retirer le mock global pour les aides
  await page.unroute('**/api/aides*');

  // Mettre en place un mock dynamique qui s'adapte au paramètre "page"
  await page.route('**/api/aides*', async route => {
    const url = new URL(route.request().url());
    const pageNum = url.searchParams.get('page') || '1';
    const items = Array.from({ length: 12 }).map((_, i) => ({
      id: `${i}`, titre: `Aide ${i}`, slug: `aide-${i}`
    }));
    await route.fulfill({
      json: {
        items,
        pagination: { total: 24, page: parseInt(pageNum), totalPages: 2, hasNext: parseInt(pageNum) < 2 }
      }
    });
  });

  await page.goto('/aides?q=a');
  // ...
});
```

> [!IMPORTANT]
> Playwright applique les routes en mode **LIFO** (Last-In First-Out) : la dernière route enregistrée est testée en premier. Pour être sûr que votre mock de test est bien prioritaire, vous pouvez appeler `page.unroute()` avant de créer votre route.

## ✅ Bonnes Pratiques & Patterns

### 1. Attentes basées sur le contenu (Content-based waits)

**NE JAMAIS UTILISER** `page.waitForResponse()` avec des mocks synchrones. Les requêtes mockées répondent instantanément, souvent avant même que Playwright n'ait eu le temps de commencer à « attendre », ce qui provoque un timeout.

**UTILISER** l'attente d'un élément dans le DOM :

```javascript
// ❌ MAUVAIS — Risque de timeout avec les mocks synchrones !
await page.click('button');
await page.waitForResponse('**/api/aides');

// ✅ BON — Attendre le résultat visible dans le DOM
await page.click('button');
await expect(page.locator('text=Résultat attendu')).toBeVisible();
```

### 2. Format des URL dans les Mocks (Path vs Query Params)

Soyez attentifs à la façon dont le frontend appelle l'API :

| Cas d'usage | Format URL côté frontend | Glob pour le mock |
|---|---|---|
| **Liste / Recherche** | `/api/aides?q=foo&page=1` | `**/api/aides*` |
| **Détail (hooks)** | `/api/aides/mon-slug` | `**/api/aides/mon-slug` |
| **Filtre (client.filter)** | `/api/structures?slug=xyz` | `**/api/structures*` |

> [!WARNING]
> Si votre test de détail échoue (h1 non visible, données manquantes), c'est souvent un décalage entre le format URL du mock (query param) et l'appel réel du hook (path param). Vérifiez toujours le hook source (`useAideDetail`, `getAideBySlug`, etc.).

**Réponse attendue :**
- Les **hooks de détail** (`getAideBySlug`) attendent un **objet unique** : `{ id, slug, titre, ... }`
- Les **appels de liste** attendent un **objet paginé** : `{ items: [...], pagination: { total, page, hasNext } }`

### 3. Clics bloqués par le CSS (Z-index / Overlays)

Certains composants (comme `StructureCard`) utilisent un overlay `<Link>` pour rendre la carte entière cliquable, combiné à des éléments de contact en `z-20`. Si Playwright refuse de cliquer car un autre élément intercepte le pointeur :

```javascript
// ❌ Peut échouer même avec force:true à cause des z-index
await page.getByTestId('structure-card').first().click({ force: true });

// ✅ Solution robuste : déclencher le clic via evaluate
await page.evaluate(() => {
  const card = document.querySelector('[data-testid="structure-card"]');
  const link = card?.querySelector('a');
  if (link) link.click();
});
```

### 4. Locateurs multiples (Strict Mode)

Helmet / react-helmet injecte des balises `<link>` et `<script>` qui peuvent dupliquer celles du HTML statique. Utilisez `.last()` pour cibler l'élément injecté dynamiquement :

```javascript
// ❌ Strict mode violation — plusieurs <link rel="canonical"> existent
const canonical = page.locator('link[rel="canonical"]');

// ✅ Cibler le dernier (celui injecté par Helmet)
const canonical = page.locator('link[rel="canonical"]').last();
```

### 5. Pagination (`hasNext`)

Le composant de pagination d'Aides utilise `pagination.hasNext` pour activer/désactiver le bouton « Suivant ». Assurez-vous que vos mocks incluent ce champ :

```javascript
pagination: {
  total: 24,
  page: 1,
  totalPages: 2,
  hasNext: true  // ← Indispensable pour activer "Suivant"
}
```

## 📏 Conventions

- **Nommage** : Nommez clairement vos tests avec l'action utilisateur attendue
- **Données de test** : Utilisez des slugs explicites dans vos mocks (`aide-seo-test`, `structure-test`) pour faciliter le debug
- **Sélecteurs** : Privilégiez les sélecteurs axés sur l'accessibilité (`getByRole`, `getByLabel`) ou nos identifiants de test (`getByTestId`) plutôt que des sélecteurs CSS fragiles (`.card > div > h3`)
- **Timeouts** : Ajoutez un `timeout` explicite aux assertions critiques (ex: `{ timeout: 10000 }`) pour les éléments qui dépendent d'un rendu asynchrone

## 📂 Structure des fichiers

```
e2e/
├── _mocks/
│   └── publicApiMocks.js    # Mocks globaux (Aides, Structures, Démarches, etc.)
├── fixtures.js               # Fixture Playwright — injection auto des mocks si USE_MOCKS=true
├── seo.spec.js               # Tests SEO (meta, canonical, schema.org)
├── seo-aides.spec.js         # Tests SEO spécifiques aux pages Aides
├── seo-errors.spec.js        # Tests SEO pour les pages 404/410
├── smoke-public.spec.js      # Smoke tests navigation publique
├── smoke-home.spec.js        # Smoke test page d'accueil (anti écran blanc)
├── search.spec.js            # Tests de recherche et pagination
├── diagnostic-flow.spec.js   # Tests du parcours diagnostic
├── vital-paths.spec.js       # Tests des parcours critiques
└── ...
```

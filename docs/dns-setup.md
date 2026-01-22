# Configuration du Domaine Production

## 1. Variables d'Environnement Vercel

Ajouter les variables suivantes dans le projet Vercel (Settings > Environment Variables) :

- `SITE_URL` = `https://accesdirectaide.fr`
- `VITE_SITE_URL` = `https://accesdirectaide.fr`
- `NEXT_PUBLIC_SITE_URL` = `https://accesdirectaide.fr`

Redéployer le projet pour que ces changements prennent effet (cocher "Redeploy existing build" si possible ou push un commit vide).

## 2. Configuration DNS (GoDaddy)

Se connecter à GoDaddy et aller dans la gestion DNS pour `accesdirectaide.fr`.

**Enregistrements à créer/modifier :**

| Type  | Nom   | Valeur                  | TTL     |
|-------|-------|-------------------------|---------|
| CNAME | `www` | `cname.vercel-dns.com` (ou la valeur spécifique donnée par Vercel) | 1 Heure |
| A     | `@`   | `76.76.21.21` (ou `216.198.79.1` si recommandé par Vercel) | 1 Heure |

*Note: Vercel recommande parfois une IP spécifique (ex: `216.198.79.1`). Si c'est le cas dans le tableau de bord Vercel (Settings > Domains), utilisez **cette IP spécifique** à la place de `76.76.21.21`.*

## 3. Configuration Vercel Domains

Dans Vercel > Settings > Domains :

1. Ajouter `accesdirectaide.fr` (Domaine racine)
   - Tapez `accesdirectaide.fr` dans le champ "Add a Domain".
   - Vercel proposera automatiquement de le rediriger vers `www.accesdirectaide.fr` (Recommended). Acceptez cette redirection (Status 308).
   - Chez GoDaddy: Assurez-vous d'avoir l'enregistrement A vers `76.76.21.21`.

2. Ajouter `www.accesdirectaide.fr`
   - C'est votre domaine principal (Production).
   - Chez GoDaddy: CNAME vers `1d26...vercel-dns.com` (ou `cname.vercel-dns.com`).

## 4. Domaines supplémentaires (.com, .org)

Si vous possédez aussi les extensions `.com` et `.org`, c'est une excellente pratique de les rediriger vers le `.fr`.

**Dans Vercel :**
1. Ajouter `accesdirectaide.com` et `www.accesdirectaide.com`.
2. Pour chacun, cliquez sur "Edit" et choisissez **Redirect to** -> `www.accesdirectaide.fr`.
3. Répétez pour le `.org`.

**Dans GoDaddy (pour .com et .org) :**
- Configurez exactement **les mêmes enregistrements DNS** que pour le `.fr` :
  - **A** `@` -> `76.76.21.21`
  - **CNAME** `www` -> `cname.vercel-dns.com`

## 4. Vérification

Après propagation (peut prendre jusqu'à 48h, souvent < 1h) :
- Accéder à `https://accesdirectaide.fr` -> Doit afficher le site.
- Accéder à `https://www.accesdirectaide.fr` -> Doit rediriger vers le sans-www.
- Vérifier le cadenas SSL (Vercel génère le certificat automatiquement).

# Contrat d'Interface API

Ce document définit le format standard des échanges avec l'API REST `AccesDirectAide`.

## 1. Format de Réponse (JSON)

Toutes les réponses de l'API suivent une structure JSON unifiée.

### Succès (2xx)

```json
{
  "data": { ... },       // L'objet ou le tableau de résultats
  "meta": {              // (Optionnel) Métadonnées
    "total": 100,        // Nombre total d'éléments (pagination)
    "page": 1,           // Page courante
    "requestId": "req_123" // Identifiant de traçabilité
  }
}
```

### Erreur (4xx, 5xx)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",  // Code machine stable
    "message": "Le champ email est invalide.", // Message lisible (pour dev ou user)
    "details": [ ... ]           // (Optionnel) Détails des champs en erreur
  }
}
```

## 2. Codes HTTP Standards

| Code | Signification | Usage |
| :--- | :--- | :--- |
| `200` | OK | Succès (lecture, modification). |
| `201` | Created | Création réussie (avec `Location` header si possible). |
| `204` | No Content | Suppression réussie ou action sans retour. |
| `400` | Bad Request | Erreur de validation, paramètres manquants. |
| `401` | Unauthorized | Token manquant ou invalide. |
| `403` | Forbidden | Token valide mais droits insuffisants. |
| `404` | Not Found | Ressource introuvable. |
| `409` | Conflict | Doublon (ex: créneau déjà pris, email déjà utilisé). |
| `429` | Too Many Requests | Rate limit dépassé. |
| `500` | Internal Server Error | Bug serveur non géré. |

## 3. Pagination

Pour les listes (ex: `/api/aides`, `/api/structures`), la pagination se fait via query params :

- `?page=1` (défaut)
- `?limit=20` (défaut, max 100)

La réponse inclut `meta.total` pour calculer le nombre de pages.

## 4. Authentification

L'API utilise le header `Authorization` :

- **Public** : Pas de header.
- **Pro** : `Bearer <JWT>` (Token obtenu via `/api/pro/auth/login`).
- **Admin** : `Bearer <ADMIN_TOKEN>` (Token statique défini côté serveur).

## 5. Headers Spécifiques

- `X-Request-Id` : Identifiant unique de la requête (retourné dans la réponse).
- `X-App-Version` : Version de l'application (optionnel).

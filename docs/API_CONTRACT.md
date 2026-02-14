# API Contract

L'API AccesDirectAide suit une structure de réponse standardisée pour garantir la prévisibilité côté client.
Tous les endpoints JSON (hors fichiers binaires) respectent ce format.

## Format de Réponse (Enveloppe)

Chaque réponse HTTP 200 (OK) contient une enveloppe JSON :

```json
{
  "data": <Any> | <Array>,
  "meta": {
    "requestId": "string (UUID)",
    "pagination": {             // Présent si liste paginée
      "page": 1,
      "limit": 10,
      "totalItems": 100,
      "totalPages": 10
    }
  },
  "error": null
}
```

### Cas particulier : Listes paginées
Si le handler renvoie un objet `{ items: [...], pagination: {...} }`, l'enveloppe place `items` dans `data` et `pagination` dans `meta.pagination`.

## Gestion des Erreurs

En cas d'erreur (4xx, 5xx), le corps de la réponse suit le même format, mais `data` est null et `error` est peuplé.

```json
{
  "data": null,
  "meta": {
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  },
  "error": {
    "code": "VALIDATION_ERROR", // Code machine (enum)
    "message": "Le champ email est invalide.", // Message humain
    "details": [ ... ] // Détails optionnels (ex: champs Zod en erreur)
  }
}
```

### Codes HTTP Standards

| Code | Signification | Contexte |
|---|---|---|
| **200** | OK | Succès standard (GET, POST, PUT, DELETE). |
| **201** | Created | Ressource créée (souvent retournée dans `data`). |
| **204** | No Content | Succès sans contenu (rarement utilisé, on préfère 200 avec data null). |
| **400** | Bad Request | Validation échouée (Zod), paramètres manquants. |
| **401** | Unauthorized | Token manquant ou invalide. |
| **403** | Forbidden | Token valide mais permissions insuffisantes (ex: Pro vs Admin). |
| **404** | Not Found | Ressource non trouvée. |
| **409** | Conflict | Ressource déjà existante (ex: email unique) ou double booking. |
| **429** | Too Many Requests | Rate limit dépassé. |
| **500** | Internal Server Error | Bug serveur non géré. |

## Headers Standards

- `X-Request-ID`: Identifiant unique de la requête (pour traçabilité logs/Sentry).
- `Authorization`: `Bearer <token>` pour les routes authentifiées.

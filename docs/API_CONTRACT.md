# Contrat d'Interface API

Toutes les réponses de l'API (`/api/*`) suivent un format JSON standardisé.

## Format de Réponse

Chaque réponse API est un objet JSON avec la structure suivante :

```json
{
  "data": <any | null>,
  "meta": {
    "requestId": "req_123456",
    "pagination": <PaginationObject | undefined>
  },
  "error": <ErrorObject | null>
}
```

### Champs

- **`data`** : Le résultat de l'opération. Peut être un objet, un tableau ou null. Présent en cas de succès.
- **`meta`** : Métadonnées sur la requête.
  - `requestId` : Identifiant unique de la requête (pour traçabilité/debug).
  - `pagination` : (Optionnel) Détails de pagination pour les listes.
- **`error`** : Détails de l'erreur. Présent uniquement si la requête a échoué.

### Objet Pagination

Si la réponse est une liste d'éléments, `meta.pagination` contiendra :

```json
{
  "page": 1,            // Numéro de page actuel
  "pageSize": 20,       // Éléments par page
  "total": 100,         // Nombre total d'éléments
  "totalPages": 5       // Nombre total de pages
}
```

### Objet Erreur

```json
{
  "code": "RESOURCE_NOT_FOUND", // Code d'erreur machine
  "message": "Ressource introuvable", // Message lisible pour l'humain
  "details": null        // (Optionnel) Détails de validation
}
```

## Codes HTTP Standards

- **200 OK** : Succès.
- **201 Created** : Création réussie.
- **204 No Content** : Succès sans contenu.
- **400 Bad Request** : Erreur de validation ou format invalide.
- **401 Unauthorized** : Token manquant ou invalide.
- **403 Forbidden** : Droits insuffisants.
- **404 Not Found** : Ressource introuvable.
- **409 Conflict** : Conflit d'état.
- **429 Too Many Requests** : Rate limit dépassé.
- **500 Internal Server Error** : Erreur serveur.

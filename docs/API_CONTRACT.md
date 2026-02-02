# Contrat d'Interface API

Toutes les réponses de l'API (`/api/*`) suivent un format JSON standardisé.

## Format de Réponse

### Succès (200 OK)

```json
{
  "data": {
    // Objet ou tableau de résultats
    "id": "123",
    "nom": "Exemple"
  },
  "meta": {
    // Métadonnées optionnelles (pagination, version)
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20
    }
  },
  "error": null
}
```

### Erreur (4xx, 5xx)

```json
{
  "data": null,
  "meta": null,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "La ressource demandée n'existe pas.",
    "details": null // Optionnel: détails de validation
  }
}
```

## Codes HTTP Standards

- **200 OK** : Succès.
- **201 Created** : Ressource créée.
- **204 No Content** : Succès sans contenu (ex: suppression).
- **400 Bad Request** : Erreur de validation ou format invalide.
- **401 Unauthorized** : Token manquant ou invalide.
- **403 Forbidden** : Droits insuffisants (ex: Pro essayant d'accéder à Admin).
- **404 Not Found** : Ressource introuvable.
- **409 Conflict** : Conflit d'état (ex: double réservation).
- **429 Too Many Requests** : Rate limit dépassé.
- **500 Internal Server Error** : Bug serveur non géré.

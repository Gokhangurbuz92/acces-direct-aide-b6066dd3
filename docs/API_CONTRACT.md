# Contrat d'Interface API

## Format de Réponse Standard

Toutes les réponses de l'API suivent (autant que possible) le format standard JSON suivant :

```json
{
  "data": { ... },       // Données demandées (objet ou tableau)
  "meta": {              // Métadonnées (pagination, version, etc.)
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20
    }
  },
  "error": null          // Présent uniquement en cas d'erreur
}
```

## Gestion des Erreurs

En cas d'erreur, le code HTTP indique le type d'erreur, et le corps JSON contient les détails :

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le champ email est invalide.",
    "details": { "email": "Format incorrect" }
  }
}
```

### Codes HTTP Communs

- `200 OK`: Succès.
- `400 Bad Request`: Erreur de validation ou paramètres manquants.
- `401 Unauthorized`: Token manquant ou invalide.
- `403 Forbidden`: Droits insuffisants (ex: accès Admin requis).
- `404 Not Found`: Ressource introuvable.
- `429 Too Many Requests`: Rate limit dépassé.
- `500 Internal Server Error`: Erreur inattendue côté serveur.

## Pagination

Les endpoints de liste acceptent généralement les paramètres `page` (défaut: 1) et `limit` (défaut: 10).
Les informations de pagination sont renvoyées dans `meta.pagination`.

## Authentification

L'API utilise des en-têtes Authorization Bearer pour les routes protégées :
`Authorization: Bearer <token>`

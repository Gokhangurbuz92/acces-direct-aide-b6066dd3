# Contrat d'Interface API

Ce document décrit le format standard des réponses et erreurs de l'API AccesDirectAide.

## 1. Format de Réponse Standard (JSON)
Toutes les réponses API réussies (200-299) suivent ce format, sauf exception (ex: binaire).

```json
{
  "data": { ... },       // Objet ou Tableau de données
  "meta": {              // Métadonnées optionnelles
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20
    },
    "requestId": "req_123..."
  }
}
```

## 2. Gestion des Erreurs
Les erreurs renvoient un code HTTP approprié (4xx, 5xx) et un corps JSON standard.

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "La ressource demandée n'existe pas.",
    "details": { ... } // Optionnel
  }
}
```

### Codes HTTP Courants
- `200 OK` : Succès.
- `400 Bad Request` : Erreur de validation (paramètres manquants ou invalides).
- `401 Unauthorized` : Token manquant ou invalide.
- `403 Forbidden` : Token valide mais permissions insuffisantes (ex: Pro accédant à Admin).
- `404 Not Found` : Ressource introuvable.
- `409 Conflict` : Conflit de données (ex: double réservation).
- `429 Too Many Requests` : Rate limit dépassé.
- `500 Internal Server Error` : Erreur serveur inattendue.

## 3. Headers
- `Authorization`: `Bearer <token>` (JWT pour Pro, Token statique pour Admin).
- `Content-Type`: `application/json` (Requis pour POST/PUT).
- `X-Request-ID`: Identifiant unique de requête (utile pour le debugging).

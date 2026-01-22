# Sources des Données

AccesDirectAide centralise les informations provenant de plusieurs sources officielles pour garantir la fiabilité et la mise à jour des contenus.

## 1. Sources Automatisées (Flux RSS & API)

Les actualités et certaines démarches sont récupérées automatiquement toutes les 12 heures via nos tâches planifiées (`api/cron`).

- **Service-Public.fr** : Source principale pour les droits et démarches nationales.
- **CAF (Caisse d'Allocations Familiales)** : Actualités sur les aides sociales.
- **Ministères Sociaux** : Informations officielles du gouvernement.
- **Aides-Territoires** : Base de données des aides locales.

### Traitement des Données
Chaque contenu importé suit un processus rigoureux :
1. **Ingestion** : Récupération du flux.
2. **Filtrage** : Vérification du domaine (liste blanche).
3. **Déduplication** : Vérification si le contenu existe déjà.
4. **Simplification FALC** : Un module d'intelligence artificielle génère un résumé Facile à Lire et à Comprendre.
5. **Validation** : Le contenu est enregistré en "Brouillon" ou "En Revue" pour validation humaine.

## 2. Données Locales (Alsace)

Nous avons intégré des données spécifiques pour le territoire alsacien :
- **Annuaire des Structures** : CCAS, Maisons de l'Autonomie (MDPH), Points d'accueil.
- **Dispositifs Territoriaux** : Aides spécifiques de la Collectivité européenne d'Alsace (CeA).

## 3. Contribution Manuelle

Les professionnels et administrateurs peuvent enrichir la base de données via le back-office sécurisé, notamment pour les guides de bonnes pratiques et les outils de la boîte à outils.

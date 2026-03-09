# Guide d'utilisation : Vercel Analytics

Ce guide explique comment lire et interpréter les métriques de **Vercel Analytics** mises en place sur le projet AccesDirectAide, en particulier pour analyser l'impact et la rétention des citoyens dans le parcours (funnel).

## 1. Accéder au Dashboard

1. Connectez-vous à votre compte sur [Vercel](https://vercel.com).
2. Sélectionnez le projet **AccesDirectAide**.
3. Allez dans l'onglet **Analytics**. S'il s'agit de **Web Analytics**, vous verrez les visiteurs uniques, pages vues, référents, etc.
4. Allez dans l'onglet **Events** (si activé sur votre plan) pour voir les événements personnalisés. Vous pouvez également filter et créer des entonnoirs (funnels) avec ces événements.

## 2. Événements de suivi implantés (Custom Events)

Voici la liste des événements côté client implémentés dans l'application pour suivre le comportement citoyen :

### Recherche & Découverte
- **`search_aides`** : Se déclenche quand un utilisateur valide une recherche par mot-clé sur la page des aides.
  - *Attribut* : `query` (le terme recherché).
- **`filter_aides`** : Se déclenche quand un utilisateur modifie les filtres ou la pagination.
  - *Attribut* : paramètre filtré simulé pour comprendre quelle facette l'utilisateur recherche.
- **`view_aide_detail`** : Se déclenche lorsqu'un utilisateur consulte le détail complet d'une aide.
  - *Attribut* : `aideId` (ID ou slug de l'aide).

### Inclusion
- **`generate_falc`** : Se déclenche lorsqu'un utilisateur clique sur le bouton de traduction en **FALC (Facile À Lire et à Comprendre)** via le Copilote IA. Mesure l'utilité réelle de la fonctionnalité IA inclusive.

### Conversion / Action (Funnel)
- **`click_request_aide`** : Au clic sur le bouton "Faire ma demande" (pour rediriger vers l'URL externe d'une démarche). Mesure le passage à l'action.
  - *Attribut* : `aideId`
- **`download_aide_pdf`** : Au clic sur l'icône de téléchargement PDF. Montre une intention de conserver l'information hors ligne.

### Prise de Rendez-vous (Booking)
- **`start_booking_flow`** : Le citoyen ouvre le calendrier pour une structure donnée.
  - *Attribut* : `structure`
- **`booking_select_service`** : Le citoyen sélectionne un motif de rendez-vous.
  - *Attributs* : `structure`, `service`
- **`booking_confirm_success`** : Validation et création réussie du rendez-vous. C'est l'objectif final du funnel.
  - *Attributs* : `structure`, `mode` (vidéo, téléphone, physique)

## 3. Comment interpréter l'entonnoir (Funnel) de Conversion ?

L'analyse de l'entonnoir permet d'identifier à quel moment les citoyens abandonnent leur démarche. Créez un rapport de type "Funnel" dans Vercel en sélectionnant successivement ces événements :

**Exemple de Funnel de réservation :**
1. **`search_aides`** / Page Views (Découverte)
2. **`view_aide_detail`** (Intérêt)
3. **`start_booking_flow`** (Intention d'accompagnement)
4. **`booking_confirm_success`** (Conversion)

### Métriques d'Impact (KPIs Sociaux)
- **Taux d'Inclusion IA** : Ratio entre `generate_falc` et `view_aide_detail`. Si ce taux est bas, le bouton FALC n'est pas assez visible ou l'information de base est déjà très claire. S'il est très haut, vos fiches d'aides classiques sont probablement trop complexes.
- **Taux d'Abandon RDV** : Ratio entre `start_booking_flow` et `booking_confirm_success`. Un taux d'abandon élevé ici pourrait indiquer un manque de créneaux disponibles ou une interface trop complexe (bien que nous l'ayons allégée).
- **Rétention hors ligne** : Le nombre d'événements `download_aide_pdf`. Utile pour prouver que les travailleurs sociaux ou les citoyens impriment les documents, justifiant les efforts d'optimisation de l'impression PDF.

## 4. Bonnes pratiques et Limites
- Les bloqueurs de publicités (ex. uBlock Origin) peuvent empêcher le déclenchement de ces événements. Vos chiffres seront potentiellement en deçà de la réalité (jusqu'à -20%).
- Vos événements personnalisés n'enregistrent pas de PII (Personally Identifiable Information). L'IP est anonymisée par Vercel. Tout est conforme au RGPD sans nécessiter de bannière de cookies bloquante.

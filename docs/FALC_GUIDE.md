# Guide FALC (Facile à Lire et à Comprendre)

## Qu'est-ce que le FALC ?

Le FALC (Facile à Lire et à Comprendre) est une méthode d'écriture qui rend l'information accessible à tous, notamment aux personnes en situation de handicap intellectuel ou ayant des difficultés de lecture.

## Principes du FALC

### 1. Phrases courtes et simples
- ✅ Une idée par phrase
- ✅ Phrases de 15-20 mots maximum
- ❌ Éviter les phrases complexes avec plusieurs propositions

**Exemple:**
- ❌ "Cette aide, qui est destinée aux personnes en situation de précarité et qui ont des difficultés financières, peut être demandée auprès de la CAF."
- ✅ "Cette aide est pour les personnes qui ont peu d'argent. Vous pouvez la demander à la CAF."

### 2. Vocabulaire simple
- ✅ Utiliser des mots courants
- ✅ Expliquer les mots techniques
- ❌ Éviter le jargon administratif

**Exemple:**
- ❌ "Bénéficiaire", "Allocataire", "Ayant droit"
- ✅ "Personne qui reçoit l'aide"

### 3. Structure claire
- ✅ Titres et sous-titres explicites
- ✅ Listes à puces
- ✅ Espaces aérés
- ❌ Blocs de texte denses

### 4. Informations concrètes
- ✅ Exemples pratiques
- ✅ Étapes numérotées
- ✅ Informations utiles (montants, délais)
- ❌ Informations abstraites ou théoriques

### 5. Mise en page
- ✅ Police sans serif (Arial, Verdana)
- ✅ Taille de police 14pt minimum
- ✅ Interligne 1.5
- ✅ Contraste élevé (texte noir sur fond blanc)
- ✅ Alignement à gauche
- ❌ Justification

### 6. Illustrations (optionnel)
- ✅ Pictogrammes simples
- ✅ Images explicatives
- ❌ Images décoratives sans lien avec le texte

## Implémentation dans AccesDirectAide

### Champs FALC dans la base de données

Tous les modèles de contenu ont des champs FALC:
- `summary_falc`: Résumé en FALC
- `conditions_falc`: Conditions d'éligibilité en FALC
- `montant_falc`: Montant de l'aide en FALC

### Mode FALC dans l'interface

L'utilisateur peut activer le "Mode Facile à lire" via un toggle dans l'interface:
- Affiche les versions FALC des contenus
- Applique une mise en page adaptée (police plus grande, espacement)
- Simplifie la navigation

### Rédaction de contenu FALC

#### Pour une aide sociale

**Titre:** Court et explicite
- ✅ "Aide pour payer le loyer"
- ❌ "Allocation de logement à caractère social"

**Résumé (summary_falc):**
```
Cette aide vous aide à payer votre loyer.
Elle est pour les personnes qui ont peu d'argent.
Vous pouvez la demander à la CAF.
```

**Conditions (conditions_falc):**
```
Pour avoir cette aide, vous devez:
1. Payer un loyer
2. Avoir peu d'argent
3. Habiter en France
```

**Montant (montant_falc):**
```
Le montant dépend de votre situation.
Il peut aller de 50€ à 300€ par mois.
```

#### Pour une démarche administrative

**Titre:** Action claire
- ✅ "Demander une carte d'identité"
- ❌ "Procédure de renouvellement de titre d'identité"

**Étapes:**
```
1. Prenez rendez-vous à la mairie
2. Apportez ces documents:
   - Une photo d'identité
   - Un justificatif de domicile
   - Votre ancienne carte (si vous en avez une)
3. Payez 25€
4. Attendez 3 semaines
5. Récupérez votre carte à la mairie
```

## Checklist de validation FALC

Avant de publier un contenu FALC, vérifiez:

- [ ] Phrases courtes (15-20 mots max)
- [ ] Vocabulaire simple (pas de jargon)
- [ ] Une idée par phrase
- [ ] Structure claire (titres, listes)
- [ ] Informations concrètes (montants, délais, étapes)
- [ ] Exemples pratiques
- [ ] Mise en page aérée
- [ ] Contraste suffisant
- [ ] Police lisible

## Ressources

- [Règles européennes FALC](https://www.inclusion-europe.eu/easy-to-read/)
- [Guide FALC de l'UNAPEI](https://www.unapei.org/publication/le-facile-a-lire-et-a-comprendre/)
- [Référentiel FALC de Santé BD](https://santebd.org/falc)

## Exemples de contenu FALC

### Exemple 1: Aide au logement

**Version standard:**
"L'allocation de logement à caractère social (ALS) est une aide financière destinée à réduire le montant de votre loyer ou de votre mensualité d'emprunt immobilier. Elle est attribuée sous conditions de ressources."

**Version FALC:**
```
Aide pour payer le loyer

Cette aide vous aide à payer votre loyer chaque mois.
Elle est pour les personnes qui ont peu d'argent.

Pour avoir cette aide:
- Vous devez payer un loyer
- Vous devez avoir peu d'argent
- Vous devez habiter en France

Le montant dépend de votre situation.
Vous pouvez demander cette aide à la CAF.
```

### Exemple 2: Démarche carte d'identité

**Version standard:**
"La demande de carte nationale d'identité s'effectue auprès de la mairie de votre domicile ou d'une mairie équipée d'un dispositif de recueil. Un timbre fiscal de 25€ est requis en cas de renouvellement hors délai réglementaire."

**Version FALC:**
```
Demander une carte d'identité

Où aller:
Allez à la mairie de votre ville.

Quoi apporter:
1. Une photo d'identité récente
2. Un justificatif de domicile (facture d'électricité ou de téléphone)
3. Votre ancienne carte d'identité (si vous en avez une)

Combien ça coûte:
- Gratuit si votre carte est perdue ou volée
- 25€ si vous avez oublié de la renouveler à temps

Combien de temps:
Vous recevrez votre carte en 3 semaines environ.
```

## Maintenance

- Réviser régulièrement les contenus FALC
- Tester avec des utilisateurs en situation de handicap
- Former les rédacteurs aux principes FALC
- Utiliser des outils de lisibilité (score Flesch-Kincaid)

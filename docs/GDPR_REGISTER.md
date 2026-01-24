# Registre des Activités de Traitement (Simplifié)

## 1. Responsable du Traitement
**AccesDirectAide**
Contact DPO/Responsable : Via le formulaire de contact ou `securite@accesdirectaide.fr` (si existant)

## 2. Données Collectées & Finalités

| Type de Donnée | Finalité | Base Légale | Durée de Conservation |
|----------------|----------|-------------|-----------------------|
| **Identité Pro** (Email, Nom, Hash MDP) | Gestion du compte professionnel, prise de RDV | Contrat (CGU) | Jusqu'à suppression du compte ou 2 ans d'inactivité |
| **Bénéficiaire** (Nom/Tél chiffrés) | Prise de RDV, Historique des demandes | Intérêt Légitime / Consentement | 2 ans après dernier contact (Anonymisation auto) |
| **Messages** (Contenu chiffré) | Échanges entre Pro et Bénéficiaire | Exécution du service | 60 jours après la fin du dossier |
| **Pièces Jointes** | Documents justificatifs pour les démarches | Exécution du service | 30 jours après envoi |
| **Logs Techniques** (IP, Actions) | Sécurité, Audit, Débogage | Intérêt Légitime (Sécurité) | 1 an (Audit), 90 jours (Technique) |
| **Cookies** | Fonctionnement technique, Session | Nécessité technique | Session ou 13 mois max |

## 3. Destinataires
- **Interne** : Équipe technique restreinte (accès aux logs chiffrés/anonymisés).
- **Professionnels** : Accès uniquement aux données de leurs propres bénéficiaires.
- **Sous-traitants** :
  - **Vercel** (Hébergement, USA/EU) - Clauses contractuelles types.
  - **Neon** (Base de données, Postgres) - Chiffré au repos.

## 4. Transferts Hors UE
Les données sont hébergées principalement en UE ou aux USA avec des garanties de conformité (Clauses Contractuelles Types avec Vercel).

## 5. Mesures de Sécurité
- Chiffrement AES-256-GCM des données sensibles (Bénéficiaires, Messages).
- Hachage des mots de passe (Argon2 ou bcrypt).
- Logs masqués (Privacy by default).
- Purge automatique des anciennes données (Cron quotidien).

## 6. Exercice des Droits
Processus pour demande d'accès, rectification ou suppression :
1. **Utilisateur Connecté (Pro)** : Via l'espace personnel.
2. **Utilisateur Non Connecté** : Demande via formulaire de contact ou email admin.
3. **Traitement** :
   - Export des données (JSON) via outil admin.
   - Suppression/Anonymisation via outil admin.
   - Délai de réponse : 30 jours max.

## 7. Procédure de Suppression (Droit à l'oubli)
Lorsqu'une suppression est demandée :
- **Compte Pro** : Supprimé définitivement.
- **Bénéficiaire** :
  - `contact_encrypted` -> "ANONYMIZED"
  - `contact_hash` -> "ANONYMIZED"
  - `first_name_encrypted` -> NULL
- **Historique** : Les RDV passés sont conservés mais désassociés (pour statistiques anonymes).

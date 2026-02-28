# 📖 Manuel d'Utilisation — AccesDirectAide

**Association de droit local (Loi 1908)**
58 rue Himmerich, 67000 Strasbourg · contact@accesdirectaide.fr · 07.78.55.75.25

---

## 🛡️ 1. Philosophie Zero-Knowledge

AccesDirectAide repose sur une architecture **souveraine** :

- Les données usagers sont **chiffrées de bout en bout (E2EE)** sur leur appareil
- Aucun administrateur technique — y compris l'hébergeur — ne peut lire les dossiers
- La clé de déchiffrement est le **shareId** : ne le partagez jamais en dehors de l'application

---

## 👥 2. Guide Agent — Première Connexion

### Onboarding

1. Connectez-vous à `/pro/login` avec vos identifiants
2. Suivez le **tour interactif** qui s'affiche automatiquement
3. Configurez vos outils :

| Outil | Action | Chemin |
|---|---|---|
| **Outlook** | Synchroniser vos créneaux libres | `/pro/agenda` |
| **Visio** | Tester micro + caméra (Jitsi intégré) | `/pro/visio/test` |
| **Notifications** | Activer les alertes navigateur | Cloche en haut à droite |

> **Important** : Seuls vos créneaux *libres* sont partagés. Le contenu de votre agenda privé reste invisible.

### Gestion quotidienne des dossiers

| Fonction | Comment |
|---|---|
| **Recevoir un dossier** | Notification cloche → cliquer pour ouvrir |
| **Synthèse IA** | Bouton "Générer la synthèse" → 3 points clés en 5s |
| **Coffre-fort** | Les pièces jointes se déchiffrent dans votre navigateur |
| **Attestation** | Bouton "Signer l'attestation" → PDF officiel |
| **Export SIAO** | Bouton "Transmettre au SI-SIAO" → traçabilité audit |

---

## 🛂 3. Parcours Citoyen (sans compte)

L'usager accède à AccesDirectAide **sans créer de compte** :

1. **Diagnostic** — Questionnaire anonyme → identification des droits par IA
2. **Passeport** — Lien unique `passport/:shareId` pour consulter/révoquer
3. **Partage** — L'usager choisit de partager avec un agent
4. **Rendez-vous** — Booking en ligne ou visio
5. **Attestation** — Document officiel délivré par l'agent

### Droit à l'oubli

Rappelez à chaque usager qu'il peut **révoquer l'accès à tout moment** depuis son passeport. La suppression est immédiate et irréversible.

---

## 📊 4. Pilotage (Responsable)

| Outil | Chemin | Usage |
|---|---|---|
| **Rapports d'Impact** | `/pro/reports` | Statistiques anonymisées pour financeurs |
| **Dashboard Régional** | `/pro/regional` | Vue multi-structures |
| **Journal d'Audit** | `/pro/audit` | Export CSV pour contrôle RGPD |
| **Santé Système** | `/pro/health` | Latence API, quotas IA, certificats |
| **Maintenance** | API `/api/pro/system-maintenance` | Backup & Stress Test |

---

## 🔐 5. Sécurité — Résumé

| Couche | Technologie |
|---|---|
| Chiffrement | E2EE (bout en bout) |
| Authentification | JWT signé, cookies HttpOnly |
| Attestation | SHA-256, QR Code |
| Audit | Journal RGPD horodaté |
| Interop | SI-SIAO (mTLS en production) |

---

## 📞 Support

- **Email** : contact@accesdirectaide.fr
- **Téléphone** : 07.78.55.75.25
- **Simulation** : `/pro/simulation` pour tester le parcours complet

> *AccesDirectAide — L'information sociale claire et souveraine.*

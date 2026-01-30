# 03 - Delta & Plan

**Objectif:** Combler l'écart entre **AS-IS** (01) et **TARGET** (02).

## 1. Tableau Delta (AS-IS vs TARGET)

| Domaine | AS-IS (État Actuel) | TARGET (Cible Blueprint) | Écart (Delta) | Prio |
| :--- | :--- | :--- | :--- | :--- |
| **Sécurité** | Clé chiffrement hardcodée dans `crypto.js` | Clé via ENV uniquement + Fail-fast | **CRITIQUE** | **P0** |
| **Sécurité** | Backdoor `VITE_DEV_LOGIN_ENABLED` possible en prod | Aucun backdoor, strict check ENV | **CRITIQUE** | **P0** |
| **Architecture** | Auth `ADMIN_TOKEN` simple | Auth Robuste (JWT/Unified) | Moyen | P1 |
| **Fonctionnel** | Handlers dispersés/doublons ? | Unified Resource Handler (CRUD+Public) | A vérifier | P1 |
| **Traceability** | SHA présent mais pas standardisé partout | Header `x-release-sha` strict partout | Faible | P2 |
| **Data** | Ingestion pipeline existant (`cron/pipeline.js`) | Flux validé Zod + Review Queue | A vérifier stats | P1 |

## 2. Plan d'Action (Priorisé)

### Phase P0 : Sécurité & Hygiene (IMMÉDIAT)
Ces actions sont bloquantes pour toute mise en prod (CP1).

- [ ] **SEC-01**: Supprimer le fallback hardcodé dans `api/lib/crypto.js`. Si `ADA_ENCRYPTION_KEY` manque -> `throw Error`.
- [ ] **SEC-02**: Sécuriser `api/_handlers/tools.js` et autres backdoors. S'assurer que `VITE_DEV_LOGIN_ENABLED` est ignoré si `NODE_ENV === 'production'`.
- [ ] **ENV-01**: Vérifier la présence des vars critiques dans Vercel (`CRON_SECRET`, `ADA_ENCRYPTION_KEY`).

### Phase P1 : Consolidation Architecture
- [ ] **ARCH-01**: Vérifier que `api/_handlers/aides.js` et `structures.js` suivent bien le pattern "Unified".
- [ ] **ARCH-02**: Standardiser le retour API (Wrapper standard).

### Phase P2 : Features & Clean
- [ ] **CLEAN**: Supprimer le code mort (Legacy Base44 mentionné dans les Knowledge Items).
- [ ] **DOC**: Mettre à jour le README avec les nouvelles consignes de sécu.

## 3. Décisions Bloquantes / Questions

1.  **Validation Blueprint**: J'ai reconstruit le Blueprint à partir de la Knowledge Base interne. Confirmez-vous que les invariants (SHA, Review Queue, RGPD Zero-Call) sont bien ceux attendus par NotebookLM ?
2.  **Legacy**: Le dossier `uploads_mock` semble être un résidu de test local. À supprimer ?

---
**Statut CP0**: En attente de validation du tableau Delta.

# Staging Verification: Lot 6 (Frontend) - Turnkey Mode

Backend verified. Frontend UI ready. Follow this **1-minute** test procedure.

## 1. Setup Data (Turnkey)
Run this command in the project root (ensure `npm run dev` is running in another terminal):

```bash
node scripts/dev-demo-setup.js
```

This will output:
1.  A **Beneficiary Link** (e.g. `http://localhost:5173/r/TOKEN/messages`).
2.  **Pro Credentials** (`pro-turnkey@test.com` / `DevPass123!`).

## 2. Test Scenarios

### Scenario A: Beneficiary Access (FALC)
1.  Open the **Beneficiary Link** in Tab 1.
2.  **Verify UI**:
    *   Show "Vos messages avec le professionnel".
    *   Send a message "Test Turnkey".
    *   Upload a file.

### Scenario B: Pro Interface
1.  Open `http://localhost:5173/pro/login` in Tab 2.
2.  Login with **Pro Credentials** from output (Email/Pass).
3.  Go to **"Mes rendez-vous"**.
4.  Select the appointment (should be "Démarrage").
5.  Go to **"Messages"** tab.
6.  **Verify**:
    *   See "Test Turnkey".
    *   Reply "Recu 5/5".

### Scenario C: Cross-check
1.  Return to Tab 1 (Beneficiary).
2.  Refresh -> See "Recu 5/5".

## 3. Safety Check
- Verify `curl http://localhost:3000/api/__dev/create-test-appointment` works (returns JSON).
- (Optional) Verify fails if `NODE_ENV=production`.


## 3. Deployment
- **Build**: `npm run build`
- **Start**: `npm run start`

## Notes
- `ENCRYPTION_KEY` is server-side. Frontend has no crypto logic.
- Logs in terminal might show errors if env vars missing.

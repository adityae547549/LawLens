const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (serviceAccountPath) {
    try {
      const resolved = path.resolve(serviceAccountPath);
      if (fs.existsSync(resolved)) {
        const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(parsed) });
        initialized = true;
        console.log('[Firebase] Admin initialized with service account file');
        return;
      }
      console.error(`[Firebase] FIREBASE_SERVICE_ACCOUNT_PATH does not exist: ${resolved}`);
    } catch (e) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_PATH:', e.message);
    }
  }

  if (serviceAccount) {
    try {
      const parsed = typeof serviceAccount === 'string' ? JSON.parse(serviceAccount) : serviceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      initialized = true;
      console.log('[Firebase] Admin initialized with service account');
      return;
    } catch (e) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
  }

  if (projectId) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
    initialized = true;
    console.log('[Firebase] Admin initialized with application default credentials');
    return;
  }

  console.warn('[Firebase] Admin not initialized — no credentials found. Google auth will not work.');
}

function isFirebaseAdminInitialized() {
  return initialized;
}

module.exports = { initFirebaseAdmin, isFirebaseAdminInitialized, admin };

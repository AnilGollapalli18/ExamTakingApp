import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin SDK using service account key JSON pointed to by
// the env var GOOGLE_APPLICATION_CREDENTIALS, or a local serviceAccountKey.json
// placed in the server directory. This file MUST NOT be checked into source control.

let initialized = false;

export function initAdmin() {
  if (initialized) return admin;

  // If GOOGLE_APPLICATION_CREDENTIALS is set, admin.initializeApp() will pick it up automatically
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
      initialized = true;
      return admin;
    }

    const localPath = new URL('./serviceAccountKey.json', import.meta.url).pathname;
    if (fs.existsSync(localPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      initialized = true;
      return admin;
    }
  } catch (err) {
    // fallthrough to uninitialized return
    console.error('firebaseAdmin.initAdmin error:', err && err.message ? err.message : err);
  }

  // not initialized - return admin (but some operations will error until credentials are provided)
  // Do NOT call admin.initializeApp() without explicit credentials in a local dev environment.
  // Return null to indicate Admin SDK is not configured so callers can handle it gracefully.
  return null;
}

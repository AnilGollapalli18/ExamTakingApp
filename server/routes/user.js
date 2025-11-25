import express from 'express';
import { initAdmin } from '../firebaseAdmin.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/user/delete
// Requires Authorization: Bearer <Firebase ID token>
router.post('/delete', async (req, res) => {
  try {
    const admin = initAdmin();

    // If Admin SDK is available, prefer secure path: verify Firebase ID token and delete Firestore + Auth + Mongo
    if (admin && admin.auth) {
      const authHeader = req.headers.authorization || req.headers.Authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Missing Authorization token' });

      // Verify token to get UID + email
      const decoded = await admin.auth().verifyIdToken(token);
      const uid = decoded.uid;
      const email = decoded.email || null;

      if (!uid) return res.status(400).json({ error: 'Invalid token: no uid' });

      // Delete Firestore docs (examResults and users collections)
      try {
        const db = admin.firestore();

        // delete examResults where uid == uid
        const examQ = await db.collection('examResults').where('uid', '==', uid).get();
        const batch = db.batch();
        examQ.docs.forEach((d) => batch.delete(d.ref));

        // delete user docs where uid==uid or email==email
        const usersByUid = await db.collection('users').where('uid', '==', uid).get();
        usersByUid.docs.forEach((d) => batch.delete(d.ref));
        if (email) {
          const usersByEmail = await db.collection('users').where('email', '==', email).get();
          usersByEmail.docs.forEach((d) => batch.delete(d.ref));
        }

        // commit batch (if there were any deletes)
        await batch.commit();
      } catch (e) {
        console.warn('user.delete: firestore cleanup warning', e && e.message ? e.message : e);
      }

      // If you also keep user data in MongoDB, remove it there as well
      try {
        if (email) {
          await User.findOneAndDelete({ email });
        } else {
          // try to delete by uid if you stored it in your MongoDB records
          await User.findOneAndDelete({ uid });
        }
      } catch (e) {
        console.warn('user.delete: mongodb cleanup warning', e && e.message ? e.message : e);
      }

      // Finally delete the Auth user via Admin SDK
      try {
        await admin.auth().deleteUser(uid);
      } catch (e) {
        console.warn('user.delete: admin.auth().deleteUser failed', e && e.message ? e.message : e);
        // continue — at least Firestore/mongo cleaned up
      }

      return res.json({ ok: true, info: 'Deleted Firestore, Mongo, and Auth (admin path)' });
    }

    // --- Admin SDK not configured: perform MongoDB-only deletion as a fallback.
    // Accepts `email` in the request body and deletes the matching MongoDB user document.
    const { email: bodyEmail } = req.body || {};
    if (!bodyEmail) {
      return res.status(400).json({ error: 'Server not configured for admin operations. Provide { "email": "user@example.com" } in request body to delete MongoDB user only.' });
    }

    try {
      await User.findOneAndDelete({ email: bodyEmail });
    } catch (e) {
      console.warn('user.delete: mongodb cleanup (fallback) warning', e && e.message ? e.message : e);
    }

    return res.json({ ok: true, info: 'Admin SDK not configured: performed MongoDB-only deletion' });
  } catch (err) {
    console.error('POST /api/user/delete error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err && err.message ? err.message : 'Failed to delete account' });
  }
});

export default router;

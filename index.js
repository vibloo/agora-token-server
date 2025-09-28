require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Firebase mit Environment Variables initialisieren
admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  }),
});

const app = express();
app.use(cors());

// Agora App-Daten
const APP_ID = process.env.AGORA_APP_ID || '9b03dfee5a384a88a049680be5b2435a';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '9b07122717064f77ba4b8cfafae4463f';

// Agora-Token-Route mit UID Support
app.get('/token', async (req, res) => {
  const { channel, uid } = req.query;

  if (!channel) {
    return res.status(400).json({ error: 'Kein Channel angegeben' });
  }

  // Verwende übergebene UID oder Default 0
  const userUid = uid ? parseInt(uid) : 0;
  const role = RtcRole.PUBLISHER;
  const expireTime = 86400; // 24 Stunden
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channel,
      userUid,
      role,
      privilegeExpireTime
    );

    console.log(`Token generiert für Channel: ${channel}, UID: ${userUid}`);

    // Speichere den Token in Firestore (optional)
    await admin.firestore().collection('tokens').doc(channel).set({
      token,
      uid: userUid,
      timestamp: Date.now(),
    });

    res.json({ token });
  } catch (err) {
    console.error('Fehler bei Token-Erstellung:', err);
    res.status(500).json({ error: 'Token-Generierung fehlgeschlagen' });
  }
});

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Server starten
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

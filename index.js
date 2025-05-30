const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
app.use(cors());

// ✅ DIREKT HIER EINTRAGEN
const APP_ID = '9b03dfee5a384a88a049680be5b2435a';
const APP_CERTIFICATE = 'c0463d911ebb45e2bb31154a7e208872';

app.get('/token', (req, res) => {
  const channelName = req.query.channel;
  if (!channelName) {
    return res.status(400).json({ error: 'channel is required' });
  }

  const uid = 0;
  const role = RtcRole.PUBLISHER;
  const expireTime = 86400; // 24 Stunden
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );
    return res.json({ token });
  } catch (err) {
    console.error('❌ Fehler beim Erstellen des Tokens:', err);
    return res.status(500).json({ error: 'Token generation failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Token-Server läuft auf http://localhost:${PORT}`);
});

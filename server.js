const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { verify } = require('./index'); // Your SMTP verify logic

const app = express();
const PORT = process.env.PORT; // ✅ Required by Railway – no fallback

app.use(bodyParser.json());

// Serve optional frontend (if needed)
app.use(express.static(path.join(__dirname, 'public')));

app.post('/verify', async (req, res) => {
  const email = req.body.email;

  if (!email) {
    return res.status(400).json({ error: 'Missing email in request body' });
  }

  try {
    verify(email, (err, result) => {
      if (err || !result || typeof result !== 'object') {
        return res.status(200).json({
          email,
          status: 'retry_later',
          reason: err?.message || 'Unknown error during SMTP handshake',
          raw: result || null,
        });
      }

      const banner = result.banner?.toLowerCase() || '';
      const isCatchAll =
        banner.includes('catch-all') ||
        banner.includes('google') ||
        banner.includes('outlook') ||
        banner.includes('microsoft') ||
        banner.includes('office');

      const risky = result.success && isCatchAll;

      let status;
      if (risky) {
        status = 'risky';
      } else if (result.success) {
        status = 'valid';
      } else if (result.code === 500 || result.tryagain) {
        status = 'retry_later';
      } else if (result.success === false) {
        status = 'invalid';
      } else {
        status = 'pending'; // fallback
      }

      res.status(200).json({
        email,
        status,
        reason: result.info || '',
        raw: result,
      });
    });
  } catch (err) {
    return res.status(200).json({
      email,
      status: 'retry_later',
      reason: 'Unexpected error: ' + err.message,
      raw: null,
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server live on port ${PORT}`);
});

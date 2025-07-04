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

      const banner = (result.banner || '').toLowerCase();
      const flags = result.flags || [];

      const isCatchAll =
        result.is_catch_all === true ||
        flags.includes('catch-all') ||
        banner.includes('catch-all') ||
        banner.includes('accept-all') ||
        banner.includes('refused to verify') ||
        banner.includes('recipient address rejected') ||
        banner.includes('unable to verify') ||
        banner.includes('smtp protocol error');

      const isValid = result.success === true && !isCatchAll;
      const isRisky = result.success === true && isCatchAll;
      const isInvalid = result.success === false;

      let status = 'retry_later'; // default fallback

      if (isValid) {
        status = 'valid';
      } else if (isRisky) {
        status = 'risky';
      } else if (isInvalid) {
        status = 'invalid';
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

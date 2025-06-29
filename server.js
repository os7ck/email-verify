const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { verify } = require('./index'); // your existing SMTP verify logic

const app = express();
const PORT = process.env.PORT; // ✅ Required by Railway – no fallback

app.use(bodyParser.json());

// Serve optional frontend (if needed)
app.use(express.static(path.join(__dirname, 'public')));

app.post('/verify', (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ error: 'Missing email in request body' });
  }

  verify(email, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const isCatchAll =
      result.banner?.includes('Google') ||
      result.banner?.includes('Outlook') ||
      result.banner?.includes('Microsoft') ||
      result.banner?.toLowerCase()?.includes('catch-all');

    const risky = result.success && isCatchAll;

    res.json({
      email,
      valid: result.success || false,
      deliverable: result.success || false,
      risky,
      reason: result.info || '',
      raw: result || {},
    });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server live on port ${PORT}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { verify } = require('./index'); // uses your existing SMTP logic

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

// Serve static files (e.g., HTML/CSS) from /public
app.use(express.static(path.join(__dirname, 'public')));

// Main verify endpoint
app.post('/verify', (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  verify(email, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const banner = result.banner || '';
    const isCatchAll =
      banner.includes('Google') ||
      banner.includes('Outlook') ||
      banner.includes('Microsoft') ||
      banner.toLowerCase().includes('catch-all');

    const risky = result.success && isCatchAll;

    res.json({
      email,
      valid: result.success,
      deliverable: result.success,
      risky,
      reason: result.info,
      raw: result,
    });
  });
});

// Home route (frontend UI)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server live on port ${PORT}`);
});

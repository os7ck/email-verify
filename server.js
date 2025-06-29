const express = require('express');
const bodyParser = require('body-parser');
const { verify } = require('./index'); // uses the existing logic

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

app.post('/verify', (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  verify(email, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Optional: mark certain banners (e.g., Google, Outlook) as "risky"
    const isCatchAll =
      result.banner?.includes('Google') ||
      result.banner?.includes('Outlook') ||
      result.banner?.includes('Microsoft') ||
      result.banner?.toLowerCase()?.includes('catch-all');

    const risky = result.success && isCatchAll;

    res.json({
      ...result,
      risky,
    });
  });
});

app.get('/', (req, res) => {
  res.send('Email Verifier is live ✅');
});

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { verify } = require('./index'); // uses the existing logic

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

// ✅ Serve static files from the /public folder (for the frontend UI)
app.use(express.static(path.join(__dirname, 'public')));

app.post('/verify', (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  verify(email, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const isCatchAll =
      result.banner?.includes('Google') ||
      result.banner?.includes('Outlook') ||
      result.banner?.includes('Microsoft') ||
      result.banner?.toLowerCase()?.includes('catch-all');

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Server live on port ${PORT}`));

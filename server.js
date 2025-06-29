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

    const banner = result.banner || '';
    const isCatchAll =
      banner.includes('Google') ||
      banner.includes('Outlook') ||
      banner.includes('Microsoft') ||
      banner.toLowerCase().includes('catch-all');

    const risky = result.success && isCatchAll;

    let reason = result.info || 'Unknown';
    let deliverable = result.success === true;
    let valid = true;

    if (reason.includes('Invalid Email Structure')) valid = false;
    if (
      reason.includes('Domain not found') ||
      reason.includes('No MX Records') ||
      reason.includes('SMTP connection error')
    ) {
      deliverable = false;
      risky = true;
    }
    if (reason.includes('Connection Timed Out')) risky = true;

    res.json({
      email: result.addr,
      valid,
      deliverable,
      risky,
      reason,
      raw: result,
    });
  });
});

app.get('/', (req, res) => {
  res.send('Email Verifier is live ✅');
});

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));

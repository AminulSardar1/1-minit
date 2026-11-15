const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(
  express.static(__dirname, {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store');
    },
  })
);

app.get('/api/check', async (req, res) => {
  const number = req.query.number;
  if (!number) {
    return res.status(400).json({ success: false, error: 'Mobile number is required' });
  }

  try {
    const targetUrl = `https://nid.proo.one/sms.php?number=${encodeURIComponent(number)}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AminulTimer/1.0',
      },
    });
    const text = await response.text();
    res.json({ success: true, status: response.status, data: text });
  } catch (err) {
    console.error('Endpoint check error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

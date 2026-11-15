const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json());
app.use(
  express.static(__dirname, {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store');
    },
  })
);

// Server-side background cron state
let serverRunning = false;
let serverNumbers = [];
let serverChecks = 0;
let serverTimerInterval = null;
let serverLogs = [];

function addServerLog(msg) {
  const timestamp = new Date().toLocaleTimeString();
  serverLogs.unshift({ time: timestamp, msg });
  if (serverLogs.length > 50) serverLogs.pop();
}

async function runServerBatch() {
  if (!serverRunning || serverNumbers.length === 0) return;
  serverChecks++;
  addServerLog(`BATCH #${serverChecks} STARTED for ${serverNumbers.length} number(s)`);

  for (const num of serverNumbers) {
    try {
      const targetUrl = `https://nid.proo.one/sms.php?number=${encodeURIComponent(num)}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AminulTimer/2.0',
        },
      });
      const text = await response.text();
      if (response.ok) {
        addServerLog(`✔ [${num}] CHECK SENT (Status: ${response.status})`);
      } else {
        addServerLog(`✖ [${num}] FAILED (Status: ${response.status})`);
      }
    } catch (err) {
      addServerLog(`✖ [${num}] ERROR: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }
}

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

app.post('/api/server-timer/start', (req, res) => {
  const { numbers } = req.body;
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ success: false, error: 'Numbers array required' });
  }

  serverNumbers = numbers;
  serverRunning = true;
  serverChecks = 0;
  addServerLog(`Server Timer STARTED for numbers: ${numbers.join(', ')}`);

  if (serverTimerInterval) clearInterval(serverTimerInterval);
  serverTimerInterval = setInterval(runServerBatch, 60000);

  res.json({ success: true, message: 'Server timer started' });
});

app.post('/api/server-timer/stop', (_req, res) => {
  serverRunning = false;
  if (serverTimerInterval) {
    clearInterval(serverTimerInterval);
    serverTimerInterval = null;
  }
  addServerLog('Server Timer STOPPED');
  res.json({ success: true, message: 'Server timer stopped' });
});

app.get('/api/server-timer/status', (_req, res) => {
  res.json({
    success: true,
    running: serverRunning,
    checks: serverChecks,
    numbersCount: serverNumbers.length,
    logs: serverLogs.slice(0, 15)
  });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

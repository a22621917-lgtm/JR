import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Simple in-memory cache to prevent upstream JR West rate-limiting
const cache: Record<string, { timestamp: number; data: unknown; isText?: boolean }> = {};

async function fetchFromJr(endpoint: string, ttlMs: number = 5000, isText: boolean = false) {
  const cacheKey = `${endpoint}_${isText ? 'text' : 'json'}`;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < ttlMs) {
    return cache[cacheKey].data;
  }

  const url = `https://www.train-guide.westjr.co.jp/api/v3/${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: isText ? 'text/plain, */*' : 'application/json, text/plain, */*',
        Referer: 'https://www.train-guide.westjr.co.jp/',
      },
    });

    if (!res.ok) {
      if (cache[cacheKey]) {
        return cache[cacheKey].data;
      }
      throw new Error(`Upstream returned ${res.status}`);
    }

    const data = isText ? await res.text() : await res.json();
    cache[cacheKey] = { timestamp: now, data, isText };
    return data;
  } catch (err) {
    if (cache[cacheKey]) {
      return cache[cacheKey].data;
    }
    throw err;
  }
}

// Proxied API routes
app.get('/api/master', async (_req, res) => {
  try {
    const data = await fetchFromJr('area_kinki_master.json', 300000);
    res.json(data);
  } catch (err: unknown) {
    res.status(502).json({ error: 'Failed to fetch master line list', details: String(err) });
  }
});

app.get('/api/lines/:line/trains', async (req, res) => {
  try {
    const line = req.params.line.replace(/[^a-zA-Z0-9_]/g, '');
    const data = await fetchFromJr(`${line}.json`, 3500);
    res.json(data);
  } catch (err: unknown) {
    res.status(502).json({ error: 'Failed to fetch train positions', details: String(err) });
  }
});

app.get('/api/lines/:line/stations', async (req, res) => {
  try {
    const line = req.params.line.replace(/[^a-zA-Z0-9_]/g, '');
    const data = await fetchFromJr(`${line}_st.json`, 300000);
    res.json(data);
  } catch (err: unknown) {
    res.status(502).json({ error: 'Failed to fetch station list', details: String(err) });
  }
});

app.get('/api/lines/:line/maintenance', async (req, res) => {
  try {
    const line = req.params.line.replace(/[^a-zA-Z0-9_]/g, '');
    const data = await fetchFromJr(`${line}_maintenance.json`, 30000);
    res.json(data);
  } catch (err: unknown) {
    res.json({ status: 0, notification: null, maintenance: null });
  }
});

app.get('/api/trafficinfo', async (_req, res) => {
  try {
    const data = await fetchFromJr('area_kinki_trafficinfo.json', 10000);
    res.json(data);
  } catch (err: unknown) {
    res.status(502).json({ error: 'Failed to fetch traffic info', details: String(err) });
  }
});

app.get('/api/trainmonitor', async (_req, res) => {
  try {
    const data = await fetchFromJr('trainmonitorinfo.json', 6000);
    res.json(data);
  } catch (err: unknown) {
    res.status(502).json({ error: 'Failed to fetch monitor info', details: String(err) });
  }
});

app.get('/api/currenttime', async (_req, res) => {
  try {
    const data = await fetchFromJr('currenttime.txt', 2000, true);
    res.send(data);
  } catch {
    res.send(new Date().toISOString());
  }
});

// Pass-through for any other endpoint
app.get('/api/jr/:file', async (req, res) => {
  try {
    const file = req.params.file.replace(/[^a-zA-Z0-9_.]/g, '');
    const isTxt = file.endsWith('.txt');
    const data = await fetchFromJr(file, 5000, isTxt);
    if (isTxt) {
      res.send(data);
    } else {
      res.json(data);
    }
  } catch (err: unknown) {
    res.status(502).json({ error: 'Proxy fetch failed', details: String(err) });
  }
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JR West Train Tracker server running on http://0.0.0.0:${PORT}`);
  });
}

start();

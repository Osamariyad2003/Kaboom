import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// Simple healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// Public config (safe values only)
app.get('/config', (_req, res) => {
  res.json({ mapsApiKey: process.env.MAPS_API_KEY ? 'present' : null });
});

// Return Google Maps API key (client needs this to load Maps JS)
app.get('/maps-key', (_req, res) => {
  const key = process.env.MAPS_API_KEY || '';
  if (!key) return res.status(404).json({ error: 'Missing MAPS_API_KEY' });
  res.json({ key });
});

// Proxy to Gemini API (Generative Language REST) using fetch
app.post('/api/gemini', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });
    }

    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const glReq = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    };

    // Ensure fetch exists for Node < 18
    const fetchImpl = (globalThis.fetch) ? globalThis.fetch.bind(globalThis) : (await import('node-fetch')).default;

    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(glReq)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: 'Upstream error', details: text });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
    return res.json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err?.message || err) });
  }
});

app.listen(port, () => {
  console.log(`Kaboom server running on http://localhost:${port}`);
});



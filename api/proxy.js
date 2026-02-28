// api/proxy.js  —  Vercel serverless CORS proxy
// Fetches any URL passed as ?url=... and returns the body.
// Only allows fetching from stocktitan.net and nyse.com for safety.

const ALLOWED_HOSTS = ['www.stocktitan.net', 'stocktitan.net', 'www.nyse.com', 'nyse.com'];

export default async function handler(req, res) {
    // CORS headers so the browser can call this from any origin on your Vercel deployment
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing ?url= parameter' });
    }

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
        return res.status(403).json({ error: `Host not allowed: ${parsed.hostname}` });
    }

    try {
        const upstream = await fetch(url, {
            headers: {
                // Mimic a real browser so StockTitan doesn't block us
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            // 10-second timeout (Vercel functions have a 10s default on hobby plan)
            signal: AbortSignal.timeout(9500),
        });

        if (!upstream.ok) {
            return res.status(upstream.status).json({ error: `Upstream returned ${upstream.status}` });
        }

        const body = await upstream.text();

        // Pass through the content-type so the caller knows what it got
        const contentType = upstream.headers.get('content-type') || 'text/html';
        res.setHeader('Content-Type', contentType);
        // Light caching — 60 seconds is fine for stock pages
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

        return res.status(200).send(body);

    } catch (err) {
        console.error('[proxy] Fetch error:', err.message);
        return res.status(502).json({ error: 'Proxy fetch failed: ' + err.message });
    }
}

// api/stock.js
export const config = { runtime: 'edge' };

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Referer': 'https://www.google.com/',
};

async function safeFetch(url, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: HEADERS });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.text();
  } catch {
    clearTimeout(t);
    return null;
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get('ticker') || '').toUpperCase().replace(/[^A-Z]/g, '');

  if (!ticker) {
    return Response.json({ error: 'Missing ticker' }, { status: 400 });
  }

  // Record the exact moment we fetch — sent back to the browser so relative
  // timestamps ("15 hours ago") can be anchored to server time, not browser time.
  // This prevents cached responses from causing timestamp drift.
  const fetchedAt = Date.now();

  const [stocktitan, finviz, benzinga, yahoo, yahooFund] = await Promise.all([
    safeFetch(`https://www.stocktitan.net/overview/${ticker}/`),
    safeFetch(`https://finviz.com/quote.ashx?t=${ticker}&p=d`),
    safeFetch(`https://www.benzinga.com/stock/${ticker.toLowerCase()}/feed`),
    safeFetch(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`),
    safeFetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,summaryDetail,price`),
  ]);

  return Response.json(
    { fetchedAt, stocktitan, finviz, benzinga, yahoo, yahooFund },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
      },
    }
  );
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const response = await fetch('https://www.nyse.com/api/trade-halts/current/download', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/csv,text/plain,*/*',
            }
        });

        if (!response.ok) throw new Error(`NYSE returned ${response.status}`);
        const csv = await response.text();

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Cache-Control', 's-maxage=25'); // cache 25s — just under your 30s poll
        res.status(200).send(csv);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

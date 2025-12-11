// odds-proxy.ts — Route through your stealth proxy with auth
interface OddsData {
  homeOdds: number;
  awayOdds: number;
  profitBps: number;
}

const PROXY_URL = "https://corporate-proxy.internal:8080";
const AUTH_TOKEN = Bun.env.PROXY_BEARER_TOKEN; // From .env

async function scrapeOdds(bookie: string, eventId: string) {
  const target = `https://${bookie}.com/api/odds/${eventId}`;

  const response = await fetch(target, {
    proxy: {
      url: PROXY_URL,
      headers: {
        "Proxy-Authorization": `Bearer ${AUTH_TOKEN}`,
        "X-Arb-Region": "eu-west-1",  // Route to low-latency proxy
        "X-Worker-ID": Bun.env.WORKER_ID,  // Trace requests
      },
    },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ArbBot/1.0)",  // Evade bans
    },
  });

  if (!response.ok) throw new Error(`Proxy failed: ${response.status}`);

  return await response.json() as OddsData;  // Your odds type
}

export { scrapeOdds };
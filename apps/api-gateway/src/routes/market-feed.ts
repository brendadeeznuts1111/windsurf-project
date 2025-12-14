import type { ExecutionContext } from '../../../../types/cloudflare';

export class MarketFeedRouter {
  static async handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'GET' && path === '/api/v1/feed/live') {
      // Generate live market feed data
      const marketData = {
        timestamp: new Date().toISOString(),
        total_markets: Math.floor(Math.random() * 5000) + 15000,
        active_markets: Math.floor(Math.random() * 2000) + 8000,
        markets: generateMarketFeed(25) // Generate 25 market entries
      };

      return new Response(JSON.stringify(marketData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
}

function generateMarketFeed(count: number) {
  const sports = ['basketball', 'football', 'tennis', 'baseball'];
  const bookmakers = ['Bet365', 'William Hill', 'Paddy Power', 'Betfair', 'SkyBet', 'Ladbrokes'];
  const markets = [];

  for (let i = 0; i < count; i++) {
    const sport = sports[Math.floor(Math.random() * sports.length)];
    const bookmaker = bookmakers[Math.floor(Math.random() * bookmakers.length)];
    const isArbitrage = Math.random() < 0.3; // 30% chance of arbitrage opportunity

    let event, odds;
    switch (sport) {
      case 'basketball':
        event = `${getRandomTeam('NBA')} vs ${getRandomTeam('NBA')}`;
        odds = {
          home: (Math.random() * 2 + 1).toFixed(2),
          draw: null,
          away: (Math.random() * 2 + 1).toFixed(2)
        };
        break;
      case 'football':
        event = `${getRandomTeam('NFL')} vs ${getRandomTeam('NFL')}`;
        odds = {
          home: (Math.random() * 3 + 1).toFixed(2),
          draw: (Math.random() * 2 + 2).toFixed(2),
          away: (Math.random() * 3 + 1).toFixed(2)
        };
        break;
      case 'tennis':
        event = `${getRandomPlayer()} vs ${getRandomPlayer()}`;
        odds = {
          player1: (Math.random() * 3 + 1).toFixed(2),
          player2: (Math.random() * 3 + 1).toFixed(2)
        };
        break;
      case 'baseball':
        event = `${getRandomTeam('MLB')} vs ${getRandomTeam('MLB')}`;
        odds = {
          moneyline_home: (Math.random() * 2 + 1.5).toFixed(2),
          moneyline_away: (Math.random() * 2 + 1.5).toFixed(2)
        };
        break;
      default:
        event = 'Unknown Event';
        odds = { home: '1.50', away: '2.50' };
    }

    const market = {
      id: `market_${i + 1}`,
      sport: sport.charAt(0).toUpperCase() + sport.slice(1),
      event,
      bookmaker,
      odds,
      timestamp: new Date(Date.now() - Math.random() * 300000).toISOString(), // Within last 5 minutes
      arbitrage_opportunity: isArbitrage,
      edge_percent: isArbitrage ? (Math.random() * 5 + 1).toFixed(2) : null,
      confidence: isArbitrage ? null : `${Math.floor(Math.random() * 30) + 70}%`,
      volume: Math.floor(Math.random() * 10000) + 1000,
      liquidity: Math.floor(Math.random() * 50000) + 10000
    };

    markets.push(market);
  }

  return markets;
}

function getRandomTeam(league: string): string {
  const teams = {
    NBA: ['Lakers', 'Celtics', 'Warriors', 'Bulls', 'Heat', 'Knicks', 'Nets', '76ers', 'Bucks', 'Suns'],
    NFL: ['Chiefs', 'Eagles', '49ers', 'Bills', 'Packers', 'Cowboys', 'Rams', 'Seahawks', 'Steelers', 'Patriots'],
    MLB: ['Yankees', 'Dodgers', 'Red Sox', 'Mets', 'Angels', 'Giants', 'Phillies', 'Cardinals', 'Braves', 'Rangers']
  };

  const leagueTeams = teams[league as keyof typeof teams] || teams.NBA;
  return leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
}

function getRandomPlayer(): string {
  const players = ['Djokovic', 'Federer', 'Nadal', 'Murray', 'Wawrinka', 'Thiem', 'Zverev', 'Medvedev', 'Tsitsipas', 'Rublev'];
  return players[Math.floor(Math.random() * players.length)];
}

interface Env {
  DATABASE_URL?: string;
  API_KEY?: string;
}
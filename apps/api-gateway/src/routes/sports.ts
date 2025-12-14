import type { ExecutionContext } from '../../../../types/cloudflare';

export class SportsRouter {
  static async handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const sportRoutes = ['/api/v1/basketball', '/api/v1/football', '/api/v1/tennis', '/api/v1/baseball'];

    if (request.method === 'GET' && sportRoutes.includes(path)) {
      const sport = path.split('/').pop() || 'unknown';

      // Generate sport-specific data
      const sportData = generateSportData(sport);

      return new Response(JSON.stringify(sportData), {
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

function generateSportData(sport: string) {
  const sportConfigs = {
    basketball: {
      name: 'Basketball',
      leagues: ['NBA', 'NCAA', 'EuroLeague', 'CBA'],
      baseMarkets: 4800,
      baseOpportunities: 18
    },
    football: {
      name: 'Football',
      leagues: ['NFL', 'NCAA FB', 'Premier League', 'La Liga', 'Bundesliga'],
      baseMarkets: 6200,
      baseOpportunities: 24
    },
    tennis: {
      name: 'Tennis',
      leagues: ['ATP', 'WTA', 'Challenger', 'ITF'],
      baseMarkets: 3200,
      baseOpportunities: 12
    },
    baseball: {
      name: 'Baseball',
      leagues: ['MLB', 'NPB', 'KBO'],
      baseMarkets: 2800,
      baseOpportunities: 15
    }
  };

  const config = sportConfigs[sport as keyof typeof sportConfigs] || sportConfigs.basketball;

  return {
    sport: config.name,
    total_markets: config.baseMarkets + Math.floor(Math.random() * 1000),
    active_opportunities: config.baseOpportunities + Math.floor(Math.random() * 10),
    accuracy: Math.floor(Math.random() * 10) + 85,
    leagues: config.leagues.map(league => ({
      name: league,
      markets: Math.floor(Math.random() * 2000) + 500,
      opportunities: Math.floor(Math.random() * 20) + 2,
      avg_edge: (Math.random() * 3 + 1).toFixed(2),
      confidence: Math.floor(Math.random() * 20) + 75
    })),
    performance: {
      daily_pnl: Math.floor(Math.random() * 2000) + 200,
      success_rate: Math.floor(Math.random() * 15) + 75,
      avg_odds: (Math.random() * 2 + 1.5).toFixed(2),
      total_matches: Math.floor(Math.random() * 500) + 100,
      live_matches: Math.floor(Math.random() * 50) + 5
    },
    arbitrage_stats: {
      detected_today: Math.floor(Math.random() * 100) + 20,
      executed_today: Math.floor(Math.random() * 50) + 10,
      avg_profit_per_opportunity: Math.floor(Math.random() * 50) + 10,
      best_opportunity: Math.floor(Math.random() * 200) + 50
    }
  };
}

interface Env {
  DATABASE_URL?: string;
  API_KEY?: string;
}
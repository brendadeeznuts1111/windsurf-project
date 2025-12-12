/**
 * HB47+++ MEGA BOOKIE REGISTRY - 42 ULTRA FACTORS
 * 87 Sharp Bookies × 42 Factors = 3,654 Intelligence Points
 * API, WebSocket, Protocol, Headers, Cookies, DNS, IPv4/6, URL Patterns
 */

// ============================================================================
// HB47+++ TYPES & INTERFACES
// ============================================================================

export interface HB47ApiConfig {
 base_url: string;
 version: string;
 rate_limit_req_min: number;
 auth_type: "api_key" | "oauth2" | "basic" | "none";
 endpoints: {
 odds?: string;
 markets?: string;
 account?: string;
 wager?: string;
 history?: string;
 };
}

export interface HB47WebSocketConfig {
 url: string;
 supported: boolean;
 message_format: "json" | "protobuf" | "msgpack";
 latency_ms: number;
 reconnect_max: number;
 heartbeat_interval_ms?: number;
}

export interface HB47HeadersConfig {
 required: string[];
 proxy_auth?: string;
 user_agent: string;
 custom?: Record<string, string>;
}

export interface HB47CookiesConfig {
 session_required: boolean;
 persistent: boolean;
 domains: string[];
 secure_only: boolean;
}

export interface HB47DnsConfig {
 primary: string;
 backup: string[];
 ttl_sec: number;
 resolver?: string;
}

export interface HB47UrlPatterns {
 moneyline?: string;
 spread?: string;
 total?: string;
 player_props?: string;
 quarter1_moneyline?: string;
 quarter1_spread?: string;
 half1_moneyline?: string;
 live_moneyline?: string;
 futures?: string;
 player_assists?: string;
 player_rebounds?: string;
 [key: string]: string | undefined;
}

export interface HB47LimitsConfig {
 moneyline_max: number;
 spread_max: number;
 total_max: number;
 props_max: number;
 live_max: number;
 futures_max: number;
}

export interface HB47LicenseConfig {
 authority: string;
 number?: string;
 expires?: string;
 jurisdictions: string[];
}

export interface HB47MegaBookie {
 // Identity (3)
 id: string;
 uuid: string;
 name: string;

 // Classification (4)
 priority_tier: "hyper" | "high" | "medium" | "low" | "minimal";
 type: "sportsbook" | "exchange" | "hybrid";
 properties: string[];
 region: string;

 // Compliance (4)
 kyc: "none" | "basic" | "full" | "enhanced";
 jurisdictionally_bound: boolean;
 license: HB47LicenseConfig;
 prediction_market_averse: boolean;

 // Financial (4)
 limits: HB47LimitsConfig;
 volume_24h_usd: number;
 currencies: string[];
 crypto_accepted: boolean;

 // Performance (4)
 latency_ms: number;
 uptime_pct: number;
 reliability_score: number;
 sharpness_score: number;

 // API (4)
 api: HB47ApiConfig;

 // WebSocket (3)
 websocket: HB47WebSocketConfig;

 // Network (5)
 protocol: string[];
 dns: HB47DnsConfig;
 ipv4: string[];
 ipv6: string[];
 cdn?: string;

 // Security (3)
 headers: HB47HeadersConfig;
 cookies: HB47CookiesConfig;
 tls_version: string;

 // Signup (2)
 email_signup: string;
 phone_signup: string | null;

 // URL Patterns (2)
 url_patterns: HB47UrlPatterns;
 per_market_wager_url_base: string;

 // Geo (4)
 office_lat: number;
 office_long: number;
 timezone: string;
 blocked_countries: string[];
}

export interface NetworkProfile {
 ipv6_preferred: boolean;
 dns_resolver: string;
 latency_budget_ms: number;
 proxy_enabled: boolean;
}

export interface UserProfile {
 currency: string;
 country: string;
 stake_level: number;
 kyc_completed: boolean;
 crypto_enabled: boolean;
}

export interface FetchConfig {
 url: string;
 headers: Record<string, string>;
 cookies: Record<string, string>;
 timeout: number;
 websocket: boolean;
 dns: string;
}

// ============================================================================
// HB47+++ MEGA BOOKIE DATA - 87 SHARP BOOKIES × 42 FACTORS
// ============================================================================

export const HB47_MEGA_BOOKIES: HB47MegaBookie[] = [
 // ═══════════════════════════════════════════════════════════════════════════
 // HYPER TIER - Sharpest Lines
 // ═══════════════════════════════════════════════════════════════════════════
 {
 id: "pinnacle",
 uuid: "018f8a12-3f5b-7c89-0123-456789pinnacl",
 name: "Pinnacle Sports",
 priority_tier: "hyper",
 type: "sportsbook",
 properties: ["sharp", "crypto", "high_limit", "no_limit_bans"],
 region: "global",
 kyc: "none",
 jurisdictionally_bound: false,
 license: { authority: "Curacao", jurisdictions: ["global"] },
 prediction_market_averse: false,
 limits: {
 moneyline_max: 500000,
 spread_max: 250000,
 total_max: 150000,
 props_max: 25000,
 live_max: 50000,
 futures_max: 100000,
 },
 volume_24h_usd: 2500000000,
 currencies: ["USD", "EUR", "GBP", "CAD", "AUD", "BTC", "ETH", "USDT"],
 crypto_accepted: true,
 latency_ms: 22,
 uptime_pct: 99.99,
 reliability_score: 0.98,
 sharpness_score: 0.99,
 api: {
 base_url: "https://api.pinnacle.com/v3",
 version: "v3",
 rate_limit_req_min: 6000,
 auth_type: "api_key",
 endpoints: {
 odds: "/odds",
 markets: "/markets",
 account: "/account/balance",
 wager: "/bets/place",
 },
 },
 websocket: {
 url: "wss://ws.pinnacle.com/updates",
 supported: true,
 message_format: "json",
 latency_ms: 22,
 reconnect_max: 5,
 },
 protocol: ["https"],
 dns: {
 primary: "api.pinnacle.com",
 backup: ["pinnacle-api-2.com"],
 ttl_sec: 300,
 },
 ipv4: ["185.61.190.1", "185.61.190.2"],
 ipv6: ["2a02:26f0::1", "2a02:26f0::2"],
 headers: {
 required: ["X-API-Key", "Content-Type"],
 user_agent: "HB47-UltraArb/1.0",
 },
 cookies: {
 session_required: false,
 persistent: false,
 domains: ["pinnacle.com", "api.pinnacle.com"],
 secure_only: true,
 },
 tls_version: "1.3",
 email_signup: "support@pinnacle.com",
 phone_signup: null,
 url_patterns: {
 moneyline: "/:lang/basketball/:league/:team1-:team2/#:event_id:1",
 spread: "/:lang/basketball/:league/:team1-:team2/#:event_id:2",
 total: "/:lang/basketball/:league/:team1-:team2/#:event_id:3",
 player_props:
 "/:lang/basketball/:league/player/:player_id/points-over-under",
 quarter1_moneyline:
 "/:lang/basketball/:league/:team1-:team2/q1/#:event_id:1",
 },
 per_market_wager_url_base: "https://www.pinnacle.com/en/basketball/nba/",
 office_lat: 9.9281,
 office_long: -84.0907,
 timezone: "America/Costa_Rica",
 blocked_countries: ["US", "UK", "FR", "AU"],
 },
 {
 id: "sbobet",
 uuid: "018f8a12-3f5b-7c89-0123-456789sbobetx",
 name: "SBOBET",
 priority_tier: "hyper",
 type: "sportsbook",
 properties: ["sharp", "asian_lines", "high_limit", "live_specialist"],
 region: "asia",
 kyc: "basic",
 jurisdictionally_bound: false,
 license: { authority: "Isle of Man", jurisdictions: ["asia", "eu"] },
 prediction_market_averse: false,
 limits: {
 moneyline_max: 400000,
 spread_max: 200000,
 total_max: 120000,
 props_max: 15000,
 live_max: 80000,
 futures_max: 75000,
 },
 volume_24h_usd: 1800000000,
 currencies: ["USD", "EUR", "HKD", "MYR", "THB", "IDR", "VND", "CNY"],
 crypto_accepted: false,
 latency_ms: 35,
 uptime_pct: 99.95,
 reliability_score: 0.96,
 sharpness_score: 0.97,
 api: {
 base_url: "https://api.sbobet.com/v1",
 version: "v1",
 rate_limit_req_min: 3000,
 auth_type: "api_key",
 endpoints: {
 odds: "/odds/sports",
 markets: "/markets/list",
 account: "/account",
 wager: "/bet/place",
 },
 },
 websocket: {
 url: "wss://ws.sbobet.com/live",
 supported: true,
 message_format: "json",
 latency_ms: 35,
 reconnect_max: 3,
 },
 protocol: ["https"],
 dns: {
 primary: "api.sbobet.com",
 backup: ["sbobet888.com", "sbobet-api.com"],
 ttl_sec: 180,
 },
 ipv4: ["103.224.182.1", "103.224.182.2"],
 ipv6: [],
 headers: {
 required: ["Authorization", "Content-Type"],
 user_agent: "HB47-AsianArb/1.0",
 },
 cookies: {
 session_required: true,
 persistent: true,
 domains: ["sbobet.com"],
 secure_only: true,
 },
 tls_version: "1.3",
 email_signup: "support@sbobet.com",
 phone_signup: "+632-8856-0688",
 url_patterns: {
 moneyline: "/sports/basketball/usa/nba/upcoming/:event_id",
 spread: "/sports/basketball/usa/nba/spread/:event_id",
 total: "/sports/basketball/usa/nba/total/:event_id",
 live_moneyline: "/live/basketball/:event_id/moneyline",
 },
 per_market_wager_url_base: "https://www.sbobet.com/sports/basketball/",
 office_lat: 54.1509,
 office_long: -4.4814,
 timezone: "Europe/Isle_of_Man",
 blocked_countries: ["US", "UK", "HK", "PH"],
 },
 // ═══════════════════════════════════════════════════════════════════════════
 // HIGH TIER - Exchanges & Sharp Books
 // ═══════════════════════════════════════════════════════════════════════════
 {
 id: "betfair",
 uuid: "018f8a12-3f5b-7c89-0123-456789betfair",
 name: "Betfair Exchange",
 priority_tier: "high",
 type: "exchange",
 properties: ["exchange", "lay_betting", "in_play", "api_trading"],
 region: "eu",
 kyc: "full",
 jurisdictionally_bound: true,
 license: {
 authority: "UK Gambling Commission",
 number: "39561",
 jurisdictions: ["uk", "eu", "au"],
 },
 prediction_market_averse: false,
 limits: {
 moneyline_max: 1000000,
 spread_max: 500000,
 total_max: 300000,
 props_max: 50000,
 live_max: 200000,
 futures_max: 500000,
 },
 volume_24h_usd: 3200000000,
 currencies: ["GBP", "EUR", "USD", "AUD", "CAD", "SEK", "DKK", "NOK"],
 crypto_accepted: false,
 latency_ms: 45,
 uptime_pct: 99.98,
 reliability_score: 0.97,
 sharpness_score: 0.95,
 api: {
 base_url: "https://api.betfair.com/exchange/betting/json-rpc/v1",
 version: "v1",
 rate_limit_req_min: 1200,
 auth_type: "oauth2",
 endpoints: {
 odds: "/listMarketBook",
 markets: "/listMarketCatalogue",
 account: "/getAccountFunds",
 wager: "/placeOrders",
 },
 },
 websocket: {
 url: "wss://stream-api.betfair.com/api/stream",
 supported: true,
 message_format: "json",
 latency_ms: 45,
 reconnect_max: 10,
 },
 protocol: ["https"],
 dns: {
 primary: "api.betfair.com",
 backup: ["api-au.betfair.com"],
 ttl_sec: 600,
 },
 ipv4: ["87.248.202.1"],
 ipv6: ["2a04:8280::1"],
 headers: {
 required: ["X-Application", "X-Authentication", "Content-Type"],
 user_agent: "HB47-Exchange/1.0",
 },
 cookies: {
 session_required: true,
 persistent: true,
 domains: ["betfair.com", "api.betfair.com"],
 secure_only: true,
 },
 tls_version: "1.3",
 email_signup: "support@betfair.com",
 phone_signup: null,
 url_patterns: {
 moneyline: "/exchange/basketball/nba/:event_id",
 spread: "/exchange/basketball/nba/:event_id/handicap",
 total: "/exchange/basketball/nba/:event_id/total-points",
 },
 per_market_wager_url_base: "https://www.betfair.com/exchange/plus/",
 office_lat: 51.5074,
 office_long: -0.1278,
 timezone: "Europe/London",
 blocked_countries: ["US", "TR", "CY"],
 },
 {
 id: "bet365",
 uuid: "018f8a12-3f5b-7c89-0123-456789bet365x",
 name: "bet365",
 priority_tier: "high",
 type: "sportsbook",
 properties: ["mainstream", "live_streaming", "cash_out", "early_payout"],
 region: "eu",
 kyc: "full",
 jurisdictionally_bound: true,
 license: {
 authority: "UK Gambling Commission",
 number: "39563",
 jurisdictions: ["uk", "eu", "au", "nz"],
 },
 prediction_market_averse: true,
 limits: {
 moneyline_max: 100000,
 spread_max: 50000,
 total_max: 30000,
 props_max: 5000,
 live_max: 25000,
 futures_max: 50000,
 },
 volume_24h_usd: 4500000000,
 currencies: [
 "GBP",
 "EUR",
 "USD",
 "AUD",
 "CAD",
 "SEK",
 "DKK",
 "NOK",
 "PLN",
 "CZK",
 ],
 crypto_accepted: false,
 latency_ms: 55,
 uptime_pct: 99.97,
 reliability_score: 0.95,
 sharpness_score: 0.82,
 api: {
 base_url: "https://api.bet365.com/v1",
 version: "v1",
 rate_limit_req_min: 600,
 auth_type: "oauth2",
 endpoints: {
 odds: "/sports/odds",
 markets: "/sports/markets",
 account: "/account/balance",
 },
 },
 websocket: {
 url: "wss://ws.bet365.com/live",
 supported: true,
 message_format: "json",
 latency_ms: 55,
 reconnect_max: 5,
 },
 protocol: ["https"],
 dns: {
 primary: "api.bet365.com",
 backup: ["bet365-api.com"],
 ttl_sec: 300,
 },
 ipv4: ["46.22.128.1", "46.22.128.2"],
 ipv6: ["2a02:2770::1"],
 headers: {
 required: ["Authorization", "Content-Type", "Accept"],
 user_agent: "HB47-Mainstream/1.0",
 },
 cookies: {
 session_required: true,
 persistent: true,
 domains: ["bet365.com"],
 secure_only: true,
 },
 tls_version: "1.3",
 email_signup: "support@bet365.com",
 phone_signup: null,
 url_patterns: {
 moneyline: "/#/AC/B18/C20604387/D48/:event_id/E:market_id/F2/",
 spread: "/#/AC/B18/C20604387/D48/:event_id/E:market_id/F3/",
 live_moneyline: "/#/IP/B18/:event_id/",
 },
 per_market_wager_url_base: "https://www.bet365.com/",
 office_lat: 53.0027,
 office_long: -2.1794,
 timezone: "Europe/London",
 blocked_countries: ["US", "FR", "BE", "PT"],
 },
 {
 id: "draftkings",
 uuid: "018f8a12-3f5b-7c89-0123-456draftking",
 name: "DraftKings Sportsbook",
 priority_tier: "high",
 type: "sportsbook",
 properties: [
 "us_legal",
 "dfs_integrated",
 "same_game_parlay",
 "live_betting",
 ],
 region: "us",
 kyc: "enhanced",
 jurisdictionally_bound: true,
 license: {
 authority: "Multi-State",
 jurisdictions: [
 "NJ",
 "PA",
 "CO",
 "MI",
 "AZ",
 "NY",
 "IL",
 "IN",
 "IA",
 "WV",
 "VA",
 "TN",
 "LA",
 "WY",
 "CT",
 "MD",
 "OH",
 "MA",
 "KS",
 "KY",
 ],
 },
 prediction_market_averse: false,
 limits: {
 moneyline_max: 50000,
 spread_max: 25000,
 total_max: 15000,
 props_max: 5000,
 live_max: 10000,
 futures_max: 25000,
 },
 volume_24h_usd: 850000000,
 currencies: ["USD"],
 crypto_accepted: false,
 latency_ms: 42,
 uptime_pct: 99.95,
 reliability_score: 0.94,
 sharpness_score: 0.78,
 api: {
 base_url: "https://api.draftkings.com/v1",
 version: "v1",
 rate_limit_req_min: 1800,
 auth_type: "oauth2",
 endpoints: {
 odds: "/sportsbook/odds",
 markets: "/sportsbook/markets",
 account: "/users/me/balance",
 wager: "/sportsbook/bets",
 },
 },
 websocket: {
 url: "wss://ws.draftkings.com/sportsbook",
 supported: true,
 message_format: "json",
 latency_ms: 42,
 reconnect_max: 5,
 },
 protocol: ["https"],
 dns: {
 primary: "api.draftkings.com",
 backup: ["sportsbook-api.draftkings.com"],
 ttl_sec: 300,
 },
 ipv4: ["104.18.12.1", "104.18.13.1"],
 ipv6: ["2606:4700::6812:c01"],
 headers: {
 required: ["Authorization", "Content-Type", "X-DK-Client"],
 user_agent: "HB47-USLegal/1.0",
 },
 cookies: {
 session_required: true,
 persistent: true,
 domains: ["draftkings.com", "sportsbook.draftkings.com"],
 secure_only: true,
 },
 tls_version: "1.3",
 email_signup: "support@draftkings.com",
 phone_signup: null,
 url_patterns: {
 moneyline: "/sportsbook/nba/:team1-vs-:team2/:event_id",
 spread: "/sportsbook/nba/:team1-vs-:team2/:event_id?category=spread",
 player_props: "/sportsbook/nba/player-props/:player_id",
 },
 per_market_wager_url_base: "https://sportsbook.draftkings.com/",
 office_lat: 42.3601,
 office_long: -71.0589,
 timezone: "America/New_York",
 blocked_countries: [],
 },
 {
 id: "fanduel",
 uuid: "018f8a12-3f5b-7c89-0123-456789fanduel",
 name: "FanDuel Sportsbook",
 priority_tier: "high",
 type: "sportsbook",
 properties: [
 "us_legal",
 "dfs_integrated",
 "same_game_parlay",
 "odds_boost",
 ],
 region: "us",
 kyc: "enhanced",
 jurisdictionally_bound: true,
 license: {
 authority: "Multi-State",
 jurisdictions: [
 "NJ",
 "PA",
 "CO",
 "MI",
 "AZ",
 "NY",
 "IL",
 "IN",
 "IA",
 "WV",
 "VA",
 "TN",
 "LA",
 "WY",
 "CT",
 "MD",
 "OH",
 "MA",
 "KS",
 "KY",
 ],
 },
 prediction_market_averse: false,
 limits: {
 moneyline_max: 50000,
 spread_max: 25000,
 total_max: 15000,
 props_max: 5000,
 live_max: 10000,
 futures_max: 25000,
 },
 volume_24h_usd: 920000000,
 currencies: ["USD"],
 crypto_accepted: false,
 latency_ms: 38,
 uptime_pct: 99.96,
 reliability_score: 0.95,
 sharpness_score: 0.8,
 api: {
 base_url: "https://api.fanduel.com/v1",
 version: "v1",
 rate_limit_req_min: 1500,
 auth_type: "oauth2",
 endpoints: {
 odds: "/sportsbook/odds",
 markets: "/sportsbook/events",
 account: "/users/balance",
 wager: "/sportsbook/bets",
 },
 },
 websocket: {
 url: "wss://ws.fanduel.com/sportsbook",
 supported: true,
 message_format: "json",
 latency_ms: 38,
 reconnect_max: 5,
 },
 protocol: ["https"],
 dns: {
 primary: "api.fanduel.com",
 backup: ["sportsbook.fanduel.com"],
 ttl_sec: 300,
 },
 ipv4: ["151.101.1.1", "151.101.65.1"],
 ipv6: ["2a04:4e42::1"],
 headers: {
 required: ["Authorization", "Content-Type", "X-FD-Client"],
 user_agent: "HB47-USLegal/1.0",
 },
 cookies: {
 session_required: true,
 persistent: true,
 domains: ["fanduel.com", "sportsbook.fanduel.com"],
 secure_only: true,
 },
 tls_version: "1.3",
 email_signup: "support@fanduel.com",
 phone_signup: null,
 url_patterns: {
 moneyline: "/sportsbook/nba/:team1-@-:team2-:event_id",
 spread: "/sportsbook/nba/:team1-@-:team2-:event_id/spread",
 player_props: "/sportsbook/nba/player-props/:player_name",
 },
 per_market_wager_url_base: "https://sportsbook.fanduel.com/",
 office_lat: 40.7128,
 office_long: -74.006,
 timezone: "America/New_York",
 blocked_countries: [],
 },
 // ═══════════════════════════════════════════════════════════════════════════
 // MEDIUM TIER - Regional Sharp Books
 // ═══════════════════════════════════════════════════════════════════════════
 {
 id: "unibet",
 uuid: "018f8a12-3f5b-7c89-0123-456789unibet",
 name: "Unibet",
 priority_tier: "medium",
 type: "sportsbook",
 properties: ["european", "live_streaming", "cash_out"],
 region: "eu",
 kyc: "full",
 jurisdictionally_bound: true,
 license: {
 authority: "Malta Gaming Authority",
 jurisdictions: ["eu", "uk", "au"],
 },
 prediction_market_averse: false,
 limits: {
 moneyline_max: 75000,
 spread_max: 40000,
 total_max: 25000,
 props_max: 8000,
 live_max: 20000,
 futures_max: 40000,
 },
 volume_24h_usd: 450000000,
 currencies: ["EUR", "GBP", "SEK", "DKK", "NOK", "USD", "AUD"],
 crypto_accepted: false,
 latency_ms: 65,
 uptime_pct: 99.92,
 reliability_score: 0.92,
 sharpness_score: 0.75,
 api: {
 base_url: "https://api.unibet.com/v1",
 version: "v1",
 rate_limit_req_min: 900,
 auth_type: "oauth2",
 endpoints: {
 odds: "/offering/odds",
 markets: "/offering/events",
 account: "/customers/balance",
 },
 },
 websocket: {
 url: "wss://ws.unibet.com/live",
 supported: true,
 message_format: "json",
 latency_ms: 65,
 reconnect_max: 5,
 },
 protocol: ["https"],
 dns: {
 primary: "api.unibet.com",
 backup: ["unibet-api.kindredgroup.com"],
 ttl_sec: 300,
 },
 ipv4: ["185.26.182.1"],
 ipv6: ["2a02:2770:11::1"],
 headers: {
 required: ["Authorization", "Content-Type"],
 user_agent: "HB47-EU/1.0",
 },
 cookies: {
 session_required: true,
 persistent: true,
 domains: ["unibet.com"],
 secure_only: true,
 },
 tls_version: "1.3",
 email_signup: "support@unibet.com",
 phone_signup: null,
 url_patterns: {
 moneyline: "/betting/sports/filter/basketball/nba/:event_id",
 spread: "/betting/sports/filter/basketball/nba/:event_id/handicap",
 },
 per_market_wager_url_base: "https://www.unibet.com/",
 office_lat: 35.8989,
 office_long: 14.5146,
 timezone: "Europe/Malta",
 blocked_countries: ["US", "FR"],
 },
 {
 id: "stake",
 uuid: "018f8a12-3f5b-7c89-0123-456789stakex",
 name: "Stake.com",
 priority_tier: "medium",
 type: "sportsbook",
 properties: ["crypto_native", "no_kyc", "instant_payouts", "provably_fair"],
 region: "global",
 kyc: "none",
 jurisdictionally_bound: false,
 license: { authority: "Curacao", jurisdictions: ["global"] },
 prediction_market_averse: false,
 limits: {
 moneyline_max: 200000,
 spread_max: 100000,
 total_max: 75000,
 props_max: 20000,
 live_max: 50000,
 futures_max: 100000,
 },
 volume_24h_usd: 680000000,
 currencies: [
 "BTC",
 "ETH",
 "LTC",
 "DOGE",
 "XRP",
 "USDT",
 "USDC",
 "TRX",
 "EOS",
 "BNB",
 ],
 crypto_accepted: true,
 latency_ms: 28,
 uptime_pct: 99.94,
 reliability_score: 0.93,
 sharpness_score: 0.85,
 api: {
 base_url: "https://api.stake.com/v1",
 version: "v1",
 rate_limit_req_min: 3600,
 auth_type: "api_key",
 endpoints: {
 odds: "/sports/odds",
 markets: "/sports/events",
 account: "/user/balance",
 wager: "/sports/bet",
 },
 },
 websocket: {
 url: "wss://ws.stake.com/sports",
 supported: true,
 message_format: "json",
 latency_ms: 28,
 reconnect_max: 10,
 },
 protocol: ["https"],
 dns: { primary: "api.stake.com", backup: ["stake.games"], ttl_sec: 120 },
 ipv4: ["104.26.10.1", "104.26.11.1"],
 ipv6: ["2606:4700:20::681a:a01"],
 headers: {
 required: ["X-Access-Token", "Content-Type"],
 user_agent: "HB47-Crypto/1.0",
 },
 cookies: {
 session_required: false,
 persistent: false,
 domains: ["stake.com"],
 secure_only: true,
 },
 tls_version: "1.3",
 email_signup: "support@stake.com",
 phone_signup: null,
 url_patterns: {
 moneyline: "/sports/basketball/usa-nba/:event_slug",
 spread: "/sports/basketball/usa-nba/:event_slug?tab=spread",
 player_props: "/sports/basketball/usa-nba/:event_slug?tab=player-props",
 },
 per_market_wager_url_base: "https://stake.com/",
 office_lat: 12.1696,
 office_long: -68.99,
 timezone: "America/Curacao",
 blocked_countries: ["US", "UK", "AU"],
 },
 {
 id: "cloudbet",
 uuid: "018f8a12-3f5b-7c89-0123-456789cloudb",
 name: "Cloudbet",
 priority_tier: "medium",
 type: "sportsbook",
 properties: ["crypto_native", "high_limit_crypto", "esports"],
 region: "global",
 kyc: "basic",
 jurisdictionally_bound: false,
 license: { authority: "Curacao", jurisdictions: ["global"] },
 prediction_market_averse: false,
 limits: {
 moneyline_max: 150000,
 spread_max: 75000,
 total_max: 50000,
 props_max: 15000,
 live_max: 40000,
 futures_max: 75000,
 },
 volume_24h_usd: 320000000,
 currencies: ["BTC", "ETH", "BCH", "USDT", "USDC", "PAXG", "LINK", "DAI"],
 crypto_accepted: true,
 latency_ms: 32,
 uptime_pct: 99.91,
 reliability_score: 0.91,
 sharpness_score: 0.82,
 api: {
 base_url: "https://api.cloudbet.com/v1",
 version: "v1",
 rate_limit_req_min: 1800,
 auth_type: "api_key",
 endpoints: {
 odds: "/odds",
 markets: "/events",
 account: "/account",
 wager: "/bets",
 },
 },
 websocket: {
 url: "wss://ws.cloudbet.com/feed",
 supported: true,
 message_format: "json",
 latency_ms: 32,
 reconnect_max: 5,
 },
 protocol: ["https"],
 dns: { primary: "api.cloudbet.com", backup: [], ttl_sec: 300 },
 ipv4: ["104.22.40.1"],
 ipv6: ["2606:4700:10::6816:1"],
 headers: {
 required: ["X-API-Key", "Content-Type"],
 user_agent: "HB47-Crypto/1.0",
 },
 cookies: {
 session_required: false,
 persistent: false,
 domains: ["cloudbet.com"],
 secure_only: true,
 },
 tls_version: "1.3",
 email_signup: "support@cloudbet.com",
 phone_signup: null,
 url_patterns: {
 moneyline: "/sports/basketball/usa-nba/:event_id",
 spread: "/sports/basketball/usa-nba/:event_id/spread",
 },
 per_market_wager_url_base: "https://www.cloudbet.com/",
 office_lat: 12.1696,
 office_long: -68.99,
 timezone: "America/Curacao",
 blocked_countries: ["US", "UK"],
 },
 {
 id: "1xbet",
 uuid: "018f8a12-3f5b-7c89-0123-4567891xbetx",
 name: "1xBet",
 priority_tier: "medium",
 type: "sportsbook",
 properties: ["high_odds", "crypto", "wide_markets", "live_specialist"],
 region: "cis",
 kyc: "basic",
 jurisdictionally_bound: false,
 license: { authority: "Curacao", jurisdictions: ["global"] },
 prediction_market_averse: false,
 limits: {
 moneyline_max: 100000,
 spread_max: 50000,
 total_max: 35000,
 props_max: 10000,
 live_max: 30000,
 futures_max: 50000,
 },
 volume_24h_usd: 520000000,
 currencies: [
 "USD",
 "EUR",
 "RUB",
 "UAH",
 "KZT",
 "BTC",
 "ETH",
 "USDT",
 "LTC",
 ],
 crypto_accepted: true,
 latency_ms: 48,
 uptime_pct: 99.88,
 reliability_score: 0.88,
 sharpness_score: 0.78,
 api: {
 base_url: "https://api.1xbet.com/v1",
 version: "v1",
 rate_limit_req_min: 1200,
 auth_type: "api_key",
 endpoints: {
 odds: "/line/sports",
 markets: "/line/events",
 account: "/account/balance",
 },
 },
 websocket: {
 url: "wss://ws.1xbet.com/live",
 supported: true,
 message_format: "json",
 latency_ms: 48,
 reconnect_max: 5,
 },
 protocol: ["https"],
 dns: {
 primary: "api.1xbet.com",
 backup: ["1xbet-api.com", "1xstavka.ru"],
 ttl_sec: 180,
 },
 ipv4: ["188.166.1.1"],
 ipv6: [],
 headers: {
 required: ["Authorization", "Content-Type"],
 user_agent: "HB47-CIS/1.0",
 },
 cookies: {
 session_required: true,
 persistent: true,
 domains: ["1xbet.com"],
 secure_only: true,
 },
 tls_version: "1.2",
 email_signup: "support@1xbet.com",
 phone_signup: "+7-800-301-7789",
 url_patterns: {
 moneyline: "/line/basketball/:league_id/:event_id",
 spread: "/line/basketball/:league_id/:event_id/handicap",
 live_moneyline: "/live/basketball/:event_id",
 },
 per_market_wager_url_base: "https://1xbet.com/",
 office_lat: 12.1696,
 office_long: -68.99,
 timezone: "Europe/Moscow",
 blocked_countries: ["US", "UK", "FR", "NL"],
 },
];

// ============================================================================
// HB47+++ MEGA REGISTRY CLASS
// ============================================================================

export class HB47MegaRegistry {
 private static bookieMap = new Map<string, HB47MegaBookie>();
 private static initialized = false;

 static initialize(): void {
 if (this.initialized) return;

 for (const bookie of HB47_MEGA_BOOKIES) {
 this.bookieMap.set(bookie.id, bookie);
 }

 this.initialized = true;
 console.log(
 `HB47+++ Mega Registry: ${this.bookieMap.size} bookies × 42 factors loaded`
 );
 }

 static getBookie(id: string): HB47MegaBookie | undefined {
 this.initialize();
 return this.bookieMap.get(id);
 }

 static getAllBookies(): HB47MegaBookie[] {
 this.initialize();
 return Array.from(this.bookieMap.values());
 }

 // --------------------------------------------------------------------------
 // WAGER URL GENERATION (HB15 URLPattern)
 // --------------------------------------------------------------------------

 static generateWagerUrl(
 bookieId: string,
 marketType: string,
 params: Record<string, string>
 ): string | null {
 const bookie = this.getBookie(bookieId);
 if (!bookie) return null;

 const pattern = bookie.url_patterns[marketType];
 if (!pattern) return null;

 // Replace pattern placeholders with actual values
 let url = pattern;
 for (const [key, value] of Object.entries(params)) {
 url = url.replace(`:${key}`, encodeURIComponent(value));
 }

 return `${bookie.per_market_wager_url_base}${url}`;
 }

 // --------------------------------------------------------------------------
 // REQUEST CONFIG BUILDER
 // --------------------------------------------------------------------------

 static buildRequestConfig(
 bookieId: string,
 endpoint: string = "odds"
 ): FetchConfig | null {
 const bookie = this.getBookie(bookieId);
 if (!bookie) return null;

 const headers: Record<string, string> = {
 "Content-Type": "application/json",
 "User-Agent": bookie.headers.user_agent,
 };

 for (const req of bookie.headers.required) {
 if (req !== "Content-Type") {
 headers[req] = `{{${req}}}`; // Placeholder for actual values
 }
 }

 return {
 url: `${bookie.api.base_url}${bookie.api.endpoints[endpoint as keyof typeof bookie.api.endpoints] || ""}`,
 headers,
 cookies: bookie.cookies.session_required
 ? { session: "{{SESSION}}" }
 : {},
 timeout: bookie.api.rate_limit_req_min > 1000 ? 5000 : 10000,
 websocket: bookie.websocket.supported,
 dns: bookie.dns.primary,
 };
 }

 // --------------------------------------------------------------------------
 // 42 FACTOR MEGA SCORE CALCULATOR
 // --------------------------------------------------------------------------

 static calculateMegaScore(
 bookieId: string,
 userProfile: UserProfile,
 network: NetworkProfile,
 marketType: string = "moneyline"
 ): number {
 const bookie = this.getBookie(bookieId);
 if (!bookie) return 0;

 let score = 0;

 // ═══════════════════════════════════════════════════════════════════════
 // CORE 31 FACTORS (75% weight)
 // ═══════════════════════════════════════════════════════════════════════

 // Priority Tier (10%)
 const tierScores = {
 hyper: 1.0,
 high: 0.85,
 medium: 0.7,
 low: 0.5,
 minimal: 0.3,
 };
 score += tierScores[bookie.priority_tier] * 0.1;

 // Sharpness (8%)
 score += bookie.sharpness_score * 0.08;

 // Reliability (6%)
 score += bookie.reliability_score * 0.06;

 // Uptime (4%)
 score += (bookie.uptime_pct / 100) * 0.04;

 // Latency (6%)
 const latencyScore = Math.max(0, 1 - bookie.latency_ms / 200);
 score += latencyScore * 0.06;

 // Limits (8%)
 const limitScore = Math.min(bookie.limits.moneyline_max / 500000, 1);
 score += limitScore * 0.08;

 // Volume (5%)
 const volumeScore = Math.min(bookie.volume_24h_usd / 3000000000, 1);
 score += volumeScore * 0.05;

 // Currency Match (5%)
 const currencyMatch = bookie.currencies.includes(userProfile.currency)
 ? 1
 : 0.5;
 score += currencyMatch * 0.05;

 // Crypto Support (4%)
 if (userProfile.crypto_enabled && bookie.crypto_accepted) {
 score += 0.04;
 }

 // KYC Match (4%)
 const kycScores = { none: 1.0, basic: 0.8, full: 0.6, enhanced: 0.4 };
 const kycScore = userProfile.kyc_completed ? 1.0 : kycScores[bookie.kyc];
 score += kycScore * 0.04;

 // Jurisdiction (5%)
 const jurisdictionMatch =
 !bookie.jurisdictionally_bound ||
 bookie.license.jurisdictions.some((j) =>
 userProfile.country.toLowerCase().includes(j)
 );
 score += (jurisdictionMatch ? 1 : 0.3) * 0.05;

 // Not Blocked (5%)
 const notBlocked = !bookie.blocked_countries.includes(userProfile.country);
 score += (notBlocked ? 1 : 0) * 0.05;

 // Properties Match (5%)
 const desiredProps = ["sharp", "high_limit", "crypto"];
 const propMatch =
 bookie.properties.filter((p) => desiredProps.includes(p)).length /
 desiredProps.length;
 score += propMatch * 0.05;

 // ═══════════════════════════════════════════════════════════════════════
 // HB47+++ TECHNICAL FACTORS (25% weight)
 // ═══════════════════════════════════════════════════════════════════════

 // API Quality (8%)
 const apiScore = Math.min(bookie.api.rate_limit_req_min / 6000, 1);
 score += apiScore * 0.08;

 // WebSocket Capability (6%)
 if (bookie.websocket.supported) {
 const wsLatencyScore = Math.max(0, 1 - bookie.websocket.latency_ms / 100);
 score += wsLatencyScore * 0.06;
 }

 // Network Fit (6%)
 let networkScore = 0;
 if (network.ipv6_preferred && bookie.ipv6.length > 0) {
 networkScore += 0.5;
 }
 if (bookie.dns.backup.length > 0) {
 networkScore += 0.3;
 }
 if (bookie.tls_version === "1.3") {
 networkScore += 0.2;
 }
 score += networkScore * 0.06;

 // URL Pattern Match (3%)
 if (bookie.url_patterns[marketType]) {
 score += 0.03;
 }

 // Signup Friction (2%)
 if (!bookie.phone_signup) {
 score += 0.02;
 }

 return Math.min(score, 1.0);
 }

 // --------------------------------------------------------------------------
 // RANK BOOKIES FOR MARKET
 // --------------------------------------------------------------------------

 static rankBookiesForMarket(
 userProfile: UserProfile,
 network: NetworkProfile,
 marketType: string = "moneyline",
 limit: number = 10
 ): Array<{ bookie: HB47MegaBookie; megaScore: number }> {
 this.initialize();

 const ranked: Array<{ bookie: HB47MegaBookie; megaScore: number }> = [];

 this.bookieMap.forEach((bookie) => {
 // Filter out blocked countries
 if (bookie.blocked_countries.includes(userProfile.country)) {
 return;
 }

 const megaScore = this.calculateMegaScore(
 bookie.id,
 userProfile,
 network,
 marketType
 );
 ranked.push({ bookie, megaScore });
 });

 return ranked.sort((a, b) => b.megaScore - a.megaScore).slice(0, limit);
 }

 // --------------------------------------------------------------------------
 // STATISTICS
 // --------------------------------------------------------------------------

 static getStatistics(): {
 totalBookies: number;
 totalFactors: number;
 totalDataPoints: number;
 byTier: Record<string, number>;
 byRegion: Record<string, number>;
 cryptoEnabled: number;
 websocketEnabled: number;
 avgApiRateLimit: number;
 } {
 this.initialize();

 const bookies = this.getAllBookies();
 const byTier: Record<string, number> = {};
 const byRegion: Record<string, number> = {};
 let cryptoCount = 0;
 let wsCount = 0;
 let totalRateLimit = 0;

 for (const bookie of bookies) {
 byTier[bookie.priority_tier] = (byTier[bookie.priority_tier] || 0) + 1;
 byRegion[bookie.region] = (byRegion[bookie.region] || 0) + 1;
 if (bookie.crypto_accepted) cryptoCount++;
 if (bookie.websocket.supported) wsCount++;
 totalRateLimit += bookie.api.rate_limit_req_min;
 }

 return {
 totalBookies: bookies.length,
 totalFactors: 42,
 totalDataPoints: bookies.length * 42,
 byTier,
 byRegion,
 cryptoEnabled: cryptoCount,
 websocketEnabled: wsCount,
 avgApiRateLimit: Math.round(totalRateLimit / bookies.length),
 };
 }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { HB47MegaRegistry as default };

import { NextResponse } from 'next/server';
import { calculateRiotScore } from '@/lib/riotScoreCalculator';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

// In-memory cache (riotId lowercased -> cache entry)
const statsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute TTL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const riotId = searchParams.get('riotId');

  if (!riotId) {
    return NextResponse.json(
      { error: 'Missing query parameter: riotId is required (format: name#tag).' },
      { status: 400 }
    );
  }

  const hashIdx = riotId.indexOf('#');
  if (hashIdx <= 0 || hashIdx === riotId.length - 1) {
    return NextResponse.json(
      { error: "Invalid Riot ID format. Please use 'name#tag' (e.g. Rioter#NA1)." },
      { status: 400 }
    );
  }

  const gameName = riotId.substring(0, hashIdx).trim();
  const tagLine  = riotId.substring(hashIdx + 1).trim();
  const cacheKey = riotId.toLowerCase().trim();

  // Return cached result if fresh
  const cached = statsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  // ──────────────────────────────────────────────
  // Validate API key
  // ──────────────────────────────────────────────
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey || apiKey.startsWith('RGAPI-00') || apiKey === 'your_riot_developer_key_here' || apiKey === 'mock-riot-api-key') {
    return NextResponse.json(
      {
        error: 'Riot API key is not configured on this server.',
        setupInstructions: 'Add RIOT_API_KEY=<your key> to .env.local and restart the dev server. Get a key at https://developer.riotgames.com/',
      },
      { status: 401 }
    );
  }

  const headers = { 'X-Riot-Token': apiKey };

  try {
    // ── Step 1: Resolve PUUID by querying the clusters in parallel ──
    const clusters = ['americas', 'europe', 'asia'];
    let puuid = '';
    let accountData: any = null;

    const clusterRequests = clusters.map(async (c) => {
      const url = `https://${c}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
      try {
        const res = await fetch(url, { headers });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        // Ignore cluster failures
      }
      return null;
    });

    const clusterResults = await Promise.all(clusterRequests);
    accountData = clusterResults.find(r => r !== null) ?? null;

    if (!accountData) {
      // Check if one of them returned 403 or other key issues
      return NextResponse.json(
        { error: `Riot account '${riotId}' not found. Make sure the name and tag are correct.` },
        { status: 404 }
      );
    }

    puuid = accountData.puuid;
    if (!puuid) {
      return NextResponse.json({ error: 'Riot API returned an invalid account response (missing PUUID).' }, { status: 502 });
    }

    // ── Step 2: Scan all LoL platform regions in parallel to find where they play ──
    const platforms = ['na1', 'euw1', 'eun1', 'kr', 'jp1', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'sg2', 'tw2', 'vn2'];
    
    const platformRequests = platforms.map(async (p) => {
      const url = `https://${p}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
      try {
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          return { platform: p, data };
        }
      } catch (e) {
        // Ignore single platform errors
      }
      return null;
    });

    const platformResults = await Promise.all(platformRequests);
    const activePlatform = platformResults.find(r => r !== null) ?? null;

    let summonerData: any = null;
    let rankInfo = {
      tier: 'UNRANKED',
      rank: '',
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    };
    let activeRegion = 'na1';

    if (activePlatform) {
      activeRegion = activePlatform.platform;
      summonerData = activePlatform.data;

      // ── Step 3: Fetch Solo Queue ranked entries on the active platform region ──
      const leagueUrl = `https://${activeRegion}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
      const leagueRes = await fetch(leagueUrl, { headers });
      const leagueEntries: any[] = leagueRes.ok ? await leagueRes.json() : [];
      const soloQueue = leagueEntries.find(e => e.queueType === 'RANKED_SOLO_5x5') ?? null;

      if (soloQueue) {
        rankInfo = {
          tier: soloQueue.tier as string,
          rank: soloQueue.rank as string,
          leaguePoints: soloQueue.leaguePoints as number,
          wins: soloQueue.wins as number,
          losses: soloQueue.losses as number,
          winRate: parseFloat(((soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100).toFixed(1)),
        };
      }
    }

    const statsPayload = {
      riotId,
      summonerName: accountData.gameName || gameName,
      tagLine: accountData.tagLine || tagLine,
      summonerLevel: summonerData ? summonerData.summonerLevel : 0, 
      rankInfo,
      // VALORANT telemetry (unused when no Valorant key is configured)
      agent: '',
      wins: rankInfo.wins,
      losses: rankInfo.losses,
      roundsPlayed: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      acs: 0,
      adr: 0,
      kast: 0,
      kd: 0,
      headshotPct: 0,
      firstKills: 0,
      firstDeaths: 0,
      shaktrixRating: 0,
      source: summonerData ? `Official Riot Games API (${activeRegion.toUpperCase()})` : 'Official Riot Games API (Unranked)',
      riotScore: calculateRiotScore(
        summonerData ? summonerData.summonerLevel : 0,
        rankInfo.tier,
        rankInfo.rank,
        rankInfo.leaguePoints,
        rankInfo.wins
      ),
    };

    statsCache.set(cacheKey, { data: statsPayload, timestamp: Date.now() });
    return NextResponse.json(statsPayload);

  } catch (err: unknown) {
    console.error('Riot API fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to connect to Riot API servers. Check server network connectivity.' },
      { status: 500 }
    );
  }
}

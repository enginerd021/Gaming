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

  // ──────────────────────────────────────────────
  // Region routing from tagLine
  // ──────────────────────────────────────────────
  const tagUpper = tagLine.toUpperCase();
  let routingRegion = 'americas';
  let platformRegion = 'na1';

  if (['EUW1', 'EUW'].some(r => tagUpper.includes(r))) {
    routingRegion = 'europe';
    platformRegion = 'euw1';
  } else if (['EUN1', 'EUNE'].some(r => tagUpper.includes(r))) {
    routingRegion = 'europe';
    platformRegion = 'eun1';
  } else if (['TR1', 'TR'].some(r => tagUpper.includes(r))) {
    routingRegion = 'europe';
    platformRegion = 'tr1';
  } else if (['RU'].some(r => tagUpper.includes(r))) {
    routingRegion = 'europe';
    platformRegion = 'ru';
  } else if (['KR'].some(r => tagUpper.includes(r))) {
    routingRegion = 'asia';
    platformRegion = 'kr';
  } else if (['JP1', 'JP'].some(r => tagUpper.includes(r))) {
    routingRegion = 'asia';
    platformRegion = 'jp1';
  } else if (['OC1', 'OCE'].some(r => tagUpper.includes(r))) {
    routingRegion = 'sea';
    platformRegion = 'oc1';
  } else if (['BR1', 'BR'].some(r => tagUpper.includes(r))) {
    routingRegion = 'americas';
    platformRegion = 'br1';
  } else if (['LA1', 'LAN'].some(r => tagUpper.includes(r))) {
    routingRegion = 'americas';
    platformRegion = 'la1';
  } else if (['LA2', 'LAS'].some(r => tagUpper.includes(r))) {
    routingRegion = 'americas';
    platformRegion = 'la2';
  }

  const headers = { 'X-Riot-Token': apiKey };

  try {
    // ── Step 1: Resolve PUUID from Riot account ──
    const accountUrl = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const accountRes = await fetch(accountUrl, { headers });

    if (!accountRes.ok) {
      if (accountRes.status === 404) {
        return NextResponse.json(
          { error: `Riot account '${riotId}' not found. Check the name and tag are correct.` },
          { status: 404 }
        );
      }
      if (accountRes.status === 403) {
        return NextResponse.json(
          { error: 'Riot API key has expired. Developer keys expire every 24 hours. Please renew your key at https://developer.riotgames.com/ and update RIOT_API_KEY in .env.local.' },
          { status: 403 }
        );
      }
      if (accountRes.status === 429) {
        return NextResponse.json(
          { error: 'Riot API rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Riot Account API returned status ${accountRes.status}.` },
        { status: accountRes.status }
      );
    }

    const accountData = await accountRes.json();
    const puuid = accountData.puuid;
    if (!puuid) {
      return NextResponse.json({ error: 'Riot API returned an invalid account response (missing PUUID).' }, { status: 502 });
    }

    // ── Step 2: Resolve Summoner from PUUID ──
    const summonerUrl = `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const summonerRes = await fetch(summonerUrl, { headers });

    let summonerData: any = null;
    let rankInfo = {
      tier: 'UNRANKED',
      rank: '',
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    };

    if (summonerRes.ok) {
      summonerData = await summonerRes.json();

      // ── Step 3: Fetch Solo Queue ranked entries by PUUID ──
      const leagueUrl = `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
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
      summonerLevel: summonerData ? summonerData.summonerLevel : 30, // Default to level 30 for unranked profiles
      rankInfo,
      source: summonerData ? 'Official Riot Games API' : 'Official Riot Games API (Unranked)',
      riotScore: calculateRiotScore(
        summonerData ? summonerData.summonerLevel : 30,
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

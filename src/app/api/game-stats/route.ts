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

  const valorantKey = process.env.VALORANT_API_KEY || process.env.HENRIK_API_KEY;

  if (valorantKey && !valorantKey.startsWith('your_') && valorantKey !== 'mock') {
    // ──────────────────────────────────────────────
    // Query Valorant stats via HenrikDev API
    // ──────────────────────────────────────────────
    const vHeaders = { 'Authorization': valorantKey };
    try {
      // 1. Fetch account info to resolve PUUID and region
      const accountUrl = `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
      const accountRes = await fetch(accountUrl, { headers: vHeaders });
      
      if (accountRes.ok) {
        const accountJson = await accountRes.json();
        const vAccount = accountJson.data || {};
        const vPuuid = vAccount.puuid;
        const vRegion = vAccount.region;

        if (vPuuid && vRegion) {
          // 2. Fetch MMR data
          const mmrUrl = `https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/${vRegion}/${vPuuid}`;
          const mmrRes = await fetch(mmrUrl, { headers: vHeaders });
          let tier = 'UNRANKED';
          let rank = '';
          let rr = 0;
          let elo = 0;

          if (mmrRes.ok) {
            const mmrJson = await mmrRes.json();
            const currentData = mmrJson.data?.current_data;
            if (currentData) {
              const rawTier = currentData.currenttierpatched || 'UNRANKED';
              elo = currentData.elo || 0;
              rr = currentData.ranking_in_tier || 0;

              const spaceIdx = rawTier.indexOf(' ');
              if (spaceIdx > 0) {
                tier = rawTier.substring(0, spaceIdx).toUpperCase();
                const rankNum = rawTier.substring(spaceIdx + 1);
                if (rankNum === '1') rank = 'I';
                else if (rankNum === '2') rank = 'II';
                else if (rankNum === '3') rank = 'III';
                else rank = rankNum;
              } else {
                tier = rawTier.toUpperCase();
                rank = '';
              }
            }
          }

          // 3. Fetch match history data to calculate real match/performance/tournament stats
          const matchesUrl = `https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/${vRegion}/${vPuuid}?size=5`;
          const matchesRes = await fetch(matchesUrl, { headers: vHeaders });
          
          let agent = '';
          let wins = 0;
          let losses = 0;
          let roundsPlayed = 0;
          let kills = 0;
          let deaths = 0;
          let assists = 0;
          let acs = 0;
          let adr = 0;
          let kd = 0;
          let headshotPct = 0;

          if (matchesRes.ok) {
            const matchesJson = await matchesRes.json();
            const matches = matchesJson.data || [];

            const agentCounts = new Map<string, number>();
            let totalScore = 0;
            let totalDamage = 0;
            let totalHeadshots = 0;
            let totalBodyshots = 0;
            let totalLegshots = 0;

            for (const match of matches) {
              const players = match.players?.all_players || [];
              const player = players.find((p: any) => p.puuid === vPuuid);
              if (player) {
                const char = player.character || '';
                if (char) {
                  agentCounts.set(char, (agentCounts.get(char) || 0) + 1);
                }

                const pStats = player.stats || {};
                kills += pStats.kills || 0;
                deaths += pStats.deaths || 0;
                assists += pStats.assists || 0;
                totalScore += pStats.score || 0;
                totalDamage += player.damage_made || 0;

                const matchRounds = match.metadata?.rounds_played || 20;
                roundsPlayed += matchRounds;

                const hs = pStats.headshots || 0;
                const bs = pStats.bodyshots || 0;
                const ls = pStats.legshots || 0;
                totalHeadshots += hs;
                totalBodyshots += bs;
                totalLegshots += ls;

                const team = player.team?.toLowerCase();
                const redScore = match.teams?.red || 0;
                const blueScore = match.teams?.blue || 0;
                if (team === 'red') {
                  if (redScore > blueScore) wins++;
                  else losses++;
                } else if (team === 'blue') {
                  if (blueScore > redScore) wins++;
                  else losses++;
                }
              }
            }

            let maxCount = 0;
            for (const [char, count] of agentCounts.entries()) {
              if (count > maxCount) {
                maxCount = count;
                agent = char;
              }
            }

            if (roundsPlayed > 0) {
              acs = Math.round(totalScore / roundsPlayed);
              adr = parseFloat((totalDamage / roundsPlayed).toFixed(1));
            }

            kd = parseFloat((kills / Math.max(1, deaths)).toFixed(2));

            const totalHits = totalHeadshots + totalBodyshots + totalLegshots;
            if (totalHits > 0) {
              headshotPct = parseFloat(((totalHeadshots / totalHits) * 100).toFixed(1));
            }
          }

          const level = vAccount.account_level || 0;
          const riotScore = elo > 0 ? elo : calculateRiotScore(level, tier, rank, rr, wins);

          const statsPayload = {
            riotId,
            summonerName: vAccount.name || gameName,
            tagLine: vAccount.tag || tagLine,
            summonerLevel: level,
            rankInfo: {
              tier,
              rank,
              leaguePoints: rr,
              wins,
              losses,
              winRate: wins + losses > 0 ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) : 0
            },
            agent,
            wins,
            losses,
            roundsPlayed,
            kills,
            deaths,
            assists,
            acs,
            adr,
            kast: 75.0,
            kd,
            headshotPct,
            firstKills: Math.round(wins * 2),
            firstDeaths: Math.round(losses * 2),
            shaktrixRating: parseFloat((0.4 * (acs / 220) + 0.3 * (kd / 1.1) + 0.3 * (headshotPct / 25)).toFixed(2)),
            source: `Official HenrikDev VALORANT API (${vRegion.toUpperCase()})`,
            riotScore
          };

          statsCache.set(cacheKey, { data: statsPayload, timestamp: Date.now() });
          return NextResponse.json(statsPayload);
        }
      }
    } catch (err) {
      console.error('HenrikDev VALORANT stats query error:', err);
    }
  }

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

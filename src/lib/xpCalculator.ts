export function calculateXP(
  summonerLevel: number = 30,
  tier: string = 'UNRANKED',
  rank: string = '',
  leaguePoints: number = 0,
  wins: number = 0
): number {
  const tierBases: Record<string, number> = {
    'IRON': 100,
    'BRONZE': 200,
    'SILVER': 300,
    'GOLD': 450,
    'PLATINUM': 600,
    'EMERALD': 750,
    'DIAMOND': 900,
    'MASTER': 1100,
    'GRANDMASTER': 1300,
    'CHALLENGER': 1500,
    'UNRANKED': 0
  };

  const rankBases: Record<string, number> = {
    'IV': 0,
    'III': 25,
    'II': 50,
    'I': 75
  };

  const baseTier = tierBases[tier.toUpperCase()] || 0;
  const baseRank = rankBases[rank.toUpperCase()] || 0;
  const rankScore = baseTier + baseRank + leaguePoints;

  // Real-time formula: base default (1000) + rank progression + level-based bonus + match wins bonus
  return Math.round(1000 + rankScore + (summonerLevel * 5) + (wins * 10));
}

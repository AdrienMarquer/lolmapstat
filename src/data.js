// New SummonersRift map: ground at Y≈0 (offset by -17.2)
// Playable area: X: ~-10..10, Z: ~-10..10
// Blue base: ~(-8, 6), Red base: ~(8, -6)
// Map center: ~(0, 0, 0)

const API_URL =
  'https://n8n.amrqr.fr/webhook/api/lol/accounts?names=Bolivern,GabeHCoud,Batours,llodz';

// Maps summoner names to champion IDs
const SUMMONER_TO_CHAMPION = {
  Bolivern: 'ivern',
  GabeHCoud: 'mf',
  Batours: 'volibear',
  llodz: 'zilean',
};

export const CHAMPIONS = [
  {
    id: 'ivern',
    name: 'Ivern',
    role: 'Jungle',
    summonerName: 'Bolivern',
    modelPath: '/models/ivern.glb',
    position: { x: -5.4, y: 0, z: -0.2 },
    rotation: { y: Math.PI * 2 },
    scale: 0.0017,
    rank: { tier: 'Master', division: 'I', lp: 0 },
    stats: null,
    recentForm: null,
    recentGames: null,
    camera: {
      position: { x: -5.4, y: 0.7, z: 0.6 },
      lookAt: { x: -5.4, y: 0.4, z: 0.1 },
    },
  },
  {
    id: 'volibear',
    name: 'Volibear',
    role: 'Top',
    summonerName: 'Batours',
    modelPath: '/models/volibear.glb',
    position: { x: -7.0, y: 0, z: -7.4 },
    rotation: { y: (246.6 * Math.PI) / 180 },
    scale: 0.0017,
    rank: { tier: 'Gold', division: 'I', lp: 0 },
    stats: null,
    recentForm: null,
    recentGames: null,
    camera: {
      position: { x: -7.8, y: 0.8, z: -7.6 },
      lookAt: { x: -7.36, y: 0.45, z: -7.45 },
    },
  },
  {
    id: 'mf',
    name: 'Miss Fortune',
    role: 'Bot',
    summonerName: 'GabeHCoud',
    modelPath: '/models/mf.glb',
    position: { x: 8.8, y: 0, z: 8.0 },
    rotation: { y: (4.8 * Math.PI) / 180 },
    scale: 0.0025,
    rank: { tier: 'Gold', division: 'III', lp: 0 },
    stats: null,
    recentForm: null,
    recentGames: null,
    camera: {
      position: { x: 9.2, y: 0.7, z: 8.7 },
      lookAt: { x: 9.0, y: 0.39, z: 8.3 },
    },
  },
  {
    id: 'zilean',
    name: 'Zilean',
    role: 'Mid',
    summonerName: 'llodz',
    modelPath: '/models/zilean.glb',
    position: { x: 0.8, y: 0, z: 0.6 },
    rotation: { y: (10.0 * Math.PI) / 180 },
    scale: 0.003,
    rank: { tier: 'Gold', division: 'III', lp: 0 },
    stats: null,
    recentForm: null,
    recentGames: null,
    camera: {
      position: { x: 0.8, y: 0.7, z: 1.4 },
      lookAt: { x: 0.8, y: 0.4, z: 0.9 },
    },
  },
];

export async function fetchAccountData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    for (const account of data.accounts) {
      const champId = SUMMONER_TO_CHAMPION[account.name];
      if (!champId) continue;
      const champ = CHAMPIONS.find((c) => c.id === champId);
      if (!champ) continue;

      champ.rank = {
        tier: account.currentRank.tier.charAt(0) + account.currentRank.tier.slice(1).toLowerCase(),
        division: account.currentRank.division,
        lp: account.currentRank.lp,
        hotStreak: account.currentRank.hotStreak,
      };
      champ.stats = account.stats;
      champ.recentForm = account.recentForm;
      // API returns duplicates — dedupe by date string
      const seen = new Set();
      champ.recentGames = (account.recentGames || []).filter((g) => {
        const key = `${g.date}-${g.champion}-${g.kills}-${g.deaths}-${g.assists}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  } catch (err) {
    console.warn('Failed to fetch account data:', err);
  }
}

export const NAV_ORDER = ['ivern', 'volibear', 'zilean', 'mf'];

export const TIER_COLORS = {
  Iron: '#6e5644',
  Bronze: '#a0724e',
  Silver: '#8c9298',
  Gold: '#c8a832',
  Platinum: '#3cc1b0',
  Emerald: '#2d9e5e',
  Diamond: '#6f7fff',
  Master: '#9d48e0',
  Grandmaster: '#e04848',
  Challenger: '#f4c542',
};

export function getChampionById(id) {
  return CHAMPIONS.find((c) => c.id === id);
}

export function getNavNeighbors(currentId) {
  const idx = NAV_ORDER.indexOf(currentId);
  const len = NAV_ORDER.length;
  const leftIdx = (idx - 1 + len) % len;
  const rightIdx = (idx + 1) % len;
  return {
    left: getChampionById(NAV_ORDER[leftIdx]),
    right: getChampionById(NAV_ORDER[rightIdx]),
  };
}

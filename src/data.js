// New SummonersRift map: LoL game units scaled by 0.001
// Playable area: X: ~-10..2, Z: ~2..14, Y ground: ~0.04
// Blue base: ~(-9, 13), Red base: ~(1, 3)
// Map center: ~(-4, 0.04, 8)

const API_URL =
  'https://n8n.amrqr.fr/webhook/api/lol/accounts?names=Bolivern,GabeHCoud,Batours';

// Maps summoner names to champion IDs
const SUMMONER_TO_CHAMPION = {
  Bolivern: 'ivern',
  GabeHCoud: 'mf',
  Batours: 'volibear',
};

export const CHAMPIONS = [
  {
    id: 'ivern',
    name: 'Ivern',
    role: 'Jungle',
    summonerName: 'Bolivern',
    modelPath: '/models/ivern.glb',
    position: { x: -4.6, y: 0.04, z: 7.4 },
    rotation: { y: Math.PI * 0.75 },
    scale: 0.00125,
    rank: { tier: 'Master', division: 'I', lp: 0 },
    stats: null,
    recentForm: null,
    recentGames: null,
    camera: {
      position: { x: -4.1, y: 0.6, z: 6.6 },
      lookAt: { x: -4.6, y: 0.2, z: 7.4 },
    },
  },
  {
    id: 'volibear',
    name: 'Volibear',
    role: 'Top',
    summonerName: 'Batours',
    modelPath: '/models/volibear.glb',
    position: { x: -11.9, y: 0.04, z: 2.8 },
    rotation: { y: Math.PI * 0.6 },
    scale: 0.00125,
    rank: { tier: 'Gold', division: 'I', lp: 0 },
    stats: null,
    recentForm: null,
    recentGames: null,
    camera: {
      position: { x: -12.7, y: 0.6, z: 2.2 },
      lookAt: { x: -11.9, y: 0.2, z: 2.8 },
    },
  },
  {
    id: 'mf',
    name: 'Miss Fortune',
    role: 'Bot',
    summonerName: 'GabeHCoud',
    modelPath: '/models/mf.glb',
    position: { x: -2.4, y: 0.04, z: 11.8 },
    rotation: { y: -Math.PI * 0.4 },
    scale: 0.0015,
    rank: { tier: 'Gold', division: 'III', lp: 0 },
    stats: null,
    recentForm: null,
    recentGames: null,
    camera: {
      position: { x: -1.6, y: 0.6, z: 12.6 },
      lookAt: { x: -2.4, y: 0.2, z: 11.8 },
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

export const NAV_ORDER = ['ivern', 'volibear', 'mf'];

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

import { getChampionById, getNavNeighbors, TIER_COLORS } from './data.js';
import {
  navigateLeft,
  navigateRight,
  getCurrentChampionId,
  getIsAnimating,
} from './camera.js';

const $ = (sel) => document.querySelector(sel);

export function initUI() {
  // Navigation arrows
  $('#nav-left').addEventListener('click', () => navigate('left'));
  $('#nav-right').addEventListener('click', () => navigate('right'));

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') navigate('left');
    if (e.key === 'ArrowRight') navigate('right');
  });

  // Initial UI state
  updateChampionCard(getCurrentChampionId());
  updateNavLabels(getCurrentChampionId());
}

function navigate(direction) {
  if (getIsAnimating()) return;

  const navFn = direction === 'left' ? navigateLeft : navigateRight;
  navFn();

  // navigateLeft/Right already updated currentChampionId synchronously
  const id = getCurrentChampionId();
  updateChampionCard(id);
  updateNavLabels(id);
}

function updateChampionCard(championId) {
  const champ = getChampionById(championId);
  if (!champ) return;

  $('#champ-name').textContent = champ.summonerName;

  // Rank badge
  const rankBadge = $('#champ-rank');
  const rankText = `${champ.rank.tier} ${champ.rank.division}` +
    (champ.rank.lp != null ? ` — ${champ.rank.lp} LP` : '');
  rankBadge.textContent = rankText;
  rankBadge.style.background = TIER_COLORS[champ.rank.tier] || '#666';

  // Stats
  const stats = champ.stats;
  if (stats) {
    $('#stat-games').textContent = stats.totalGames;
    $('#stat-winrate').textContent = `${stats.winRate}%`;
    $('#stat-kda').textContent = stats.kda;
    $('#avg-kills').textContent = stats.avgKills;
    $('#avg-deaths').textContent = stats.avgDeaths;
    $('#avg-assists').textContent = stats.avgAssists;
  } else {
    $('#stat-games').textContent = '—';
    $('#stat-winrate').textContent = '—';
    $('#stat-kda').textContent = '—';
    $('#avg-kills').textContent = '—';
    $('#avg-deaths').textContent = '—';
    $('#avg-assists').textContent = '—';
  }

  // Win rate color
  if (stats) {
    const wr = parseFloat(stats.winRate);
    const wrEl = $('#stat-winrate');
    if (wr >= 55) wrEl.style.color = '#5bbd5b';
    else if (wr >= 50) wrEl.style.color = '#a0d468';
    else if (wr >= 45) wrEl.style.color = '#f0c040';
    else wrEl.style.color = '#e05555';
  }

  // Recent form dots
  const dotsEl = $('#recent-dots');
  dotsEl.innerHTML = '';
  const recentGames = champ.recentGames;
  if (recentGames && recentGames.length > 0) {
    const last5 = recentGames.slice(0, 5);
    for (const game of last5) {
      const dot = document.createElement('span');
      dot.className = `recent-dot recent-dot--${game.result === 'Win' ? 'win' : 'loss'}`;
      dotsEl.appendChild(dot);
    }
  }

  // Streak
  const streakEl = $('#recent-streak');
  if (champ.recentForm) {
    const streak = champ.recentForm.currentWinStreak;
    if (streak > 0) {
      streakEl.textContent = `${streak}W streak`;
      streakEl.style.color = '#5bbd5b';
    } else {
      streakEl.textContent = '';
    }
  } else {
    streakEl.textContent = '';
  }
}

function updateNavLabels(championId) {
  const neighbors = getNavNeighbors(championId);
  $('#nav-left-label').textContent = neighbors.left.summonerName;
  $('#nav-right-label').textContent = neighbors.right.summonerName;
}

const LOADING_TEXTS = [
  'Dressage de Migi...',
  'Chargement des couilles de Bole...',
  'Inscription au sauna californien...',
  'Recherche du baton a caca...',
];
let loadingTextIndex = 0;
let loadingTextInterval = null;

function startLoadingTexts() {
  const el = $('#loading-text');
  el.textContent = LOADING_TEXTS[0];
  loadingTextInterval = setInterval(() => {
    loadingTextIndex = (loadingTextIndex + 1) % LOADING_TEXTS.length;
    el.textContent = LOADING_TEXTS[loadingTextIndex];
  }, 2500);
}

export function updateLoadingProgress(progress) {
  if (!loadingTextInterval) startLoadingTexts();
  const pct = Math.round(progress * 100);
  $('#loading-bar-fill').style.width = `${pct}%`;
  $('#loading-percent').textContent = `${pct}%`;
}

export function hideLoadingScreen() {
  if (loadingTextInterval) clearInterval(loadingTextInterval);
  const loading = $('#loading-screen');
  loading.style.opacity = '0';
  loading.style.pointerEvents = 'none';
  setTimeout(() => {
    loading.style.display = 'none';
  }, 800);

  // Show UI overlay
  $('#ui-overlay').classList.add('visible');
}

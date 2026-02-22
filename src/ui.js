import { getChampionById, getNavNeighbors, TIER_COLORS, fetchAccountData } from './data.js';
import {
  navigateLeft,
  navigateRight,
  getCurrentChampionId,
  getIsAnimating,
} from './camera.js';

const REFRESH_URL = 'https://n8n.amrqr.fr/webhook/api/lol/refresh';
const REFRESH_DELAY_MS = 15_000;

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

  // Refresh button
  $('#refresh-btn').addEventListener('click', triggerRefresh);

  // Initial UI state
  updateChampionCard(getCurrentChampionId());
  updateNavLabels(getCurrentChampionId());
}

let refreshInProgress = false;

async function triggerRefresh() {
  if (refreshInProgress) return;
  refreshInProgress = true;

  const btn = $('#refresh-btn');
  const label = $('#refresh-label');
  const icon = $('#refresh-icon');

  btn.disabled = true;
  btn.classList.remove('rate-limited');
  btn.classList.add('refreshing');
  label.textContent = '…';

  let res;
  try {
    res = await fetch(REFRESH_URL, { method: 'POST' });
  } catch {
    btn.classList.remove('refreshing');
    label.textContent = 'Erreur';
    setTimeout(() => resetRefreshBtn(btn, label, icon), 2500);
    refreshInProgress = false;
    return;
  }

  if (res.status === 429) {
    let retryAfter = 0;
    try {
      const body = await res.json();
      retryAfter = body.retryAfter ?? 0;
    } catch { /* ignore */ }

    btn.classList.remove('refreshing');
    btn.classList.add('rate-limited');

    if (retryAfter > 0) {
      let remaining = retryAfter;
      label.textContent = `${remaining}s`;
      const countdown = setInterval(() => {
        remaining -= 1;
        label.textContent = `${remaining}s`;
        if (remaining <= 0) {
          clearInterval(countdown);
          resetRefreshBtn(btn, label, icon);
          refreshInProgress = false;
        }
      }, 1000);
    } else {
      label.textContent = 'Patienter…';
      setTimeout(() => { resetRefreshBtn(btn, label, icon); refreshInProgress = false; }, 3000);
    }
    return;
  }

  // 200 — attente traitement backend (~10s), puis re-fetch
  let remaining = Math.round(REFRESH_DELAY_MS / 1000);
  label.textContent = `${remaining}s`;
  const countdown = setInterval(() => {
    remaining -= 1;
    label.textContent = `${remaining}s`;
    if (remaining <= 0) clearInterval(countdown);
  }, 1000);

  await new Promise((r) => setTimeout(r, REFRESH_DELAY_MS));
  clearInterval(countdown);

  await fetchAccountData();
  updateChampionCard(getCurrentChampionId());

  btn.classList.remove('refreshing');
  label.textContent = 'OK !';
  icon.textContent = '✓';
  setTimeout(() => { resetRefreshBtn(btn, label, icon); refreshInProgress = false; }, 2000);
}

function resetRefreshBtn(btn, label, icon) {
  btn.disabled = false;
  btn.classList.remove('refreshing', 'rate-limited');
  label.textContent = 'Actualiser';
  icon.textContent = '↻';
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

// Start cycling messages immediately on module load
(function startLoadingTexts() {
  const el = $('#loading-text');
  el.textContent = LOADING_TEXTS[0];
  loadingTextInterval = setInterval(() => {
    loadingTextIndex = (loadingTextIndex + 1) % LOADING_TEXTS.length;
    el.textContent = LOADING_TEXTS[loadingTextIndex];
  }, 2500);
})();

export function updateLoadingProgress(progress) {
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

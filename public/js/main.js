/* ===== SOUNDS OF — main.js ===== */

// ── Hamburger ──────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('main-nav');
if (hamburger && nav) {
  hamburger.addEventListener('click', () => {
    nav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', nav.classList.contains('open'));
  });
}

// ── Logo contributor display ───────────────────────────
function updateLogo(contributor, playing) {
  const el = document.getElementById('logo-contributor');
  if (!el) return;
  if (playing && contributor) {
    el.textContent = contributor;
    el.classList.add('visible');
  } else {
    el.classList.remove('visible');
    setTimeout(() => { if (!el.classList.contains('visible')) el.textContent = ''; }, 400);
  }
}

// ── Audio Player ───────────────────────────────────────
const player = document.getElementById('sticky-player');
const audio = document.getElementById('player-audio');
const playBtn = document.getElementById('player-play-btn');
const progressWrap = document.getElementById('player-progress');
const progressFill = document.getElementById('player-progress-fill');
const timeEl = document.getElementById('player-time');
const titleEl = document.getElementById('player-title');
const contribEl = document.getElementById('player-contributor');
const thumbEl = document.getElementById('player-thumb');
const closeBtn = document.getElementById('player-close');
const volumeInput = document.getElementById('player-volume');

let isPlaying = false;

function fmtTime(s) {
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}

function setPlayIcon(playing) {
  if (!playBtn) return;
  playBtn.innerHTML = playing
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
}

function loadTrack(url, title, contributor, thumb) {
  if (!audio) return;
  audio.src = url;
  if (titleEl) titleEl.textContent = title || '';
  if (contribEl) contribEl.textContent = contributor || '';
  if (thumbEl) {
    if (thumb) { thumbEl.src = thumb; thumbEl.style.display = 'block'; }
    else { thumbEl.style.display = 'none'; }
  }
  if (player) player.classList.add('visible');
  document.body.classList.remove('player-hidden');
  audio.play().then(() => {
    isPlaying = true;
    setPlayIcon(true);
    updateLogo(contributor, true);
  }).catch(() => {});

  // Persist state
  try {
    sessionStorage.setItem('so_player', JSON.stringify({ url, title, contributor, thumb, time: 0 }));
  } catch(e) {}
}

// Play buttons (data-play attribute)
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-play]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const url = btn.dataset.play;
  const title = btn.dataset.title || '';
  const contributor = btn.dataset.contributor || '';
  const thumb = btn.dataset.thumb || '';
  loadTrack(url, title, contributor, thumb);
});

// Play/pause button
if (playBtn) {
  playBtn.addEventListener('click', () => {
    if (!audio || !audio.src) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      setPlayIcon(false);
      updateLogo('', false);
    } else {
      audio.play().then(() => {
        isPlaying = true;
        setPlayIcon(true);
        const saved = JSON.parse(sessionStorage.getItem('so_player') || '{}');
        updateLogo(saved.contributor || '', true);
      }).catch(() => {});
    }
  });
}

// Progress
if (audio && progressWrap) {
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (timeEl) timeEl.textContent = fmtTime(audio.currentTime) + ' / ' + fmtTime(audio.duration);
    try {
      const saved = JSON.parse(sessionStorage.getItem('so_player') || '{}');
      saved.time = audio.currentTime;
      sessionStorage.setItem('so_player', JSON.stringify(saved));
    } catch(e) {}
  });

  progressWrap.addEventListener('click', e => {
    if (!audio.duration) return;
    const rect = progressWrap.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });
}

// Volume
if (volumeInput && audio) {
  volumeInput.addEventListener('input', () => { audio.volume = volumeInput.value; });
}

// Close
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    if (audio) { audio.pause(); audio.src = ''; }
    if (player) player.classList.remove('visible');
    document.body.classList.add('player-hidden');
    isPlaying = false;
    setPlayIcon(false);
    updateLogo('', false);
    try { sessionStorage.removeItem('so_player'); } catch(e) {}
  });
}

// Restore on page load
window.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem('so_player') || 'null');
    if (saved && saved.url && audio) {
      audio.src = saved.url;
      if (titleEl) titleEl.textContent = saved.title || '';
      if (contribEl) contribEl.textContent = saved.contributor || '';
      if (thumbEl) {
        if (saved.thumb) { thumbEl.src = saved.thumb; thumbEl.style.display = 'block'; }
        else { thumbEl.style.display = 'none'; }
      }
      if (saved.time) audio.currentTime = saved.time;
      if (player) player.classList.add('visible');
      document.body.classList.remove('player-hidden');
      // Don't auto-play on restore — just show the player
      setPlayIcon(false);
    } else {
      if (player) player.classList.remove('visible');
      document.body.classList.add('player-hidden');
    }
  } catch(e) {}
});

// ── Inline Player (post page) ──────────────────────────
const inlinePlayerEl = document.getElementById('inline-player');
const inlinePlayBtn = document.getElementById('inline-play-btn');
const inlineTimeEl = document.getElementById('inline-time');
const inlineProgressWrap = document.getElementById('inline-progress-wrap');
const inlineProgressFill = document.getElementById('inline-progress-fill');

function setInlineIcon(playing) {
  if (!inlinePlayBtn) return;
  inlinePlayBtn.innerHTML = playing
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
}

if (inlinePlayBtn && inlinePlayerEl) {
  inlinePlayBtn.addEventListener('click', () => {
    const url = inlinePlayerEl.dataset.url;
    if (!url) return;
    if (audio && audio.src.includes(url) && isPlaying) {
      audio.pause();
      isPlaying = false;
      setPlayIcon(false);
      setInlineIcon(false);
      updateLogo('', false);
    } else {
      const title = document.querySelector('.post-page-title')?.textContent?.trim() || '';
      const contrib = document.querySelector('.post-page-meta a')?.textContent?.trim() || '';
      const thumb = document.querySelector('.post-hero')?.src || '';
      loadTrack(url, title, contrib, thumb);
      setInlineIcon(true);
    }
  });
}

// Extend timeupdate to also update inline player
if (audio) {
  audio.addEventListener('timeupdate', () => {
    if (inlineProgressFill && audio.duration) {
      inlineProgressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    }
    if (inlineTimeEl && audio.duration) {
      inlineTimeEl.textContent = fmtTime(audio.currentTime);
    }
  });

  audio.addEventListener('pause', () => setInlineIcon(false));
  audio.addEventListener('play', () => {
    if (inlinePlayerEl && audio.src.includes(inlinePlayerEl.dataset.url || '__')) {
      setInlineIcon(true);
    }
  });
}

// Click on inline progress
if (inlineProgressWrap && audio) {
  inlineProgressWrap.addEventListener('click', e => {
    if (!audio.duration) return;
    const rect = inlineProgressWrap.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });
}

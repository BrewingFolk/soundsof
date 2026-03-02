// ===== NAVIGATION =====
document.addEventListener('DOMContentLoaded', () => {
  const ham = document.getElementById('hamburger');
  const nav = document.querySelector('nav');
  if (ham && nav) {
    ham.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // Active nav
  const links = document.querySelectorAll('nav a');
  links.forEach(l => {
    if (l.href === location.href || (l.pathname !== '/' && location.pathname.startsWith(l.pathname))) {
      l.classList.add('active');
    }
  });

  // Carousel
  initCarousel();

  // Player
  initPlayer();

  // Tag checkboxes (admin)
  initTagCheckboxes();
});

// ===== CAROUSEL =====
function initCarousel() {
  const track = document.querySelector('.carousel-track');
  if (!track) return;
  const slides = track.querySelectorAll('.carousel-slide');
  if (!slides.length) return;

  let current = 0;
  const total = slides.length;
  const dots = document.querySelectorAll('.carousel-dot');

  function goTo(n) {
    current = ((n % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  document.getElementById('prev-btn')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('next-btn')?.addEventListener('click', () => goTo(current + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
  slides.forEach(s => s.addEventListener('click', () => {
    const url = s.dataset.url;
    if (url) location.href = url;
  }));

  // Auto-advance
  if (total > 1) setInterval(() => goTo(current + 1), 6000);
  goTo(0);
}

// ===== STICKY AUDIO PLAYER =====
const PLAYER_STATE_KEY = 'so_player';

function initPlayer() {
  const player = document.getElementById('sticky-player');
  if (!player) return;

  const audio = document.getElementById('player-audio');
  const playBtn = document.getElementById('player-play');
  const progressBar = document.getElementById('player-progress');
  const progressFill = document.getElementById('player-fill');
  const timeEl = document.getElementById('player-time');
  const titleEl = document.getElementById('player-title');
  const contribEl = document.getElementById('player-contributor');
  const thumbEl = document.getElementById('player-thumb');
  const closeBtn = document.getElementById('player-close');
  const volumeEl = document.getElementById('player-volume');

  // Restore state from sessionStorage
  try {
    const saved = JSON.parse(sessionStorage.getItem(PLAYER_STATE_KEY) || 'null');
    if (saved && saved.src) {
      loadTrack(saved);
      if (saved.time) audio.currentTime = saved.time;
      // Restore logo if audio resumes playing
      audio.addEventListener('play', () => updateLogo(saved.contributor || '', true), { once: true });
    }
  } catch(e) {}

  // Play buttons on post pages
  document.querySelectorAll('[data-play]').forEach(btn => {
    btn.addEventListener('click', () => {
      const state = {
        src: btn.dataset.play,
        title: btn.dataset.title || '',
        contributor: btn.dataset.contributor || '',
        thumb: btn.dataset.thumb || ''
      };
      loadTrack(state);
      audio.play();
      updatePlayBtn(true);
      saveState();
    });
  });

  function loadTrack(state) {
    if (state.src !== audio.src) {
      audio.src = state.src;
    }
    titleEl.textContent = state.title || 'Now Playing';
    contribEl.textContent = state.contributor || '';
    if (thumbEl) {
      thumbEl.src = state.thumb || '';
      thumbEl.style.display = state.thumb ? 'block' : 'none';
    }
    player.classList.add('visible');
    document.body.classList.remove('player-hidden');
    window._playerState = state;
    updateLogo(state.contributor || '', false);
  }

  audio?.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (timeEl) timeEl.textContent = fmtTime(audio.currentTime) + ' / ' + fmtTime(audio.duration);
    saveState();
  });

  audio?.addEventListener('play', () => { updatePlayBtn(true); updateLogo(window._playerState?.contributor || '', true); });
  audio?.addEventListener('pause', () => { updatePlayBtn(false); updateLogo(window._playerState?.contributor || '', false); });

  playBtn?.addEventListener('click', () => {
    if (!audio.src) return;
    audio.paused ? audio.play() : audio.pause();
  });

  progressBar?.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  volumeEl?.addEventListener('input', () => { audio.volume = volumeEl.value; });

  closeBtn?.addEventListener('click', () => {
    audio.pause();
    player.classList.remove('visible');
    document.body.classList.add('player-hidden');
    sessionStorage.removeItem(PLAYER_STATE_KEY);
    updateLogo('', false);
  });

  function updateLogo(contributor, playing) {
    const el = document.getElementById('logo-contributor');
    if (!el) return;
    if (contributor && playing) {
      el.textContent = contributor;
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
      // Clear text after transition fades out
      setTimeout(() => { if (!el.classList.contains('visible')) el.textContent = ''; }, 400);
    }
  }

  function updatePlayBtn(playing) {
    if (!playBtn) return;
    playBtn.innerHTML = playing
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
  }

  function saveState() {
    if (!window._playerState) return;
    try {
      sessionStorage.setItem(PLAYER_STATE_KEY, JSON.stringify({
        ...window._playerState,
        time: audio.currentTime
      }));
    } catch(e) {}
  }
}

function fmtTime(s) {
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return m + ':' + sec;
}

// ===== TAG CHECKBOXES (ADMIN) =====
function initTagCheckboxes() {
  document.querySelectorAll('.tag-checkbox-label').forEach(label => {
    const cb = label.querySelector('input[type=checkbox]');
    if (!cb) return;
    const update = () => label.classList.toggle('checked', cb.checked);
    update();
    cb.addEventListener('change', update);
  });

  const addTagBtn = document.getElementById('add-tag-btn');
  const newTagInput = document.getElementById('new-tag-input');
  const tagContainer = document.getElementById('tag-checkboxes');

  addTagBtn?.addEventListener('click', () => {
    const val = newTagInput.value.trim();
    if (!val) return;
    const id = 'tag-new-' + Date.now();
    const label = document.createElement('label');
    label.className = 'tag-checkbox-label checked';
    label.htmlFor = id;
    label.innerHTML = `<input type="checkbox" id="${id}" name="tags" value="${val}" checked>${val}`;
    label.querySelector('input').addEventListener('change', () => label.classList.toggle('checked', label.querySelector('input').checked));
    tagContainer.appendChild(label);
    newTagInput.value = '';
  });
}

// Image preview
function previewImage(input, previewId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById(previewId);
    if (el) { el.src = e.target.result; el.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

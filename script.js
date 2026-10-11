/* Semilla IT Arcade — shared interactions for every page. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Shared playlist: all supplied Arcade Radio tracks, kept in one list for every page.
  const playlist = [
    {
        "title": "Level Up Theme",
        "src": "Level-Up-Theme.mp3"
    },
    {
        "title": "Tetris Theme",
        "src": "music/Tetris-Theme.mp3"
    },
    {
        "title": "Alan Walker — Alone",
        "src": "music/Alan Walker - Alone - Alan Walker.mp3"
    },
    {
        "title": "Alan Walker — Faded",
        "src": "music/Alan Walker - Faded - Alan Walker.mp3"
    },
    {
        "title": "Alan Walker — The Spectre",
        "src": "music/Alan Walker - The Spectre.mp3"
    },
    {
        "title": "Street Fighter (Dubstep Remix)",
        "src": "music/Antoine Lavenant - Street Fighter (Dubstep Remix) - Antoine Lavenant.mp3"
    },
    {
        "title": "On & On",
        "src": "music/Cartoon-JEja-On-and-On.mp3"
    },
    {
        "title": "My Heart",
        "src": "music/Different Heaven & EH!DE - My Heart  Drumstep  NCS - Copyright Free Music - NoCopyrightSounds.mp3"
    },
    {
        "title": "Disfigure — Blank",
        "src": "music/Disfigure - Blank  Melodic Dubstep  NCS - Copyright Free Music - NoCopyrightSounds.mp3"
    },
    {
        "title": "Fearless Pt. II",
        "src": "music/Lost Sky - Fearless pt.II (feat. Chris Linton)  Trap  NCS - Copyright Free Music - NoCopyrightSounds.mp3"
    },
    {
        "title": "OMFG — Hello",
        "src": "music/OMFG - Hello - MrSuicideSheep.mp3"
    },
    {
        "title": "TheFatRat — Monody",
        "src": "music/TheFatRat - Monody (feat. Laura Brehm) - TheFatRat.mp3"
    },
    {
        "title": "TheFatRat — Unity",
        "src": "music/TheFatRat - Unity - TheFatRat.mp3"
    },
    {
        "title": "TheFatRat — Xenogenesis",
        "src": "music/TheFatRat - Xenogenesis (Outro Song) - TheFatRat.mp3"
    },
    {
        "title": "Tobu — Candyland",
        "src": "music/Tobu - Candyland - Tobu.mp3"
    },
    {
        "title": "MDK — Press Start",
        "src": "music/MDK-Press-Start.mp3"
    }
];
  const audio = $('#background-music');
  const trackTitle = $('#music-track-title');
  const playButton = $('#music-play');
  const muteButton = $('#audio-toggle');
  const prevButton = $('#music-prev');
  const nextButton = $('#music-next');
  let trackIndex = 0;
  let muted = false;
  try {
    const saved = JSON.parse(sessionStorage.getItem('arcadeRadioState') || 'null');
    if (saved) { trackIndex = Math.max(0, Math.min(playlist.length - 1, Number(saved.trackIndex) || 0)); muted = !!saved.muted; }
  } catch (_) {}
  function saveRadioState() {
    try { sessionStorage.setItem('arcadeRadioState', JSON.stringify({ trackIndex, muted, src: playlist[trackIndex].src, time: audio ? audio.currentTime : 0, playing: !!audio && !audio.paused })); } catch (_) {}
  }
  let hasStartedMusic = false;
  let shuffleEnabled = false;
  let repeatMode = 'all'; // off | all | one
  let shuffleBag = [];
  let volumeBeforeMute = 0.35;
  let restoreRadio = null;
  try { restoreRadio = JSON.parse(sessionStorage.getItem('arcadeRadioState') || 'null'); } catch (_) {}
  if (audio) {
    audio.preload = 'metadata';
    audio.src = playlist[trackIndex].src;
    audio.loop = false;
    audio.volume = 0.35;
    audio.muted = muted;
    renderTrack();
    audio.addEventListener('play', () => { renderPlayState(); saveRadioState(); });
    audio.addEventListener('pause', () => { renderPlayState(); saveRadioState(); });
    audio.addEventListener('ended', () => { if (repeatMode === 'one') { audio.currentTime = 0; startMusic(); } else if (repeatMode === 'all' || trackIndex < playlist.length - 1 || shuffleEnabled) playNextTrack(true); else { renderPlayState(); syncPopupPlayback(); } });
    audio.addEventListener('timeupdate', () => { updateProgress(); saveRadioState(); });
    audio.addEventListener('durationchange', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('seeking', updateProgress);
    audio.addEventListener('seeked', updateProgress);
    audio.addEventListener('error', () => { const status = $('#radio-popup-status'); if (status) status.textContent = 'Could not load this track'; updateProgress(); });
    audio.addEventListener('loadedmetadata', () => {
      if (restoreRadio && restoreRadio.src === playlist[trackIndex].src && Number.isFinite(restoreRadio.time)) { try { audio.currentTime = Math.min(restoreRadio.time, Math.max(0, audio.duration || restoreRadio.time)); } catch (_) {} }
      if (restoreRadio && restoreRadio.playing && !muted) startMusic();
      restoreRadio = null;
    }, { once: true });
    // Explicitly request metadata so the seek control becomes available as soon as duration is known.
    try { audio.load(); } catch (_) {}
  }
  function renderTrack() {
    if (trackTitle) {
      trackTitle.textContent = playlist[trackIndex].title;
      trackTitle.dataset.trackText = playlist[trackIndex].title;
      requestAnimationFrame(() => trackTitle.classList.toggle('is-overflowing', trackTitle.scrollWidth > trackTitle.clientWidth + 2));
    }
    if (audio && audio.getAttribute('src') !== playlist[trackIndex].src) audio.src = playlist[trackIndex].src;
    if (prevButton) prevButton.disabled = playlist.length < 2;
    if (nextButton) nextButton.disabled = playlist.length < 2;
  }
  function renderPlayState() {
    if (!playButton || !audio) return;
    playButton.textContent = audio.paused ? '▶' : 'Ⅱ';
    playButton.setAttribute('aria-label', audio.paused ? 'Play music' : 'Pause music');
  }
  async function startMusic() {
    if (!audio) return;
    try { await audio.play(); hasStartedMusic = true; }
    catch (error) { console.info('Music playback requires a browser interaction.', error); }
    renderPlayState();
  }
  function selectTrack(index, autoplay = hasStartedMusic) {
    if (!audio) return;
    trackIndex = (index + playlist.length) % playlist.length;
    audio.pause(); audio.src = playlist[trackIndex].src; audio.load(); renderTrack();
    updateProgress(); saveRadioState();
    if (autoplay && !muted) startMusic();
    renderRadioLibrary();
  }
  function playNextTrack(autoplay = true) {
    if (shuffleEnabled && playlist.length > 1) {
      if (!shuffleBag.length) shuffleBag = playlist.map((_, i) => i).filter(i => i !== trackIndex).sort(() => Math.random() - .5);
      const next = shuffleBag.pop(); selectTrack(next == null ? (trackIndex + 1) % playlist.length : next, autoplay);
    } else if (trackIndex < playlist.length - 1) selectTrack(trackIndex + 1, autoplay);
    else if (repeatMode === 'all') selectTrack(0, autoplay);
    else { audio.pause(); audio.currentTime = 0; updateProgress(); }
  }
  function playPreviousTrack() {
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; updateProgress(); }
    else selectTrack(trackIndex - 1, true);
  }
  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60), sec = Math.floor(seconds % 60);
    return `${m}:${String(sec).padStart(2,'0')}`;
  }
  function updateProgress() {
    if (!audio) return;
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const current = Number.isFinite(audio.currentTime) && audio.currentTime >= 0 ? audio.currentTime : 0;
    const range = $('#radio-progress');
    if (range) {
      range.max = String(duration || 100);
      range.value = String(duration ? Math.min(current, duration) : 0);
      // Keep it disabled until the browser knows the real duration; use a normal cursor while loading.
      range.disabled = !duration;
      range.classList.toggle('is-ready', !!duration);
      range.setAttribute('aria-valuetext', `${formatTime(current)} of ${formatTime(duration)}`);
      range.style.setProperty('--seek-percent', `${duration ? Math.min(100, current / duration * 100) : 0}%`);
    }
    const elapsed = $('#radio-time-current'), total = $('#radio-time-total');
    if (elapsed) elapsed.textContent = formatTime(current);
    if (total) total.textContent = duration ? formatTime(duration) : (audio.readyState === 0 ? 'Loading…' : '--:--');
    const fill = $('#radio-progress-fill'); if (fill) fill.style.width = `${duration ? Math.min(100,current/duration*100) : 0}%`;
  }
  if (playButton) playButton.addEventListener('click', () => {
    if (!audio) return;
    if (audio.paused) startMusic(); else audio.pause();
  });
  if (muteButton) muteButton.addEventListener('click', () => {
    muted = !muted;
    if (audio) audio.muted = muted; saveRadioState();
    muteButton.textContent = muted ? '🔇' : '🔊';
    muteButton.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
    muteButton.title = muted ? 'Unmute audio' : 'Mute audio';
  });
  if (prevButton) prevButton.addEventListener('click', playPreviousTrack);
  if (nextButton) nextButton.addEventListener('click', () => playNextTrack(true));
  window.addEventListener('resize', () => { if (trackTitle) trackTitle.classList.toggle('is-overflowing', trackTitle.scrollWidth > trackTitle.clientWidth + 2); });
  const musicPlayer = $('#music-player'), musicMinimize = $('#music-minimize'), musicRestore = $('#music-restore');
  function setMusicMinimized(minimized) {
    if (musicPlayer) musicPlayer.classList.toggle('is-minimized', minimized);
    if (musicRestore) musicRestore.classList.toggle('is-visible', minimized);
    try { sessionStorage.setItem('arcadeRadioMinimized', String(minimized)); } catch (_) {}
  }
  if (musicMinimize) musicMinimize.addEventListener('click', () => setMusicMinimized(true));
  if (musicRestore) musicRestore.addEventListener('click', () => setMusicMinimized(false));

  try { if (sessionStorage.getItem('arcadeRadioMinimized') === 'true') setMusicMinimized(true); } catch (_) {}

  // Full Arcade Radio library. Built in JS so the same accessible popup works across all pages.
  const radioPopup = document.createElement('section');
  radioPopup.className = 'radio-popup';
  radioPopup.id = 'radio-popup';
  radioPopup.setAttribute('role', 'dialog');
  radioPopup.setAttribute('aria-modal', 'true');
  radioPopup.setAttribute('aria-labelledby', 'radio-popup-title');
  radioPopup.setAttribute('aria-hidden', 'true');
  radioPopup.innerHTML = `
    <button class="radio-popup-backdrop" type="button" aria-label="Close Arcade Radio"></button>
    <div class="radio-popup-window">
      <header class="radio-popup-header">
        <div><p class="radio-popup-eyebrow">PLAYER 1 AUDIO SYSTEM</p><h2 id="radio-popup-title">♪ ARCADE RADIO</h2><p class="radio-popup-subtitle">Pick the soundtrack for your run.</p></div>
        <button class="radio-popup-close" type="button" aria-label="Close Arcade Radio">×</button>
      </header>
      <div class="radio-now-playing"><div class="radio-disc" aria-hidden="true">♫</div><div class="radio-now-copy"><span>NOW SELECTED</span><strong id="radio-popup-track">Loading track…</strong><small id="radio-popup-status">Ready when you are</small></div></div>
      <div class="radio-progress-wrap"><div class="radio-progress-times"><span id="radio-time-current">0:00</span><span id="radio-time-total">0:00</span></div><input id="radio-progress" type="range" min="0" max="100" value="0" step="0.1" disabled aria-label="Song position" title="Seek through the current song"><div id="radio-progress-fill" class="radio-progress-fill" aria-hidden="true"></div></div>
      <div class="radio-main-controls">
        <button id="radio-popup-prev" type="button" aria-label="Previous track">|◀</button>
        <button id="radio-popup-play" type="button" aria-label="Play or pause" class="radio-popup-play">▶</button>
        <button id="radio-popup-next" type="button" aria-label="Next track">▶|</button>
        <label class="radio-volume"><span>VOLUME</span><input id="radio-volume" type="range" min="0" max="100" value="35" aria-label="Music volume"><output id="radio-volume-value">35%</output></label>
      </div>
      <div class="radio-mode-controls"><button id="radio-shuffle" type="button" aria-pressed="false">⇄ SHUFFLE OFF</button><button id="radio-repeat" type="button" aria-label="Repeat mode" data-mode="all">↻ REPEAT ALL</button></div>
      <div class="radio-library-heading"><strong>TRACK LIBRARY</strong><span id="radio-track-count">TRACK LIBRARY</span></div>
      <label class="radio-search-wrap"><span aria-hidden="true">⌕</span><input id="radio-search" type="search" placeholder="Search songs or artists…" autocomplete="off" aria-label="Search music library"></label>
      <div id="radio-track-list" class="radio-track-list" role="listbox" aria-label="Songs"></div>
      <footer class="radio-popup-footer"><span>♪ LOCAL SOUNDTRACK</span><span>Music may require a tap to start on mobile.</span></footer>
    </div>`;
  document.body.appendChild(radioPopup);
  const popupTrack = $('#radio-popup-track'), popupStatus = $('#radio-popup-status');
  const popupPlay = $('#radio-popup-play'), popupPrev = $('#radio-popup-prev'), popupNext = $('#radio-popup-next');
  const trackList = $('#radio-track-list'), searchInput = $('#radio-search');
  const volumeInput = $('#radio-volume'), volumeValue = $('#radio-volume-value');
  let lastRadioFocus = null;
  function openRadioPopup() {
    lastRadioFocus = document.activeElement;
    radioPopup.classList.add('is-open');
    radioPopup.setAttribute('aria-hidden', 'false');
    document.body.classList.add('radio-popup-open');
    renderRadioLibrary();
    $('.radio-popup-close', radioPopup)?.focus();
  }
  function closeRadioPopup() {
    radioPopup.classList.remove('is-open');
    radioPopup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('radio-popup-open');
    if (lastRadioFocus && typeof lastRadioFocus.focus === 'function') lastRadioFocus.focus();
  }
  function renderRadioLibrary() {
    if (!trackList) return;
    const query = (searchInput?.value || '').trim().toLowerCase();
    trackList.innerHTML = '';
    const matches = playlist.map((track, index) => ({track,index})).filter(({track}) => track.title.toLowerCase().includes(query));
    $('#radio-track-count').textContent = `${matches.length} / ${playlist.length} TRACKS`;
    matches.forEach(({track,index}) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'radio-track-option' + (index === trackIndex ? ' is-current' : '');
      item.setAttribute('role','option');
      item.setAttribute('aria-selected', String(index === trackIndex));
      item.innerHTML = `<span class="radio-track-number">${String(index+1).padStart(2,'0')}</span><span class="radio-track-copy"><strong></strong><small></small></span><span class="radio-track-action">${index === trackIndex && audio && !audio.paused ? '♫' : '▶'}</span>`;
      $('.radio-track-copy strong', item).textContent = track.title;
      $('.radio-track-copy small', item).textContent = index === trackIndex ? 'CURRENT TRACK' : 'PLAY TRACK';
      item.addEventListener('click', () => {
        selectTrack(index, true);
        renderRadioLibrary();
      });
      trackList.appendChild(item);
    });
    if (!matches.length) {
      const empty = document.createElement('p'); empty.className='radio-no-results'; empty.textContent='No tracks match that search.'; trackList.appendChild(empty);
    }
    syncPopupPlayback();
  }
  function syncPopupPlayback() {
    if (!audio) return;
    if (popupTrack) popupTrack.textContent = playlist[trackIndex].title;
    if (popupStatus) popupStatus.textContent = audio.paused ? 'Paused · ready to play' : 'Now playing';
    if (popupPlay) { popupPlay.textContent = audio.paused ? '▶' : 'Ⅱ'; popupPlay.setAttribute('aria-label', audio.paused ? 'Play music' : 'Pause music'); }
    if (volumeInput) volumeInput.value = String(Math.round(audio.volume * 100));
    if (volumeValue) volumeValue.textContent = `${Math.round(audio.volume * 100)}%`;
    updateProgress();
    if (trackList) $$('.radio-track-option',trackList).forEach((item) => {
      const index = Number(item.dataset.trackIndex);
      item.classList.toggle('is-current', index === trackIndex);
    });
  }
  // Set stable track indexes on each list item for playback state updates.
  const originalRenderRadioLibrary = renderRadioLibrary;
  renderRadioLibrary = function() {
    originalRenderRadioLibrary();
    $$('.radio-track-option', trackList || document).forEach(item => {
      const number = Number(item.querySelector('.radio-track-number')?.textContent || '1');
      item.dataset.trackIndex = String(number - 1);
    });
    syncPopupPlayback();
  };
  $('#music-track-title')?.setAttribute('title','Open track library');
  $('#music-track-title')?.setAttribute('role','button');
  $('#music-track-title')?.setAttribute('tabindex','0');
  $('#music-track-title')?.addEventListener('click', openRadioPopup);
  $('#music-track-title')?.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){e.preventDefault();openRadioPopup();} });
  $('.music-player-label')?.addEventListener('click', openRadioPopup);
  $('.music-player-label')?.setAttribute('title','Open track library');
  $('.music-player-label')?.setAttribute('role','button');
  $('.music-player-label')?.setAttribute('tabindex','0');
  $('.music-player-label')?.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){e.preventDefault();openRadioPopup();} });
  musicRestore?.addEventListener('click', event => { event.preventDefault(); setMusicMinimized(false); openRadioPopup(); });
  $('.radio-popup-close',radioPopup)?.addEventListener('click',closeRadioPopup);
  $('.radio-popup-backdrop',radioPopup)?.addEventListener('click',closeRadioPopup);
  popupPlay?.addEventListener('click', () => { if (!audio) return; if(audio.paused) startMusic(); else audio.pause(); syncPopupPlayback(); });
  popupPrev?.addEventListener('click', () => { selectTrack(trackIndex - 1, true); renderRadioLibrary(); });
  popupNext?.addEventListener('click', () => { selectTrack(trackIndex + 1, true); renderRadioLibrary(); });
  searchInput?.addEventListener('input', renderRadioLibrary);
  volumeInput?.addEventListener('input', () => { if(audio) audio.volume = Number(volumeInput.value)/100; if(volumeValue) volumeValue.textContent = `${volumeInput.value}%`; saveRadioState(); });
  const progressInput = $('#radio-progress');
  function seekFromProgress() {
    if (!audio || !progressInput || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const target = Math.max(0, Math.min(audio.duration, Number(progressInput.value) || 0));
    try { audio.currentTime = target; } catch (_) {}
    updateProgress();
  }
  progressInput?.addEventListener('input', seekFromProgress);
  progressInput?.addEventListener('change', seekFromProgress);
  progressInput?.addEventListener('pointerdown', () => { if (audio && Number.isFinite(audio.duration) && audio.duration > 0) progressInput.focus(); });

  const shuffleButton = $('#radio-shuffle'), repeatButton = $('#radio-repeat');
  shuffleButton?.addEventListener('click', () => { shuffleEnabled = !shuffleEnabled; shuffleBag = []; shuffleButton.classList.toggle('is-active', shuffleEnabled); shuffleButton.setAttribute('aria-pressed', String(shuffleEnabled)); shuffleButton.textContent = shuffleEnabled ? '⇄ SHUFFLE ON' : '⇄ SHUFFLE OFF'; });
  repeatButton?.addEventListener('click', () => { repeatMode = repeatMode === 'all' ? 'one' : repeatMode === 'one' ? 'off' : 'all'; repeatButton.dataset.mode = repeatMode; repeatButton.textContent = repeatMode === 'all' ? '↻ REPEAT ALL' : repeatMode === 'one' ? '↻ REPEAT ONE' : '↻ REPEAT OFF'; repeatButton.setAttribute('aria-label', `Repeat ${repeatMode}`); repeatButton.classList.toggle('is-active', repeatMode !== 'off'); });
  document.addEventListener('keydown', event => { if(event.key === 'Escape' && radioPopup.classList.contains('is-open')) closeRadioPopup(); });
  if (audio) ['play','pause','ended','volumechange'].forEach(name => audio.addEventListener(name, () => { syncPopupPlayback(); if(radioPopup.classList.contains('is-open')) renderRadioLibrary(); }));



  // Compact atmosphere settings. Preferences persist locally and never affect the core site when unavailable.
  const settingsButton = document.createElement('button');
  settingsButton.type = 'button'; settingsButton.className = 'arcade-settings-trigger'; settingsButton.textContent = '⚙'; settingsButton.setAttribute('aria-label','Open atmosphere settings'); settingsButton.title = 'Atmosphere settings';
  const navBar = $('.navbar');
  const isMobileNavbar = window.matchMedia('(max-width:760px)').matches;
  const settingsNavAnchor = isMobileNavbar ? ($('.nav-menu-toggle') || $('.nav-dropdown-toggle')) : ($('.nav-dropdown-toggle') || $('.nav-menu-toggle'));
  if (settingsNavAnchor && settingsNavAnchor.parentElement) {
    settingsNavAnchor.insertAdjacentElement(isMobileNavbar ? 'beforebegin' : 'afterend', settingsButton);
    settingsButton.classList.add('in-navbar');
  }
  else if (navBar) { navBar.appendChild(settingsButton); settingsButton.classList.add('in-navbar'); }
  else document.body.appendChild(settingsButton);
  const settingsPanel = document.createElement('section'); settingsPanel.className = 'arcade-settings-panel'; settingsPanel.setAttribute('role','dialog'); settingsPanel.setAttribute('aria-label','Atmosphere settings'); settingsPanel.setAttribute('aria-hidden','true');
  settingsPanel.innerHTML = '<div class="arcade-settings-head"><strong>ATMOSPHERE SETTINGS</strong><button type="button" aria-label="Close settings">×</button></div><label><input type="checkbox" data-effect="crt"> CRT scanlines</label><label><input type="checkbox" data-effect="sparkles"> Sparkles and particles</label><label><input type="checkbox" data-effect="static"> Screen static</label><label><input type="checkbox" data-effect="music"> Background music</label><p>Preferences are saved on this device.</p>';
  document.body.appendChild(settingsPanel);
  const effectSelectors = { crt: ['body'], sparkles: ['.particle','.sparkle','.ambient-particle'], static: ['.crt-static','.screen-static','.static-overlay'], music: [] };
  function setEffect(name, enabled) {
    if (name === 'music') { if (audio) { if (enabled) { muted = false; audio.muted = false; if (muteButton) { muteButton.textContent='🔊'; muteButton.setAttribute('aria-label','Mute audio'); } } else { muted = true; audio.muted = true; if (muteButton) { muteButton.textContent='🔇'; muteButton.setAttribute('aria-label','Unmute audio'); } } saveRadioState(); } }
    else if (name === 'crt') document.body.classList.toggle('effects-crt-off', !enabled);
    else if (name === 'sparkles') document.body.classList.toggle('effects-sparkles-off', !enabled);
    else if (name === 'static') document.body.classList.toggle('effects-static-off', !enabled);
    try { localStorage.setItem('arcadeEffect_'+name, String(enabled)); } catch (_) {}
  }
  settingsPanel.querySelectorAll('[data-effect]').forEach(input => {
    let enabled = true; try { enabled = localStorage.getItem('arcadeEffect_'+input.dataset.effect) !== 'false'; } catch (_) {}
    if (input.dataset.effect === 'music') enabled = !muted;
    input.checked = enabled; setEffect(input.dataset.effect, enabled);
    input.addEventListener('change', () => setEffect(input.dataset.effect, input.checked));
  });
  settingsButton.addEventListener('click', () => {
    const open = !settingsPanel.classList.contains('is-open');
    settingsPanel.classList.toggle('is-open', open);
    settingsPanel.setAttribute('aria-hidden', String(!open));
    if (open) {
      const r = settingsButton.getBoundingClientRect();
      settingsPanel.style.bottom = 'auto';
      if (window.matchMedia('(max-width:760px)').matches) {
        settingsPanel.style.left = '8px';
        settingsPanel.style.right = '8px';
        settingsPanel.style.width = 'auto';
        const panelHeight = settingsPanel.getBoundingClientRect().height;
        settingsPanel.style.top = `${Math.max(8, Math.min(r.bottom + 8, window.innerHeight - panelHeight - 8))}px`;
      } else {
        settingsPanel.style.left = 'auto';
        settingsPanel.style.width = '';
        settingsPanel.style.top = `${Math.max(8, Math.min(window.innerHeight - 20, r.bottom + 8))}px`;
        settingsPanel.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
      }
    }
  });
  settingsPanel.querySelector('button').addEventListener('click', () => { settingsPanel.classList.remove('is-open'); settingsPanel.setAttribute('aria-hidden','true'); });

  // Lightweight local achievements: unlock milestones without accounts or external services.
  const achievementKey = 'sethsArcadeAchievements';
  function readAchievements() { try { return JSON.parse(localStorage.getItem(achievementKey) || '{}'); } catch (_) { return {}; } }
  function unlockAchievement(id, title, detail) {
    const achievements = readAchievements(); if (achievements[id]) return;
    achievements[id] = { title, detail, unlockedAt: Date.now() };
    try { localStorage.setItem(achievementKey, JSON.stringify(achievements)); } catch (_) {}
    const toast = document.createElement('div'); toast.className='achievement-toast'; toast.setAttribute('role','status'); toast.innerHTML='<span aria-hidden="true">🏆</span><div><strong>ACHIEVEMENT UNLOCKED</strong><p></p></div>'; toast.querySelector('p').textContent = title + ' — ' + detail; document.body.appendChild(toast);
    window.setTimeout(() => toast.classList.add('is-visible'), 20); window.setTimeout(() => toast.remove(), 4200);
  }
  let songsPlayed = 0;
  if (audio) audio.addEventListener('play', () => { songsPlayed++; if (songsPlayed === 1) unlockAchievement('first-track','Sound Check','Played your first track'); });
  document.addEventListener('click', event => {
    if (event.target.closest('.hub-card[href="arcade.html"], [data-nav="arcade"]')) unlockAchievement('arcade-explorer','Arcade Explorer','Found the games');
    if (event.target.closest('#fairy-next') && tutorial && stepIndex === steps.length - 1) unlockAchievement('fairy-friend','Fairy Friend','Completed the guided tour');
  });

  // Short synthesized UI bleeps keep feedback lightweight and avoid extra audio assets.
  function uiBleep() {
    if (muted || reducedMotion) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + .045);
      gain.gain.setValueAtTime(.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .06);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .065);
      osc.onended = () => ctx.close();
    } catch (_) {}
  }
  document.addEventListener('click', event => {
    const control = event.target.closest('button, .navbar a, .hub-card, .arcade-cta, #press-start');
    if (control && !control.matches(':disabled')) uiBleep();
  }, true);

  // Fairy's proactive guide tips: short contextual nudges beside her dock, never an intrusive modal.
  const fairyDock = $('#fairy-dock');
  const fairyFab = $('#fairy-fab');
  if (fairyDock && fairyFab) {
    const tip = document.createElement('div');
    tip.className = 'fairy-quick-tip'; tip.setAttribute('role','status'); tip.setAttribute('aria-live','polite');
    fairyDock.insertBefore(tip, fairyFab);
    const tips = [
      'Did you know? Tetris was created by Alexey Pajitnov in 1984.',
      'Pong, one of the earliest arcade hits, was released by Atari in 1972.',
      'Explore all fifteen mini-games from the Arcade page, then come back for another round.',
      'This portfolio brings together Seth’s IT interests, projects, and browser-playable games.',
      'The Projects page highlights the EnerhAIa capstone prototype.',
      'Open Arcade Radio to choose a soundtrack, seek within a song, or shuffle the playlist.',
      'You can tune the site atmosphere with Settings: CRT scanlines, static, sparkles, and music.',
      'Tip: try keyboard controls inside a game, and check each game’s on-screen instructions.'
    ];
    let tipIndex = 0, tipTimer = 0, tipHideTimer = 0;
    const showTip = (message, duration = 6500) => {
      tip.textContent = message; tip.classList.add('is-visible');
      window.clearTimeout(tipHideTimer);
      tipHideTimer = window.setTimeout(() => tip.classList.remove('is-visible'), duration);
    };
    // Occasional hints only; don't interrupt the tutorial or an open chat/player dialog.
    if (!reducedMotion) tipTimer = window.setInterval(() => {
      if (document.hidden || fairyDock.classList.contains('chat-open') || $('#fairy-tutorial')?.classList.contains('is-active') || $('#radio-popup')?.classList.contains('is-open')) return;
      showTip(tips[tipIndex++ % tips.length], 6500);
    }, 150000);
    $$('.project-card, .game-card, .hub-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent?.trim();
      if (!title) return;
      card.addEventListener('pointerenter', () => {
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !fairyDock.classList.contains('chat-open')) {
          const facts = {
            'Connect Four': 'Game: Connect Four — Drop discs into columns and connect four in a row. Tip: build two-way threats and block an opponent’s immediate win.',
            'Snake': 'Game: Snake — Guide the snake to eat food and grow without hitting walls or itself. Tip: plan turns early and leave an escape route.',
            'Tic-Tac-Toe': 'Game: Tic-Tac-Toe — Get three of your marks in a row. Tip: take the center or a corner and watch for forks.',
            'Rock Paper Scissors': 'Game: Rock Paper Scissors — Choose rock, paper, or scissors to beat the computer. Tip: mix up choices and avoid predictable patterns.',
            'Hangman': 'Game: Hangman — Guess the hidden word before you run out of tries. Tip: try common vowels early and use letter positions as clues.',
            'Brick Breaker': 'Game: Brick Breaker — Bounce the ball to clear the bricks. Tip: aim for gaps and use paddle position to influence the ball angle.',
            'Tetris': 'Game: Tetris — Arrange falling blocks to complete horizontal lines. Tip: keep the stack low and leave a clean well for long pieces.',
            'Pong': 'Game: Pong — Move your paddle to return the ball past your opponent. Tip: meet the ball early and use paddle contact position to aim.',
            'Minesweeper': 'Game: Minesweeper — Reveal safe tiles while avoiding hidden mines. Tip: each number counts mines in its eight neighboring squares.',
            'Galaga': 'Game: Galaga — Pilot a ship and shoot incoming alien waves. Tip: keep moving, watch enemy attack patterns, and fire steadily.',
            '2048': 'Game: 2048 — Slide matching numbered tiles together to reach 2048. Tip: keep your largest tile in a corner and build around it.',
            'Frogger': 'Game: Frogger — Cross traffic and water to reach the home pads. Tip: move in short, deliberate steps and time road crossings between vehicles.',
            'Whack-a-Mole': 'Game: Whack-a-Mole — Hit moles as they pop up before time runs out. Tip: scan the whole board and prioritize quick, safe hits.',
            'Dinosaur Run': 'Game: Dinosaur Run — Jump over obstacles and survive as the run speeds up. Tip: watch the ground ahead and jump early for tall obstacles.',
            'Doodle Jumper': 'Game: Doodle Jumper — Bounce upward from platform to platform. Tip: line up your landings and favor stable platforms when choosing a route.',
          };
          const gameTip = facts[title] || (card.classList.contains('project-card') ? `${title}: Select Play Game to give it a try.` : `${title}: Open this section to explore.`);
          showTip(gameTip.length > 180 ? gameTip.slice(0,177)+'…' : gameTip, 7500);
        }
      });
      card.addEventListener('focusin', () => showTip(facts[title] || `${title}: Select to explore.`, 6000));
    });
    fairyFab.addEventListener('click', () => { tip.classList.remove('is-visible'); window.clearTimeout(tipHideTimer); });
    window.addEventListener('pagehide', () => window.clearInterval(tipTimer));
  }

  // Current page navigation state.
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  const currentKey = currentFile.replace('.html', '') === 'index' ? 'home' : currentFile.replace('.html', '');
  $$('[data-nav]').forEach(link => {
    if (link.dataset.nav === currentKey) {
      link.classList.add('is-current'); link.setAttribute('aria-current', 'page');
    }
  });

  // Intro and Fairy tutorial run only on Home. Other pages open directly.
  const intro = $('#intro-screen');
  const pressStart = $('#press-start');
  const tutorial = $('#fairy-tutorial');
  const tutorialText = $('#fairy-tutorial-text');
  const progress = $('#fairy-progress-fill');
  const next = $('#fairy-next');
  const back = $('#fairy-back');
  const skip = $('#fairy-skip');
  const dock = $('#fairy-dock');
  const highlightLabel = $('#fairy-highlight-label');
  const steps = [
    { target: null, label: 'WELCOME, PLAYER', text: "Welcome, player! I'm Fairy, your guide and host here at Fairy's Arcade. I'll help you explore the games, discover the portfolio, and find your way around." },
    { target: '[data-nav="home"]', label: 'HOME', text: "Home is your starting point, with an overview and shortcuts to explore the portfolio." },
    { target: '[data-nav="arcade"]', label: 'ARCADE', text: "Ready to play? Open Arcade to find all fifteen mini-games and choose one to launch." },
    { target: null, label: 'ARCADE RADIO', radio: true, text: "Arcade Radio lives here! Play or pause the soundtrack, switch tracks, or mute the audio whenever you like." },
    { target: '#nav-about-link', label: 'ABOUT ME', openAbout: true, text: "About Me introduces Seth and his background. The small arrow beside it opens the other portfolio destinations, too." },
    { target: '#nav-about-menu', label: 'MORE DESTINATIONS', openAbout: true, text: "Here are the extra destinations: Skills covers skills and experience, Projects showcases work and content creation, and Contact has the available ways to get in touch." }
  ];
  let stepIndex = 0, tutorialActive = false, transitioning = false, portfolioStarted = false;
  function clearHighlight() {
    $$('.fairy-tutorial-target').forEach(el => el.classList.remove('fairy-tutorial-target'));
    $$('.fairy-radio-target').forEach(el => el.classList.remove('fairy-radio-target'));
    if (highlightLabel) { highlightLabel.classList.remove('is-visible'); highlightLabel.setAttribute('aria-hidden', 'true'); }
  }
  function placeLabel(target, label) {
    if (!highlightLabel || !target) return;
    const rect = target.getBoundingClientRect();
    highlightLabel.textContent = label;
    highlightLabel.style.left = `${Math.max(10, Math.min(window.innerWidth - 230, rect.left))}px`;
    highlightLabel.style.top = `${Math.max(10, rect.top - 42)}px`;
    highlightLabel.classList.add('is-visible'); highlightLabel.setAttribute('aria-hidden', 'false');
  }
  const nav = $('.navbar');
  const navLinks = $('#primary-navigation');
  const navMenuToggle = $('.nav-menu-toggle');
  const aboutGroup = $('#nav-about-group');
  const aboutToggle = $('#nav-about-toggle');
  const aboutMenu = $('#nav-about-menu');
  function setMobileMenu(open) {
    if (!navLinks || !navMenuToggle) return;
    navLinks.classList.toggle('is-open', open);
    navMenuToggle.classList.toggle('is-open', open);
    navMenuToggle.setAttribute('aria-expanded', String(open));
    navMenuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  function setAboutMenu(open) {
    if (!aboutGroup || !aboutToggle) return;
    aboutGroup.classList.toggle('is-expanded', open);
    aboutToggle.setAttribute('aria-expanded', String(open));
  }
  if (navMenuToggle) navMenuToggle.addEventListener('click', () => setMobileMenu(!navLinks.classList.contains('is-open')));
  if (aboutToggle) aboutToggle.addEventListener('click', event => { event.stopPropagation(); setAboutMenu(!aboutGroup.classList.contains('is-expanded')); });
  if (['skills', 'projects', 'contact'].includes(currentKey)) setAboutMenu(true);
  document.addEventListener('click', event => {
    if (aboutGroup && !aboutGroup.contains(event.target) && !tutorialActive) setAboutMenu(false);
  });
  if (navLinks) navLinks.addEventListener('click', event => {
    if (event.target.closest('a')) { setMobileMenu(false); if (!event.target.closest('#nav-about-group')) setAboutMenu(false); }
  });

  function renderStep() {
    if (!tutorialText) return;
    clearHighlight();
    const step = steps[stepIndex];
    tutorial.classList.toggle('is-intro-step', stepIndex === 0);
    tutorial.classList.toggle('is-radio-step', !!step.radio);
    document.body.classList.toggle('fairy-radio-demo-step', !!step.radio);
    const radioDemo = $('#fairy-radio-demo');
    if (radioDemo) radioDemo.setAttribute('aria-hidden', String(!step.radio));
    tutorial.classList.toggle('is-nav-step', stepIndex > 0 && !step.radio);
    tutorialText.textContent = step.text;
    if (progress) progress.style.width = `${((stepIndex + 1) / steps.length) * 100}%`;
    if (back) { back.disabled = stepIndex === 0; back.style.opacity = stepIndex === 0 ? '.4' : '1'; }
    if (next) next.innerHTML = stepIndex === steps.length - 1 ? 'LET’S GO ▶' : 'NEXT ▶';
    // Keep the mobile menu open while Fairy demonstrates navigation, then expand About Me for its step.
    if (window.matchMedia('(max-width: 760px)').matches && stepIndex > 0) setMobileMenu(true);
    // The radio tutorial uses an in-dialogue demo instead of moving or spotlighting the real fixed player.
    const radio = $('#music-player');
    if (radio) radio.classList.remove('fairy-radio-target', 'fairy-tutorial-target');
    const restoreRadio = $('#music-restore');
    if (restoreRadio) restoreRadio.classList.remove('fairy-radio-target', 'fairy-tutorial-target');
    setAboutMenu(!!step.openAbout);
    if (step.target) {
      const target = $(step.target);
      if (target) {
        target.classList.add('fairy-tutorial-target');
        if (step.target === '#nav-about-menu') aboutGroup?.classList.add('fairy-tutorial-target');
        requestAnimationFrame(() => placeLabel(target, step.label));
      }
    }
  }
  function beginTutorial() {
    if (!tutorial || tutorialActive || transitioning || portfolioStarted) return;
    tutorialActive = true; stepIndex = 0;
    document.body.classList.add('fairy-tutorial-open');
    tutorial.classList.remove('is-leaving', 'is-docking'); tutorial.classList.add('is-active');
    tutorial.setAttribute('aria-hidden', 'false'); renderStep();
    if (skip) skip.focus({ preventScroll: true });
  }
  function startupSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx || muted) return;
      const ctx = new AudioCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.setValueAtTime(220, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + .16);
      gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.09, ctx.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .2);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .21);
    } catch (_) { /* Audio is an enhancement; navigation still works without it. */ }
  }
  function startPortfolio() {
    if (portfolioStarted) return; portfolioStarted = true;
    startupSound(); if (!muted) startMusic();
    if (intro) {
      intro.classList.add('transition-started');
      window.setTimeout(() => { intro.remove(); document.body.classList.remove('intro-active'); }, reducedMotion ? 50 : 750);
    }
  }
  function finishTutorial() {
    if (transitioning) return; transitioning = true; tutorialActive = false; clearHighlight();
    setMobileMenu(false); setAboutMenu(false);
    document.body.classList.remove('fairy-tutorial-open', 'fairy-radio-demo-step');
    if (tutorial) { tutorial.classList.add('is-leaving', 'is-docking'); tutorial.setAttribute('aria-hidden', 'true'); }
    startPortfolio();
    // Reveal the dock while the tutorial mascot is still travelling, so it feels like one continuous movement.
    window.setTimeout(() => { if (dock) dock.classList.add('is-visible', 'is-arriving'); }, reducedMotion ? 0 : 430);
    window.setTimeout(() => {
      if (tutorial) { tutorial.classList.remove('is-active', 'is-leaving', 'is-docking'); }
      if (dock) dock.classList.remove('is-arriving'); transitioning = false;
    }, reducedMotion ? 80 : 900);
  }
  if (pressStart) {
    pressStart.addEventListener('click', beginTutorial);
    pressStart.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); beginTutorial(); } });
  }
  if (next) next.addEventListener('click', () => { if (stepIndex < steps.length - 1) { stepIndex++; renderStep(); } else finishTutorial(); });
  if (back) back.addEventListener('click', () => { if (stepIndex > 0) { stepIndex--; renderStep(); } });
  if (skip) skip.addEventListener('click', finishTutorial);
  window.addEventListener('resize', () => { if (tutorialActive) renderStep(); });

  // On non-home pages Fairy is available immediately. Home reveals her after the tutorial.
  if (!intro && dock) dock.classList.add('is-visible');
  const fab = $('#fairy-fab'), chatPanel = $('#fairy-chat-panel'), chatClose = $('#fairy-chat-close');
  const chatForm = $('#fairy-chat-form'), chatInput = $('#fairy-chat-input'), chatMessages = $('#fairy-chat-messages');
  function toggleChat(force) {
    if (!dock) return;
    const open = typeof force === 'boolean' ? force : !dock.classList.contains('chat-open');
    dock.classList.toggle('chat-open', open); try { sessionStorage.setItem('fairyChatOpen',String(open)); } catch (_) {}
    if (fab) fab.setAttribute('aria-expanded', String(open));
    if (chatPanel) chatPanel.setAttribute('aria-hidden', String(!open));
    if (open && chatInput) chatInput.focus();
  }
  if (fab) fab.addEventListener('click', () => toggleChat());
  if (chatClose) chatClose.addEventListener('click', () => toggleChat(false));
  function addMessage(text, who) {
    if (!chatMessages) return;
    const message = document.createElement('div'); message.className = `fairy-message ${who === 'user' ? 'fairy-message-user' : 'fairy-message-bot'}`;
    message.textContent = text; chatMessages.appendChild(message); chatMessages.scrollTop = chatMessages.scrollHeight;
    try { const history = JSON.parse(sessionStorage.getItem('fairyChatHistory') || '[]'); history.push({text,who}); sessionStorage.setItem('fairyChatHistory',JSON.stringify(history.slice(-40))); } catch (_) {}
  }
  try {
    const history = JSON.parse(sessionStorage.getItem('fairyChatHistory') || '[]');
    if (chatMessages && Array.isArray(history) && history.length) { chatMessages.innerHTML=''; history.forEach(item => { const m=document.createElement('div'); m.className=`fairy-message ${item.who==='user'?'fairy-message-user':'fairy-message-bot'}`; m.textContent=String(item.text||''); chatMessages.appendChild(m); }); }
    if(chatInput) chatInput.value=sessionStorage.getItem('fairyChatDraft')||'';
    if(sessionStorage.getItem('fairyChatOpen')==='true'){dock?.classList.add('chat-open');fab?.setAttribute('aria-expanded','true');chatPanel?.setAttribute('aria-hidden','false');}
  } catch (_) {}
  if(chatInput) chatInput.addEventListener('input',()=>{try{sessionStorage.setItem('fairyChatDraft',chatInput.value)}catch(_){}});
  function reply(message) {
    const text = message.toLowerCase();
    // Knowledge is maintained in fairy-knowledge.js so portfolio facts can be edited without rewriting chat logic.
    const knowledge = window.FAIRY_KNOWLEDGE || [];
    for (const entry of knowledge) {
      if (entry.patterns.some(pattern => text.includes(pattern))) return entry.answer;
    }
    if (/hello|\bhi\b|hey|good morning|good afternoon/.test(text)) return "Hey, player! ✦ I'm Fairy, your local portfolio guide. What would you like to explore?";
    if (/arcade|game|snake|tetris|pong|connect four|minesweeper|hangman|brick breaker|tic.?tac.?toe|rock.?paper.?scissors/.test(text)) return 'The Arcade page holds all nine mini-games: Connect Four, Tic-Tac-Toe, Snake, Rock Paper Scissors, Hangman, Brick Breaker, Tetris, Pong, and Minesweeper. Open a card to play.';
    if (/about|who is seth|profile/.test(text)) return "Seth Eulice T. Semilla is an Information Technology student interested in computers, hardware, software, and interactive digital projects. Visit About Me for the profile.";
    if (/skill|experience|education|school|college/.test(text)) return 'Open Skills / Experience from the top navigation to see the education and learning context documented in this portfolio.';
    if (/project|enerhaia|capstone/.test(text)) return 'The Projects page includes a reference to the supplied EnerhAIa capstone prototype. It is described as a prototype, not a live service.';
    if (/facebook|social|contact|reach|message/.test(text)) return "The Contact page links to Seth's Facebook profile, the contact option included in the original source.";
    if (/music|sound|audio|mute|volume|song/.test(text)) return 'Use the Arcade Radio panel on the left to play or pause music, switch between the MP3s included in this project, or mute audio.';
    if (/help|navigate|how do i|how to|where/.test(text)) return 'Use the navigation bar to move between Home, About Me, Skills / Experience, Projects, Arcade, and Contact. You can open me again with the floating Fairy button.';
    if (/fairy|are you ai|what are you|who are you/.test(text)) return "I'm Fairy, your arcade guide! This version uses local scripted responses; it is not connected to a live AI model.";
    return 'I’m still learning that topic! Try asking about Seth, his education, projects, the website features, Arcade Radio, or a specific game. My answers are based on the information included with this portfolio, so I won’t invent personal details.';
  }
  function submitMessage(message) {
    const clean = (message || '').trim(); if (!clean) return;
    addMessage(clean, 'user'); window.setTimeout(() => addMessage(reply(clean), 'bot'), 220);
  }
  if (chatForm) chatForm.addEventListener('submit', event => { event.preventDefault(); submitMessage(chatInput ? chatInput.value : ''); if (chatInput) { chatInput.value = ''; try { sessionStorage.removeItem('fairyChatDraft'); } catch (_) {} } });
  $$('[data-fairy-prompt]').forEach(button => button.addEventListener('click', () => submitMessage(button.dataset.fairyPrompt)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (tutorialActive) finishTutorial(); else if (dock && dock.classList.contains('chat-open')) toggleChat(false);
      const modal = $('#game-modal'); if (modal && modal.style.display === 'flex') closeGame();
    }
  });

  // All arcade games remain individual game pages, launched from Arcade.
  const modal = $('#game-modal'), frame = $('#connect-four-frame'), closeButton = $('#close-game-modal');
  let resumeMusicAfterGame = false;
  const gameSoundToggle = $('#game-sound-toggle');
  let gameSfxMuted = false, gameAudioContext = null, gameSfxLastAt = 0;
  function playGameSfx(kind = 'tap') {
    if (gameSfxMuted || !modal || modal.style.display !== 'flex') return;
    const now = performance.now(); if (now - gameSfxLastAt < 55) return; gameSfxLastAt = now;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
      if (!gameAudioContext) gameAudioContext = new Ctx();
      if (gameAudioContext.state === 'suspended') gameAudioContext.resume();
      const ctx = gameAudioContext, osc = ctx.createOscillator(), gain = ctx.createGain();
      const tones = kind === 'key' ? [410, 560] : kind === 'button' ? [520, 720] : [300, 390];
      osc.type = 'square'; osc.frequency.setValueAtTime(tones[0], ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(tones[1], ctx.currentTime + .045);
      gain.gain.setValueAtTime(.022, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .065);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .07);
    } catch (_) {}
  }
  function bindGameSound() {
    try {
      const doc = frame.contentDocument; if (!doc) return;
      doc.addEventListener('click', event => { if (event.target.closest('button,[role="button"],canvas,.cell,.choice')) playGameSfx(event.target.closest('button') ? 'button' : 'tap'); }, true);
      doc.addEventListener('keydown', event => { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','a','A','d','D','w','W','s','S'].includes(event.key)) playGameSfx('key'); }, true);
      doc.querySelectorAll('audio,video').forEach(el => { el.muted = gameSfxMuted; });
    } catch (_) {}
  }
  if (gameSoundToggle) gameSoundToggle.addEventListener('click', () => {
    gameSfxMuted = !gameSfxMuted;
    gameSoundToggle.textContent = gameSfxMuted ? '🔇 Muted' : '🔊 Sound';
    gameSoundToggle.setAttribute('aria-pressed', String(gameSfxMuted));
    gameSoundToggle.setAttribute('aria-label', gameSfxMuted ? 'Unmute game sound effects' : 'Mute game sound effects');
    try {
      const doc = frame.contentDocument;
      doc?.querySelectorAll('audio,video').forEach(el => { el.muted = gameSfxMuted; });
      // Games with their own sound switch (e.g. Galaga/Frogger/2048) stay in sync with the popup control.
      const nativeSoundToggle = doc?.querySelector('#sound-toggle, .music-toggle');
      if (nativeSoundToggle) nativeSoundToggle.click();
    } catch (_) {}
    if (!gameSfxMuted) playGameSfx('button');
  });
  if (frame) frame.addEventListener('load', bindGameSound);
  const gamePaths = {
    'connect-four-button': ['projects/connect-four/index.html', 'Connect Four'],
    'tic-tac-toe-button': ['projects/tic-tac-toe/index.html', 'Tic-Tac-Toe'],
    'snake-button': ['projects/snake/index.html', 'Snake'],
    'rock-paper-scissors-button': ['projects/rock-paper-scissors/index.html', 'Rock Paper Scissors'],
    'hangman-button': ['projects/hangman/index.html', 'Hangman'],
    'brick-breaker-button': ['projects/brick-breaker/index.html', 'Brick Breaker'],
    'tetris-button': ['projects/tetris/index.html', 'Tetris'],
    'pong-button': ['projects/pong/index.html', 'Pong'],
    'minesweeper-button': ['projects/minesweeper/index.html', 'Minesweeper'],
    'galaga-button': ['projects/galaga/index.html', 'Galaga'],
    '2048-button': ['projects/2048/index.html', '2048'],
    'frogger-button': ['projects/frogger/index.html', 'Frogger'],
    'whack-a-mole-button': ['projects/whack-a-mole/index.html', 'Whack-a-Mole'],
    'dinosaur-button': ['projects/dinosaur/index.html', 'Dinosaur Run'],
    'doodle-jumper-button': ['projects/doodle-jumper/index.html', 'Doodle Jumper']
  };
  function openGame(path, title) {
    if (!modal || !frame) return;
    // Keep background music running for every game except Tetris, whose rhythm/game audio can clash.
    const shouldPauseForThisGame = title === 'Tetris';
    resumeMusicAfterGame = shouldPauseForThisGame && Boolean(audio && !audio.paused && !muted);
    if (shouldPauseForThisGame && audio && !audio.paused) audio.pause();
    frame.title = `${title} mini-game`; gameSfxMuted = false; if (gameSoundToggle) { gameSoundToggle.textContent = '🔊 Sound'; gameSoundToggle.setAttribute('aria-pressed','false'); gameSoundToggle.setAttribute('aria-label','Mute game sound effects'); } frame.src = path; modal.style.display = 'flex'; modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('game-open');
  }
  function closeGame() {
    if (!modal || !frame) return;
    modal.style.display = 'none'; modal.setAttribute('aria-hidden', 'true'); frame.src = ''; document.body.classList.remove('game-open');
    if (resumeMusicAfterGame && !muted) startMusic();
    resumeMusicAfterGame = false;
  }
  Object.entries(gamePaths).forEach(([id, data]) => { const button = document.getElementById(id); if (button) button.addEventListener('click', () => openGame(data[0], data[1])); });
  if (closeButton) closeButton.addEventListener('click', closeGame);
  if (modal) modal.addEventListener('click', event => { if (event.target === modal) closeGame(); });
})();

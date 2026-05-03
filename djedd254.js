/* ╔══════════════════════════════════════════════════════════════════╗
   ║           DJ EDD254 — OFFICIAL WEBSITE JAVASCRIPT               ║
   ║           djedd254.js  ·  v1.0  ·  Mombasa, Kenya              ║
   ║                                                                  ║
   ║  HOW TO USE:                                                     ║
   ║  1. Save this file as  djedd254.js                              ║
   ║  2. Place it in the same folder as  djedd254.html               ║
   ║  3. In your HTML, find the <script>…</script> block and         ║
   ║     DELETE the entire thing.                                     ║
   ║  4. Just before </body>, paste this single line:                ║
   ║         <script src="djedd254.js"></script>                     ║
   ║  5. Save and open djedd254.html — everything works exactly      ║
   ║     as before, now cleanly separated.                            ║
   ║                                                                  ║
   ║  KEYBOARD SHORTCUTS (when not typing in a form):                ║
   ║    Space       → Play / Pause current track                     ║
   ║    → (Right)   → Next track                                     ║
   ║    ← (Left)    → Previous track                                 ║
   ║    M           → Mute / Unmute                                  ║
   ║    Escape      → Close video lightbox                           ║
   ╚══════════════════════════════════════════════════════════════════╝

   TABLE OF CONTENTS
   ──────────────────────────────────────────────────────────────────
    1.  Utility Helpers
    2.  Custom Cursor
    3.  Navigation — Scroll Shrink & Active Link
    4.  Mobile Menu
    5.  Scroll Reveal (IntersectionObserver)
    6.  Toast Notification
    7.  Vinyl Disc — Pause on Scroll
    8.  About Photo Upload
    9.  Audio Engine
        9a.  State variables
        9b.  Audio element event listeners
        9c.  File input & drag-and-drop handlers
        9d.  Track management (add / delete)
        9e.  Playback controls (play, pause, next, prev, seek)
        9f.  Shuffle & Repeat
        9g.  Volume control
        9h.  Track list renderer
   10.  Video Gallery Engine
        10a. State variables
        10b. File input & drag-and-drop handlers
        10c. Video management (add / delete)
        10d. Video grid renderer
        10e. Lightbox (fullscreen player)
   11.  Drag-and-Drop Zone Helpers
   12.  Events Section Builder
   13.  Photo Gallery
        13a. Gallery grid builder
        13b. Slot upload & clear
   14.  Booking Form Validator & Submit
   15.  Keyboard Shortcuts
   16.  Initialisation  (runs on DOMContentLoaded)
   ────────────────────────────────────────────────────────────────── */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   1. UTILITY HELPERS
═══════════════════════════════════════════════════════════════════ */

/**
 * Shorthand for document.getElementById()
 * @param {string} id
 * @returns {HTMLElement|null}
 */
const $ = id => document.getElementById(id);

/**
 * Shorthand for document.querySelector()
 * @param {string} sel  CSS selector
 * @returns {Element|null}
 */
const $q = sel => document.querySelector(sel);

/**
 * Shorthand for document.querySelectorAll()
 * @param {string} sel  CSS selector
 * @returns {NodeList}
 */
const $all = sel => document.querySelectorAll(sel);

/**
 * Format seconds into m:ss string.
 * @param {number} totalSeconds
 * @returns {string}  e.g. "3:07"
 */
function formatTime(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Sanitise a raw filename by stripping its extension.
 * @param {string} filename   e.g. "Coast Vibez Vol.3.mp3"
 * @returns {string}          e.g. "Coast Vibez Vol.3"
 */
function stripExtension(filename) {
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Clamp a number between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}


/* ═══════════════════════════════════════════════════════════════════
   2. CUSTOM CURSOR
   Two-part cursor: a small filled dot that follows the mouse
   instantly, and a larger ring that lags behind for a smooth feel.
═══════════════════════════════════════════════════════════════════ */
(function initCursor() {
  const dot  = $('cur');
  const ring = $('cur-r');
  if (!dot || !ring) return;          // bail if elements not in DOM

  // Target coordinates (updated on every mousemove)
  let mx = 0, my = 0;
  // Ring's current interpolated coordinates
  let rx = 0, ry = 0;
  // Easing factor: lower = more lag (smoother)
  const EASE = 0.1;

  // Track raw mouse position
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  // Hide cursor when it leaves the window
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '0.5';
  });

  // Expand ring on interactive elements
  document.addEventListener('mouseover', e => {
    if (e.target.matches('a, button, [onclick], input, select, textarea, .track-item, .video-card, .gal-item')) {
      ring.style.width     = '48px';
      ring.style.height    = '48px';
      ring.style.opacity   = '0.3';
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.matches('a, button, [onclick], input, select, textarea, .track-item, .video-card, .gal-item')) {
      ring.style.width   = '32px';
      ring.style.height  = '32px';
      ring.style.opacity = '0.5';
    }
  });

  // Animation loop — dot snaps, ring eases
  function loop() {
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';

    rx += (mx - rx) * EASE;
    ry += (my - ry) * EASE;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';

    requestAnimationFrame(loop);
  }
  loop();
})();


/* ═══════════════════════════════════════════════════════════════════
   3. NAVIGATION — SCROLL SHRINK & ACTIVE LINK
═══════════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav = $('mainNav');
  if (!nav) return;

  // Shrink navbar after scrolling 60px
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    highlightActiveLink();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Highlight nav link for the section currently in view
  function highlightActiveLink() {
    const sections = $all('section[id]');
    const scrollY  = window.scrollY + 100;

    sections.forEach(section => {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');
      const link   = $q(`.nav-links a[href="#${id}"]`);

      if (link) {
        link.classList.toggle('active-link', scrollY >= top && scrollY < top + height);
      }
    });
  }
})();


/* ═══════════════════════════════════════════════════════════════════
   4. MOBILE MENU
═══════════════════════════════════════════════════════════════════ */

/** Toggle the full-screen mobile menu open/closed. */
function toggleMenu() {
  const menu = $('mobileMenu');
  if (!menu) return;
  const isOpen = menu.classList.toggle('open');
  // Prevent body scroll while menu is open
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

// Close mobile menu when pressing Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const menu = $('mobileMenu');
    if (menu && menu.classList.contains('open')) {
      toggleMenu();
    }
  }
});


/* ═══════════════════════════════════════════════════════════════════
   5. SCROLL REVEAL
   Elements with class "reveal" animate in when they enter the
   viewport. The CSS handles the actual transition.
═══════════════════════════════════════════════════════════════════ */
(function initReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve after revealing — no need to re-check
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  $all('.reveal').forEach(el => observer.observe(el));
})();


/* ═══════════════════════════════════════════════════════════════════
   6. TOAST NOTIFICATION
   Displays a brief message banner at the bottom of the screen.
═══════════════════════════════════════════════════════════════════ */
let toastTimer = null;

/**
 * Show a toast message.
 * @param {string}  message       Text to display
 * @param {number}  [duration=2800] Milliseconds before auto-hide
 * @param {string}  [type='']     Optional CSS modifier class
 */
function showToast(message, duration = 2800, type = '') {
  const toast = $('toast');
  if (!toast) return;

  // Clear any existing timer so toasts don't stack
  if (toastTimer) clearTimeout(toastTimer);

  toast.textContent = message;
  toast.className   = 'toast' + (type ? ' toast--' + type : '');
  toast.classList.add('show');

  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}


/* ═══════════════════════════════════════════════════════════════════
   7. VINYL DISC — PAUSE ON SCROLL
   The spinning vinyl in the hero pauses once the user scrolls
   past the hero section to save CPU.
═══════════════════════════════════════════════════════════════════ */
(function initVinyl() {
  const vinyl = $q('.vinyl');
  if (!vinyl) return;

  window.addEventListener('scroll', () => {
    vinyl.style.animationPlayState = window.scrollY > 400 ? 'paused' : 'running';
  }, { passive: true });
})();


/* ═══════════════════════════════════════════════════════════════════
   8. ABOUT PHOTO UPLOAD
   Lets the DJ upload a personal photo into the About section.
   The photo preview replaces the placeholder icon immediately.
═══════════════════════════════════════════════════════════════════ */

/**
 * Called when a file is selected via the photo <input>.
 * @param {Event} e   The file input change event
 */
function uploadPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Only accept image files
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file (JPG, PNG, WEBP…)');
    return;
  }

  const url = URL.createObjectURL(file);
  const box = $('photoBox');

  // Hide the placeholder text/icon
  const placeholder = $('photoPlaceholder');
  if (placeholder) placeholder.style.display = 'none';

  // Reuse existing <img> or create one
  let img = box.querySelector('img.uploaded');
  if (!img) {
    img           = document.createElement('img');
    img.className = 'uploaded';
    img.alt       = 'DJ EDD254 photo';
    box.appendChild(img);
  }
  img.src = url;

  showToast('📸 Photo uploaded!');
}


/* ═══════════════════════════════════════════════════════════════════
   9. AUDIO ENGINE
   A full-featured audio player supporting:
   • Multiple uploaded tracks (MP3, WAV, OGG, FLAC, M4A)
   • Play / Pause / Next / Previous
   • Seek by clicking / dragging the progress bar
   • Repeat (single track) and Shuffle modes
   • Volume control
   • Waveform bar visualisation (CSS animated)
═══════════════════════════════════════════════════════════════════ */

/* ── 9a. State Variables ── */
/**
 * @type {Array<{name:string, url:string, duration:string, size:string}>}
 */
let tracks        = [];
let currentTrack  = -1;          // Index of the currently loaded track
let isPlaying     = false;
let isRepeat      = false;
let isShuffle     = false;
let isMuted       = false;
let lastVolume    = 0.8;         // Saved volume before mute

// The single Audio element used for all playback
const audioEl = new Audio();
audioEl.volume = 0.8;

// Waveform bar heights (percentage) — staggered for visual interest
const WAVE_HEIGHTS = [30, 60, 80, 50, 70, 40, 90, 55];

/* ── 9b. Audio Element Event Listeners ── */

// Update progress bar and elapsed time every frame
audioEl.addEventListener('timeupdate', () => {
  if (!audioEl.duration) return;

  const pct = (audioEl.currentTime / audioEl.duration) * 100;

  const fill  = $('progressFill');
  const thumb = $('progressThumb');
  const elapsed = $('timeElapsed');

  if (fill)    fill.style.width  = pct + '%';
  if (thumb)   thumb.style.left  = pct + '%';
  if (elapsed) elapsed.textContent = formatTime(audioEl.currentTime);
});

// When metadata loads we know the real duration
audioEl.addEventListener('loadedmetadata', () => {
  const dur = $('timeDuration');
  if (dur) dur.textContent = formatTime(audioEl.duration);

  // Store formatted duration in the track object
  if (currentTrack >= 0 && tracks[currentTrack]) {
    tracks[currentTrack].duration = formatTime(audioEl.duration);
    renderTrackList();
  }
});

// Auto-advance when a track ends
audioEl.addEventListener('ended', () => {
  if (isRepeat) {
    // Loop current track
    audioEl.currentTime = 0;
    audioEl.play();
  } else {
    nextTrack();
  }
});

// Handle load errors gracefully
audioEl.addEventListener('error', () => {
  showToast('⚠️ Error loading track — try another file');
  isPlaying = false;
  const btn = $('playBtn');
  if (btn) btn.textContent = '▶';
});

/* ── 9c. File Input & Drag-and-Drop Handlers ── */

/**
 * Called when audio files are chosen via the file <input>.
 * @param {Event} e
 */
function handleAudioFiles(e) {
  addAudioFiles(e.target.files);
  e.target.value = ''; // reset so the same file can be re-added
}

/**
 * Called when files are dropped onto the audio drop zone.
 * @param {DragEvent} e
 */
function handleAudioDrop(e) {
  e.preventDefault();
  handleDragLeave('audioDropZone');
  addAudioFiles(e.dataTransfer.files);
}

/* ── 9d. Track Management ── */

/**
 * Process a FileList and add valid audio files to the track queue.
 * @param {FileList} files
 */
function addAudioFiles(files) {
  const SUPPORTED = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac',
                     'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/webm'];
  let added = 0;

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('audio/') && !SUPPORTED.includes(file.type)) return;

    const url  = URL.createObjectURL(file);
    const name = stripExtension(file.name);
    const size = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    tracks.push({ name, url, duration: '—', size, file });
    added++;
  });

  if (added) {
    renderTrackList();
    // Hide the empty-state placeholder
    const empty = $('audioEmpty');
    if (empty) empty.style.display = 'none';
    showToast(`🎵 ${added} track${added > 1 ? 's' : ''} added!`);
  } else {
    showToast('No supported audio files found (MP3, WAV, OGG, FLAC…)');
  }
}

/**
 * Remove a track from the queue by index.
 * If the removed track was playing, stop playback and reset the player.
 * @param {number} index
 */
function deleteTrack(index) {
  if (index === currentTrack) {
    // Stop playback for the deleted track
    audioEl.pause();
    audioEl.src  = '';
    isPlaying    = false;
    currentTrack = -1;

    // Reset Now Playing UI
    const playBtn  = $('playBtn');
    const npTitle  = $('np-title');
    const npArtist = $('np-artist');
    const fill     = $('progressFill');
    const elapsed  = $('timeElapsed');
    const dur      = $('timeDuration');

    if (playBtn)  playBtn.textContent  = '▶';
    if (npTitle)  npTitle.textContent  = 'No Track Selected';
    if (npArtist) npArtist.textContent = 'Upload a track to begin';
    if (fill)     fill.style.width     = '0%';
    if (elapsed)  elapsed.textContent  = '0:00';
    if (dur)      dur.textContent      = '0:00';

  } else if (currentTrack > index) {
    // Adjust index so it still points to the same track
    currentTrack--;
  }

  // Release the object URL to free memory
  URL.revokeObjectURL(tracks[index].url);
  tracks.splice(index, 1);

  renderTrackList();
  showToast('Track removed');
}

/* ── 9e. Playback Controls ── */

/**
 * Load a track by index and start playing it.
 * If the track is already playing, toggle pause.
 * @param {number} index
 */
function loadTrack(index) {
  // Tapping the currently playing track toggles play/pause
  if (currentTrack === index && isPlaying) {
    togglePlay();
    return;
  }

  currentTrack = index;
  audioEl.src  = tracks[index].url;

  audioEl.play().then(() => {
    isPlaying = true;
    updatePlayButton();
    updateNowPlaying();
    renderTrackList();
  }).catch(err => {
    console.warn('Playback failed:', err);
    showToast('⚠️ Could not play this file');
  });
}

/** Toggle play / pause for the current track. */
function togglePlay() {
  if (!tracks.length) {
    showToast('Upload a track first!');
    return;
  }

  // Nothing loaded yet — start from first track
  if (currentTrack < 0) {
    loadTrack(0);
    return;
  }

  if (isPlaying) {
    audioEl.pause();
    isPlaying = false;
  } else {
    audioEl.play();
    isPlaying = true;
  }

  updatePlayButton();
  renderTrackList();
}

/** Skip to the next track (or a random one if shuffle is on). */
function nextTrack() {
  if (!tracks.length) return;

  let next;
  if (isShuffle) {
    // Pick a random track that isn't the current one
    do { next = Math.floor(Math.random() * tracks.length); }
    while (tracks.length > 1 && next === currentTrack);
  } else {
    next = (currentTrack + 1) % tracks.length;
  }

  loadTrack(next);
}

/** Go to the previous track, or restart the current one if > 3s in. */
function prevTrack() {
  if (!tracks.length) return;

  // If more than 3 seconds in, restart current track
  if (audioEl.currentTime > 3) {
    audioEl.currentTime = 0;
    return;
  }

  const prev = (currentTrack - 1 + tracks.length) % tracks.length;
  loadTrack(prev);
}

/**
 * Seek the audio to the position clicked on the progress bar.
 * @param {MouseEvent} e
 */
function seekAudio(e) {
  if (!audioEl.duration) return;

  const bar = $('progressWrap');
  if (!bar) return;

  const rect = bar.getBoundingClientRect();
  const pct  = clamp((e.clientX - rect.left) / rect.width, 0, 1);
  audioEl.currentTime = pct * audioEl.duration;
}

/* ── 9f. Shuffle & Repeat ── */

/** Toggle repeat mode (loops the current track). */
function toggleRepeat() {
  isRepeat = !isRepeat;
  const btn = $('repeatBtn');
  if (btn) btn.style.color = isRepeat ? 'var(--orange)' : '';
  showToast(isRepeat ? '🔂 Repeat ON' : 'Repeat OFF');
}

/** Toggle shuffle mode (randomises next track selection). */
function shuffleTrack() {
  isShuffle = !isShuffle;
  const btn = $q('[onclick="shuffleTrack()"]');
  if (btn) btn.style.color = isShuffle ? 'var(--orange)' : '';
  showToast(isShuffle ? '🔀 Shuffle ON' : 'Shuffle OFF');
}

/* ── 9g. Volume Control ── */

/**
 * Set the playback volume.
 * @param {number|string} value   0.0 to 1.0
 */
function setVolume(value) {
  const vol = clamp(parseFloat(value), 0, 1);
  audioEl.volume = vol;
  lastVolume     = vol > 0 ? vol : lastVolume;

  // Unmute if the user drags the slider above zero
  if (vol > 0 && isMuted) {
    isMuted        = false;
    audioEl.muted  = false;
  }
}

/** Toggle mute / unmute. */
function toggleMute() {
  isMuted       = !isMuted;
  audioEl.muted = isMuted;

  const slider = $('volSlider');
  if (slider) slider.value = isMuted ? 0 : lastVolume;

  showToast(isMuted ? '🔇 Muted' : '🔊 Unmuted');
}

/* ── 9h. Track List Renderer ── */

/** Build and inject the track list HTML into #trackList. */
function renderTrackList() {
  const list = $('trackList');
  if (!list) return;

  if (!tracks.length) {
    list.innerHTML = `
      <div class="empty-state" id="audioEmpty">
        <div class="es-icon">🎧</div>
        Upload your first mix to get started
      </div>`;
    return;
  }

  list.innerHTML = tracks.map((track, i) => {
    const isActive = currentTrack === i;

    // Build animated waveform bars
    const bars = WAVE_HEIGHTS.map((h, j) =>
      `<div class="wv-b" style="height:${h}%;animation-delay:${(j * 0.07).toFixed(2)}s"></div>`
    ).join('');

    return `
      <div class="track-item${isActive ? ' playing' : ''}" id="ti-${i}"
           onclick="loadTrack(${i})"
           title="Click to ${isActive && isPlaying ? 'pause' : 'play'}: ${track.name}">

        <div class="track-num">${String(i + 1).padStart(2, '0')}</div>

        <div class="wv" aria-hidden="true">${bars}</div>

        <div class="track-info">
          <div class="track-title-t">${track.name}</div>
          <div class="track-meta">DJ EDD254 · ${track.duration}</div>
        </div>

        <div class="track-dur">${track.duration}</div>

        <button class="track-play-icon"
                onclick="event.stopPropagation(); loadTrack(${i})"
                title="${isActive && isPlaying ? 'Pause' : 'Play'}">
          ${isActive && isPlaying ? '⏸' : '▶'}
        </button>

        <button class="track-del"
                onclick="event.stopPropagation(); deleteTrack(${i})"
                title="Remove track">✕</button>
      </div>`;
  }).join('');
}

/** Update the play/pause button icon to match current state. */
function updatePlayButton() {
  const btn = $('playBtn');
  if (btn) btn.textContent = isPlaying ? '⏸' : '▶';
}

/** Update the Now Playing card with the current track details. */
function updateNowPlaying() {
  const title  = $('np-title');
  const artist = $('np-artist');

  if (title && currentTrack >= 0)  title.textContent  = tracks[currentTrack].name;
  if (artist)                       artist.textContent = 'DJ EDD254';
}


/* ═══════════════════════════════════════════════════════════════════
   10. VIDEO GALLERY ENGINE
   Supports uploading and displaying multiple video files (MP4,
   MOV, WebM). Each video opens in a fullscreen lightbox player.
═══════════════════════════════════════════════════════════════════ */

/* ── 10a. State Variables ── */
/**
 * @type {Array<{name:string, url:string}>}
 */
let videos = [];

/* ── 10b. File Input & Drag-and-Drop Handlers ── */

/**
 * Called when video files are chosen via the file <input>.
 * @param {Event} e
 */
function handleVideoFiles(e) {
  addVideoFiles(e.target.files);
  e.target.value = '';
}

/**
 * Called when files are dropped onto the video drop zone.
 * @param {DragEvent} e
 */
function handleVideoDrop(e) {
  e.preventDefault();
  handleDragLeave('videoDropZone');
  addVideoFiles(e.dataTransfer.files);
}

/* ── 10c. Video Management ── */

/**
 * Process a FileList and add valid video files to the gallery.
 * @param {FileList} files
 */
function addVideoFiles(files) {
  let added = 0;

  Array.from(files).forEach(file => {
    if (!file.type.startsWith('video/')) return;

    const url  = URL.createObjectURL(file);
    const name = stripExtension(file.name);
    videos.push({ name, url });
    added++;
  });

  if (added) {
    renderVideoGrid();
    // Hide empty-state if visible
    const empty = $('videoEmpty');
    if (empty) empty.style.display = 'none';
    showToast(`🎬 ${added} video${added > 1 ? 's' : ''} uploaded!`);
  } else {
    showToast('No supported video files found (MP4, MOV, WebM…)');
  }
}

/**
 * Remove a video from the gallery by index.
 * @param {number} index
 */
function deleteVideo(index) {
  // Stop the lightbox if it's playing this video
  const lbVideo = $('lb-video');
  if (lbVideo && lbVideo.src === videos[index].url) {
    closeLightbox();
  }

  URL.revokeObjectURL(videos[index].url);
  videos.splice(index, 1);
  renderVideoGrid();
  showToast('Video removed');
}

/* ── 10d. Video Grid Renderer ── */

/** Build and inject the video grid HTML into #videoGrid. */
function renderVideoGrid() {
  const grid = $('videoGrid');
  if (!grid) return;

  if (!videos.length) {
    grid.innerHTML = `
      <div class="empty-state" id="videoEmpty" style="grid-column:1/-1">
        <div class="es-icon">🎬</div>
        Upload your first video to display it here
      </div>`;
    return;
  }

  grid.innerHTML = videos.map((video, i) => `
    <div class="video-card" id="vc-${i}">
      <video src="${video.url}" preload="metadata" muted
             aria-label="${video.name} video thumbnail"></video>

      <div class="video-card-overlay">
        <div class="vid-title">${video.name}</div>
        <div class="vid-meta">DJ EDD254 · HD</div>
      </div>

      <button class="vid-play-btn"
              onclick="openLightbox(${i})"
              aria-label="Play ${video.name} fullscreen">▶</button>

      <button class="vid-del"
              onclick="deleteVideo(${i})"
              aria-label="Remove ${video.name}">✕ Remove</button>
    </div>`).join('');
}

/* ── 10e. Lightbox (Fullscreen Video Player) ── */

/**
 * Open the video lightbox and play the selected video.
 * @param {number} index   Index in the videos array
 */
function openLightbox(index) {
  const lightbox = $('lightbox');
  const lbVideo  = $('lb-video');
  if (!lightbox || !lbVideo) return;

  lbVideo.src = videos[index].url;
  lightbox.classList.add('open');

  // Prevent page scroll while lightbox is open
  document.body.style.overflow = 'hidden';

  lbVideo.play().catch(() => {
    // Autoplay may be blocked — user can still press play on the video
  });
}

/** Close the video lightbox and stop playback. */
function closeLightbox() {
  const lightbox = $('lightbox');
  const lbVideo  = $('lb-video');
  if (!lightbox || !lbVideo) return;

  lightbox.classList.remove('open');
  lbVideo.pause();
  lbVideo.src = '';                   // Release resource

  document.body.style.overflow = '';  // Restore scroll
}

// Close lightbox when clicking the dark backdrop
document.addEventListener('click', e => {
  const lightbox = $('lightbox');
  if (e.target === lightbox) closeLightbox();
});


/* ═══════════════════════════════════════════════════════════════════
   11. DRAG-AND-DROP ZONE HELPERS
   Visual feedback when a file is dragged over an upload zone.
═══════════════════════════════════════════════════════════════════ */

/**
 * Add the "drag" CSS class to a drop zone and prevent default
 * browser behaviour (which would otherwise open the file).
 * @param {DragEvent} e
 * @param {string}    zoneId   ID of the drop zone element
 */
function handleDragOver(e, zoneId) {
  e.preventDefault();
  const zone = $(zoneId);
  if (zone) zone.classList.add('drag');
}

/**
 * Remove the "drag" CSS class from a drop zone.
 * @param {string} zoneId   ID of the drop zone element
 */
function handleDragLeave(zoneId) {
  const zone = $(zoneId);
  if (zone) zone.classList.remove('drag');
}


/* ═══════════════════════════════════════════════════════════════════
   12. EVENTS SECTION BUILDER
   Renders the upcoming shows list from the eventsData array.
   To add / change events, edit the array below.
═══════════════════════════════════════════════════════════════════ */

/**
 * List of upcoming events.
 * Fields: day, month, name, venue, city, ticketUrl (optional)
 */
const eventsData = [
  {
    day: '14', month: 'Jun',
    name: 'COAST RAVE VOL.3',
    venue: 'Forty Thieves Beach Bar',
    city: 'Mombasa',
    ticketUrl: ''
  },
  {
    day: '21', month: 'Jun',
    name: 'VIBES ONLY',
    venue: 'Radisson Blu Nairobi',
    city: 'Nairobi',
    ticketUrl: ''
  },
  {
    day: '05', month: 'Jul',
    name: 'FESTIVAL MAIN STAGE',
    venue: 'Uhuru Gardens',
    city: 'Nairobi',
    ticketUrl: ''
  },
  {
    day: '12', month: 'Jul',
    name: 'SUNSET SESSION',
    venue: 'Neptune Beach Resort',
    city: 'Mombasa',
    ticketUrl: ''
  },
  {
    day: '26', month: 'Jul',
    name: 'DIANI POOL PARTY',
    venue: 'Diani Reef Hotel',
    city: 'Diani',
    ticketUrl: ''
  },
  {
    day: '09', month: 'Aug',
    name: 'ROOFTOP TAKEOVER',
    venue: 'The View Nairobi',
    city: 'Nairobi',
    ticketUrl: ''
  },
];

/** Build and inject the events list HTML into #eventsList. */
function buildEvents() {
  const list = $('eventsList');
  if (!list) return;

  list.innerHTML = eventsData.map(ev => {
    const ticketBtn = ev.ticketUrl
      ? `<a href="${ev.ticketUrl}" target="_blank" rel="noopener" class="ev-ticket">Get Tickets</a>`
      : `<button class="ev-ticket" onclick="showToast('🎟 Tickets link coming soon!')">Get Tickets</button>`;

    return `
      <div class="event-row">
        <div class="ev-date">
          <div class="ev-day">${ev.day}</div>
          <div class="ev-month">${ev.month}</div>
        </div>
        <div>
          <div class="ev-name">${ev.name}</div>
          <div class="ev-venue">${ev.venue}</div>
        </div>
        <div class="ev-city">${ev.city}</div>
        ${ticketBtn}
      </div>`;
  }).join('');
}


/* ═══════════════════════════════════════════════════════════════════
   13. PHOTO GALLERY
   An 8-slot mosaic grid. Each slot can hold one uploaded image.
   Clicking a slot opens the file picker. Hovering a filled slot
   reveals a "Remove" button.
═══════════════════════════════════════════════════════════════════ */

/* ── 13a. Gallery Grid Builder ── */

/** CSS mosaic span classes for each of the 8 gallery slots. */
const GALLERY_CLASSES = ['gi1', 'gi2', 'gi3', 'gi4', 'gi5', 'gi6', 'gi7', 'gi8'];

/** Stores the Object URL for each slot (null = empty). */
let galleryPhotos = new Array(8).fill(null);

/** Which slot index triggered the file picker (null = none). */
let galleryUploadSlot = null;

/** Build the empty gallery grid with clickable "Add Photo" slots. */
function buildGalleryGrid() {
  const grid = $('galleryGrid');
  if (!grid) return;

  grid.innerHTML = GALLERY_CLASSES.map((cls, i) =>
    `<div class="gal-item ${cls} add-btn"
          id="gslot-${i}"
          onclick="triggerGallerySlot(${i})"
          role="button"
          aria-label="Add photo to gallery slot ${i + 1}"
          tabindex="0">
       <svg width="20" height="20" fill="none" viewBox="0 0 24 24" aria-hidden="true">
         <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
       </svg>
       <span style="font-size:10px;letter-spacing:1px">Add Photo</span>
     </div>`
  ).join('');
}

/* ── 13b. Slot Upload & Clear ── */

/**
 * Open the file picker, remembering which slot to fill.
 * @param {number} slotIndex   0–7
 */
function triggerGallerySlot(slotIndex) {
  galleryUploadSlot = slotIndex;
  const input = $('galleryInput');
  if (input) input.click();
}

/**
 * Handle file selection for the gallery.
 * If a specific slot was clicked, fill that slot.
 * If multiple files are selected, fill consecutive empty slots.
 * @param {Event} e   The file input change event
 */
function addGalleryPhotos(e) {
  const files = Array.from(e.target.files);

  files.forEach((file, fileIndex) => {
    // If a specific slot was targeted, use it; otherwise fill sequentially
    const slot = galleryUploadSlot !== null ? galleryUploadSlot : fileIndex;
    if (slot >= 8) return;                          // Only 8 slots available
    if (!file.type.startsWith('image/')) return;    // Images only

    // Revoke old URL if slot already had a photo
    if (galleryPhotos[slot]) URL.revokeObjectURL(galleryPhotos[slot]);

    const url = URL.createObjectURL(file);
    galleryPhotos[slot] = url;

    const el = $('gslot-' + slot);
    if (!el) return;

    // Fill the slot with the image
    el.classList.remove('add-btn');
    el.innerHTML = `
      <img src="${url}" alt="Gallery photo ${slot + 1}">
      <div class="gal-del-wrap" style="
        position:absolute;inset:0;display:flex;
        align-items:center;justify-content:center;
        opacity:0;transition:opacity .3s;background:rgba(0,0,0,.6)">
        <button onclick="clearGallerySlot(${slot}, event)"
                style="background:var(--orange);border:none;color:#000;
                       padding:8px 16px;font-family:var(--font-b);
                       font-size:10px;letter-spacing:2px;cursor:pointer;">
          ✕ Remove
        </button>
      </div>`;

    // Show/hide the remove button on hover
    el.onmouseenter = () => el.querySelector('.gal-del-wrap').style.opacity = '1';
    el.onmouseleave = () => el.querySelector('.gal-del-wrap').style.opacity = '0';

    // Reset slot targeting after filling
    galleryUploadSlot = null;
  });

  // Reset input so the same file can be re-selected
  e.target.value = '';
  showToast('📷 Photo added!');
}

/**
 * Clear a gallery slot, restoring it to the "Add Photo" state.
 * @param {number}      slotIndex   0–7
 * @param {MouseEvent}  e           The click event (to stop propagation)
 */
function clearGallerySlot(slotIndex, e) {
  if (e) e.stopPropagation();

  // Release the Object URL
  if (galleryPhotos[slotIndex]) {
    URL.revokeObjectURL(galleryPhotos[slotIndex]);
    galleryPhotos[slotIndex] = null;
  }

  const el = $('gslot-' + slotIndex);
  if (!el) return;

  // Restore empty-slot appearance
  el.className  = `gal-item ${GALLERY_CLASSES[slotIndex]} add-btn`;
  el.innerHTML  = `
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span style="font-size:10px;letter-spacing:1px">Add Photo</span>`;

  el.onclick      = () => triggerGallerySlot(slotIndex);
  el.onmouseenter = null;
  el.onmouseleave = null;
}


/* ═══════════════════════════════════════════════════════════════════
   14. BOOKING FORM — VALIDATOR & SUBMIT
   Validates the booking form fields and shows feedback.
   Extend this to POST to a backend when ready.
═══════════════════════════════════════════════════════════════════ */

/**
 * Validate the booking form and handle the submission.
 * Currently shows a success confirmation — connect to your
 * backend API or email service (e.g. EmailJS, Formspree) here.
 */
function submitBooking() {
  const name   = $('bk-name')  ?.value.trim();
  const phone  = $('bk-phone') ?.value.trim();
  const email  = $('bk-email') ?.value.trim();
  const venue  = $('bk-venue') ?.value.trim();
  const date   = $('bk-date')  ?.value;

  // ── Validation ──
  if (!name) {
    showToast('⚠️ Please enter your name');
    $('bk-name')?.focus();
    return;
  }
  if (!phone && !email) {
    showToast('⚠️ Please enter a phone number or email address');
    $('bk-phone')?.focus();
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('⚠️ Please enter a valid email address');
    $('bk-email')?.focus();
    return;
  }

  // ── Success State ──
  const btn = $q('.submit-btn');
  if (btn) {
    btn.textContent         = '✓ Request Sent!';
    btn.style.background    = 'var(--blue)';
    btn.style.pointerEvents = 'none';     // prevent double-submit

    // Reset after 4 seconds
    setTimeout(() => {
      btn.textContent         = 'Send Booking Request →';
      btn.style.background    = '';
      btn.style.pointerEvents = '';
    }, 4000);
  }

  showToast('✅ Booking request sent! I'll be in touch within 24hrs.', 4000);

  // ── TODO: Integrate your preferred form backend here ──
  // Option A — EmailJS:
  //   emailjs.send('SERVICE_ID', 'TEMPLATE_ID', { name, phone, email, venue, date })
  //     .then(() => console.log('Email sent'))
  //     .catch(err => console.error('Email failed', err));
  //
  // Option B — Formspree:
  //   fetch('https://formspree.io/f/YOUR_FORM_ID', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ name, phone, email, venue, date })
  //   });
}


/* ═══════════════════════════════════════════════════════════════════
   15. KEYBOARD SHORTCUTS
   Global shortcuts — disabled when typing in form fields.
═══════════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  // Don't intercept shortcuts while the user is typing
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.target.isContentEditable) return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;

    case 'ArrowRight':
      e.preventDefault();
      nextTrack();
      break;

    case 'ArrowLeft':
      e.preventDefault();
      prevTrack();
      break;

    case 'KeyM':
      toggleMute();
      break;

    case 'Escape':
      closeLightbox();
      break;

    default:
      break;
  }
});


/* ═══════════════════════════════════════════════════════════════════
   16. INITIALISATION
   Everything that needs to run as soon as the DOM is ready.
═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // Build the events list
  buildEvents();

  // Build the empty photo gallery grid
  buildGalleryGrid();

  // Render the (initially empty) track list
  renderTrackList();

  // Set volume slider to match default audio volume
  const volSlider = $('volSlider');
  if (volSlider) volSlider.value = audioEl.volume;

  // Log initialisation (remove in production if preferred)
  console.log('%c🎛️ DJ EDD254 Website — JS Loaded', 'color:#ff4800;font-weight:bold;font-size:14px');
  console.log('Keyboard shortcuts: Space=Play/Pause  ←/→=Prev/Next  M=Mute  Esc=Close video');
});

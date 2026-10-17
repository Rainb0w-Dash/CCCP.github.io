(() => {
  const audio   = document.getElementById('player-audio');
  const playBtn = document.getElementById('player-play');
  const seek    = document.getElementById('player-seek');
  const vol     = document.getElementById('player-vol');
  const timeEl  = document.getElementById('player-time');
  let scrubbing = false;

  const ICON_PLAY  = '<svg width="14" height="12" viewBox="0 0 14 12" shape-rendering="crispEdges"><polygon points="3,1 3,11 11,6"/></svg>';
  const ICON_PAUSE = '<svg width="14" height="12" viewBox="0 0 14 12" shape-rendering="crispEdges"><rect x="3" y="1" width="3" height="10"/><rect x="8" y="1" width="3" height="10"/></svg>';

  const fmt = (s) => {
    if (!isFinite(s)) return '--:--';
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  };

  function syncIcon() {
    playBtn.innerHTML = audio.paused ? ICON_PLAY : ICON_PAUSE;
    playBtn.title = audio.paused ? 'Play' : 'Pause';
  }

  function update() {
    const dur = audio.duration;
    const cur = scrubbing ? (seek.value / 1000) * dur : audio.currentTime;
    timeEl.textContent = fmt(cur) + ' / ' + fmt(dur);
    if (!scrubbing && isFinite(dur) && dur > 0) seek.value = (audio.currentTime / dur) * 1000;
  }

  playBtn.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });
  audio.addEventListener('play', syncIcon);
  audio.addEventListener('pause', syncIcon);
  audio.addEventListener('loadedmetadata', () => { seek.disabled = false; update(); });
  audio.addEventListener('emptied', () => { seek.disabled = true; seek.value = 0; update(); }); // new track loading
  audio.addEventListener('durationchange', update);
  audio.addEventListener('timeupdate', update);

  seek.addEventListener('input', () => { scrubbing = true; update(); });
  seek.addEventListener('change', () => {
    if (isFinite(audio.duration)) audio.currentTime = (seek.value / 1000) * audio.duration;
    scrubbing = false;
    update();
  });

  audio.volume = vol.value / 100;   // iPhones ignore this and use the phone's volume buttons
  vol.addEventListener('input', () => { audio.volume = vol.value / 100; });

  if (audio.readyState >= 1) seek.disabled = false;
  syncIcon();
  update();
})();
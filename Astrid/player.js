(() => {
  // ---- EDIT THIS: your playlist (plays top to bottom, then loops back to the start).
  // "title" is optional. Leave it out and the titlebar shows the filename.
  const playlist = [
    { src: 'Whatsername.mp3' },
    { src: 'thank-you-for-the-venom.mp3' },
    { src: 'dead.mp3' },
    // { src: 'third-song.mp3', title: 'A custom title' },
  ];
 
  const audio   = document.getElementById('player-audio');
  const titleEl = document.getElementById('player-title');
  const canvas  = document.getElementById('player-vis');
  const g       = canvas.getContext('2d');
  let index = 0;
 
  const fileName = (src) => decodeURIComponent(src.split('/').pop());
 
  // ---------- playlist ----------
  function load(i, play) {
    index = (i + playlist.length) % playlist.length;   // wraps around = looping playlist
    const item = playlist[index];
    audio.src = item.src;
    titleEl.textContent = item.title || fileName(item.src);
    titleEl.title = titleEl.textContent;                // full name on hover
    if (play) audio.play().catch(() => {});
  }
 
  audio.addEventListener('ended', () => load(index + 1, true));
  audio.addEventListener('error', () => {
    titleEl.textContent = "Can't load " + fileName(playlist[index].src);
  });
  document.getElementById('player-prev').addEventListener('click', () => load(index - 1, true));
  document.getElementById('player-next').addEventListener('click', () => load(index + 1, true));
 
  // ---------- visualiser (Web Audio API) ----------
  let actx, analyser, data, hooked = false;
 
  // Routes the audio through the analyser. This only happens once the AudioContext is
  // actually running, because routing audio through a suspended context would mute it.
  function hookUp() {
    if (hooked || !actx || actx.state !== 'running') return;
    hooked = true;
    const source = actx.createMediaElementSource(audio);
    analyser = actx.createAnalyser();
    analyser.fftSize = 256;                 // 128 frequency bins
    analyser.smoothingTimeConstant = 0.75;  // higher = smoother, slower bars
    source.connect(analyser);
    analyser.connect(actx.destination);
    data = new Uint8Array(analyser.frequencyBinCount);
  }
 
  // Create the context straight away so the visualiser works on page load
  // whenever the browser allows autoplay.
  actx = new (window.AudioContext || window.webkitAudioContext)();
  actx.onstatechange = hookUp;
  hookUp();
 
  const W = canvas.width, H = canvas.height;
  const BARS = 22, BIN_PER_BAR = 3, SEG = 4;   // 22 bars, 4px-tall segments
  const ROWS = Math.floor(H / SEG);
  const BAR_W = W / BARS;
 
  function draw() {
    requestAnimationFrame(draw);
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    if (!hooked) hookUp();                  // safety net in case no statechange event fired
    if (!analyser) return;                  // nothing to show until audio is hooked up
    analyser.getByteFrequencyData(data);
 
    for (let b = 0; b < BARS; b++) {
      let sum = 0;
      for (let k = 0; k < BIN_PER_BAR; k++) sum += data[b * BIN_PER_BAR + k];
      const level = Math.round((sum / BIN_PER_BAR / 255) * ROWS);
 
      for (let s = 0; s < level; s++) {
        g.fillStyle = s > ROWS * 0.8 ? '#ff0000' : s > ROWS * 0.55 ? '#ffff00' : '#00ff00';
        g.fillRect(b * BAR_W + 1, H - (s + 1) * SEG, BAR_W - 2, SEG - 1);
      }
    }
  }
 
  // ---------- autoplay + browser audio rules ----------
  // Browsers only allow sound (and the visualiser's AudioContext) after the visitor
  // has clicked or pressed a key. So: try autoplay, and if it's blocked, start on
  // the first interaction anywhere on the page.
  function onFirstGesture(e) {
    document.removeEventListener('click', onFirstGesture);
    document.removeEventListener('keydown', onFirstGesture);
    actx.resume();   // the visualiser hooks itself up as soon as the context is running
    const usingPlayer = e.target.closest && e.target.closest('#player');
    if (audio.paused && !usingPlayer) audio.play().catch(() => {});
  }
  document.addEventListener('click', onFirstGesture);
  document.addEventListener('keydown', onFirstGesture);
 
  load(0, false);
  audio.play().catch(() => {});   // works only if the browser allows autoplay
  draw();
})();
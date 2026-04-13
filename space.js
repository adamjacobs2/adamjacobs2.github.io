(function () {
  const canvas = document.getElementById('space-canvas');
  const ctx = canvas.getContext('2d');

  // ── Config ──────────────────────────────────────────────────────────────────
  const STAR_COUNT       = 320;
  const NEBULA_COUNT     = 4;
  const SHOOT_INTERVAL   = 4000;  // ms between shooting star attempts
  const SHOOT_CHANCE     = 0.65;  // probability a shoot attempt fires

  // Star color palette — mostly blue-white with a few warm tones
  const STAR_COLORS = [
    '#ffffff', '#ffffff', '#ffffff',
    '#d0e8ff', '#c8d8ff',
    '#ffe8c0', '#ffd090',
    '#a0c8ff',
  ];

  // ── State ────────────────────────────────────────────────────────────────────
  let W, H;
  let stars = [];
  let nebulae = [];
  let shooters = [];

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

  // ── Star ─────────────────────────────────────────────────────────────────────
  function makeStar() {
    return {
      x:         rand(0, W),
      y:         rand(0, H),
      r:         rand(0.3, 1.8),
      color:     pick(STAR_COLORS),
      phase:     rand(0, Math.PI * 2),
      speed:     rand(0.4, 1.2),
      drift:     rand(-0.015, 0.015),
      baseAlpha: rand(0.55, 1.0),
    };
  }

  // ── Nebula blob ──────────────────────────────────────────────────────────────
  function makeNebula() {
    const hues = [220, 200, 260, 180, 300];
    const hue = pick(hues);
    return {
      x:     rand(0.1, 0.9) * W,
      y:     rand(0.05, 0.85) * H,
      rx:    rand(W * 0.15, W * 0.35),
      ry:    rand(H * 0.1, H * 0.28),
      hue,
      alpha: rand(0.025, 0.06),
    };
  }

  // ── Shooting star ─────────────────────────────────────────────────────────────
  function spawnShooter() {
    if (Math.random() > SHOOT_CHANCE) return;
    const angle = rand(Math.PI * 0.1, Math.PI * 0.45);
    const speed = rand(6, 14);
    shooters.push({
      x:     rand(0, W * 0.8),
      y:     rand(0, H * 0.5),
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed,
      len:   rand(80, 200),
      alpha: 1.0,
      fade:  rand(0.012, 0.025),
      color: pick(['#ffffff', '#d0e8ff', '#c8d8ff']),
    });
  }

  // ── Resize ───────────────────────────────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    nebulae = Array.from({ length: NEBULA_COUNT }, makeNebula);
    stars   = Array.from({ length: STAR_COUNT },   makeStar);
  }

  // ── Draw ─────────────────────────────────────────────────────────────────────
  let last = 0;
  let shootTimer = 0;

  function draw(ts) {
    const dt = ts - last;
    last = ts;
    shootTimer += dt;

    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05070f');
    bg.addColorStop(1, '#0a0e1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Nebula blobs
    for (const n of nebulae) {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(1, n.ry / n.rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
      g.addColorStop(0,   `hsla(${n.hue},70%,60%,${n.alpha})`);
      g.addColorStop(0.5, `hsla(${n.hue},60%,40%,${n.alpha * 0.4})`);
      g.addColorStop(1,   `hsla(${n.hue},50%,20%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Stars
    const t = ts * 0.001;
    for (const s of stars) {
      s.x += s.drift;
      if (s.x > W + 2) s.x = -2;
      if (s.x < -2)    s.x = W + 2;

      const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const alpha   = s.baseAlpha * (0.6 + 0.4 * twinkle);

      ctx.save();
      ctx.globalAlpha = alpha;

      if (s.r > 1.1) {
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        glow.addColorStop(0, s.color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Fade curtain — stars only visible in the top 55%, smoothly fade out below
    const curtainStart = H * 0.42;
    const curtainEnd   = H * 0.62;
    const curtain = ctx.createLinearGradient(0, curtainStart, 0, curtainEnd);
    curtain.addColorStop(0, 'rgba(5, 7, 15, 0)');
    curtain.addColorStop(1, 'rgba(5, 7, 15, 1)');
    ctx.fillStyle = curtain;
    ctx.fillRect(0, curtainStart, W, curtainEnd - curtainStart);
    // solid cover for everything below the fade
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, curtainEnd, W, H - curtainEnd);

    // Shooting stars
    if (shootTimer > SHOOT_INTERVAL) {
      spawnShooter();
      shootTimer = 0;
    }

    for (let i = shooters.length - 1; i >= 0; i--) {
      const sh = shooters[i];
      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.alpha -= sh.fade;

      if (sh.alpha <= 0 || sh.x > W + 50 || sh.y > H + 50) {
        shooters.splice(i, 1);
        continue;
      }

      const mag  = Math.hypot(sh.vx, sh.vy);
      const tailX = sh.x - (sh.vx / mag) * sh.len;
      const tailY = sh.y - (sh.vy / mag) * sh.len;

      const grad = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y);
      grad.addColorStop(0, `rgba(255,255,255,0)`);
      grad.addColorStop(1, `rgba(255,255,255,${sh.alpha})`);

      ctx.save();
      ctx.globalAlpha = sh.alpha;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 6;
      ctx.shadowColor = sh.color;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(sh.x, sh.y);
      ctx.stroke();
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();

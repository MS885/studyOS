/* ═══════════════════════════════════════════
   STUDYOS — CITY CANVAS
   8 cyberpunk / night city pixel art scenes
═══════════════════════════════════════════ */

(function () {
  const canvas = document.getElementById('city-canvas');
  const ctx = canvas.getContext('2d');
  let currentScene = 0;
  let animFrame;
  let tickCount = 0;

  // ── SCENE DEFINITIONS ──────────────────────────────────────────────────────
  const SCENES = [
    {
      name: 'MIDNIGHT SKYLINE',
      sky:       ['#020912', '#040e1e', '#061528', '#0a1e36', '#0d2444'],
      horizon:   0.72,
      moonColor: '#d0e8ff',
      moonPhase: 'crescent',
      neonLine:  '#00e5ff',
      neonLine2: '#39ff14',
      starColor: '#c8e6ff',
      buildingBase: 'rgba(5,14,34,',
      windowPalette: ['#ffe066','#7fffdb','#c8e6ff','#39ff14','rgba(255,255,255,0.5)'],
      reflectColor: 'rgba(0,229,255,0.06)',
    },
    {
      name: 'NEON RAIN DISTRICT',
      sky:       ['#030614', '#05091a', '#070e24', '#0a142e', '#0e1c3e'],
      horizon:   0.68,
      moonColor: '#8888ff',
      moonPhase: 'full',
      neonLine:  '#ff2d78',
      neonLine2: '#bf5fff',
      starColor: '#9999ff',
      buildingBase: 'rgba(8,5,28,',
      windowPalette: ['#ff2d78','#bf5fff','#ff99cc','#ffaaff','rgba(255,100,200,0.6)'],
      reflectColor: 'rgba(255,45,120,0.07)',
      rain: true,
    },
    {
      name: 'OUTRUN HIGHWAY',
      sky:       ['#0a0014', '#120020', '#1a0030', '#220040', '#2a0055'],
      horizon:   0.65,
      moonColor: '#ffaaff',
      moonPhase: 'crescent',
      neonLine:  '#ff6ec7',
      neonLine2: '#ffcc00',
      starColor: '#ffddff',
      buildingBase: 'rgba(15,5,30,',
      windowPalette: ['#ff6ec7','#ffcc00','#ff99ff','#cc44ff','rgba(255,100,255,0.5)'],
      reflectColor: 'rgba(255,110,199,0.07)',
      grid: true,
    },
    {
      name: 'DEEP OCEAN CITY',
      sky:       ['#001020', '#001830', '#002040', '#002850', '#003060'],
      horizon:   0.74,
      moonColor: '#aaddff',
      moonPhase: 'half',
      neonLine:  '#00ccff',
      neonLine2: '#00ffcc',
      starColor: '#aaddff',
      buildingBase: 'rgba(0,10,30,',
      windowPalette: ['#00ccff','#00ffcc','#66eeff','#44bbdd','rgba(100,230,255,0.5)'],
      reflectColor: 'rgba(0,204,255,0.08)',
    },
    {
      name: 'EMBER DISTRICT',
      sky:       ['#0f0600', '#1a0900', '#250d00', '#301200', '#3a1800'],
      horizon:   0.70,
      moonColor: '#ffcc88',
      moonPhase: 'crescent',
      neonLine:  '#ff6600',
      neonLine2: '#ffcc00',
      starColor: '#ffddaa',
      buildingBase: 'rgba(20,8,0,',
      windowPalette: ['#ff6600','#ffaa00','#ffdd44','#ff8833','rgba(255,150,50,0.5)'],
      reflectColor: 'rgba(255,102,0,0.07)',
    },
    {
      name: 'GHOST PROTOCOL',
      sky:       ['#040410', '#070718', '#0a0a22', '#0e0e2c', '#121238'],
      horizon:   0.75,
      moonColor: '#ffffff',
      moonPhase: 'full',
      neonLine:  '#ffffff',
      neonLine2: '#aaaaff',
      starColor: '#ffffff',
      buildingBase: 'rgba(6,6,20,',
      windowPalette: ['#ffffff','#ddddff','#aaaaff','#8888cc','rgba(200,200,255,0.5)'],
      reflectColor: 'rgba(200,200,255,0.05)',
    },
    {
      name: 'ACID RAIN SECTOR',
      sky:       ['#001408', '#001e0c', '#002810', '#003318', '#004020'],
      horizon:   0.69,
      moonColor: '#aaffaa',
      moonPhase: 'crescent',
      neonLine:  '#39ff14',
      neonLine2: '#00ffcc',
      starColor: '#aaffaa',
      buildingBase: 'rgba(0,14,6,',
      windowPalette: ['#39ff14','#00ffcc','#88ff44','#44ff88','rgba(100,255,80,0.5)'],
      reflectColor: 'rgba(57,255,20,0.06)',
      rain: true,
    },
    {
      name: 'BLOOD MOON QUARTER',
      sky:       ['#0e0004', '#180006', '#22000a', '#2c000e', '#360012'],
      horizon:   0.71,
      moonColor: '#ff4444',
      moonPhase: 'full',
      neonLine:  '#ff0044',
      neonLine2: '#ff6600',
      starColor: '#ffaaaa',
      buildingBase: 'rgba(18,0,5,',
      windowPalette: ['#ff0044','#ff6600','#ff4488','#cc0033','rgba(255,50,80,0.5)'],
      reflectColor: 'rgba(255,0,68,0.07)',
    },
  ];

  // ── RAIN DROPS ──────────────────────────────────────────────────────────────
  let rainDrops = [];
  function initRain() {
    rainDrops = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: 8 + Math.random() * 14,
      speed: 6 + Math.random() * 6,
      alpha: 0.15 + Math.random() * 0.25,
    }));
  }
  function updateRain(scene) {
    const color = scene.neonLine;
    rainDrops.forEach(d => {
      ctx.strokeStyle = color.replace(')', `,${d.alpha})`).replace('rgb(', 'rgba(').replace('#', '');
      ctx.strokeStyle = hexToRgba(color, d.alpha);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1, d.y + d.len);
      ctx.stroke();
      d.y += d.speed;
      if (d.y > canvas.height) {
        d.y = -d.len;
        d.x = Math.random() * canvas.width;
      }
    });
  }

  // ── GRID (OUTRUN) ─────────────────────────────────────────────────────────
  function drawGrid(scene, horizonY) {
    const W = canvas.width;
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = scene.neonLine2;
    ctx.lineWidth = 1;
    const lines = 16;
    const vp = { x: W / 2, y: horizonY };
    for (let i = 1; i <= lines; i++) {
      const y = horizonY + (i / lines) * (canvas.height - horizonY) * 1.2;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    const vlines = 18;
    for (let i = 0; i <= vlines; i++) {
      const bx = (i / vlines) * W;
      ctx.beginPath(); ctx.moveTo(vp.x, vp.y); ctx.lineTo(bx, canvas.height); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function hexToRgba(hex, alpha) {
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── STARS ─────────────────────────────────────────────────────────────────
  const starField = Array.from({ length: 160 }, (_, i) => ({
    x: (i * 137.508 + 50) % 1,
    y: (i * 89.123 + 10) % 0.62,
    size: i % 4 === 0 ? 2 : 1,
    twinkle: Math.random() > 0.85,
    phase: Math.random() * Math.PI * 2,
  }));

  // ── MOON ─────────────────────────────────────────────────────────────────
  function drawMoon(scene, W, H) {
    const mx = W * 0.72, my = H * 0.1;
    const r = 14;
    ctx.fillStyle = scene.moonColor;

    if (scene.moonPhase === 'full') {
      for (let dy = -r; dy <= r; dy += 2) {
        for (let dx = -r; dx <= r; dx += 2) {
          if (dx * dx + dy * dy <= r * r) ctx.fillRect(mx + dx, my + dy, 2, 2);
        }
      }
    } else if (scene.moonPhase === 'crescent') {
      for (let dy = -r; dy <= r; dy += 2) {
        for (let dx = -r; dx <= r; dx += 2) {
          if (dx * dx + dy * dy <= r * r) {
            const ox = dx + 6, oy = dy - 2;
            if (ox * ox + oy * oy > (r - 4) * (r - 4)) ctx.fillRect(mx + dx, my + dy, 2, 2);
          }
        }
      }
    } else {
      // half
      for (let dy = -r; dy <= r; dy += 2) {
        for (let dx = -r; dx <= r; dx += 2) {
          if (dx * dx + dy * dy <= r * r && dx >= 0) ctx.fillRect(mx + dx, my + dy, 2, 2);
        }
      }
    }
  }

  // ── BUILDINGS ─────────────────────────────────────────────────────────────
  function buildBuildings(W, horizonY) {
    const buildings = [];
    let x = -10;
    const totalW = W + 30;
    while (x < totalW) {
      const w = 18 + ((x * 7 + 42) % 26);
      const h = 55 + ((x * 11 + 17) % 180);
      buildings.push({ x, w, h, y: horizonY - h });
      x += w + 4 + ((x * 3) % 8);
    }
    return buildings;
  }

  // ── MAIN DRAW ─────────────────────────────────────────────────────────────
  function drawScene(sceneIdx) {
    const s = SCENES[sceneIdx];
    const W = canvas.width, H = canvas.height;
    const horizonY = H * s.horizon;

    ctx.clearRect(0, 0, W, H);

    // Sky bands
    const bandH = horizonY / s.sky.length;
    s.sky.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(0, i * bandH, W, bandH + 1);
    });

    // Outrun grid
    if (s.grid) drawGrid(s, horizonY);

    // Stars
    starField.forEach(st => {
      const twinkAlpha = st.twinkle ? 0.4 + 0.6 * Math.abs(Math.sin(st.phase + tickCount * 0.03)) : 0.85;
      ctx.globalAlpha = twinkAlpha;
      ctx.fillStyle = s.starColor;
      ctx.fillRect(Math.floor(st.x * W), Math.floor(st.y * H), st.size, st.size);
    });
    ctx.globalAlpha = 1;

    // Moon
    drawMoon(s, W, H);

    // Buildings
    const buildings = buildBuildings(W, horizonY);
    buildings.forEach((b, bi) => {
      // Shadow buildings (back layer, slightly lighter)
      const backAlpha = 0.55 + (bi % 2) * 0.1;
      ctx.fillStyle = s.buildingBase + backAlpha + ')';
      ctx.fillRect(b.x + 2, b.y + 4, b.w - 2, b.h - 4);

      // Main building
      ctx.fillStyle = s.buildingBase + '0.95)';
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Edge highlight
      ctx.fillStyle = hexToRgba(s.neonLine, 0.06);
      ctx.fillRect(b.x, b.y, 1, b.h);

      // Windows
      const ws = 3, wg = 5;
      for (let wy = b.y + 8; wy < b.y + b.h - 8; wy += ws + wg) {
        for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += ws + wg) {
          const r = (wx * 13 + wy * 7 + bi * 31) % 100;
          if (r < 52) {
            const c = s.windowPalette[r % s.windowPalette.length];
            ctx.fillStyle = c;
            ctx.fillRect(wx, wy, ws, ws);
          }
        }
      }

      // Beacon
      const bx = b.x + Math.floor(b.w / 2) - 1;
      const beaconOn = (tickCount + bi * 17) % 60 < 30;
      ctx.fillStyle = beaconOn ? 'rgba(255,50,50,0.95)' : 'rgba(80,10,10,0.6)';
      ctx.fillRect(bx, b.y - 5, 2, 5);
    });

    // Horizon neon lines
    ctx.fillStyle = s.neonLine;
    ctx.fillRect(0, horizonY, W, 2);
    ctx.fillStyle = hexToRgba(s.neonLine, 0.18);
    ctx.fillRect(0, horizonY + 2, W, 4);
    ctx.fillStyle = s.neonLine2;
    ctx.fillRect(0, horizonY + 6, W, 1);

    // Ground / water
    ctx.fillStyle = hexToRgba(s.sky[0], 1);
    ctx.fillRect(0, horizonY + 8, W, H);

    // Water reflections
    for (let i = 0; i < W; i += 16) {
      const shimmer = (tickCount + i) % 40 < 20 ? 1 : 0.5;
      ctx.fillStyle = hexToRgba(s.neonLine, 0.04 * shimmer);
      ctx.fillRect(i, horizonY + 12, 10, 2);
      ctx.fillRect(i + 5, horizonY + 20, 6, 1);
      ctx.fillRect(i + 2, horizonY + 28, 8, 1);
    }

    // Rain overlay
    if (s.rain) updateRain(s);
  }

  // ── ANIMATION LOOP ─────────────────────────────────────────────────────────
  function tick() {
    tickCount++;
    drawScene(currentScene);
    animFrame = requestAnimationFrame(tick);
  }

  // ── RESIZE ─────────────────────────────────────────────────────────────────
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (SCENES[currentScene].rain) initRain();
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────────
  window.CityBG = {
    next() {
      currentScene = (currentScene + 1) % SCENES.length;
      if (SCENES[currentScene].rain) initRain();
      return SCENES[currentScene].name;
    },
    getName() {
      return SCENES[currentScene].name;
    },
    getCount() {
      return SCENES.length;
    },
    getIndex() {
      return currentScene;
    },
  };

  // ── INIT ───────────────────────────────────────────────────────────────────
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  tick();

  // Expose scene name update to home screen
  const sceneLabel = document.getElementById('scene-label');
  if (sceneLabel) sceneLabel.textContent = SCENES[0].name;

})();

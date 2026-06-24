// ============================================================
// PALE HARVEST — procedural canvas textures (no asset files)
// ============================================================
const TEX = (() => {

  const cache = {};

  function make(w, h, fn, srgb = true) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    fn(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb && 'colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // scatter single dark/light pixels for grit
  function grit(g, w, h, n, colors, size = 1) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = colors[(Math.random() * colors.length) | 0];
      g.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, size, size);
    }
  }

  function get(name, builder) {
    if (!cache[name]) cache[name] = builder();
    return cache[name];
  }

  const T = {};

  // ---- ground: 512px map of the whole farm, world [-100..100] -> uv ----
  T.ground = () => get('ground', () => make(512, 512, (g, w, h) => {
    const px = x => (x / 200 + 0.5) * w;
    const py = z => (0.5 + z / 200) * h;   // plane rotated -90deg: v runs with +z after flip below
    g.fillStyle = '#3d3a2b'; g.fillRect(0, 0, w, h);            // dead grass
    grit(g, w, h, 26000, ['#34301f', '#46412c', '#2e2b1e', '#52482f']);
    // corn field soil
    g.fillStyle = '#42392a';
    g.fillRect(px(-62), py(-62), px(62) - px(-62), py(6) - py(-62));
    grit(g, w, h, 9000, ['#3a3224', '#4a4030']);
    // road (east-west, z ~ 62..72)
    g.fillStyle = '#4b463e'; g.fillRect(0, py(62), w, py(72) - py(62));
    grit(g, w, h, 1200, ['#403c35', '#565049']);
    // paths
    g.strokeStyle = '#5c5138'; g.lineCap = 'round';
    g.lineWidth = 7;
    g.beginPath(); g.moveTo(px(-20), py(62)); g.lineTo(px(-20), py(40)); g.stroke();   // road -> house
    g.beginPath(); g.moveTo(px(8), py(62)); g.lineTo(px(-14), py(40)); g.stroke();     // truck -> house
    g.beginPath();                                                                      // house -> post -> chapel
    g.moveTo(px(-18), py(33)); g.lineTo(px(-8), py(16)); g.lineTo(px(0), py(6));
    g.lineTo(px(0), py(-68)); g.stroke();
    g.beginPath(); g.moveTo(px(-14), py(34)); g.lineTo(px(28), py(24)); g.stroke();    // house -> barn
    // yard
    g.fillStyle = 'rgba(92,81,56,0.35)';
    g.beginPath(); g.arc(px(-20), py(36), 30, 0, 7); g.fill();
    g.beginPath(); g.arc(px(33), py(24), 26, 0, 7); g.fill();
  }));

  T.siding = () => get('siding', () => make(64, 64, (g, w, h) => {
    g.fillStyle = '#6e6557'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      g.fillStyle = '#4f483d'; g.fillRect(0, y, w, 1);
      g.fillStyle = (y / 8) % 2 ? '#6a6153' : '#73695a'; g.fillRect(0, y + 1, w, 7);
    }
    grit(g, w, h, 700, ['#5c5447', '#7a7060', '#46403600']);
  }));

  T.barnWood = () => get('barnWood', () => make(64, 64, (g, w, h) => {
    g.fillStyle = '#6d3a30'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      g.fillStyle = '#48241d'; g.fillRect(x, 0, 1, h);
      g.fillStyle = (x / 8) % 2 ? '#693830' : '#723f33'; g.fillRect(x + 1, 0, 7, h);
    }
    grit(g, w, h, 800, ['#5a2f27', '#7c483a', '#3f201a']);
  }));

  T.planks = () => get('planks', () => make(64, 64, (g, w, h) => {
    g.fillStyle = '#5c4b38'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) {
      g.fillStyle = '#3e3225'; g.fillRect(0, y, w, 1);
      g.fillStyle = (y / 10) % 2 ? '#594936' : '#62503c'; g.fillRect(0, y + 1, w, 9);
    }
    grit(g, w, h, 600, ['#4e3f2e', '#6b5742']);
  }));

  T.roof = () => get('roof', () => make(64, 64, (g, w, h) => {
    g.fillStyle = '#3a3633'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 6) {
      g.fillStyle = '#28251f'; g.fillRect(0, y, w, 1);
      for (let x = ((y / 6) % 2) * 4; x < w; x += 8) { g.fillStyle = '#2e2b26'; g.fillRect(x, y, 1, 6); }
    }
    grit(g, w, h, 400, ['#332f2b', '#423d38']);
  }));

  T.stone = () => get('stone', () => make(64, 64, (g, w, h) => {
    g.fillStyle = '#6e6a61'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 12) {
      g.fillStyle = '#4c4942'; g.fillRect(0, y, w, 2);
      for (let x = ((y / 12) % 2) * 8; x < w; x += 16) { g.fillStyle = '#4c4942'; g.fillRect(x, y, 2, 12); }
    }
    grit(g, w, h, 900, ['#625e55', '#79756b', '#55524b', '#5d6b4f']);
  }));

  T.corn = () => get('corn', () => make(32, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    // stalk
    g.strokeStyle = '#6f6633'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(16, 64); g.lineTo(16, 6); g.stroke();
    // leaves
    g.strokeStyle = '#5d5a2c'; g.lineWidth = 2;
    const leaf = (y, dir) => {
      g.beginPath(); g.moveTo(16, y);
      g.quadraticCurveTo(16 + 8 * dir, y - 6, 16 + 14 * dir, y - 2);
      g.stroke();
    };
    leaf(54, 1); leaf(46, -1); leaf(38, 1); leaf(30, -1); leaf(22, 1); leaf(16, -1);
    g.strokeStyle = '#867a3e'; g.lineWidth = 1;
    leaf(50, -1); leaf(34, 1); leaf(26, -1);
    // tassel
    g.strokeStyle = '#9c8b4a';
    g.beginPath(); g.moveTo(16, 8); g.lineTo(12, 1); g.moveTo(16, 8); g.lineTo(16, 0); g.moveTo(16, 8); g.lineTo(20, 1); g.stroke();
  }));

  T.burlap = () => get('burlap', () => make(32, 32, (g, w, h) => {
    g.fillStyle = '#8d7c4f'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { g.fillStyle = 'rgba(60,48,25,.4)'; g.fillRect(0, y, w, 1); }
    for (let x = 0; x < w; x += 2) { g.fillStyle = 'rgba(120,105,65,.35)'; g.fillRect(x, 0, 1, h); }
    grit(g, w, h, 200, ['#7a6a42', '#9a8857', '#6c5c38']);
  }));

  // scarecrow head front face
  T.face = () => get('face', () => make(64, 64, (g, w, h) => {
    g.fillStyle = '#8d7c4f'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { g.fillStyle = 'rgba(60,48,25,.4)'; g.fillRect(0, y, w, 1); }
    grit(g, w, h, 280, ['#7a6a42', '#9a8857', '#5e5034']);
    g.strokeStyle = '#191007'; g.lineWidth = 2; g.lineCap = 'round';
    // X eyes, stitched
    const eye = (cx, cy) => {
      g.beginPath(); g.moveTo(cx - 5, cy - 5); g.lineTo(cx + 5, cy + 5);
      g.moveTo(cx + 5, cy - 5); g.lineTo(cx - 5, cy + 5); g.stroke();
      g.fillStyle = '#0c0803'; g.fillRect(cx - 2, cy - 2, 4, 4);
    };
    eye(20, 24); eye(44, 24);
    // grin: wide, torn open at one corner
    g.strokeStyle = '#140c04'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(12, 42); g.quadraticCurveTo(32, 54, 52, 40); g.stroke();
    g.lineWidth = 1; g.strokeStyle = '#241804';
    for (let i = 0; i < 8; i++) {
      const t = i / 7, x = 12 + t * 40, y = 42 + Math.sin(t * Math.PI) * 11;
      g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x, y + 4); g.stroke();
    }
    g.fillStyle = '#0a0602';
    g.beginPath(); g.moveTo(48, 40); g.lineTo(58, 46); g.lineTo(50, 47); g.closePath(); g.fill();
    // stains
    g.fillStyle = 'rgba(35,22,8,.5)';
    g.beginPath(); g.arc(46, 52, 6, 0, 7); g.fill();
    g.beginPath(); g.arc(18, 12, 7, 0, 7); g.fill();
  }));

  T.paper = () => get('paper', () => make(32, 32, (g, w, h) => {
    g.fillStyle = '#cabd97'; g.fillRect(0, 0, w, h);
    grit(g, w, h, 120, ['#bdb08c', '#d4c8a4']);
  }));

  T.hay = () => get('hay', () => make(32, 32, (g, w, h) => {
    g.fillStyle = '#8f7c43'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = ['#a08c4f', '#7a6a38', '#b09a58'][i % 3];
      g.beginPath();
      const x = rnd(0, w), y = rnd(0, h);
      g.moveTo(x, y); g.lineTo(x + rnd(-6, 6), y + rnd(-3, 3)); g.stroke();
    }
  }));

  T.bark = () => get('bark', () => make(32, 32, (g, w, h) => {
    g.fillStyle = '#453d33'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 3) {
      g.fillStyle = (x % 6) ? '#3a332b' : '#50473b';
      g.fillRect(x, 0, 2, h);
    }
    grit(g, w, h, 150, ['#332d26', '#554b3e']);
  }));

  T.door = () => get('door', () => make(32, 64, (g, w, h) => {
    g.fillStyle = '#54402c'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { g.fillStyle = '#3a2c1e'; g.fillRect(x, 0, 1, h); }
    g.fillStyle = '#3a2c1e'; g.fillRect(0, 14, w, 2); g.fillRect(0, 48, w, 2);
    g.fillStyle = '#1c1610'; g.fillRect(25, 30, 3, 3);   // knob
    grit(g, w, h, 200, ['#4a3826', '#604a32']);
  }));

  T.windowDark = () => get('windowDark', () => make(32, 32, (g, w, h) => {
    g.fillStyle = '#4f483d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0d111c'; g.fillRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#4f483d'; g.fillRect(15, 3, 2, h - 6); g.fillRect(3, 15, w - 6, 2);
    g.fillStyle = 'rgba(120,130,160,.12)'; g.fillRect(5, 5, 8, 8);
  }));

  T.sigil = () => get('sigil', () => make(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#d8d2bf'; g.lineWidth = 2;
    g.beginPath(); g.arc(32, 32, 22, 0, 7); g.stroke();
    g.beginPath();
    g.moveTo(32, 12); g.lineTo(46, 44); g.lineTo(18, 24); g.lineTo(46, 24); g.lineTo(18, 44); g.closePath();
    g.stroke();
    g.beginPath(); g.moveTo(32, 44); g.lineTo(32, 54); g.stroke();
  }));

  T.moon = () => get('moon', () => make(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const grd = g.createRadialGradient(64, 64, 20, 64, 64, 64);
    grd.addColorStop(0, 'rgba(232,228,205,1)');
    grd.addColorStop(0.45, 'rgba(220,215,190,0.9)');
    grd.addColorStop(0.7, 'rgba(180,178,160,0.25)');
    grd.addColorStop(1, 'rgba(160,160,150,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(150,148,128,0.5)';
    g.beginPath(); g.arc(50, 52, 7, 0, 7); g.fill();
    g.beginPath(); g.arc(74, 70, 5, 0, 7); g.fill();
    g.beginPath(); g.arc(60, 80, 4, 0, 7); g.fill();
  }));

  // ---- jumpscare face: drawn at 80px so it blows up into fat PS2 pixels ----
  T.drawScareFace = (canvas) => {
    const w = canvas.width = 80, h = canvas.height = 80;
    const g = canvas.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    // burlap head, slightly tilted
    g.fillStyle = '#5e4f2c';
    g.beginPath(); g.ellipse(40, 42, 34, 39, 0.09, 0, 7); g.fill();
    grit(g, w, h, 950, ['#534626', '#6b5a31', '#463b20', '#705f37']);
    for (let y = 5; y < h; y += 3) { g.fillStyle = 'rgba(18,12,3,0.35)'; g.fillRect(4, y, 72, 1); }
    // hollow ragged eye sockets, asymmetric
    const socket = (cx, cy, r, sy) => {
      g.fillStyle = '#000';
      g.beginPath();
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * Math.PI * 2, rr = r * rnd(0.7, 1.3);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * sy;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.fill();
    };
    socket(25, 30, 9, 1.2);
    socket(55, 27, 12, 1.05);
    // tiny off-center glints — it's looking at you
    g.fillStyle = '#e0d8ba';
    g.fillRect(28, 34, 2, 2); g.fillRect(58, 30, 1, 2);
    // long scratch across the right socket
    g.strokeStyle = '#160e04'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(45, 10); g.lineTo(70, 42); g.stroke();
    // dark runs under the eyes
    g.fillStyle = 'rgba(12,6,1,0.75)';
    g.fillRect(24, 41, 3, 10); g.fillRect(56, 41, 2, 13); g.fillRect(60, 41, 1, 8);
    // gaping black mouth
    g.fillStyle = '#000';
    g.beginPath();
    g.moveTo(9, 51);
    g.quadraticCurveTo(40, 82, 71, 49);
    g.quadraticCurveTo(57, 69, 40, 71);
    g.quadraticCurveTo(21, 69, 9, 51);
    g.closePath(); g.fill();
    // crooked straw teeth hanging in the dark
    g.fillStyle = '#bda767';
    [[15, 54, 5], [22, 59, 4], [30, 63, 6], [39, 65, 4], [48, 63, 6], [56, 59, 4], [63, 53, 5]]
      .forEach(([x, y, len]) => g.fillRect(x, y, 2, len));
    // snapped stitches around the lip
    g.strokeStyle = '#241804'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const t = i / 8, x = 11 + t * 58, y = 50 + Math.sin(t * Math.PI) * 12;
      g.beginPath(); g.moveTo(x, y - 3); g.lineTo(x + rnd(-2, 2), y + 3); g.stroke();
    }
    // hard vignette
    const v = g.createRadialGradient(40, 40, 18, 40, 40, 55);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.96)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  };

  // ---- PS1 vertex-snap wobble, injected into any material ----
  T.ps1 = (mat) => {
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
#endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
        gl_Position.xyz /= gl_Position.w;
        gl_Position.xy = floor(gl_Position.xy * vec2(240.0, 135.0) + 0.5) / vec2(240.0, 135.0);
        gl_Position.xyz *= gl_Position.w;`
      );
    };
    return mat;
  };

  return T;
})();

// ============================================================
// PALE HARVEST — world geometry: the Hale farm
// ============================================================
function buildWorld(scene) {

  const W = { colliders: [], lanternLights: [], stones: [] };

  // ---------- helpers ----------
  const lam = (opts) => TEX.ps1(new THREE.MeshLambertMaterial(opts));
  const rep = (tex, x, y) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(x, y); return t; };

  function addCol(cx, cz, w, d) {
    const c = { x1: cx - w / 2, z1: cz - d / 2, x2: cx + w / 2, z2: cz + d / 2, active: true };
    W.colliders.push(c);
    return c;
  }

  function box(w, h, d, material, x, y, z, ry = 0, collide = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    scene.add(m);
    if (collide) {
      const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
      addCol(x, z, w * c + d * s, w * s + d * c);
    }
    return m;
  }

  // ---------- materials ----------
  // ground gets NO vertex-snap: its huge triangles make the wobble look like an earthquake
  const mGround = new THREE.MeshLambertMaterial({ map: TEX.ground() });
  const mSiding = lam({ map: rep(TEX.siding(), 3, 1) });
  const mBarn = lam({ map: rep(TEX.barnWood(), 4, 2) });
  const mStone = lam({ map: rep(TEX.stone(), 3, 2) });
  const mPlanks = lam({ map: rep(TEX.planks(), 3, 3) });
  const mRoof = lam({ map: rep(TEX.roof(), 4, 2) });
  const mBark = lam({ map: TEX.bark() });
  const mDoor = lam({ map: TEX.door() });
  const mWindow = lam({ map: TEX.windowDark() });
  const mPaper = lam({ map: TEX.paper() });
  const mHay = lam({ map: TEX.hay() });
  const mCloth = lam({ color: 0x3c332b });
  const mRust = lam({ color: 0x55453a });
  const mDirt = lam({ color: 0x46392a });
  const mBurlap = lam({ map: TEX.burlap() });
  // double-sided variants for gable walls / the well shaft
  const mSidingD = lam({ map: rep(TEX.siding(), 3, 1), side: THREE.DoubleSide });
  const mBarnD = lam({ map: rep(TEX.barnWood(), 4, 2), side: THREE.DoubleSide });
  const mStoneD = lam({ map: rep(TEX.stone(), 3, 2), side: THREE.DoubleSide });

  // triangular gable: fills the gap between wall top and pitched roof
  function gable(cx, baseY, cz, halfBase, apexH, axis, mat) {
    const shape = new THREE.Shape();
    shape.moveTo(-halfBase, 0);
    shape.lineTo(halfBase, 0);
    shape.lineTo(0, apexH);
    shape.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
    m.position.set(cx, baseY, cz);
    if (axis === 'x') m.rotation.y = Math.PI / 2;
    scene.add(m);
    return m;
  }

  // ---------- sky ----------
  scene.background = new THREE.Color(0x07090f);
  scene.fog = new THREE.FogExp2(0x07090f, 0.031);

  const starGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2 + 0.15, r = 350;
    sp[i * 3] = Math.cos(a) * Math.cos(e) * r;
    sp[i * 3 + 1] = Math.sin(e) * r;
    sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xb8c2da, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.75
  })));

  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.moon(), fog: false, depthWrite: false }));
  moon.scale.set(42, 42, 1);
  moon.position.set(110, 95, -180);
  scene.add(moon);

  // ---------- light ----------
  scene.add(new THREE.HemisphereLight(0x222a3c, 0x0b0a08, 0.7));
  const moonDir = new THREE.DirectionalLight(0x8fa0c0, 0.38);
  moonDir.position.set(60, 90, -50);
  scene.add(moonDir);
  W.moonDir = moonDir;

  // ---------- ground ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mGround);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ---------- door factory ----------
  function makeDoor(hingeX, hingeZ, gapCenterX) {
    const pivot = new THREE.Group();
    pivot.position.set(hingeX, 0, hingeZ);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, 0.08), mDoor);
    panel.position.set(0.65, 1.1, 0);
    pivot.add(panel);
    scene.add(pivot);
    const col = addCol(gapCenterX, hingeZ, 1.4, 0.35);
    return { pivot, col, isOpen: false, target: 0 };
  }

  // ============ FARMHOUSE (-20, 36) ============
  {
    const x = -20, z = 36, w = 9, d = 7, h = 3.0, t = 0.25;
    // south wall w/ door gap
    box(3.85, h, t, mSiding, x - 2.575, h / 2, z + d / 2);
    box(3.85, h, t, mSiding, x + 2.575, h / 2, z + d / 2);
    box(1.3, h - 2.2, t, mSiding, x, 2.2 + (h - 2.2) / 2, z + d / 2, 0, false);
    box(w, h, t, mSiding, x, h / 2, z - d / 2);                       // north
    box(t, h, d, mSiding, x - w / 2, h / 2, z);                       // west
    box(t, h, d, mSiding, x + w / 2, h / 2, z);                       // east
    box(w, 0.2, d, mPlanks, x, h + 0.1, z, 0, false);                 // ceiling
    // floor
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mPlanks);
    fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.02, z); scene.add(fl);
    // roof
    for (const s of [-1, 1]) {
      const slope = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.16, 4.6), mRoof);
      slope.position.set(x, h + 1.0, z + s * 1.62);
      slope.rotation.x = s * 0.6;
      scene.add(slope);
    }
    box(0.8, 1.7, 0.8, mStone, x + 3, h + 1.3, z - 1.6, 0, false);    // chimney
    // gable triangles (ridge runs east-west)
    gable(x - w / 2, h, z, d / 2, 2.1, 'x', mSidingD);
    gable(x + w / 2, h, z, d / 2, 2.1, 'x', mSidingD);
    // windows
    for (const wx of [x - 2.8, x + 2.8]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mWindow);
      win.position.set(wx, 1.7, z + d / 2 + 0.14); scene.add(win);
    }
    const win2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mWindow);
    win2.position.set(x + w / 2 + 0.14, 1.7, z); win2.rotation.y = Math.PI / 2; scene.add(win2);

    W.houseDoor = makeDoor(x - 0.65, z + d / 2, x);

    // porch light — the one warm beacon you walk toward
    const porch = new THREE.PointLight(0xffb868, 0.95, 13, 1.5);
    porch.position.set(x, 2.6, z + d / 2 + 0.7);
    scene.add(porch);
    W.lanternLights.push(porch);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xffd28a }));
    bulb.position.set(x, 2.55, z + d / 2 + 0.4);
    scene.add(bulb);

    // dying embers in the fireplace
    const ember = new THREE.PointLight(0xff5522, 0.55, 6, 1.8);
    ember.position.set(x + 1.5, 0.7, z - 2.8);
    scene.add(ember);
    W.lanternLights.push(ember);

    // furniture
    box(1.5, 0.72, 0.85, mPlanks, x + 0.8, 0.36, z - 0.8);                 // table block
    box(1.7, 0.08, 1.0, mPlanks, x + 0.8, 0.78, z - 0.8, 0, false);        // table top
    box(0.45, 0.9, 0.45, mPlanks, x + 0.8, 0.45, z + 0.35);                // chair
    box(2.0, 0.45, 1.05, mCloth, x - 3.2, 0.23, z - 2.3);                  // bed
    box(0.5, 0.15, 0.7, mPaper, x - 4.0, 0.53, z - 2.3, 0, false);         // pillow
    W.dresser = box(1.2, 1.05, 0.5, mPlanks, x + 3.8, 0.53, z + 1.6);      // dresser
    box(1.7, 1.4, 0.5, mStone, x + 1.5, 0.7, z - 3.2);                     // fireplace
    const fireHole = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x05030a }));
    fireHole.position.set(x + 1.5, 0.6, z - 2.94); scene.add(fireHole);

    // the letter + flashlight on the table
    W.letter = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.28), mPaper);
    W.letter.rotation.set(-Math.PI / 2, 0, 0.3);
    W.letter.position.set(x + 0.55, 0.83, z - 0.75);
    scene.add(W.letter);

    W.flashlight = new THREE.Group();
    const flBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.3, 6), mRust);
    flBody.rotation.z = Math.PI / 2;
    W.flashlight.add(flBody);
    const flLens = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.03, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff7cc }));
    flLens.rotation.z = Math.PI / 2; flLens.position.x = 0.16;
    W.flashlight.add(flLens);
    W.flashlight.position.set(x + 1.2, 0.86, z - 1.0);
    scene.add(W.flashlight);

    // Ruth's letter on the dresser
    W.ruthNote = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), mPaper);
    W.ruthNote.rotation.set(-Math.PI / 2, 0, -0.5);
    W.ruthNote.position.set(x + 3.8, 1.08, z + 1.6);
    scene.add(W.ruthNote);
  }

  // ============ BARN (34, 24) ============
  {
    const x = 34, z = 24, w = 10, d = 13, h = 4.5, t = 0.3;
    // west wall w/ opening (faces the house)
    box(t, h, 5, mBarn, x - w / 2, h / 2, z - 4);
    box(t, h, 5, mBarn, x - w / 2, h / 2, z + 4);
    box(t, h - 3.4, 3, mBarn, x - w / 2, 3.4 + (h - 3.4) / 2, z, 0, false);
    box(t, h, d, mBarn, x + w / 2, h / 2, z);                          // east
    box(w, h, t, mBarn, x, h / 2, z - d / 2);                          // north
    box(w, h, t, mBarn, x, h / 2, z + d / 2);                          // south
    for (const s of [-1, 1]) {
      const slope = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.18, d + 0.8), mRoof);
      slope.position.set(x + s * 2.45, h + 1.15, z);
      slope.rotation.z = -s * 0.52;
      scene.add(slope);
    }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mPlanks);
    fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.02, z); scene.add(fl);
    // gable triangles (ridge runs north-south)
    gable(x, h, z - d / 2, w / 2, 2.5, 'z', mBarnD);
    gable(x, h, z + d / 2, w / 2, 2.5, 'z', mBarnD);

    box(3, 0.9, 0.8, mPlanks, x - 1, 0.45, z - 5.7);                   // workbench
    // key on Pa's hook
    box(0.06, 0.3, 0.06, mBark, x - 1.8, 1.6, z - 6.28, 0, false);     // hook block
    W.keyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xc8b878 }));
    W.keyMesh.position.set(x - 1.8, 1.45, z - 6.2);
    scene.add(W.keyMesh);
    // journal page nailed to the bench
    W.barnNote = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), mPaper);
    W.barnNote.rotation.x = -Math.PI / 2;
    W.barnNote.position.set(x + 0.2, 0.92, z - 5.6);
    scene.add(W.barnNote);
    // oil can
    W.oilCan = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 7),
      lam({ color: 0x7a2e22 }));
    W.oilCan.position.set(x + 2.5, 0.23, z - 4.5);
    scene.add(W.oilCan);
    // hay
    box(1.5, 0.9, 0.9, mHay, x + 3, 0.45, z + 3.5);
    box(1.5, 0.9, 0.9, mHay, x + 2.4, 0.45, z + 5, 0.4);
    box(1.5, 0.9, 0.9, mHay, x + 2.8, 1.35, z + 4.2, 0.2, false);
  }

  // ============ CHAPEL (0, -74) ============
  {
    const x = 0, z = -74, w = 7, d = 11, h = 3.6, t = 0.3;
    box(2.95, h, t, mStone, x - 2.025, h / 2, z + d / 2);              // south w/ door gap
    box(2.95, h, t, mStone, x + 2.025, h / 2, z + d / 2);
    box(1.4, h - 2.2, t, mStone, x, 2.2 + (h - 2.2) / 2, z + d / 2, 0, false);
    box(w, h, t, mStone, x, h / 2, z - d / 2);                         // north
    box(t, h, d, mStone, x - w / 2, h / 2, z);                         // west
    box(t, h, d, mStone, x + w / 2, h / 2, z);                         // east
    for (const s of [-1, 1]) {
      const slope = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.16, d + 0.6), mRoof);
      slope.position.set(x + s * 1.8, h + 0.85, z);
      slope.rotation.z = -s * 0.55;
      scene.add(slope);
    }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mPlanks);
    fl.rotation.x = -Math.PI / 2; fl.position.set(x, 0.02, z); scene.add(fl);
    // gable triangles (ridge runs north-south)
    gable(x, h, z - d / 2, w / 2, 1.9, 'z', mStoneD);
    gable(x, h, z + d / 2, w / 2, 1.9, 'z', mStoneD);
    // steeple + cross
    box(1.3, 1.6, 1.3, mStone, x, h + 1.6, z + d / 2 - 1, 0, false);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.3, 4), mRoof);
    spire.position.set(x, h + 3.0, z + d / 2 - 1); spire.rotation.y = Math.PI / 4; scene.add(spire);
    box(0.1, 0.9, 0.1, mBark, x, h + 4.1, z + d / 2 - 1, 0, false);
    box(0.55, 0.1, 0.1, mBark, x, h + 4.25, z + d / 2 - 1, 0, false);

    // pews + altar
    box(2.2, 0.5, 0.6, mPlanks, x - 1.7, 0.25, z + 1.8);
    box(2.2, 0.5, 0.6, mPlanks, x + 1.7, 0.25, z + 1.8);
    box(2.2, 0.5, 0.6, mPlanks, x - 1.7, 0.25, z + 0.2);
    box(2.2, 0.5, 0.6, mPlanks, x + 1.7, 0.25, z + 0.2);
    box(1.9, 1.0, 0.8, mStone, x, 0.5, z - 3.8);                       // altar
    // candles
    for (const cx of [-0.8, 0.8]) {
      box(0.06, 0.25, 0.06, mPaper, x + cx, 1.13, z - 3.8, 0, false);
      const flame = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xffcc66 }));
      flame.position.set(x + cx, 1.31, z - 3.8); scene.add(flame);
    }
    const candleLight = new THREE.PointLight(0xff9944, 0.55, 7, 1.5);
    candleLight.position.set(x, 1.6, z - 3.6);
    scene.add(candleLight);
    W.lanternLights.push(candleLight);

    // sermon pages + matches on the altar
    W.sermon = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), mPaper);
    W.sermon.rotation.set(-Math.PI / 2, 0, 0.15);
    W.sermon.position.set(x - 0.35, 1.02, z - 3.7);
    scene.add(W.sermon);
    W.matches = box(0.16, 0.05, 0.1, lam({ color: 0x8a4030 }), x + 0.42, 1.04, z - 3.7, 0.3, false);
    // crate of watchers
    W.crate = box(0.95, 0.6, 0.95, mPlanks, x + 2.4, 0.3, z + 4.2);
    for (let i = 0; i < 2; i++) {
      const doll = makeDoll();
      doll.position.set(x + 2.2 + i * 0.35, 0.6, z + 4.1 + i * 0.2);
      doll.rotation.z = 0.4 - i * 0.8;
      scene.add(doll);
      if (!W.crateDolls) W.crateDolls = [];
      W.crateDolls.push(doll);
    }

    W.chapelDoor = makeDoor(x - 0.7, z + d / 2, x);
    // chain across the door
    const chain = new THREE.Group();
    const cMat = new THREE.MeshLambertMaterial({ color: 0x494d52 });
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.07), cMat);
    c1.rotation.z = 0.35; chain.add(c1);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.07), cMat);
    c2.rotation.z = -0.35; chain.add(c2);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.08), cMat);
    chain.add(lock);
    chain.position.set(x, 1.15, z + d / 2 + 0.12);
    scene.add(chain);
    W.chapelChain = chain;
  }

  // ============ GRAVEYARD (east of chapel) ============
  {
    W.headstone = box(0.7, 0.9, 0.16, mStone, 10, 0.45, -74.5);
    W.graveMound = box(0.9, 0.3, 1.9, mDirt, 10, 0.12, -72.6, 0, false);
    const spots = [[7.5, -76.5], [12.5, -76], [8, -71], [13, -73.5], [11.5, -70.5]];
    for (const [gx, gz] of spots) {
      box(0.1, 1.0, 0.1, mBark, gx, 0.5, gz, Math.random() * 0.3 - 0.15, false);
      box(0.5, 0.09, 0.09, mBark, gx, 0.75, gz, Math.random() * 0.3 - 0.15, false);
    }
  }

  // ============ WELL (-8, 30) ============
  {
    // open shaft: walls only, with black water far below
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.9, 8, 1, true), mStoneD);
    ring.position.set(-8, 0.45, 30); scene.add(ring);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 5, 8), mStoneD);
    rim.rotation.x = Math.PI / 2; rim.position.set(-8, 0.9, 30); scene.add(rim);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.84, 8),
      new THREE.MeshBasicMaterial({ color: 0x04060a }));
    water.rotation.x = -Math.PI / 2; water.position.set(-8, 0.1, 30); scene.add(water);
    addCol(-8, 30, 1.8, 1.8);
    box(0.12, 2.0, 0.12, mBark, -8.7, 1.0, 30, 0, false);
    box(0.12, 2.0, 0.12, mBark, -7.3, 1.0, 30, 0, false);
    box(1.8, 0.1, 1.0, mRoof, -8, 2.05, 30, 0, false);
    W.wellPos = new THREE.Vector3(-8, 0, 30);
  }

  // ============ TRUCK (14, 65.5) ============
  {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 4.4), mRust); body.position.y = 0.85; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 1.5), mRust); cab.position.set(0, 1.55, 0.7); g.add(cab);
    const winT = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), mWindow);
    winT.position.set(0, 1.6, 1.46); g.add(winT);
    const wMat = new THREE.MeshLambertMaterial({ color: 0x14110e });
    for (const [wx, wz] of [[-1, 1.4], [1, 1.4], [-1, -1.4], [1, -1.4]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.25, 8), wMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx * 0.95, 0.37, wz);
      g.add(wheel);
    }
    g.position.set(14, 0, 65.5); g.rotation.y = 0.12;
    scene.add(g);
    addCol(14, 65.5, 2.4, 4.8);
    W.truckPos = new THREE.Vector3(14, 0, 65.5);
  }

  // ============ FENCES ============
  function fenceRun(x1, z1, x2, z2) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const ry = Math.atan2(dx, dz) + Math.PI / 2;
    const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    for (const y of [0.55, 1.0]) box(len, 0.09, 0.09, mBark, cx, y, cz, ry, false);
    const n = Math.floor(len / 3.2);
    for (let i = 0; i <= n; i++) {
      const t = i / Math.max(1, n);
      box(0.14, 1.25, 0.14, mBark, x1 + dx * t, 0.62, z1 + dz * t, 0, false);
    }
    // collider strip
    const w = Math.abs(dx) + 0.3, d = Math.abs(dz) + 0.3;
    addCol(cx, cz, Math.max(w, 0.3), Math.max(d, 0.3));
  }
  // road fence with two gaps (house path, truck path)
  fenceRun(-68, 58, -22, 58);
  fenceRun(-18, 58, 6, 58);
  fenceRun(10.5, 58, 68, 58);
  // perimeter
  fenceRun(-68, 58, -68, -82);
  fenceRun(68, 58, 68, -82);
  fenceRun(-68, -82, 68, -82);
  // hard outer bounds
  addCol(0, 74, 200, 1);       // north side of road
  addCol(0, -86, 200, 1);
  addCol(-72, 0, 1, 200);
  addCol(72, 0, 1, 200);

  // fallen logs blocking the road
  for (const lx of [-56, 58]) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 11, 7), mBark);
    log.rotation.z = Math.PI / 2; log.rotation.y = 0.15;
    log.position.set(lx, 0.5, 66);
    scene.add(log);
    addCol(lx, 66, 1.4, 11);
  }

  // ============ DEAD TREES ============
  const treeSpots = [
    [-30, 50], [-38, 42], [5, 48], [-2, 55], [22, 50], [44, 44], [50, 30],
    [-45, 30], [-55, 18], [-12, 12], [16, 10], [-8, -68], [-14, -78], [16, -79],
    [20, -68], [-64, -30], [64, -36], [-63, 45], [63, 50], [40, -75]
  ];
  for (const [tx, tz] of treeSpots) {
    const tr = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 3.4, 6), mBark);
    trunk.position.y = 1.7; tr.add(trunk);
    for (let b = 0; b < 3; b++) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1.8, 5), mBark);
      br.position.y = 2.6 + b * 0.4;
      br.rotation.z = (b - 1) * 0.9 + 0.4;
      br.position.x = (b - 1) * 0.5;
      tr.add(br);
    }
    tr.position.set(tx, 0, tz);
    tr.rotation.y = Math.random() * 6;
    scene.add(tr);
    addCol(tx, tz, 0.7, 0.7);
  }

  // ============ SCARECROW POST (0, -26) ============
  {
    const post = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 2.9, 6), mBark);
    pole.position.y = 1.45; post.add(pole);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.12), mBark);
    bar.position.y = 2.27; post.add(bar);
    post.position.copy(POST_POS);
    scene.add(post);
    addCol(0, -26, 0.5, 0.5);
    W.post = post;
  }

  // ============ CORNER-STONES + LANTERNS ============
  function makeDoll() {
    const doll = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.1), mBurlap);
    b.position.y = 0.2; doll.add(b);
    const arms = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.07), mBurlap);
    arms.position.y = 0.3; doll.add(arms);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.11), mHay);
    hd.position.y = 0.46; doll.add(hd);
    return doll;
  }

  const stoneDefs = [
    { x: -57, z: 1, noteId: 'frag74' },
    { x: 57, z: 1, noteId: 'frag79' },
    { x: -57, z: -57, noteId: 'frag81' },
    { x: 57, z: -57, noteId: 'frag86' }
  ];
  for (const sd of stoneDefs) {
    box(1.0, 0.5, 0.9, mStone, sd.x, 0.25, sd.z);
    box(0.75, 0.4, 0.7, mStone, sd.x, 0.68, sd.z, 0.3, false);
    box(0.5, 0.35, 0.5, mStone, sd.x, 1.0, sd.z, 0.6, false);
    const sig = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6),
      new THREE.MeshBasicMaterial({ map: TEX.sigil(), transparent: true }));
    sig.position.set(sd.x, 0.55, sd.z + 0.47);
    scene.add(sig);
    // lantern pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.2, 5), mBark);
    pole.position.set(sd.x + 0.9, 1.6, sd.z);
    pole.rotation.z = 0.1;
    scene.add(pole);
    const lant = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.26),
      new THREE.MeshBasicMaterial({ color: 0xffc870 }));
    lant.position.set(sd.x + 1.2, 3.05, sd.z);
    scene.add(lant);
    const ll = new THREE.PointLight(0xff9944, 0.85, 11, 1.4);
    ll.position.set(sd.x + 1.2, 3.0, sd.z);
    scene.add(ll);
    W.lanternLights.push(ll);
    // hidden doll, appears when placed
    const doll = makeDoll();
    doll.position.set(sd.x, 1.15, sd.z);
    doll.visible = false;
    scene.add(doll);

    W.stones.push({ pos: new THREE.Vector3(sd.x, 0, sd.z), doll, placed: false, noteId: sd.noteId });
  }

  // ============ CORN ============
  {
    const cw = 1.1, ch = 2.3;
    const p1 = new THREE.PlaneGeometry(cw, ch);
    const p2 = new THREE.PlaneGeometry(cw, ch);
    p2.rotateY(Math.PI / 2);
    // manual merge
    const geo = new THREE.BufferGeometry();
    const pos = [], norm = [], uv = [], idx = [];
    for (const p of [p1, p2]) {
      const base = pos.length / 3;
      pos.push(...p.attributes.position.array);
      norm.push(...p.attributes.normal.array);
      uv.push(...p.attributes.uv.array);
      for (const i of p.index.array) idx.push(i + base);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.translate(0, ch / 2, 0);

    const cornMat = TEX.ps1(new THREE.MeshLambertMaterial({
      map: TEX.corn(), alphaTest: 0.5, side: THREE.DoubleSide
    }));

    const pts = [];
    for (let gx = -60; gx <= 60; gx += 1.45) {
      for (let gz = -60; gz <= 4; gz += 1.15) {
        const x = gx + (Math.random() - 0.5) * 0.9;
        const z = gz + (Math.random() - 0.5) * 0.7;
        if (Math.abs(x) < 1.8) continue;                                    // main path
        if (Math.abs(z + 20) < 1.6) continue;                               // cross path
        if (Math.hypot(x, z + 26) < 6.5) continue;                          // post clearing
        let nearStone = false;
        for (const sd of stoneDefs) if (Math.hypot(x - sd.x, z - sd.z) < 4) nearStone = true;
        if (nearStone) continue;
        if (Math.random() < 0.05) continue;
        pts.push([x, z]);
      }
    }
    const inst = new THREE.InstancedMesh(geo, cornMat, pts.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
    for (let i = 0; i < pts.length; i++) {
      v.set(pts[i][0], 0, pts[i][1]);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI);
      const sc = 0.85 + Math.random() * 0.35;
      s.set(sc, sc * (0.9 + Math.random() * 0.3), sc);
      m4.compose(v, q, s);
      inst.setMatrixAt(i, m4);
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
  }

  // ---------- region helpers ----------
  W.inCorn = (x, z) => x > -61 && x < 61 && z > -61 && z < 5 &&
    !(Math.abs(x) < 1.8) && !(Math.hypot(x, z + 26) < 6.5);
  W.inHouse = (x, z) => x > -24.3 && x < -15.7 && z > 32.8 && z < 39.3;
  W.inBarn = (x, z) => x > 29.2 && x < 38.8 && z > 17.8 && z < 30.2;
  W.chapelInside = (x, z) => x > -3.2 && x < 3.2 && z > -79.2 && z < -68.8;
  W.indoors = (x, z) => W.inHouse(x, z) || W.inBarn(x, z) || W.chapelInside(x, z);

  W.randomCornPointNear = (pp, camera) => {
    const f = new THREE.Vector3();
    camera.getWorldDirection(f);
    const camA = Math.atan2(f.x, f.z);
    for (let i = 0; i < 12; i++) {
      const a = camA + Math.PI + (Math.random() - 0.5) * 2.6;   // biased behind you
      const r = 17 + Math.random() * 9;
      const x = pp.x + Math.sin(a) * r, z = pp.z + Math.cos(a) * r;
      if (x > -59 && x < 59 && z > -59 && z < 3) return new THREE.Vector3(x, 0, z);
    }
    return null;
  };

  return W;
}

// ============================================================
// PALE HARVEST — game director
// ============================================================
(function () {
'use strict';

if (!window.THREE) {
  document.getElementById('errmsg').classList.remove('hidden');
  document.getElementById('screen-title').classList.add('hidden');
  return;
}

// ---------- three setup ----------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 600);
scene.add(camera);

function resize() {
  const a = innerWidth / innerHeight;
  camera.aspect = a;
  camera.updateProjectionMatrix();
  renderer.setSize(Math.round(270 * a), 270, false);   // chunky internal res, CSS upscales
}
addEventListener('resize', resize);
resize();

UI.init();

// ---------- world / player / entity ----------
const W = buildWorld(scene);
W.lanternLights.forEach(l => { l.userData.base = l.intensity; });
const player = new Player(camera);
player.colliders = W.colliders;
const entity = new Scarecrow(scene, player, W.randomCornPointNear);

// flashlight
const flash = new THREE.SpotLight(0xffeec0, 0, 28, 0.5, 0.55, 1.2);
flash.position.set(0.28, -0.22, 0.1);
camera.add(flash);
camera.add(flash.target);
flash.target.position.set(0, -0.25, -4);

// ---------- state ----------
let mode = 'title';          // title | intro | play | dead | outro
const F = {
  letter: false, flash: false, flashOn: false, ruth: false,
  key: false, oil: false, barnNote: false,
  sermon: false, matches: false, effigies: 0, placed: 0,
  doused: false, lit: false, chase: false, done: false
};
const stage = { approached: false, barnHaunt: false, chapelHaunt: false, cornWhisper: false };
let checkpoint = { x: -20, z: 43, yaw: 0 };
let randomHauntT = 45;
let lightningT = 18;
const journalNotes = [];
const doors = [W.houseDoor, W.chapelDoor];
let currentInteract = null;

const OBJ = STORY.obj;

function setDoor(door, open) {
  if (door.isOpen === open) return;
  door.isOpen = open;
  door.col.active = !open;
  door.target = open ? -1.95 : 0;
  SND.sfx('creak');
}

let tabHintShown = false;
function readNote(id, cb) {
  const n = STORY.notes[id];
  const firstTime = !journalNotes.includes(n);
  if (firstTime) journalNotes.push(n);
  UI.showNote(n, () => {
    if (cb) cb();
    if (firstTime && STORY.thoughts[id]) {
      setTimeout(() => UI.toast('“' + STORY.thoughts[id] + '”', 5200), 250);
      if (!tabHintShown) {
        tabHintShown = true;
        setTimeout(() => UI.toast('Collected pages can be re-read — press TAB.', 4200), 6200);
      }
    }
  });
}

function inv() { UI.inventory(F); }

// ---------- interactables ----------
const inter = [];
function addI(x, z, r, label, use) { inter.push({ x, z, r, label, use }); }

// farmhouse door
addI(-20, 39.5, 2.4,
  () => W.houseDoor.isOpen ? null : '[E] Open the door',
  () => setDoor(W.houseDoor, true));

// grandpa's letter
addI(-19.45, 35.25, 1.9,
  () => F.letter ? null : '[E] Read the letter',
  () => {
    F.letter = true;
    readNote('letter', () => UI.setObjective(OBJ.flash));
  });

// flashlight
addI(-18.8, 35.0, 1.9,
  () => (F.letter && !F.flash) ? '[E] Take the flashlight' : null,
  () => {
    F.flash = true; F.flashOn = true;
    flash.intensity = 1.8;
    scene.remove(W.flashlight);
    SND.sfx('pickup'); inv();
    UI.setObjective(OBJ.barn);
    setTimeout(() => { SND.sfx('thunder'); }, 1800);
  });

// Ruth's letter on the dresser
addI(-16.2, 37.6, 1.8,
  () => F.ruth ? null : '[E] Read the unopened letter',
  () => { F.ruth = true; readNote('ruth'); });

// chapel key in the barn
addI(32.2, 17.8, 2.0,
  () => F.key ? null : "[E] Take the key from Pa's hook",
  () => {
    F.key = true;
    scene.remove(W.keyMesh);
    SND.sfx('pickup'); inv();
    UI.setObjective(OBJ.chapel);
    stage.barnHaunt = true;            // it leaves the post while you're inside
    if (entity.mode === 'post') { entity.vanish(); SND.sfx('crows'); }
  });

// oil can
addI(36.5, 19.5, 2.0,
  () => F.oil ? null : '[E] Take the oil can',
  () => { F.oil = true; scene.remove(W.oilCan); SND.sfx('pickup'); inv(); });

// barn journal page
addI(34.2, 18.4, 2.0,
  () => F.barnNote ? null : '[E] Read the journal page',
  () => { F.barnNote = true; readNote('journal73'); });

// chapel door
addI(0, -68.5, 2.4,
  () => {
    if (W.chapelDoor.isOpen) return null;
    if (W.chapelChain) return F.key ? '[E] Unlock the chapel' : '[E] Chained shut';
    return '[E] Open the chapel door';
  },
  () => {
    if (W.chapelChain) {
      if (!F.key) { UI.toast('A rusted chain. The lock is older than you are.'); SND.sfx('clank'); return; }
      scene.remove(W.chapelChain);
      W.chapelChain = null;
      SND.sfx('clank');
      checkpoint = { x: 0, z: -65, yaw: Math.PI };
      setTimeout(() => setDoor(W.chapelDoor, true), 350);
      UI.setObjective(OBJ.altar);
    } else {
      setDoor(W.chapelDoor, true);
    }
  });

// sermon pages (once read, they go into your journal)
addI(-0.35, -77.7, 2.0,
  () => F.sermon ? null : '[E] Read the pages on the altar',
  () => readNote('sermon', () => {
    if (!F.sermon) {
      F.sermon = true;
      scene.remove(W.sermon);
      UI.setObjective(OBJ.takeKit);
    }
  }));

// matches
addI(0.42, -77.7, 2.0,
  () => (F.sermon && !F.matches) ? '[E] Take the matches' : null,
  () => { F.matches = true; scene.remove(W.matches); SND.sfx('pickup'); inv(); checkKit(); });

// crate of watchers
addI(2.4, -69.8, 2.0,
  () => (F.sermon && F.effigies === 0 && F.placed === 0) ? '[E] Take the four watchers' : null,
  () => {
    F.effigies = 4;
    if (W.crateDolls) W.crateDolls.forEach(d => scene.remove(d));
    SND.sfx('pickup'); inv(); checkKit();
  });

function checkKit() {
  if (F.matches && F.effigies === 4 && !entity.phaseHunt) {
    UI.setObjective(OBJ.place);
    entity.phaseHunt = true;
    entity.spawnTimer = 14;
    SND.sfx('thunder');
    UI.toast('Outside, the corn has started moving against the wind.');
  }
}

// the four corner-stones
for (const stone of W.stones) {
  addI(stone.pos.x, stone.pos.z, 2.4,
    () => (!stone.placed && F.effigies > 0) ? '[E] Set a watcher on the stone' : null,
    () => {
      stone.placed = true;
      stone.doll.visible = true;
      F.effigies--;
      F.placed++;
      entity.aggression = F.placed;
      SND.sfx('whisper');
      inv();
      UI.placed(F.placed);
      readNote(stone.noteId, () => {
        if (F.placed >= 4) bindHim();
      });
    });
}

function bindHim() {
  entity.phaseHunt = false;
  entity.hangOnPost(true);
  SND.sfx('bell');
  setTimeout(() => SND.sfx('thunder'), 1200);
  UI.setObjective(OBJ.douse);
  // delayed so it doesn't collide with the last journal thought
  setTimeout(() => UI.toast('Every row whispers the same word at once. Then — silence.', 5000), 6800);
  checkpoint = { x: 0, z: -65, yaw: Math.PI };
}

// the post / the Old Man
addI(0, -26, 2.7,
  () => {
    if (F.placed < 4) return null;
    if (!F.doused) return F.oil ? '[E] Soak the Old Man in oil' : '[E] You need something to burn him with';
    if (!F.lit) return '[E] Strike a match';
    return null;
  },
  () => {
    if (!F.doused) {
      if (!F.oil) { UI.toast('Pa kept an oil can in the barn.'); return; }
      F.doused = true;
      UI.toast('Oil runs black down the burlap. The stitched mouth is wider than it was.');
      SND.sfx('whisper');
      UI.setObjective(OBJ.light);
    } else if (!F.lit) {
      F.lit = true;
      SND.sfx('match');
      entity.ignite();
      UI.setObjective(OBJ.run);
      setDoor(W.chapelDoor, true);
      setTimeout(() => {
        if (mode !== 'play') return;
        entity.startChase();
        F.chase = true;
        SND.setChase(true);
      }, 2400);
    }
  });

// flavor
addI(10, -74.5, 2.2,
  () => '[E] Read the headstone',
  () => UI.toast('JONAS HALE · 1909 – 1986 · “THE LORD GIVETH.”', 4000));
addI(10, -72.6, 2.2,
  () => '[E] The fresh grave',
  () => UI.toast('The dirt is loose. Something has been digging. From below.', 4000));
addI(14, 65.5, 3.0,
  () => '[E] Try the truck',
  () => UI.toast('The engine turns over and dies. The battery cables are cut. Cut — not corroded.', 4500));
addI(-8, 30, 2.2,
  () => '[E] Look down the well',
  () => UI.toast('The rope is cut. Far below, the water moves like something turning over in its sleep.', 4500));

// ---------- death / respawn ----------
entity.onCaught = () => {
  if (mode !== 'play') return;
  mode = 'dead';
  player.enabled = false;
  SND.sfx('scare');
  SND.setChase(false);
  SND.setHeart(0);
  UI.setStatic(1);
  UI.jumpscare(() => {
    const txt = STORY.deaths[(Math.random() * STORY.deaths.length) | 0];
    UI.death(txt, respawn);
  });
};

function respawn() {
  entity.killed = false;
  UI.setStatic(0);
  SND.setStatic(0);
  if (F.chase) {
    // back on the post — you have to light him again
    F.chase = false; F.lit = false;
    SND.setChase(false);
    SND.sfx('fireOff');
    entity.setBurn(false);
    entity.hangOnPost(true);
    player.setPos(0, -33, Math.PI);
    UI.setObjective(OBJ.light);
  } else {
    entity.vanish();
    player.setPos(checkpoint.x, checkpoint.z, checkpoint.yaw);
  }
  player.stamina = 1;
  UI.fade(false, 900);
  mode = 'play';
  lock();   // respawn comes from the death-screen click, so this gesture relocks
}

// ---------- ending ----------
function finishGame() {
  F.done = true;
  mode = 'outro';
  player.enabled = false;
  F.chase = false;
  SND.setChase(false);
  SND.setHeart(0);
  SND.setStatic(0);
  UI.setStatic(0);
  SND.sfx('slam');
  SND.sfx('fireOff');
  setDoor(W.chapelDoor, false);
  entity.group.visible = false;
  entity.mode = 'hidden';
  entity.phaseHunt = false;
  document.exitPointerLock && document.exitPointerLock();
  UI.fade(true, 1600, '#000', () => UI.runOutro(STORY.outro));
}

// ---------- objective marker ----------
const marker = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.3),
  new THREE.MeshBasicMaterial({ color: 0xffc868, transparent: true, opacity: 0.75, depthTest: false, fog: false })
);
marker.renderOrder = 999;
marker.visible = false;
scene.add(marker);
let markerT = 0;

function markerTarget() {
  if (F.chase) return [0, 2.8, -66];
  if (F.placed >= 4) return F.lit ? null : [0, 3.6, -26];
  if (F.effigies > 0) {
    let best = null, bd = 1e9;
    for (const s of W.stones) {
      if (s.placed) continue;
      const d = Math.hypot(player.pos.x - s.pos.x, player.pos.z - s.pos.z);
      if (d < bd) { bd = d; best = s; }
    }
    return best ? [best.pos.x, 2.4, best.pos.z] : null;
  }
  if (F.sermon) return F.matches ? [2.4, 1.6, -69.8] : [0.42, 1.9, -77.7];
  if (!W.chapelChain) return [-0.35, 1.9, -77.7];          // unlocked -> altar
  if (F.key) return [0, 3.0, -68.5];
  if (F.flash) return [32.2, 2.4, 17.8];
  if (F.letter) return [-18.8, 1.7, 35.0];
  if (stage.approached) return [-19.45, 1.7, 35.25];
  return [-20, 3.0, 39.5];
}

function updateMarker(dt) {
  markerT += dt;
  const tgt = mode === 'play' && !F.done ? markerTarget() : null;
  if (!tgt) { marker.visible = false; return; }
  const d = Math.hypot(player.pos.x - tgt[0], player.pos.z - tgt[2]);
  marker.visible = d > 3;
  marker.position.set(tgt[0], tgt[1] + Math.sin(markerT * 2.6) * 0.18, tgt[2]);
  marker.rotation.y = markerT * 1.8;
}

// ---------- non-lethal spooks ----------
let spookT = 40;
function doSpook() {
  const indoors = W.indoors(player.pos.x, player.pos.z);
  const roll = Math.random();
  if (roll < 0.2) {
    UI.faceFlash();
    SND.sfx('flash');
  } else if (roll < 0.5 && entity.mode === 'hidden' && !indoors) {
    // peeker: appears close, at the edge of your vision, gone almost instantly
    const f = player.forward();
    const a = Math.atan2(f.x, f.z) + (Math.random() < 0.5 ? 0.55 : -0.55);
    const d = 7 + Math.random() * 4;
    entity.manifestAt(new THREE.Vector3(
      player.pos.x + Math.sin(a) * d, 0, player.pos.z + Math.cos(a) * d));
    entity.lifeTimer = 0.7;
    SND.sfx('sight');
  } else if (roll < 0.7) {
    SND.sfx(indoors ? 'knock' : 'crows');
  } else if (roll < 0.85) {
    SND.sfx('breath');
  } else {
    SND.sfx('moan');
  }
}

// ---------- per-frame game logic ----------
const tmpV = new THREE.Vector3();

function gameTick(dt) {
  const p = player.pos;

  // first objective: reach the house
  if (!stage.approached && Math.hypot(p.x + 20, p.z - 39.5) < 7) {
    stage.approached = true;
    UI.setObjective(OBJ.letter);
  }

  // it leaves the post — sighting when you step out of the barn
  if (stage.barnHaunt && !W.inBarn(p.x, p.z)) {
    stage.barnHaunt = false;
    if (entity.mode === 'hidden') entity.manifestAt(new THREE.Vector3(6, 0, 2));
  }

  // sighting when you first leave the chapel
  if (F.sermon && !stage.chapelHaunt && !W.chapelInside(p.x, p.z) && p.z > -66 && F.placed === 0) {
    stage.chapelHaunt = true;
    if (entity.mode === 'hidden') entity.manifestAt(new THREE.Vector3(-4, 0, -48));
  }

  // occasional random sighting between key and the hunt
  if (F.key && !entity.phaseHunt && F.placed < 4 && entity.mode === 'hidden') {
    randomHauntT -= dt;
    if (randomHauntT <= 0) {
      randomHauntT = 35 + Math.random() * 30;
      if (!W.indoors(p.x, p.z) && Math.random() < 0.6) {
        const sp = W.randomCornPointNear(p, camera);
        if (sp) entity.manifestAt(sp);
      }
    }
  }

  // first steps into the corn
  if (!stage.cornWhisper && W.inCorn(p.x, p.z)) {
    stage.cornWhisper = true;
    SND.sfx('whisper');
  }

  // whispers near unplaced stones during the hunt
  if (entity.phaseHunt) {
    for (const s of W.stones) {
      if (!s.placed && Math.hypot(p.x - s.pos.x, p.z - s.pos.z) < 7 && Math.random() < 0.004) {
        SND.sfx('whisper');
      }
    }
  }

  // chase: reached the chapel?
  if (F.chase && W.chapelInside(p.x, p.z)) { finishGame(); return; }

  // static + heartbeat from the entity
  const st = entity.staticOut;
  UI.setStatic(st);
  SND.setStatic(st);
  const d = entity.dist();
  let heart = 0;
  if (entity.mode === 'hunt') heart = Math.max(0, 1 - d / 22);
  if (entity.mode === 'chase') heart = Math.max(0.5, 1 - d / 25);
  SND.setHeart(heart);

  // flashlight flicker when it's close
  if (F.flashOn) {
    let base = 1.8;
    if (entity.group.visible && entity.mode !== 'post' && entity.mode !== 'bound' && d < 15) {
      if (Math.random() < 0.18) base = Math.random() < 0.5 ? 0.15 : 2.3;
    }
    flash.intensity += (base - flash.intensity) * Math.min(1, dt * 30);
  }

  // occasional spooks once you have the flashlight (never during the chase)
  if (F.flash && !F.chase && !F.done) {
    spookT -= dt;
    if (spookT <= 0) {
      spookT = 45 + Math.random() * 50;
      doSpook();
    }
  }

  // lightning
  lightningT -= dt;
  if (lightningT <= 0) {
    lightningT = 24 + Math.random() * 32;
    const md = W.moonDir;
    md.intensity = 2.2;
    setTimeout(() => md.intensity = 0.38, 90);
    setTimeout(() => md.intensity = 1.6, 200);
    setTimeout(() => md.intensity = 0.38, 320);
    setTimeout(() => SND.sfx('thunder'), 800 + Math.random() * 1400);
  }

  // lantern flicker
  for (const l of W.lanternLights) {
    if (Math.random() < 0.14) l.intensity = l.userData.base * (0.65 + Math.random() * 0.6);
  }

  // interaction prompt
  const f = player.forward();
  let best = null, bestD = 1e9, bestLabel = null;
  for (const it of inter) {
    const lab = it.label();
    if (!lab) continue;
    const dx = it.x - p.x, dz = it.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist > it.r) continue;
    if (dist > 0.6) {
      tmpV.set(dx / dist, 0, dz / dist);
      if (tmpV.dot(f) < 0.2) continue;
    }
    if (dist < bestD) { bestD = dist; best = it; bestLabel = lab; }
  }
  currentInteract = best;
  UI.prompt(bestLabel);
}

// ---------- footsteps ----------
player.onStep = (running) => {
  SND.step(running, W.inCorn(player.pos.x, player.pos.z));
};

// ---------- input ----------
addEventListener('keydown', (e) => {
  if (e.code === 'Tab') e.preventDefault();

  if (e.code === 'KeyE' || e.code === 'Enter') {
    if (UI.noteOpen) { UI.hideNote(); if (mode === 'play') lock(); return; }
    if (UI.journalOpen) { UI.hideJournal(); if (mode === 'play') lock(); return; }
    if (mode === 'play' && currentInteract) currentInteract.use();
    return;
  }
  if (e.code === 'KeyF') {
    if (mode === 'play' && F.flash) {
      F.flashOn = !F.flashOn;
      flash.intensity = F.flashOn ? 1.8 : 0;
      SND.sfx('pickup');
      inv();
    }
    return;
  }
  if (e.code === 'Tab') {
    if (mode !== 'play' || UI.noteOpen) return;
    if (UI.journalOpen) {
      UI.hideJournal();
      lock();
    } else {
      UI.showJournal(journalNotes);
      document.exitPointerLock && document.exitPointerLock();   // free the cursor for clicking
    }
    return;
  }
  if (e.code === 'Escape' && UI.noteOpen) UI.hideNote();
});

// journal entries clickable
document.getElementById('journallist').addEventListener('click', (e) => {
  const el = e.target.closest('.jentry');
  if (!el || el.classList.contains('dim')) return;
  const idx = parseInt(el.textContent, 10) - 1;
  if (journalNotes[idx]) { UI.hideJournal(); UI.showNote(journalNotes[idx]); }
});

// ---------- pointer lock ----------
const viewport = document.getElementById('viewport');
function lock() { viewport.requestPointerLock && viewport.requestPointerLock(); }

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement !== null;
  if (mode === 'play') player.enabled = locked;
});
document.getElementById('paused').addEventListener('click', lock);

// ---------- volume ----------
const volEl = document.getElementById('vol');
const savedVol = parseInt(localStorage.getItem('ph_vol') || '55', 10);
volEl.value = savedVol;
const applyVol = v => SND.setVolume(Math.pow(v / 100, 1.4) * 1.1);
applyVol(savedVol);
volEl.addEventListener('input', () => {
  applyVol(+volEl.value);
  localStorage.setItem('ph_vol', volEl.value);
});
document.getElementById('volrow').addEventListener('click', e => e.stopPropagation());

// ---------- title -> intro -> play ----------
document.getElementById('screen-title').addEventListener('click', () => {
  if (mode !== 'title') return;
  SND.init();
  UI.hideTitle();
  mode = 'intro';
  UI.runIntro(STORY.intro, () => {
    mode = 'play';
    UI.fade(false, 1200);
    player.setPos(8, 67, 0.9);
    UI.setObjective(OBJ.approach);
    inv();
    lock();
  });
});

// ---------- main loop ----------
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // pause overlay (lost pointer lock) freezes the world too — no cheap kills
  const frozen = mode !== 'play' || UI.noteOpen || UI.journalOpen || !player.enabled;
  UI.paused(mode === 'play' && !player.enabled && !UI.noteOpen && !UI.journalOpen);
  if (!frozen) {
    player.update(dt);
    entity.update(dt, camera);
    gameTick(dt);
  }

  // doors always ease toward their target
  for (const door of doors) {
    door.pivot.rotation.y += (door.target - door.pivot.rotation.y) * Math.min(1, dt * 3.2);
  }
  updateMarker(dt);

  SND.tick(dt);
  UI.tick();
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

// debug / test handle
window.PH = {
  player, entity, F, W, camera, flash,
  mode: () => mode,
  setMode: m => { mode = m; },
  obj: OBJ
};

})();

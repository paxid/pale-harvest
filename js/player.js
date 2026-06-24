// ============================================================
// PALE HARVEST — first-person player controller
// ============================================================
class Player {

  constructor(camera) {
    this.camera = camera;
    this.pos = new THREE.Vector3(8, 0, 67);
    this.yaw = 0.9;
    this.pitch = 0;
    this.vel = new THREE.Vector3();
    this.colliders = [];
    this.enabled = false;      // input allowed
    this.stamina = 1;
    this.sprinting = false;
    this.bobPhase = 0;
    this.lastBobSin = 0;
    this.onStep = null;        // (running) => {}
    this.radius = 0.38;
    this.eye = 1.68;

    this.keys = {};
    addEventListener('keydown', e => { this.keys[e.code] = true; });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });

    document.addEventListener('mousemove', e => {
      if (!this.enabled || document.pointerLockElement === null) return;
      this.yaw -= e.movementX * 0.0023;
      this.pitch -= e.movementY * 0.0023;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });

    camera.rotation.order = 'YXZ';
  }

  setPos(x, z, yaw) {
    this.pos.set(x, 0, z);
    if (yaw !== undefined) this.yaw = yaw;
    this.vel.set(0, 0, 0);
    this.syncCamera(0);
  }

  forward() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  update(dt) {
    let ix = 0, iz = 0;
    if (this.enabled) {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) iz += 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) iz -= 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) ix -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;
    }
    const moving = (ix !== 0 || iz !== 0);

    // unlimited sprint — stamina stays full (bar auto-hides)
    this.sprinting = this.enabled && (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && moving && iz > 0;
    this.stamina = 1;

    const speed = this.sprinting ? 5.9 : 3.4;
    const f = this.forward();
    const r = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3()
      .addScaledVector(f, iz)
      .addScaledVector(r, ix);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);

    // accelerate toward wish velocity
    const accel = moving ? 11 : 13;
    this.vel.x += (wish.x - this.vel.x) * Math.min(1, accel * dt);
    this.vel.z += (wish.z - this.vel.z) * Math.min(1, accel * dt);

    // move + resolve, axis by axis
    this.pos.x += this.vel.x * dt;
    this.collideAxis('x');
    this.pos.z += this.vel.z * dt;
    this.collideAxis('z');

    // head bob + footsteps
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 0.6) {
      this.bobPhase += dt * (this.sprinting ? 11.5 : 8);
      const s = Math.sin(this.bobPhase);
      if (this.lastBobSin > 0 && s <= 0 && this.onStep) this.onStep(this.sprinting);
      this.lastBobSin = s;
    } else {
      this.bobPhase *= 0.9;
      this.lastBobSin = 0;
    }
    this.syncCamera(sp);
  }

  collideAxis(axis) {
    const r = this.radius, p = this.pos;
    for (const c of this.colliders) {
      if (c.active === false) continue;
      if (p.x > c.x1 - r && p.x < c.x2 + r && p.z > c.z1 - r && p.z < c.z2 + r) {
        if (axis === 'x') {
          const mid = (c.x1 + c.x2) / 2;
          p.x = p.x < mid ? c.x1 - r : c.x2 + r;
        } else {
          const mid = (c.z1 + c.z2) / 2;
          p.z = p.z < mid ? c.z1 - r : c.z2 + r;
        }
      }
    }
  }

  syncCamera(speed) {
    const bobAmp = Math.min(1, speed / 4) * 0.05;
    const y = this.eye + Math.sin(this.bobPhase) * bobAmp;
    this.camera.position.set(this.pos.x, y, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}

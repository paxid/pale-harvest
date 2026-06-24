// ============================================================
// PALE HARVEST — the Old Man of the Rows
// modes: post | hidden | manifest | hunt | bound | burning | chase
// ============================================================
const POST_POS = new THREE.Vector3(0, 0, -26);

class Scarecrow {

  constructor(scene, player, spawnPointFn) {
    this.scene = scene;
    this.player = player;
    this.spawnPointFn = spawnPointFn;
    this.mode = 'post';
    this.aggression = 0;
    this.onCaught = null;
    this.killed = false;
    this.staticOut = 0;
    this.spawnTimer = 18;
    this.lifeTimer = 0;
    this.seenTime = 0;
    this.everSeen = false;
    this.sightedSting = false;
    this.crowsDone = false;
    this.twitchT = 0;
    this.speed = 0;
    this.lungeT = 0;
    this.lungeCd = 0;

    this.build();
    this.hangOnPost(false);
    scene.add(this.group);
  }

  build() {
    const g = new THREE.Group();
    const burlap = TEX.ps1(new THREE.MeshLambertMaterial({ map: TEX.burlap() }));
    const cloth = TEX.ps1(new THREE.MeshLambertMaterial({ color: 0x3c332b }));
    const straw = TEX.ps1(new THREE.MeshLambertMaterial({ map: TEX.hay() }));
    const faceMat = TEX.ps1(new THREE.MeshLambertMaterial({ map: TEX.face() }));
    this.mats = [burlap, cloth, straw, faceMat];

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.05, 0.32), burlap);
    body.position.y = 1.28;
    g.add(body);

    // head: face texture on +z
    const side = new THREE.MeshLambertMaterial({ map: TEX.burlap() });
    TEX.ps1(side);
    this.headMats = [side, side, side, side, faceMat, side];
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.4), this.headMats);
    head.position.y = 2.1;
    g.add(head);
    this.head = head;

    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 6), cloth);
    hat.position.y = 2.5;
    hat.rotation.y = 0.4;
    g.add(hat);

    const mkArm = (dir) => {
      const pivot = new THREE.Group();
      pivot.position.set(dir * 0.3, 1.72, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.15, 0.15), burlap);
      arm.position.x = dir * 0.45;
      pivot.add(arm);
      const hand = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 5), straw);
      hand.rotation.z = dir * Math.PI / 2;
      hand.position.set(dir * 0.95, 0, 0);
      pivot.add(hand);
      return pivot;
    };
    this.armL = mkArm(-1); this.armR = mkArm(1);
    g.add(this.armL, this.armR);

    const mkLeg = (dir) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.85, 0.17), cloth);
      leg.position.set(dir * 0.15, 0.42, 0);
      return leg;
    };
    this.legL = mkLeg(-1); this.legR = mkLeg(1);
    g.add(this.legL, this.legR);

    // straw tufts at neck / waist
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 5), straw);
    tuft.position.y = 1.82; g.add(tuft);

    // fire light + embers (used when burning)
    this.fireLight = new THREE.PointLight(0xff7722, 0, 16, 1.6);
    this.fireLight.position.y = 1.6;
    g.add(this.fireLight);

    const eGeo = new THREE.BufferGeometry();
    const ePos = new Float32Array(40 * 3);
    for (let i = 0; i < 40; i++) {
      ePos[i * 3] = (Math.random() - 0.5) * 0.8;
      ePos[i * 3 + 1] = Math.random() * 2.4;
      ePos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    this.embers = new THREE.Points(eGeo, new THREE.PointsMaterial({
      color: 0xffaa44, size: 0.09, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.embers.visible = false;
    g.add(this.embers);

    this.group = g;
  }

  setPose(hang) {
    this.armL.rotation.z = hang ? 0 : -0.95;
    this.armR.rotation.z = hang ? 0 : 0.95;
    this.legL.rotation.x = hang ? 0.12 : 0;
    this.legR.rotation.x = hang ? -0.1 : 0;
    this.group.rotation.x = hang ? 0 : 0.07;   // leans at you when it walks
  }

  setBurn(on) {
    this.fireLight.intensity = on ? 2.2 : 0;
    this.embers.visible = on;
    for (const m of this.mats) m.emissive = new THREE.Color(on ? 0x812f00 : 0x000000);
  }

  hangOnPost(bound) {
    this.group.visible = true;
    this.group.position.copy(POST_POS);
    this.group.position.y = 0.55;
    this.group.rotation.set(0, 0, 0);
    this.setPose(true);
    this.mode = bound ? 'bound' : 'post';
  }

  vanish() {
    this.group.visible = false;
    this.mode = 'hidden';
    this.sightedSting = false;
    this.spawnTimer = Math.max(8, 24 - this.aggression * 3.5) * (0.7 + Math.random() * 0.6);
  }

  manifestAt(pos) {
    this.group.visible = true;
    this.group.position.set(pos.x, 0, pos.z);
    this.setPose(false);
    this.facePlayer();
    this.mode = 'manifest';
    this.lifeTimer = 7;
    this.seenTime = 0;
    this.everSeen = false;
    this.sightedSting = false;
  }

  ignite() {
    this.setBurn(true);
    this.mode = 'burning';
    SND.sfx('fireOn');
  }

  startChase() {
    this.group.position.y = 0;
    this.setPose(false);
    this.mode = 'chase';
    this.speed = 5.45;
    SND.sfx('tear');
  }

  // is the player's camera pointed at it?
  isSeen(camera) {
    const to = new THREE.Vector3().subVectors(this.group.position, this.player.pos);
    const d = to.length();
    if (d > 45) return false;
    to.normalize();
    const f = new THREE.Vector3();
    camera.getWorldDirection(f);
    return f.dot(to) > 0.55;
  }

  facePlayer() {
    const p = this.player.pos;
    this.group.lookAt(p.x, this.group.position.y, p.z);
  }

  dist() {
    const dx = this.group.position.x - this.player.pos.x;
    const dz = this.group.position.z - this.player.pos.z;
    return Math.hypot(dx, dz);
  }

  update(dt, camera) {
    const d = this.dist();
    const seen = this.group.visible && this.isSeen(camera);
    this.staticOut = 0;
    this.twitchT -= dt;

    switch (this.mode) {

      case 'post': {
        // head slowly turns to follow you
        const to = new THREE.Vector3().subVectors(this.player.pos, this.group.position);
        const targetY = Math.atan2(to.x, to.z);
        this.head.rotation.y += (targetY - this.head.rotation.y) * Math.min(1, dt * 0.4);
        if (!this.crowsDone && d < 9) { this.crowsDone = true; SND.sfx('crows'); }
        break;
      }

      case 'manifest': {
        this.lifeTimer -= dt;
        this.facePlayer();
        if (seen) {
          this.seenTime += dt;
          this.everSeen = true;
          if (!this.sightedSting) { this.sightedSting = true; SND.sfx('sight'); }
          this.staticOut = Math.max(0, 1 - d / 30) * 0.7;
        } else {
          this.staticOut = d < 30 ? 0.12 : 0;
          if (this.everSeen && this.seenTime > 1.2) this.vanish();   // gone when you look away
        }
        if (d < 9 || this.lifeTimer <= 0) this.vanish();
        break;
      }

      case 'hidden': {
        if (this.phaseHunt) {
          this.spawnTimer -= dt;
          if (this.spawnTimer <= 0) {
            const p = this.spawnPointFn(this.player.pos, camera);
            if (p) {
              this.manifestAt(p);
              this.mode = 'hunt';
              this.lifeTimer = 50;
              this.speed = 2.2 + this.aggression * 0.5;
              this.lungeCd = 2.5;
            } else this.spawnTimer = 4;
          }
        }
        break;
      }

      case 'hunt': {
        this.lifeTimer -= dt;
        this.lungeCd -= dt;
        this.facePlayer();
        if (!this.sightedSting && seen) { this.sightedSting = true; SND.sfx('sight'); }

        // sudden lunge when it gets close — run or die
        let spd = this.speed;
        if (this.lungeT > 0) {
          this.lungeT -= dt;
          spd = 9.6;
        } else if (d < 8.5 && this.lungeCd <= 0) {
          this.lungeT = 0.85;
          this.lungeCd = 7;
          SND.sfx('screech');
        }

        // weeping angel while it's still "shy" (a lunge overrides it)
        const frozen = seen && d > 7 && this.aggression < 2 && this.lungeT <= 0;
        if (!frozen) {
          const to = new THREE.Vector3().subVectors(this.player.pos, this.group.position);
          to.y = 0; to.normalize();
          this.group.position.addScaledVector(to, spd * dt);
          this.group.position.y = Math.abs(Math.sin(performance.now() * (this.lungeT > 0 ? 0.012 : 0.004))) * 0.06;
        }
        // jerky head twitch
        if (this.twitchT <= 0) {
          this.twitchT = 0.2 + Math.random() * 0.7;
          this.head.rotation.z = (Math.random() - 0.5) * 0.5;
          this.head.rotation.y = (Math.random() - 0.5) * 0.4;
        }
        this.staticOut = Math.max(0, 1 - d / 28) * (seen ? 0.95 : 0.4);
        if (d > 42 || this.lifeTimer <= 0) this.vanish();
        if (d < 1.6 && !this.killed) { this.killed = true; if (this.onCaught) this.onCaught(); }
        break;
      }

      case 'bound': {
        // writhing on the post
        if (this.twitchT <= 0) {
          this.twitchT = 0.1 + Math.random() * 0.3;
          this.group.rotation.z = (Math.random() - 0.5) * 0.16;
          this.head.rotation.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 0.6);
          if (Math.random() < 0.06) SND.sfx('whisper');
        }
        this.staticOut = Math.max(0, 1 - d / 14) * 0.3;
        break;
      }

      case 'burning': {
        if (this.twitchT <= 0) {
          this.twitchT = 0.06 + Math.random() * 0.15;
          this.group.rotation.z = (Math.random() - 0.5) * 0.3;
          this.head.rotation.y = (Math.random() - 0.5) * 2.2;
        }
        this.fireLight.intensity = 1.9 + Math.random() * 0.9;
        this.updateEmbers(dt);
        this.staticOut = Math.max(0.2, 1 - d / 20);
        break;
      }

      case 'chase': {
        const to = new THREE.Vector3().subVectors(this.player.pos, this.group.position);
        to.y = 0;
        const dd = to.length();
        to.normalize();
        this.group.position.addScaledVector(to, this.speed * dt);
        this.group.position.y = Math.abs(Math.sin(performance.now() * 0.009)) * 0.1;
        this.facePlayer();
        if (this.twitchT <= 0) {
          this.twitchT = 0.08 + Math.random() * 0.2;
          this.head.rotation.z = (Math.random() - 0.5) * 0.8;
        }
        this.fireLight.intensity = 1.9 + Math.random() * 0.9;
        this.updateEmbers(dt);
        this.staticOut = Math.max(0.3, 1 - dd / 25);
        if (dd < 1.7 && !this.killed) { this.killed = true; if (this.onCaught) this.onCaught(); }
        break;
      }
    }
  }

  updateEmbers(dt) {
    const a = this.embers.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      let y = a.getY(i) + dt * (0.8 + (i % 5) * 0.3);
      if (y > 2.6) {
        y = 0.3;
        a.setX(i, (Math.random() - 0.5) * 0.8);
        a.setZ(i, (Math.random() - 0.5) * 0.8);
      }
      a.setY(i, y);
    }
    a.needsUpdate = true;
  }
}

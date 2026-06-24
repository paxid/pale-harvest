// ============================================================
// PALE HARVEST — procedural WebAudio engine (no sound files)
// ============================================================
const SND = (() => {

  let ctx = null, master = null, noiseBuf = null;
  let windGain, staticGain, droneGain, fireGain, fireSrc;
  let staticTarget = 0, heartLevel = 0, heartT = 0, chaseOn = false, chaseT = 0;
  let stepFlip = false, volume = 0.6;

  function makeNoise() {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function env(node, t0, a, peak, d, end = 0.0001) {
    node.gain.setValueAtTime(0.0001, t0);
    node.gain.linearRampToValueAtTime(peak, t0 + a);
    node.gain.exponentialRampToValueAtTime(end, t0 + a + d);
  }

  function noiseSrc(loop = false) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf; s.loop = loop;
    return s;
  }

  const S = { ready: false };

  S.init = () => {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    noiseBuf = makeNoise();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 8;
    comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = volume;
    master.connect(comp);

    // wind: looped noise -> bandpass, slow gust LFO
    const wind = noiseSrc(true);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 320; bp.Q.value = 0.4;
    windGain = ctx.createGain(); windGain.gain.value = 0.05;
    wind.connect(bp); bp.connect(windGain); windGain.connect(master);
    wind.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.03;
    lfo.connect(lfoG); lfoG.connect(windGain.gain); lfo.start();

    // drone: detuned low oscillators
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 52;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 52.8;
    droneGain = ctx.createGain(); droneGain.gain.value = 0.035;
    o1.connect(droneGain); o2.connect(droneGain); droneGain.connect(master);
    o1.start(); o2.start();

    // static bed (entity proximity)
    const st = noiseSrc(true);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
    staticGain = ctx.createGain(); staticGain.gain.value = 0;
    st.connect(hp); hp.connect(staticGain); staticGain.connect(master);
    st.start();

    S.ready = true;
  };

  // called every frame from the main loop
  S.tick = (dt) => {
    if (!ctx) return;
    // smooth static toward target
    const cur = staticGain.gain.value;
    staticGain.gain.value = cur + (staticTarget * 0.2 - cur) * Math.min(1, dt * 6);

    // heartbeat
    if (heartLevel > 0.02) {
      heartT -= dt;
      if (heartT <= 0) {
        const bpm = 55 + heartLevel * 85;
        heartT = 60 / bpm;
        thump(0.16 + heartLevel * 0.22);
        setTimeout(() => thump(0.10 + heartLevel * 0.13), 60000 / bpm * 0.32);
      }
    }
    // chase pulse
    if (chaseOn) {
      chaseT -= dt;
      if (chaseT <= 0) {
        chaseT = 0.46;
        const t = ctx.currentTime;
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(72, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.18);
        const g = ctx.createGain(); env(g, t, 0.005, 0.5, 0.3);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.4);
        // anxiety cluster stab every other pulse
        if ((stepFlip = !stepFlip)) {
          [466, 493, 523].forEach(f => {
            const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f * 0.5;
            const sg = ctx.createGain(); env(sg, t, 0.01, 0.05, 0.35);
            s.connect(sg); sg.connect(master); s.start(t); s.stop(t + 0.45);
          });
        }
      }
    }
  };

  function thump(vol) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(58, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.12);
    const g = ctx.createGain(); env(g, t, 0.004, vol, 0.16);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.25);
  }

  S.setStatic = v => { staticTarget = Math.max(0, Math.min(1, v)); };
  S.setVolume = v => { volume = Math.max(0, Math.min(1.2, v)); if (master) master.gain.value = volume; };
  S.setHeart = v => { heartLevel = Math.max(0, Math.min(1, v)); };
  S.setChase = b => { chaseOn = b; if (!b) chaseT = 0; };

  S.step = (running, inCorn) => {
    if (!ctx) return;
    const t = ctx.currentTime;
    const s = noiseSrc();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = inCorn ? 2600 : 700;
    const g = ctx.createGain();
    env(g, t, 0.002, (running ? 0.16 : 0.09) * (inCorn ? 1.25 : 1), inCorn ? 0.14 : 0.08);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.2);
  };

  S.sfx = (name) => {
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (name) {

      case 'sight': {     // dissonant string cluster — it's looking at you
        [196, 202, 208, 311].forEach((f, i) => {
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(f, t);
          o.frequency.linearRampToValueAtTime(f * 1.06, t + 1.4);
          const g = ctx.createGain(); env(g, t + i * 0.04, 0.3, 0.075, 1.3);
          o.connect(g); g.connect(master); o.start(t); o.stop(t + 2);
        });
        break;
      }

      case 'whisper': {
        const s = noiseSrc();
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 7;
        bp.frequency.setValueAtTime(700, t);
        bp.frequency.linearRampToValueAtTime(2300, t + 0.9);
        bp.frequency.linearRampToValueAtTime(900, t + 1.7);
        const trem = ctx.createOscillator(); trem.frequency.value = 11;
        const tg = ctx.createGain(); tg.gain.value = 0.06;
        const g = ctx.createGain(); env(g, t, 0.25, 0.12, 1.6);
        trem.connect(tg); tg.connect(g.gain);
        s.connect(bp); bp.connect(g); g.connect(master);
        s.start(t); s.stop(t + 2); trem.start(t); trem.stop(t + 2);
        break;
      }

      case 'thunder': {
        const s = noiseSrc();
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
        lp.frequency.setValueAtTime(160, t); lp.frequency.exponentialRampToValueAtTime(45, t + 2.4);
        const g = ctx.createGain(); env(g, t, 0.06, 0.5, 2.6);
        s.connect(lp); lp.connect(g); g.connect(master);
        s.start(t); s.stop(t + 3);
        break;
      }

      case 'scare': {     // jumpscare scream: sub drop + vibrato shrieks + noise blast
        const sub = ctx.createOscillator(); sub.type = 'sine';
        sub.frequency.setValueAtTime(110, t);
        sub.frequency.exponentialRampToValueAtTime(28, t + 0.9);
        const sg = ctx.createGain(); env(sg, t, 0.005, 0.75, 1.0);
        sub.connect(sg); sg.connect(master); sub.start(t); sub.stop(t + 1.2);
        [1568, 1244, 1864].forEach(f0 => {
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(f0 * 0.55, t);
          o.frequency.linearRampToValueAtTime(f0, t + 0.1);
          o.frequency.linearRampToValueAtTime(f0 * 0.3, t + 1.05);
          const vib = ctx.createOscillator(); vib.frequency.value = 26;
          const vg = ctx.createGain(); vg.gain.value = f0 * 0.06;
          vib.connect(vg); vg.connect(o.frequency);
          const g = ctx.createGain(); env(g, t, 0.004, 0.3, 1.05);
          o.connect(g); g.connect(master);
          o.start(t); o.stop(t + 1.3); vib.start(t); vib.stop(t + 1.3);
        });
        const s = noiseSrc();
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
        const g1 = ctx.createGain(); env(g1, t, 0.003, 0.8, 0.95);
        s.connect(hp); hp.connect(g1); g1.connect(master); s.start(t); s.stop(t + 1.2);
        break;
      }

      case 'screech': {   // the lunge — fast rising shriek
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(420, t);
        o.frequency.exponentialRampToValueAtTime(2100, t + 0.3);
        const g = ctx.createGain(); env(g, t, 0.008, 0.42, 0.45);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.55);
        const s = noiseSrc();
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 2;
        const g2 = ctx.createGain(); env(g2, t, 0.01, 0.25, 0.4);
        s.connect(bp); bp.connect(g2); g2.connect(master); s.start(t); s.stop(t + 0.5);
        break;
      }

      case 'knock': {     // three slow knocks on wood
        for (let i = 0; i < 3; i++) {
          const t0 = t + i * 0.32;
          const o = ctx.createOscillator(); o.type = 'sine';
          o.frequency.setValueAtTime(165, t0);
          o.frequency.exponentialRampToValueAtTime(68, t0 + 0.09);
          const g = ctx.createGain(); env(g, t0, 0.003, 0.42, 0.15);
          o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.22);
        }
        break;
      }

      case 'breath': {    // two slow breaths, very close
        for (let i = 0; i < 2; i++) {
          const t0 = t + i * 0.9;
          const s2 = noiseSrc();
          const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 540;
          const g = ctx.createGain(); env(g, t0, 0.32, 0.15, 0.5);
          s2.connect(lp); lp.connect(g); g.connect(master); s2.start(t0); s2.stop(t0 + 0.95);
        }
        break;
      }

      case 'moan': {      // distant wail out in the rows
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(112, t);
        o.frequency.linearRampToValueAtTime(84, t + 2.2);
        const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
        const vg = ctx.createGain(); vg.gain.value = 4;
        vib.connect(vg); vg.connect(o.frequency);
        const g = ctx.createGain(); env(g, t, 0.7, 0.13, 1.8);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 2.7); vib.start(t); vib.stop(t + 2.7);
        break;
      }

      case 'flash': {     // split-second sting for a non-lethal face flash
        const s2 = noiseSrc();
        const hp2 = ctx.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 1000;
        const g = ctx.createGain(); env(g, t, 0.002, 0.42, 0.16);
        s2.connect(hp2); hp2.connect(g); g.connect(master); s2.start(t); s2.stop(t + 0.2);
        [880, 932].forEach(f => {
          const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
          const g2 = ctx.createGain(); env(g2, t, 0.002, 0.12, 0.14);
          o.connect(g2); g2.connect(master); o.start(t); o.stop(t + 0.18);
        });
        break;
      }

      case 'creak': {
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(140, t);
        o.frequency.linearRampToValueAtTime(95, t + 0.5);
        o.frequency.linearRampToValueAtTime(120, t + 0.8);
        const g = ctx.createGain(); env(g, t, 0.05, 0.06, 0.85);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 1);
        break;
      }

      case 'slam': {
        const s = noiseSrc();
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
        const g = ctx.createGain(); env(g, t, 0.003, 0.7, 0.35);
        s.connect(lp); lp.connect(g); g.connect(master); s.start(t); s.stop(t + 0.5);
        thump(0.5);
        break;
      }

      case 'clank': {     // chain
        [820, 1110, 660].forEach((f, i) => {
          const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
          const g = ctx.createGain(); env(g, t + i * 0.09, 0.002, 0.12, 0.18);
          o.connect(g); g.connect(master); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.25);
        });
        break;
      }

      case 'match': {
        const s = noiseSrc();
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
        const g = ctx.createGain(); env(g, t, 0.004, 0.25, 0.3);
        s.connect(hp); hp.connect(g); g.connect(master); s.start(t); s.stop(t + 0.4);
        break;
      }

      case 'bell': {      // deep chapel bell x3
        for (let i = 0; i < 3; i++) {
          const t0 = t + i * 1.5;
          [98, 147, 196, 294].forEach((f, j) => {
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * 1.002;
            const g = ctx.createGain(); env(g, t0, 0.005, [0.3, 0.14, 0.08, 0.04][j], 1.4);
            o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 1.6);
          });
        }
        break;
      }

      case 'crows': {
        for (let i = 0; i < 7; i++) {
          const t0 = t + i * 0.13 + Math.random() * 0.06;
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(900 + Math.random() * 500, t0);
          o.frequency.exponentialRampToValueAtTime(420, t0 + 0.12);
          const g = ctx.createGain(); env(g, t0, 0.004, 0.07, 0.12);
          o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.2);
        }
        break;
      }

      case 'pickup': {
        const o = ctx.createOscillator(); o.type = 'triangle';
        o.frequency.setValueAtTime(420, t); o.frequency.linearRampToValueAtTime(560, t + 0.07);
        const g = ctx.createGain(); env(g, t, 0.004, 0.12, 0.12);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);
        break;
      }

      case 'paper': {
        const s = noiseSrc();
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 1;
        const g = ctx.createGain(); env(g, t, 0.01, 0.1, 0.18);
        s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + 0.25);
        break;
      }

      case 'fireOn': {
        if (fireSrc) break;
        fireSrc = noiseSrc(true);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        fireGain = ctx.createGain(); fireGain.gain.value = 0;
        fireSrc.connect(lp); lp.connect(fireGain); fireGain.connect(master);
        fireSrc.start();
        fireGain.gain.linearRampToValueAtTime(0.22, t + 0.6);
        break;
      }

      case 'fireOff': {
        if (!fireSrc) break;
        fireGain.gain.linearRampToValueAtTime(0.0001, t + 1.2);
        const fs = fireSrc; fireSrc = null;
        setTimeout(() => { try { fs.stop(); } catch (e) {} }, 1500);
        break;
      }

      case 'tear': {      // it rips free of the post
        const s = noiseSrc();
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.8;
        const g = ctx.createGain(); env(g, t, 0.01, 0.5, 0.6);
        s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + 0.8);
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(180, t + 0.5);
        const g2 = ctx.createGain(); env(g2, t, 0.02, 0.3, 0.6);
        o.connect(g2); g2.connect(master); o.start(t); o.stop(t + 0.8);
        break;
      }
    }
  };

  return S;
})();

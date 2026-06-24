// ============================================================
// PALE HARVEST — DOM HUD / overlays
// ============================================================
const UI = (() => {

  const $ = id => document.getElementById(id);
  let els = {};
  let staticLevel = 0, grainCv, grainCtx;
  let noteCloseCb = null, introDone = null, outroIdx = 0, outroDone = null;
  let toastTimer = null;

  const U = { journalOpen: false, noteOpen: false };

  U.init = () => {
    ['objective', 'toast', 'prompt', 'inventory', 'noteview', 'notetitle',
     'notebody', 'journal', 'journallist', 'staticfx', 'fade', 'deathtext', 'jumpscare', 'scareface',
     'screen-title', 'screen-intro', 'screen-outro', 'outrotext', 'paused']
      .forEach(id => els[id] = $(id));
    grainCv = els.staticfx;
    grainCv.width = 160; grainCv.height = 90;
    grainCtx = grainCv.getContext('2d');
    TEX.drawScareFace(els.scareface);
  };

  // film grain + entity static, redrawn every frame
  U.tick = () => {
    const img = grainCtx.createImageData(160, 90);
    const d = img.data;
    const count = 300 + staticLevel * 9500;      // denser noise when it's close
    for (let n = 0; n < count; n++) {
      const i = ((Math.random() * 14400) | 0) * 4;
      const v = (Math.random() * 255) | 0;
      d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
    }
    grainCtx.putImageData(img, 0, 0);
    grainCv.style.opacity = Math.max(0.07, staticLevel * 0.85);
  };

  U.setStatic = v => { staticLevel = Math.max(0, Math.min(1, v)); };

  U.setObjective = t => {
    els.objective.innerHTML = '<span>OBJECTIVE</span><br>' + t;
    els.objective.classList.remove('flash');
    void els.objective.offsetWidth;
    els.objective.classList.add('flash');
  };

  U.placed = (n) => {
    const o = els.objective.innerHTML;
    els.objective.innerHTML = o.replace(/\(\d\/4\)/, `(${n}/4)`);
  };

  U.toast = (t, ms = 3500) => {
    els.toast.textContent = t;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), ms);
  };

  U.prompt = t => {
    if (t) { els.prompt.textContent = t; els.prompt.classList.add('show'); }
    else els.prompt.classList.remove('show');
  };

  U.inventory = (f) => {
    const chips = [];
    if (f.flash) chips.push('FLASHLIGHT' + (f.flashOn ? ' ●' : ' ○'));
    if (f.key) chips.push('CHAPEL KEY');
    if (f.oil) chips.push('OIL CAN');
    if (f.matches) chips.push('MATCHES');
    if (f.effigies > 0) chips.push('WATCHERS ×' + f.effigies);
    els.inventory.innerHTML = chips.map(c => `<div class="chip">${c}</div>`).join('');
  };

  // ---- notes ----
  U.showNote = (note, cb) => {
    U.noteOpen = true;
    noteCloseCb = cb || null;
    els.notetitle.textContent = note.title;
    els.notebody.textContent = note.body;
    els.noteview.classList.remove('hidden');
    SND.sfx('paper');
  };
  U.hideNote = () => {
    if (!U.noteOpen) return;
    U.noteOpen = false;
    els.noteview.classList.add('hidden');
    SND.sfx('paper');
    if (noteCloseCb) { const cb = noteCloseCb; noteCloseCb = null; cb(); }
  };

  // ---- journal ----
  U.showJournal = (found) => {
    U.journalOpen = true;
    els.journallist.innerHTML = found.length
      ? found.map((n, i) => `<div class="jentry">${i + 1}. ${n.title}</div>`).join('')
      : '<div class="jentry dim">You have found nothing yet.</div>';
    els.journal.classList.remove('hidden');
  };
  U.hideJournal = () => { U.journalOpen = false; els.journal.classList.add('hidden'); };

  // ---- fades ----
  U.fade = (toBlack, ms = 800, color = '#000', cb) => {
    const f = els.fade;
    f.style.transition = 'none';
    f.style.background = color;
    f.style.opacity = toBlack ? 0 : 1;
    void f.offsetWidth;
    f.style.transition = `opacity ${ms}ms linear`;
    f.style.opacity = toBlack ? 1 : 0;
    if (cb) setTimeout(cb, ms + 30);
  };

  // ---- screens ----
  U.hideTitle = () => els['screen-title'].classList.add('hidden');

  U.runIntro = (lines, cb) => {
    introDone = cb;
    const sc = els['screen-intro'];
    sc.classList.remove('hidden');
    sc.innerHTML = lines.map((l, i) =>
      `<div class="introline" style="animation-delay:${0.4 + i * 1.5}s">${l}</div>`).join('') +
      `<div class="introline hint" style="animation-delay:${0.8 + lines.length * 1.5}s">[ CLICK TO BEGIN ]</div>`;
    const fin = () => {
      sc.removeEventListener('click', fin);
      sc.classList.add('hidden');
      if (introDone) { const c = introDone; introDone = null; c(); }
    };
    sc.addEventListener('click', fin);
  };

  U.runOutro = (paras, cb) => {
    outroIdx = 0; outroDone = cb;
    const sc = els['screen-outro'];
    sc.classList.remove('hidden');
    const show = () => {
      if (outroIdx >= paras.length) {
        els.outrotext.innerHTML =
          '<div class="endtitle">PALE HARVEST</div><div class="hint" style="opacity:1">[ CLICK TO RETURN ]</div>';
        sc.onclick = () => location.reload();
        return;
      }
      els.outrotext.innerHTML = `<p>${paras[outroIdx]}</p><div class="hint">[ CLICK ]</div>`;
      outroIdx++;
    };
    sc.onclick = show;
    show();
  };

  U.death = (text, cb) => {
    els.deathtext.innerHTML = text.replace(/\n/g, '<br>') +
      '<div class="deathhint">[ CLICK TO CRAWL BACK ]</div>';
    els.deathtext.classList.remove('hidden');
    const hint = els.deathtext.querySelector('.deathhint');
    setTimeout(() => {
      hint.style.opacity = 0.85;
      const once = () => {
        els.deathtext.removeEventListener('click', once);
        els.deathtext.classList.add('hidden');
        if (cb) cb();
      };
      els.deathtext.addEventListener('click', once);
    }, 1100);
  };

  // split-second non-lethal face flash
  U.faceFlash = () => {
    els.jumpscare.classList.remove('go');
    els.jumpscare.classList.remove('hidden');
    setTimeout(() => els.jumpscare.classList.add('hidden'), 150);
  };

  U.jumpscare = (cb) => {
    els.jumpscare.classList.remove('hidden');
    els.jumpscare.classList.remove('go');
    void els.jumpscare.offsetWidth;
    els.jumpscare.classList.add('go');
    setTimeout(() => {
      els.jumpscare.classList.add('hidden');
      if (cb) cb();
    }, 950);
  };

  U.paused = b => els.paused.classList.toggle('hidden', !b);

  return U;
})();

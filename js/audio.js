/* 堡垒要塞 · 音效合成（WebAudio，无外部资源） */
(function () {
  'use strict';
  var A = {
    ctx: null,
    master: null,
    muted: false,
    ready: false
  };

  function ensure() {
    if (A.ready) return true;
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return false;
      A.ctx = new C();
      A.master = A.ctx.createGain();
      A.master.gain.value = 0.55;
      A.master.connect(A.ctx.destination);
      A.ready = true;
    } catch (e) { return false; }
    return true;
  }

  function now() { return A.ctx.currentTime; }

  function env(node, t0, peak, attack, decay) {
    var g = node.gain;
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
    g.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!ensure() || A.muted) return;
    var t0 = now() + (delay || 0);
    var o = A.ctx.createOscillator();
    var g = A.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    env(g, t0, vol == null ? 0.2 : vol, 0.004, dur);
    o.connect(g); g.connect(A.master);
    o.start(t0); o.stop(t0 + dur + 0.06);
  }

  var noiseBuf = null;
  function getNoise() {
    if (noiseBuf) return noiseBuf;
    var len = A.ctx.sampleRate * 1.2;
    noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function noise(dur, vol, filterFreq, q, sweepTo, delay) {
    if (!ensure() || A.muted) return;
    var t0 = now() + (delay || 0);
    var s = A.ctx.createBufferSource();
    s.buffer = getNoise();
    s.loop = true;
    var f = A.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(filterFreq || 900, t0);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur);
    f.Q.value = q == null ? 1.2 : q;
    var g = A.ctx.createGain();
    env(g, t0, vol == null ? 0.2 : vol, 0.005, dur);
    s.connect(f); f.connect(g); g.connect(A.master);
    s.start(t0); s.stop(t0 + dur + 0.08);
  }

  A.resume = function () { if (ensure() && A.ctx.state === 'suspended') A.ctx.resume(); };

  /* ---------- 游戏音效 ---------- */
  A.shot = function (kind) {
    if (kind === 'shotgun') { noise(0.30, 0.34, 1500, 0.7, 260); tone(170, 0.22, 'sawtooth', 0.16, 60); }
    else if (kind === 'sniper') { noise(0.42, 0.34, 2400, 0.6, 180); tone(290, 0.34, 'square', 0.2, 60); }
    else { noise(0.10, 0.22, 2200, 1.0, 700); tone(330, 0.09, 'square', 0.13, 120); }
  };
  A.dry = function () { tone(140, 0.05, 'square', 0.1, 90); };
  A.reloadStart = function () { tone(320, 0.06, 'triangle', 0.12); noise(0.09, 0.12, 700, 2, 400); };
  A.reloadEnd = function () { tone(520, 0.07, 'triangle', 0.14); tone(760, 0.09, 'triangle', 0.12, null, 0.06); };
  A.hit = function () { tone(1250, 0.045, 'square', 0.1, 900); };
  A.headshot = function () { tone(1750, 0.06, 'square', 0.13, 2400); tone(2400, 0.09, 'sine', 0.1, null, 0.05); };
  A.kill = function () { tone(210, 0.13, 'sawtooth', 0.11, 90); noise(0.16, 0.14, 600, 1, 200); };
  A.explode = function () {
    noise(0.65, 0.42, 420, 0.6, 70);
    tone(110, 0.5, 'sawtooth', 0.2, 38);
    tone(70, 0.7, 'sine', 0.22, 30, 0.03);
  };
  A.coreHit = function () { tone(90, 0.22, 'sawtooth', 0.2, 55); noise(0.2, 0.16, 400, 1.2, 160); };
  A.playerHit = function () { tone(160, 0.16, 'sawtooth', 0.16, 80); noise(0.18, 0.18, 500, 1, 220); };
  A.enemyShot = function () { tone(420, 0.06, 'sawtooth', 0.07, 180); };
  A.wave = function () {
    tone(300, 0.20, 'triangle', 0.16);
    tone(400, 0.24, 'triangle', 0.16, null, 0.16);
    tone(520, 0.34, 'triangle', 0.16, null, 0.32);
  };
  A.ui = function () { tone(720, 0.05, 'triangle', 0.09); };
  A.star = function (i) { tone(520 + i * 220, 0.28, 'triangle', 0.18); tone(1040 + i * 260, 0.2, 'sine', 0.1, null, 0.05); };
  A.win = function () {
    [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.34, 'triangle', 0.17, null, i * 0.13); });
  };
  A.fail = function () {
    [420, 330, 250, 160].forEach(function (f, i) { tone(f, 0.4, 'sawtooth', 0.15, null, i * 0.17); });
  };
  A.lock = function () { tone(200, 0.07, 'square', 0.1, 140); };
  A.setMuted = function (m) { A.muted = !!m; if (A.master) A.master.gain.value = m ? 0 : 0.55; };

  window.BF = window.BF || {};
  window.BF.audio = A;
})();

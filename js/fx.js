/* 堡垒要塞 · 视觉特效系统（粒子 / 曳光 / 爆炸 / 冲击环） */
(function () {
  'use strict';

  var FX = {
    scene: null,
    parts: [],      // 活跃粒子
    pool: [],       // 空闲粒子 mesh
    tracers: [],
    rings: [],
    MAX: 520
  };

  var _v = null;

  FX.init = function (scene) {
    FX.scene = scene;
    FX.parts.length = 0;
    FX.pool.length = 0;
    FX.tracers.length = 0;
    FX.rings.length = 0;
    _v = new THREE.Vector3();
  };

  function geoBox() {
    if (!FX._box) FX._box = new THREE.BoxGeometry(1, 1, 1);
    return FX._box;
  }
  function geoSph() {
    if (!FX._sph) FX._sph = new THREE.SphereGeometry(0.5, 8, 6);
    return FX._sph;
  }
  function geoRing() {
    if (!FX._ring) FX._ring = new THREE.RingGeometry(0.6, 1, 24);
    return FX._ring;
  }

  function take(kind, color) {
    var m = FX.pool.pop();
    if (!m) {
      m = new THREE.Mesh(geoBox(), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
    }
    m.geometry = kind === 'sphere' ? geoSph() : geoBox();
    m.material.color.setHex(color);
    m.material.opacity = 1;
    m.visible = true;
    FX.scene.add(m);
    return m;
  }

  function give(m) {
    m.visible = false;
    FX.scene.remove(m);
    if (FX.pool.length < 260) FX.pool.push(m);
  }

  /* ---------- 通用粒子发射 ---------- */
  function emit(pos, opt) {
    var n = opt.n || 10;
    for (var i = 0; i < n; i++) {
      if (FX.parts.length > FX.MAX) break;
      var m = take(opt.shape || 'box', opt.color == null ? 0xffaa33 : opt.color);
      var s = opt.size || 0.18;
      var jitter = opt.jitter == null ? 0.35 : opt.jitter;
      m.position.set(
        pos.x + (Math.random() - 0.5) * jitter,
        pos.y + (Math.random() - 0.5) * jitter,
        pos.z + (Math.random() - 0.5) * jitter
      );
      var v = opt.vel == null ? 4 : opt.vel;
      var dir = opt.dir;
      var vel = new THREE.Vector3(
        (Math.random() - 0.5) * v,
        Math.random() * v * (opt.up == null ? 1 : opt.up),
        (Math.random() - 0.5) * v
      );
      if (dir) vel.addScaledVector(dir, opt.dirBoost || 2);
      m.scale.setScalar(s * (0.6 + Math.random() * 0.9));
      FX.parts.push({
        m: m, life: 0, ttl: (opt.ttl || 0.7) * (0.6 + Math.random() * 0.8),
        vel: vel, grav: opt.grav == null ? -9 : opt.grav,
        spin: (Math.random() - 0.5) * 12,
        fade: opt.fade !== false, s0: m.scale.x, shrink: opt.shrink !== false
      });
    }
  }
  FX.emit = emit;

  FX.explode = function (pos, color, scale) {
    scale = scale || 1;
    emit(pos, { n: Math.round(16 * scale), color: 0xffd36a, vel: 7 * scale, ttl: 0.55, size: 0.22 * scale, grav: -6 });
    emit(pos, { n: Math.round(12 * scale), color: color == null ? 0xff6a2a : color, vel: 5.5 * scale, ttl: 0.8, size: 0.3 * scale, grav: -3 });
    emit(pos, { n: Math.round(10 * scale), color: 0x3a3a3a, vel: 2.4 * scale, ttl: 1.5, size: 0.42 * scale, grav: 0.6, up: 1.4 });
    FX.ring(pos, 0xffc46a, 3.2 * scale);
  };

  FX.ring = function (pos, color, max) {
    var m = new THREE.Mesh(geoRing(), new THREE.MeshBasicMaterial({
      color: color == null ? 0xffc46a : color, transparent: true, side: THREE.DoubleSide, depthWrite: false
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.copy(pos);
    m.position.y += 0.15;
    FX.scene.add(m);
    FX.rings.push({ m: m, life: 0, ttl: 0.5, max: max || 5 });
  };

  FX.puff = function (pos, color, n) {
    emit(pos, { n: n || 8, color: color == null ? 0xbbbbbb : color, vel: 2.2, ttl: 0.8, size: 0.22, grav: 1.2, shape: 'sphere', shrink: false });
  };

  FX.blood = function (pos, color, dir) {
    emit(pos, { n: 8, color: color == null ? 0xc4342a : color, vel: 3.2, ttl: 0.45, size: 0.14, grav: -8, dir: dir, dirBoost: 1.5 });
  };

  FX.sparks = function (pos, dir) {
    emit(pos, { n: 6, color: 0xffe08a, vel: 5, ttl: 0.3, size: 0.09, grav: -10, jitter: 0.1 });
  };

  FX.debris = function (pos, color) {
    emit(pos, { n: 10, color: color, vel: 4.5, ttl: 1.1, size: 0.2, grav: -9 });
  };

  /* ---------- 曳光弹 ---------- */
  FX.tracer = function (from, to, color) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([from.x, from.y, from.z, to.x, to.y, to.z], 3));
    var m = new THREE.LineBasicMaterial({ color: color == null ? 0xffe1a0 : color, transparent: true, opacity: 0.95 });
    var l = new THREE.Line(g, m);
    FX.scene.add(l);
    FX.tracers.push({ l: l, life: 0, ttl: 0.07 });
  };

  FX.clear = function () {
    for (var i = 0; i < FX.parts.length; i++) give(FX.parts[i].m);
    FX.parts.length = 0;
    for (var j = 0; j < FX.tracers.length; j++) { FX.scene.remove(FX.tracers[j].l); FX.tracers[j].l.geometry.dispose(); }
    FX.tracers.length = 0;
    for (var k = 0; k < FX.rings.length; k++) { FX.scene.remove(FX.rings[k].m); FX.rings[k].m.geometry.dispose(); }
    FX.rings.length = 0;
  };

  FX.update = function (dt) {
    var i, p;
    for (i = FX.parts.length - 1; i >= 0; i--) {
      p = FX.parts[i];
      p.life += dt;
      var t = p.life / p.ttl;
      if (t >= 1) { give(p.m); FX.parts.splice(i, 1); continue; }
      p.vel.y += p.grav * dt;
      p.m.position.x += p.vel.x * dt;
      p.m.position.y += p.vel.y * dt;
      p.m.position.z += p.vel.z * dt;
      if (p.m.position.y < 0.05 && p.grav < 0) { p.m.position.y = 0.05; p.vel.y *= -0.28; p.vel.x *= 0.6; p.vel.z *= 0.6; }
      p.m.rotation.x += p.spin * dt;
      p.m.rotation.y += p.spin * dt * 0.7;
      if (p.fade) p.m.material.opacity = 1 - t * t;
      if (p.shrink) p.m.scale.setScalar(p.s0 * (1 - t * 0.8));
    }
    for (i = FX.tracers.length - 1; i >= 0; i--) {
      var tr = FX.tracers[i];
      tr.life += dt;
      var tt = tr.life / tr.ttl;
      if (tt >= 1) { FX.scene.remove(tr.l); tr.l.geometry.dispose(); tr.l.material.dispose(); FX.tracers.splice(i, 1); continue; }
      tr.l.material.opacity = 0.95 * (1 - tt);
    }
    for (i = FX.rings.length - 1; i >= 0; i--) {
      var rg = FX.rings[i];
      rg.life += dt;
      var rt = rg.life / rg.ttl;
      if (rt >= 1) { FX.scene.remove(rg.m); rg.m.material.dispose(); FX.rings.splice(i, 1); continue; }
      rg.m.scale.setScalar(0.4 + rt * rg.max);
      rg.m.material.opacity = 0.75 * (1 - rt);
    }
  };

  window.BF = window.BF || {};
  window.BF.FX = FX;
})();

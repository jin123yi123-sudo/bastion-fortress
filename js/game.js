/* 堡垒要塞 · 主控：渲染 / 玩家 / 武器 / 波次 / 评分 / UI */
(function () {
  'use strict';

  var BF = window.BF;
  var LEVELS = BF.LEVELS;
  var TERRAIN = BF.TERRAIN;
  var FX = BF.FX;
  var WEAPONS = [
    {
      key: 'ar', name: '突击步枪', short: 'AR', dmg: 26, rate: 0.105, mag: 30, reserve: 210, reload: 1.7,
      spread: 0.011, adsSpread: 0.004, pellets: 1, auto: true, range: 220, headMul: 2.0, recoil: 0.55,
      zoom: 1.35, sfx: 'rifle', color: 0x4c5b46, kick: 0.35
    },
    {
      key: 'sg', name: '战斗霰弹枪', short: 'SG', dmg: 15, rate: 0.7, mag: 6, reserve: 48, reload: 2.3,
      spread: 0.075, adsSpread: 0.05, pellets: 9, auto: true, range: 55, headMul: 1.6, recoil: 2.2,
      zoom: 1.2, sfx: 'shotgun', color: 0x5a4636, kick: 1.1
    },
    {
      key: 'sr', name: '精准狙击枪', short: 'SR', dmg: 115, rate: 1.25, mag: 5, reserve: 40, reload: 2.6,
      spread: 0.02, adsSpread: 0.0006, pellets: 1, auto: false, range: 400, headMul: 2.4, recoil: 2.8,
      zoom: 5.2, sfx: 'sniper', color: 0x3d4a3c, kick: 1.8
    }
  ];

  /* ================= 存档 ================= */
  var SAVE_KEY = 'bastion_fortress_v1';
  var save = { stars: {}, best: {}, settings: { sens: 120, view: 'tps', muted: false } };

  function loadSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        save.stars = s.stars || {};
        save.best = s.best || {};
        save.settings = Object.assign({ sens: 120, view: 'tps', muted: false }, s.settings || {});
      }
    } catch (e) { }
  }
  function writeSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { }
  }
  function totalStars() {
    var n = 0;
    for (var k in save.stars) n += save.stars[k];
    return n;
  }
  function isUnlocked(lv) { return totalStars() >= lv.require; }

  /* ================= DOM ================= */
  function el(id) { return document.getElementById(id); }
  function show(id) { el(id).classList.remove('hide'); }
  function hide(id) { el(id).classList.add('hide'); }

  var toastTimer = null;
  function toast(msg) {
    var t = el('toast');
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.opacity = '0'; }, 1700);
  }

  /* ================= 引擎 ================= */
  var renderer, scene, camera, clock;
  var G = {
    state: 'menu',      // menu | brief | play | pause | result
    world: null,
    level: null,
    enemies: [],
    time: 0,
    sceneTime: 0
  };

  function initEngine() {
    var canvas = el('scene');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 900);
    scene.add(camera);
    FX.init(scene);
    clock = new THREE.Clock();
    ctxObj.scene = scene;
    ctxObj.camera = camera;
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /* ================= 玩家 ================= */
  var player = {
    pos: new THREE.Vector3(0, 0, 8),
    vel: new THREE.Vector3(0, 0, 0),
    yaw: Math.PI, pitch: -0.12,
    hp: 100, maxHp: 100,
    onGround: true, vy: 0,
    mesh: null, gun: null,
    moving: false, sprinting: false,
    bob: 0
  };

  function buildSoldier() {
    var g = new THREE.Group();
    var uni = new THREE.MeshLambertMaterial({ color: 0x4d6141 });
    var vest = new THREE.MeshLambertMaterial({ color: 0x3b3b33 });
    var skin = new THREE.MeshLambertMaterial({ color: 0xd7a373 });
    var helm = new THREE.MeshLambertMaterial({ color: 0x5a6b4a });

    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.86, 0.4), uni); torso.position.y = 1.16; g.add(torso);
    var vt = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.62, 0.52), vest); vt.position.y = 1.22; g.add(vt);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), skin); head.position.y = 1.82; g.add(head);
    var hm = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65), helm);
    hm.position.y = 1.84; g.add(hm);

    var legG = new THREE.BoxGeometry(0.22, 0.8, 0.24);
    var legL = new THREE.Group(); legL.position.set(-0.17, 0.8, 0);
    var legR = new THREE.Group(); legR.position.set(0.17, 0.8, 0);
    [legL, legR].forEach(function (p) {
      var m = new THREE.Mesh(legG, vest); m.position.y = -0.4; p.add(m); g.add(p);
    });

    var armR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.6, 0.17), uni);
    armR.position.set(0.42, 1.18, 0.12); g.add(armR);
    var armL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.6, 0.17), uni);
    armL.position.set(-0.42, 1.18, 0.02); g.add(armL);

    var gunGrp = buildGunModel(WEAPONS[0]);
    gunGrp.position.set(0.44, 1.06, 0.16);
    g.add(gunGrp);

    var pack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.6, 0.26), vest);
    pack.position.set(0, 1.2, -0.34); g.add(pack);

    g.userData = { legL: legL, legR: legR, gun: gunGrp, armR: armR, head: head };
    return g;
  }

  function buildGunModel(w) {
    var grp = new THREE.Group();
    var metal = new THREE.MeshLambertMaterial({ color: 0x33383d });
    var body = new THREE.MeshLambertMaterial({ color: w.color });
    var dark = new THREE.MeshLambertMaterial({ color: 0x23282c });
    var long = (w.key === 'sr') ? 1.55 : (w.key === 'sg' ? 0.9 : 1.0);

    var recv = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.5), body);
    grp.add(recv);
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.55 * long, 8), dark);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.42;
    grp.add(barrel);
    if (w.key === 'sg') {
      var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), dark);
      tube.rotation.x = Math.PI / 2; tube.position.set(0, -0.06, -0.42);
      grp.add(tube);
    }
    if (w.key === 'sr') {
      var scope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.34, 8), dark);
      scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.12, -0.02);
      grp.add(scope);
      var mag2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.1), dark);
      mag2.position.set(0, -0.13, 0.02);
      grp.add(mag2);
      var stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.34), body);
      stock.position.set(0, -0.03, 0.36);
      grp.add(stock);
    } else {
      var mag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.1), dark);
      mag.position.set(0, -0.16, 0.02);
      mag.rotation.x = -0.12;
      grp.add(mag);
      var stock2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.26), body);
      stock2.position.set(0, -0.02, 0.34);
      grp.add(stock2);
      var sight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.06), dark);
      sight.position.set(0, 0.1, -0.18);
      grp.add(sight);
    }
    var grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.09), dark);
    grip.position.set(0, -0.14, 0.2);
    grip.rotation.x = 0.28;
    grp.add(grip);
    var handguard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.22), metal);
    handguard.position.set(0, -0.02, -0.28);
    grp.add(handguard);
    grp.userData.muzzle = new THREE.Vector3(0, 0.02, -0.42 - 0.55 * long * 0.4);
    return grp;
  }

  /* 第一人称手持模型 */
  var vmGun = null;
  function ensureViewModel() {
    if (vmGun) camera.remove(vmGun);
    vmGun = buildGunModel(gun.w);
    vmGun.scale.setScalar(1.25);
    camera.add(vmGun);
  }

  /* ================= 主角 chemical ================= */
  function ensureAvatar() {
    if (player.mesh) return;
    player.mesh = buildSoldier();
    scene.add(player.mesh);
  }

  /* ================= 武器状态 ================= */
  var gun = {
    w: WEAPONS[0], idx: 0, mag: 30, reserve: 210,
    cd: 0, reloading: false, reloadT: 0, ads: false, shots: 0, hits: 0
  };

  function curWeapon() { return gun.w; }
  function setWeapon(i) {
    if (gun.reloading) return;
    gun.idx = i; gun.w = WEAPONS[i];
    gun.mag = gun.w.mag;
    gun.reserve = gun.w.reserve;
    gun.cd = 0.25;
    if (camera) ensureViewModel();
    // 更新士兵手中的枪颜色
    if (player.mesh) {
      var oldGun = player.mesh.userData.gun;
      oldGun.traverse(function (o) { if (o.material && o.material.color) o.material.color.setHex(gun.w.color); });
    }
    BF.audio.reloadEnd();
    updateWeaponBar();
  }

  function reload() {
    if (gun.reloading || gun.mag >= gun.w.mag || gun.reserve <= 0) return;
    gun.reloading = true;
    gun.reloadT = gun.w.reload;
    BF.audio.reloadStart();
  }

  /* ================= 命中判定 ================= */
  var _ray = new THREE.Vector3();
  var _tmp = new THREE.Vector3();

  function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r) {
    var ex = cx - ox, ey = cy - oy, ez = cz - oz;
    var b = ex * dx + ey * dy + ez * dz;
    var c = ex * ex + ey * ey + ez * ez - r * r;
    if (c > 0 && b < 0) return -1;
    var disc = b * b - c;
    if (disc < 0) return -1;
    var t = b - Math.sqrt(disc);
    if (t < 0) t = 0;
    return t;
  }

  function traceShot(dir, range) {
    var best = null, bestT = range, bestHead = false;
    var ox = camera.position.x, oy = camera.position.y, oz = camera.position.z;
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i];
      if (e.dead) continue;
      var p = e.mesh.position;
      // 头部球
      var th = raySphere(ox, oy, oz, dir.x, dir.y, dir.z, p.x, p.y + e.headY, p.z, e.headR);
      if (th >= 0 && th < bestT) { bestT = th; best = e; bestHead = true; continue; }
      var tb = raySphere(ox, oy, oz, dir.x, dir.y, dir.z, p.x, p.y + e.height * 0.55, p.z, e.radius * 1.06);
      if (tb >= 0 && tb < bestT) { bestT = tb; best = e; bestHead = false; }
    }
    return { enemy: best, t: bestT, head: bestHead, point: new THREE.Vector3(ox + dir.x * bestT, oy + dir.y * bestT, oz + dir.z * bestT) };
  }

  var _muzzle = new THREE.Vector3();
  function fireOnce() {
    var w = gun.w;
    gun.shots++;
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    // 扩散
    var spread = (gun.ads ? w.adsSpread : w.spread) * (player.moving ? 1.5 : 1) * (player.sprinting ? 1.6 : 1);
    var camPos = camera.position;
    for (var p = 0; p < w.pellets; p++) {
      var d = dir.clone();
      if (spread > 0) {
        d.x += (Math.random() - 0.5) * spread * 2;
        d.y += (Math.random() - 0.5) * spread * 2;
        d.z += (Math.random() - 0.5) * spread * 2;
        d.normalize();
      }
      var hit = traceShot(d, w.range);
      // 地面拦截（未命中敌人时子弹落在地上）
      if (d.y < -0.0001) {
        var tg = (G.world.groundY - camPos.y) / d.y;
        if (tg > 0.5 && tg < hit.t) {
          hit = {
            enemy: null, t: tg, head: false,
            point: new THREE.Vector3(camPos.x + d.x * tg, G.world.groundY + 0.02, camPos.z + d.z * tg)
          };
        }
      }
      // 起点
      var from = camera.position.clone();
      if (view === 'fps') {
        if (vmGun) {
          vmGun.getWorldPosition(_muzzle);
          _muzzle.addScaledVector(d, 0.75);
        } else {
          _muzzle.copy(from).addScaledVector(d, 0.9);
          _muzzle.y -= 0.12;
        }
        from.copy(_muzzle);
      } else {
        var mp = new THREE.Vector3();
        if (player.mesh) player.mesh.userData.gun.getWorldPosition(mp);
        else mp.copy(from);
        from.copy(mp);
      }
      if (hit.enemy) {
        gun.hits++;
        var dmg = w.dmg * (hit.head ? w.headMul : 1);
        var killed = hit.enemy.damage(dmg, hit.head, ctxObj);
        FX.tracer(from, hit.point, hit.head ? 0xffd6a0 : 0xffe9b0);
        FX.blood(hit.point, 0xb5302a, d);
        if (hit.head) { BF.audio.headshot(); flashHit(1); }
        else { BF.audio.hit(); flashHit(0); }
        if (!killed) addCombo(hit.head);
      } else {
        FX.tracer(from, hit.point, 0xfff0c0);
        if (hit.point.y <= G.world.groundY + 0.2) FX.puff(hit.point, 0xbbbbbb, 4);
      }
    }
    BF.audio.shot(w.sfx);
    gun.mag--;
    gun.cd = w.rate;
    // 后坐
    player.pitch += (w.recoil * 0.006) * (gun.ads ? 0.6 : 1);
    if (player.pitch > 1.2) player.pitch = 1.2;
    recoilKick = Math.min(1, recoilKick + w.kick * 0.5);
    if (gun.mag <= 0) reload();
    updateAmmo();
  }

  function updateAmmo() {
    el('ammoNum').innerHTML = gun.mag + '<small>/' + gun.reserve + '</small>';
    el('wpnName').textContent = gun.w.name;
    el('reloadHint').classList.toggle('hide', !(gun.mag === 0 && gun.reserve > 0 && !gun.reloading));
  }

  function updateWeaponBar() {
    var bar = el('weaponBar');
    bar.innerHTML = '';
    WEAPONS.forEach(function (w, i) {
      var d = document.createElement('div');
      d.className = 'wslot' + (i === gun.idx ? ' on' : '');
      d.innerHTML = '<span class="wico"></span><b>' + (i + 1) + '</b> ' + w.name;
      bar.appendChild(d);
      /* 外部美术：assets/ui/<weapon-id>.png 武器图标 */
      if (window.BF && BF.Art) BF.Art.mount(d.querySelector('.wico'), 'assets/ui/' + w.key + '.png');
    });
    updateAmmo();
  }

  /* ================= 连击 / 击杀反馈 ================= */
  var combo = 0, comboTimer = 0;
  function addCombo(head) {
    combo++;
    comboTimer = 2.6;
    if (combo >= 2) {
      var c = el('combo');
      c.querySelector('.k').textContent = 'x' + combo;
      c.style.opacity = '1';
      c.style.transform = 'translateX(-50%) scale(' + (1 + Math.min(0.5, combo * 0.04)) + ')';
    }
  }
  function flashHit(head) {
    var h = el('hitmark');
    h.style.opacity = '1';
    h.style.filter = head ? 'hue-rotate(300deg)' : 'none';
    hitFlash = 0.18;
  }

  var hitFlash = 0, recoilKick = 0, view = 'tps';
  var dmgFlashT = 0;

  /* ================= 战斗上下文 ================= */
  var run = null;

  var ctxObj = {
    scene: scene,
    camera: camera,
    world: null,
    player: player,
    time: 0,
    damageCore: function (n, e) {
      if (!run || run.over) return;
      run.core -= n;
      if (run.core < 0) run.core = 0;
      BF.audio.coreHit();
      dmgFlashT = 0.35;
      FX.explode(e.hitPoint(), 0xff8a3a, 0.6);
      updateCoreUI();
      if (run.core <= 0) endRun(false, '核心被击毁');
    },
    enemyShoot: function (e) {
      if (!run || run.over) return;
      var from = e.headPoint();
      BF.audio.enemyShot();
      var acc = 0.55 + (player.moving ? -0.12 : 0.2);
      if (e.type === 'sniper') acc += 0.12;
      if (Math.random() < acc) {
        var dmg = Math.round(e.dmg * 0.7);
        player.hp -= dmg;
        dmgFlashT = 0.5;
        if (player.hp <= 0) { player.hp = 0; endRun(false, '守军阵亡'); }
        updateHpUI();
      } else {
        FX.puff(new THREE.Vector3(player.pos.x, player.pos.y + 1.4, player.pos.z), 0xcccccc, 3);
      }
      FX.tracer(from, new THREE.Vector3(player.pos.x, player.pos.y + 1.4, player.pos.z), 0xff6a4a);
    },
    onKill: function (e, headshot) {
      run.kills++;
      if (headshot) run.heads++;
      run.score += e.score * (headshot ? 1.5 : 1);
      run.score += Math.round(combo * 10);
      BF.audio.kill();
      FX.explode(e.center(), 0xffa23a, e.T.model === 'tank' ? 1.6 : 0.9);
      killfeed(e.name, headshot);
      el('scoreNum').textContent = run.score;
      if (!run.waveCleared) checkWaveClear();
    }
  };

  function killfeed(name, head) {
    var f = el('killfeed');
    var d = document.createElement('div');
    d.className = 'kf' + (head ? ' hs' : '');
    d.innerHTML = '击杀 <b>' + name + '</b>' + (head ? ' <b>爆头</b>' : '');
    f.insertBefore(d, f.firstChild);
    while (f.children.length > 5) f.removeChild(f.lastChild);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 3600);
  }

  /* ================= 关卡启动 ================= */
  function startLevel(lv) {
    if (G.world) G.world.dispose();
    clearEnemies();
    G.level = lv;
    G.world = BF.World.build(scene, lv);
    ctxObj.world = G.world;
    G.world.setCoreHealth(1);

    run = {
      core: lv.core, maxCore: lv.core,
      wave: 0, waveTimer: 3.0, spawning: false, queue: [], waveCleared: false, spawnT: 0,
      kills: 0, heads: 0, score: 0, secs: 0, over: false, startedAt: performance.now()
    };

    player.pos.set(0, G.world.topY, 9);
    player.vel.set(0, 0, 0);
    player.yaw = Math.PI; player.pitch = -0.1;
    player.hp = player.maxHp;
    player.vy = 0;
    combo = 0;
    gun.reserve = gun.w.reserve;
    gun.mag = gun.w.mag;
    gun.reloading = false;

    ensureAvatar();
    updateWeaponBar();
    updateCoreUI(); updateHpUI();
    el('hudLevel').textContent = lv.name;
    el('killfeed').innerHTML = '';
    el('combo').style.opacity = '0';
    G.state = 'play';
    hide('menu'); hide('brief'); hide('result'); hide('pause');
    show('hud');
    requestLock();
    BF.audio.resume();
    toast(lv.name + ' · 防线就位');
  }

  function clearEnemies() {
    for (var i = 0; i < G.enemies.length; i++) G.enemies[i].dispose(ctxObj);
    G.enemies.length = 0;
    FX.clear();
  }

  /* ================= 波次 ================= */
  function spawnPos(from) {
    var a, d, x, z, y;
    var groundY = G.world.groundY;
    switch (from) {
      case 'air':
        a = Math.random() * Math.PI * 2; d = 45 + Math.random() * 45;
        return { x: Math.cos(a) * d, y: G.world.topY + 16 + Math.random() * 14, z: Math.sin(a) * d };
      case 'far':
        a = Math.random() * Math.PI * 2; d = 95 + Math.random() * 30;
        return { x: Math.cos(a) * d, y: groundY, z: Math.sin(a) * d };
      case 'water':
        a = Math.random() * Math.PI * 2; d = 36 + Math.random() * 34;
        return { x: Math.cos(a) * d, y: groundY, z: Math.sin(a) * d };
      default:
        a = Math.random() * Math.PI * 2; d = 58 + Math.random() * 38;
        return { x: Math.cos(a) * d, y: groundY, z: Math.sin(a) * d };
    }
  }

  function targetFor(e, from) {
    var a = Math.atan2(e.mesh.position.x, e.mesh.position.z);
    if (e.flying && !e.T.bombs) {
      // 空降兵贴到城墙外悬停，平视即可命中
      var rf = G.world.wallRadius + 0.5 + Math.random() * 2.0;
      return new THREE.Vector3(Math.sin(a) * rf, G.world.topY, Math.cos(a) * rf);
    }
    if (e.T.bombs) {
      // 轰炸飞翼盘旋在要塞上空投弹
      var r = Math.random() * 7;
      var ang = Math.random() * Math.PI * 2;
      return new THREE.Vector3(Math.cos(ang) * r, G.world.topY, Math.sin(ang) * r);
    }
    var rr = G.world.wallRadius + 1.2 + Math.random() * 1.5;
    return new THREE.Vector3(Math.sin(a) * rr, G.world.topY, Math.cos(a) * rr);
  }

  function startWave(idx) {
    var lv = G.level;
    var wv = lv.waves[idx];
    run.wave = idx + 1;
    run.waveCleared = false;
    run.queue = [];
    var delay = 0;
    wv.groups.forEach(function (g) {
      for (var i = 0; i < g.n; i++) {
        run.queue.push({ t: g.t, from: g.from, delay: delay });
        delay += 0.28 + Math.random() * 0.3;
      }
      delay += 0.8;
    });
    run.spawnT = 0;
    BF.audio.wave();
    waveToast(idx + 1, lv.waves.length);
    el('waveNum').textContent = (idx + 1) + ' / ' + lv.waves.length;
    el('waveBar').style.width = ((idx) / lv.waves.length * 100) + '%';
  }

  function spawnOne(cfg) {
    var T = BF.Enemies.TYPES[cfg.t];
    var p = spawnPos(cfg.from);
    var hpMul = 1 + (G.level.id - 1) * 0.09;
    var e = new BF.Enemies.Enemy(cfg.t, ctxObj, { hpMul: hpMul });
    e.mesh.position.set(p.x, p.y, p.z);
    e.target = targetFor(e, cfg.from);
    G.enemies.push(e);
    if (cfg.from === 'water') FX.puff(new THREE.Vector3(p.x, G.world.groundY + 0.3, p.z), 0x9fd8d0, 10);
    else FX.puff(new THREE.Vector3(p.x, p.y + 0.4, p.z), 0xbbbbbb, 6);
  }

  function checkWaveClear() {
    if (run.over || run.wave === 0 || run.waveCleared) return;
    // 队列已空且场上无活敌
    if (run.queue.length > 0) return;
    for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) return;
    if (run.waveCleared) return;
    run.waveCleared = true;
    run.score += 300;
    el('scoreNum').textContent = run.score;
    var last = run.wave >= G.level.waves.length;
    if (last) { endRun(true); return; }
    run.waveTimer = 6;
    // 补给
    gun.reserve = Math.min(gun.w.reserve, gun.reserve + gun.w.mag * 2);
    player.hp = Math.min(player.maxHp, player.hp + 22);
    updateAmmo(); updateHpUI();
    toast('第 ' + run.wave + ' 波肃清 · 补给已送达（6 秒后下一波）');
    el('waveBar').style.width = (run.wave / G.level.waves.length * 100) + '%';
  }

  function waveToast(n, total) {
    var w = el('wavetoast');
    w.querySelector('.w').textContent = '第 ' + n + ' 波来袭';
    w.querySelector('.s').textContent = 'WAVE ' + n + ' / ' + total;
    w.style.opacity = '1';
    setTimeout(function () { w.style.opacity = '0'; }, 1800);
  }

  /* ================= UI 更新 ================= */
  function updateCoreUI() {
    if (!run) return;
    var pct = run.core / run.maxCore;
    el('coreBar').style.width = (pct * 100) + '%';
    el('coreNum').textContent = Math.ceil(run.core);
    el('corePct').textContent = Math.round(pct * 100) + '%';
    G.world.setCoreHealth(pct);
  }
  function updateHpUI() {
    el('hpBar').style.width = (player.hp / player.maxHp * 100) + '%';
    el('hpNum').textContent = Math.ceil(player.hp);
    el('lowhp').style.opacity = player.hp < 35 ? '1' : '0';
  }

  var uiTick = 0;
  function updateHUD(dt) {
    uiTick += dt;
    if (uiTick > 0.12) {
      uiTick = 0;
      var alive = 0;
      for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) alive++;
      el('enemyNum').textContent = alive + run.queue.length;
      el('accNum').textContent = gun.shots ? Math.round(gun.hits / gun.shots * 100) + '%' : '--';
      el('killNum').textContent = run.kills + ' / ' + run.heads;
      var s = Math.floor(run.secs);
      el('timeNum').textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
    }
  }

  /* 雷达 */
  var rctx = null;
  function drawRadar() {
    if (!rctx) rctx = el('radar').getContext('2d');
    var c = rctx, w = 300, h = 300, cx = 150, cy = 150, R = 128;
    c.clearRect(0, 0, w, h);
    c.save();
    // 底盘
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2);
    c.fillStyle = 'rgba(8,14,20,.72)'; c.fill();
    c.clip();
    c.strokeStyle = 'rgba(255,171,74,.18)'; c.lineWidth = 2;
    for (var i = 1; i <= 3; i++) {
      c.beginPath(); c.arc(cx, cy, R * i / 3, 0, Math.PI * 2); c.stroke();
    }
    c.beginPath(); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R);
    c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.stroke();

    // 城墙
    c.beginPath();
    c.arc(cx, cy, (G.world.wallRadius / 120) * R, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(120,200,150,.55)'; c.lineWidth = 2; c.stroke();

    var cos = Math.cos(-player.yaw), sin = Math.sin(-player.yaw);
    for (var k = 0; k < G.enemies.length; k++) {
      var e = G.enemies[k];
      if (e.dead) continue;
      var dx = e.mesh.position.x - player.pos.x;
      var dz = e.mesh.position.z - player.pos.z;
      var rx = dx * cos - dz * sin;
      var rz = dx * sin + dz * cos;
      var px = cx + (rx / 120) * R;
      var py = cy + (rz / 120) * R;
      if (Math.sqrt(rx * rx + rz * rz) > 120) {
        var ang = Math.atan2(rz, rx);
        px = cx + Math.cos(ang) * R * 0.95; py = cy + Math.sin(ang) * R * 0.95;
      }
      var col = e.flying ? '#ffab4a' : (e.ranged ? '#ffe08a' : '#ff5d55');
      c.fillStyle = col;
      c.beginPath();
      if (e.flying) {
        c.moveTo(px, py - 6); c.lineTo(px + 6, py); c.lineTo(px, py + 6); c.lineTo(px - 6, py);
      } else {
        c.arc(px, py, e.T.model === 'tank' ? 7 : 5, 0, Math.PI * 2);
      }
      c.fill();
    }
    // 中心 axe
    c.beginPath();
    c.moveTo(cx, cy - 9); c.lineTo(cx - 6, cy + 7); c.lineTo(cx + 6, cy + 7);
    c.closePath(); c.fillStyle = '#7af7c8'; c.fill();
    c.restore();
    c.strokeStyle = 'rgba(255,171,74,.5)'; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
  }

  /* ================= 结算 ================= */
  function endRun(win, reason) {
    if (run.over) return;
    run.over = true;
    G.state = 'result';
    document.exitPointerLock && document.exitPointerLock();

    var acc = gun.shots ? gun.hits / gun.shots : 0;
    var corePct = Math.max(0, run.core / run.maxCore);
    var stars = 0;
    if (win) {
      stars = 1;
      if (corePct >= 0.6) stars = 2;
      if (corePct >= 0.88 && acc >= 0.22) stars = 3;
    }
    var timeBonus = win ? Math.max(0, 600 - run.secs) * 3 : 0;
    var accBonus = Math.round(acc * 1200);
    var coreBonus = Math.round(corePct * 2500);
    var total = Math.round(run.score + (win ? timeBonus + accBonus + coreBonus : 0));

    var lv = G.level;
    var prevStars = save.stars[lv.key] || 0;
    var prevBest = save.best[lv.key] || 0;
    var newRecord = total > prevBest;
    if (stars > prevStars) save.stars[lv.key] = stars;
    if (newRecord) save.best[lv.key] = total;
    writeSave();

    el('rsTitle').textContent = win ? '防线守住了' : '防线失守';
    el('rsTitle').className = 'rTitle' + (win ? '' : ' fail');
    el('rsSub').textContent = win ? lv.codename + ' · SECTOR CLEARED' : (reason || '');

    // 星星
    var sw = '';
    function starSVG(fill, i) {
      var pts = '150,20 186,96 268,96 202,144 224,224 150,176 76,224 98,144 32,96 114,96';
      return '<svg viewBox="0 0 300 240"><polygon points="' + pts + '" fill="' +
        (fill ? '#ffd257' : 'rgba(255,255,255,.09)') + '" stroke="' + (fill ? '#ffe9a8' : 'rgba(255,255,255,.18)') +
        '" stroke-width="6"/>' + (fill ? '<text x="150" y="150" font-size="90" text-anchor="middle" fill="#4a3200" font-family="Consolas">' + (i + 1) + '</text>' : '') + '</svg>';
    }
    for (var i = 0; i < 3; i++) sw += starSVG(i < stars, i);
    el('rsStars').innerHTML = sw;

    var rows = [
      ['击杀 / 爆头', run.kills + ' / ' + run.heads],
      ['命中率', Math.round(acc * 100) + '%'],
      ['核心完整度', Math.round(corePct * 100) + '%'],
      ['防御耗时', Math.floor(run.secs / 60) + '分' + Math.round(run.secs % 60) + '秒'],
      ['要塞星级', stars + ' / 3' + (stars > prevStars ? '  ★新纪录' : '')]
    ];
    if (win) rows.push(['时间 / 精准 / 核心奖励', '+' + Math.round(timeBonus + accBonus + coreBonus)]);
    var html = rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('');
    html += '<tr class="total"><td>总分 BEST ' + prevBest + (newRecord ? ' → NEW' : '') + '</td><td>' + total + '</td></tr>';
    el('rsTable').innerHTML = html;

    // 下一关是否解锁
    var nxt = LEVELS.filter(function (l) { return l.id === lv.id + 1; })[0];
    var showNext = win && nxt && isUnlocked(nxt);
    el('rsNext').classList.toggle('hide', !showNext);
    if (showNext) el('rsNext').textContent = '下一要塞 · ' + nxt.name;
    if (win) { BF.audio.win(); setTimeout(function () { for (var s = 0; s < stars; s++) setTimeout(function () { BF.audio.star(s); }, s * 260); }, 400); }
    else BF.audio.fail();

    hide('hud');
    show('result');
  }

  /* ================= 输入 ================= */
  var keys = {};
  var locked = false;

  function requestLock() {
    var c = el('scene');
    if (c.requestPointerLock) c.requestPointerLock();
  }

  function bindInput() {
    document.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      keys[k] = true;
      if (G.state === 'play') {
        if (k === 'escape') return; // 由 pointerlock 处理
        if (k === 'v') { toggleView(); }
        if (k === 'r') { reload(); }
        if (k === '1') setWeapon(0);
        if (k === '2') setWeapon(1);
        if (k === '3') setWeapon(2);
        if (k === ' ') e.preventDefault();
      }
    });
    document.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

    el('scene').addEventListener('mousedown', function (e) {
      BF.audio.resume();
      if (G.state !== 'play') return;
      if (!locked) { requestLock(); return; }
      if (e.button === 0) triggerDown = true;
      if (e.button === 2) gun.ads = true;
    });
    window.addEventListener('mouseup', function (e) {
      if (e.button === 0) triggerDown = false;
      if (e.button === 2) gun.ads = false;
    });
    window.addEventListener('contextmenu', function (e) { if (G.state === 'play') e.preventDefault(); });

    document.addEventListener('mousemove', function (e) {
      if (!locked || G.state !== 'play') return;
      var sens = save.settings.sens / 100;
      var s = 0.0022 * sens * (gun.ads ? 0.5 : 1);
      player.yaw -= e.movementX * s;
      player.pitch -= e.movementY * s;
      player.pitch = Math.max(-1.1, Math.min(1.1, player.pitch));
    });

    document.addEventListener('pointerlockchange', function () {
      locked = document.pointerLockElement === el('scene');
      if (!locked && G.state === 'play') pauseGame();
    });
  }

  var triggerDown = false;

  function toggleView() {
    view = view === 'fps' ? 'tps' : 'fps';
    save.settings.view = view;
    writeSave();
    el('viewTag').textContent = view === 'fps' ? '第一人称' : '第三人称';
    el('pFps').className = 'btn sm' + (view === 'fps' ? ' primary' : '');
    el('pTps').className = 'btn sm' + (view === 'tps' ? ' primary' : '');
    toast(view === 'fps' ? '切换到第一人称' : '切换到第三人称');
  }

  function pauseGame() {
    if (G.state !== 'play') return;
    G.state = 'pause';
    triggerDown = false;
    show('pause');
  }
  function resumeGame() {
    hide('pause');
    G.state = 'play';
    requestLock();
  }

  /* ================= 玩家更新 ================= */
  function updatePlayer(dt) {
    var speed = (keys['shift'] ? 8.5 : 5.4);
    var f = 0, s = 0;
    if (keys['w']) f += 1;
    if (keys['s']) f -= 1;
    if (keys['a']) s -= 1;
    if (keys['d']) s += 1;
    player.moving = (f || s) ? true : false;
    player.sprinting = !!keys['shift'] && player.moving;

    if (player.moving) {
      var len = Math.sqrt(f * f + s * s);
      f /= len; s /= len;
      var sinY = Math.sin(player.yaw), cosY = Math.cos(player.yaw);
      // forward = (-sinY, -cosY)
      var vx = (-sinY * f + cosY * s) * speed;
      var vz = (-cosY * f - sinY * s) * speed;
      player.vel.x += (vx - player.vel.x) * Math.min(1, dt * 12);
      player.vel.z += (vz - player.vel.z) * Math.min(1, dt * 12);
    } else {
      player.vel.x *= 0.82;
      player.vel.z *= 0.82;
    }

    player.pos.x += player.vel.x * dt;
    player.pos.z += player.vel.z * dt;
    player.pos.y += player.vy * dt;

    if (player.pos.y > G.world.topY + 0.01 || player.vy > 0) {
      player.vy -= 22 * dt;
      player.onGround = false;
    }
    if (player.pos.y <= G.world.topY) { player.pos.y = G.world.topY; player.vy = 0; player.onGround = true; }
    if (keys[' '] && player.onGround) { player.vy = 7.2; }

    // 边界
    var b = G.world.bounds;
    player.pos.x = Math.max(b.x0, Math.min(b.x1, player.pos.x));
    player.pos.z = Math.max(b.z0, Math.min(b.z1, player.pos.z));
    // 核心碰撞 (半径 3.4)
    var dx = player.pos.x, dz = player.pos.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d < 3.4 && d > 0.001) {
      player.pos.x = dx / d * 3.4;
      player.pos.z = dz / d * 3.4;
    }

    // 模型动画
    if (player.mesh) {
      player.mesh.position.copy(player.pos);
      player.mesh.rotation.y = player.yaw;
      var spd = Math.sqrt(player.vel.x * player.vel.x + player.vel.z * player.vel.z);
      player.bob += dt * spd * 2.6;
      var ud = player.mesh.userData;
      var sw = Math.sin(player.bob) * 0.6 * Math.min(1, spd / 5);
      ud.legL.rotation.x = sw;
      ud.legR.rotation.x = -sw;
      ud.gun.position.z = 0.16 - recoilKick * 0.25;
      ud.gun.rotation.x = -recoilKick * 0.35;
      player.mesh.visible = (view === 'tps');
    }
  }

  /* ================= 相机 ================= */
  var camLag = new THREE.Vector3();
  function updateCamera(dt) {
    var targetFov = 72;
    if (gun.ads) targetFov = gun.w.key === 'sr' ? 22 : 72 / gun.w.zoom;
    if (view === 'tps' && gun.ads) targetFov = Math.max(45, 72 / gun.w.zoom);
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 9);
    camera.updateProjectionMatrix();

    if (view === 'fps') {
      var eye = 1.72;
      var bobY = Math.sin(player.bob) * 0.035 * (player.moving ? 1 : 0.2);
      camera.position.set(player.pos.x, player.pos.y + eye + bobY, player.pos.z);
      camera.rotation.set(0, 0, 0);
      camera.rotateY(player.yaw);
      camera.rotateX(player.pitch);
      camera.rotateZ(Math.sin(player.bob * 0.5) * 0.006);
    } else {
      var dist = gun.ads ? 2.4 : 4.6;
      var height = gun.ads ? 1.9 : 2.5;
      var dirx = -Math.sin(player.yaw) * Math.cos(player.pitch);
      var diry = Math.sin(player.pitch);
      var dirz = -Math.cos(player.yaw) * Math.cos(player.pitch);
      var want = new THREE.Vector3(
        player.pos.x - dirx * dist,
        player.pos.y + height - diry * dist * 0.55,
        player.pos.z - dirz * dist
      );
      if (want.y < G.world.topY + 0.9) want.y = G.world.topY + 0.9;
      camera.position.lerp(want, Math.min(1, dt * 14));
      camera.lookAt(player.pos.x, player.pos.y + 1.55, player.pos.z);
    }
    if (recoilKick > 0) recoilKick = Math.max(0, recoilKick - dt * 3.2);

    // 第一人称手持武器
    if (vmGun) {
      var scoped = gun.ads && gun.w.key === 'sr' && view === 'fps';
      vmGun.visible = (view === 'fps') && !scoped;
      if (view === 'fps' && !scoped) {
        var aim = gun.ads && gun.w.key !== 'sr';
        var tx = aim ? 0.0 : 0.24, ty = aim ? -0.135 : -0.2, tz = aim ? -0.36 : -0.46;
        var bobx = Math.sin(player.bob) * 0.012 * (player.moving ? 1 : 0.25);
        var boby = Math.cos(player.bob * 2) * 0.008 * (player.moving ? 1 : 0.25);
        vmGun.position.x += (tx + bobx - vmGun.position.x) * Math.min(1, dt * 12);
        vmGun.position.y += (ty + boby - vmGun.position.y) * Math.min(1, dt * 12);
        vmGun.position.z += (tz + recoilKick * 0.14 - vmGun.position.z) * Math.min(1, dt * 14);
        vmGun.rotation.x = recoilKick * 0.25;
        vmGun.rotation.y = aim ? 0 : -0.045;
        vmGun.rotation.z = aim ? 0 : 0.03;
      }
    }
    // 瞄准镜 UI
    el('scope').style.opacity = (gun.ads && gun.w.key === 'sr' && view === 'fps') ? '1' : '0';
    el('crosshair').style.opacity = (gun.ads && view === 'fps' && gun.w.key === 'sr') ? '0' : '1';
  }

  /* ================= 主循环 ================= */
  function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, clock.getDelta());
    G.sceneTime += dt;

    if (G.state === 'play') {
      ctxObj.time = G.sceneTime;
      run.secs += dt;
      updatePlayer(dt);
      updateCamera(dt);

      // 武器
      if (gun.cd > 0) gun.cd -= dt;
      if (gun.reloading) {
        gun.reloadT -= dt;
        if (gun.reloadT <= 0) {
          var need = gun.w.mag - gun.mag;
          var take = Math.min(need, gun.reserve);
          gun.mag += take; gun.reserve -= take;
          gun.reloading = false;
          BF.audio.reloadEnd();
          updateAmmo();
        }
      } else if (triggerDown && gun.cd <= 0) {
        if (gun.mag > 0) { if (gun.w.auto || !gun.firedThisClick) { fireOnce(); gun.firedThisClick = true; } }
        else { BF.audio.dry(); gun.cd = 0.3; reload(); }
      }
      if (!triggerDown) gun.firedThisClick = false;

      // 波次
      if (!run.over) {
        if (run.wave === 0) {
          run.waveTimer -= dt;
          if (run.waveTimer <= 0) startWave(0);
        } else if (run.waveCleared) {
          run.waveTimer -= dt;
          if (run.waveTimer <= 0) startWave(run.wave);
        }
        // 出怪
        if (run.queue.length && !run.waveCleared) {
          run.spawnT += dt;
          while (run.queue.length && run.queue[0].delay <= run.spawnT) {
            spawnOne(run.queue.shift());
          }
        }
        // 更新敌人
        for (var i = G.enemies.length - 1; i >= 0; i--) {
          var e = G.enemies[i];
          e.update(dt, ctxObj);
          if (e.removeMe) { e.dispose(ctxObj); G.enemies.splice(i, 1); }
        }
        if (!run.waveCleared && run.queue.length === 0) checkWaveClear();
      }

      // 连击计时
      if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) { combo = 0; el('combo').style.opacity = '0'; }
      }
      if (hitFlash > 0) { hitFlash -= dt; if (hitFlash <= 0) el('hitmark').style.opacity = '0'; }
      if (dmgFlashT > 0) {
        dmgFlashT -= dt;
        el('dmgflash').style.opacity = String(Math.max(0, dmgFlashT * 1.4));
      }

      updateHUD(dt);
      drawRadar();
    }

    if (G.world) G.world.tick(dt, G.sceneTime);
    FX.update(dt);
    renderer.render(scene, camera);
  }

  /* ================= 菜单 ================= */
  function thumbCanvas(terrainKey) {
    var T = TERRAIN[terrainKey];
    var c = document.createElement('canvas');
    c.width = 300; c.height = 148;
    var g = c.getContext('2d');
    var grad = g.createLinearGradient(0, 0, 0, 148);
    grad.addColorStop(0, T.palette[0]);
    grad.addColorStop(1, T.palette[1]);
    g.fillStyle = grad; g.fillRect(0, 0, 300, 148);
    // 地形剪影
    g.fillStyle = 'rgba(0,0,0,.22)';
    if (terrainKey === 'skyline') {
      g.beginPath(); g.ellipse(150, 118, 90, 26, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)';
      for (var i = 0; i < 8; i++) {
        g.beginPath(); g.ellipse(30 + i * 34, 130 + (i % 3) * 5, 34, 9, 0, 0, Math.PI * 2); g.fill();
      }
    } else {
      g.beginPath();
      g.moveTo(0, 148);
      for (var x = 0; x <= 300; x += 30) {
        g.lineTo(x, 96 - Math.sin(x * 0.03) * 14 - (x % 60 === 0 ? 12 : 0));
      }
      g.lineTo(300, 148); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.14)';
      for (var k = 0; k < 7; k++) {
        var px = 20 + k * 42, py = 100 - (k % 3) * 8;
        g.beginPath(); g.moveTo(px, py); g.lineTo(px - 10, py + 18); g.lineTo(px + 10, py + 18); g.closePath(); g.fill();
      }
    }
    // 要塞剪影
    g.fillStyle = 'rgba(20,22,26,.85)';
    g.fillRect(112, 86, 76, 34);
    for (var t = 0; t < 4; t++) {
      g.fillRect(108 + t * 21, 76, 12, 12);
    }
    g.fillRect(140, 58, 20, 30);
    g.beginPath(); g.moveTo(138, 58); g.lineTo(150, 40); g.lineTo(162, 58); g.closePath(); g.fill();
    return c;
  }

  function buildMenu() {
    /* 外部美术：assets/ui/menu-bg.jpg 主菜单背景、assets/ui/logo.png LOGO */
    if (window.BF && BF.Art) {
      BF.Art.mount(el('menuBg'), 'assets/ui/menu-bg.jpg');
      BF.Art.mount(el('menuLogo'), 'assets/ui/logo.png');
    }
    var grid = el('levelGrid');
    grid.innerHTML = '';
    var ts = totalStars();
    el('totalStars').textContent = ts;
    el('clearedNum').textContent = LEVELS.filter(function (l) { return (save.stars[l.key] || 0) > 0; }).length;
    var best = 0;
    for (var k in save.best) best = Math.max(best, save.best[k]);
    el('bestScore').textContent = best;

    LEVELS.forEach(function (lv) {
      var card = document.createElement('div');
      var st = save.stars[lv.key] || 0;
      var un = isUnlocked(lv);
      card.className = 'card' + (un ? '' : ' locked');
      var starsHtml = '';
      for (var i = 0; i < 3; i++) starsHtml += '<span class="' + (i < st ? 'on' : '') + '">★</span>';
      card.innerHTML =
        '<div class="thumb"></div>' +
        '<div class="no">SECTOR ' + ('0' + lv.id).slice(-2) + '</div>' +
        (st === 3 ? '<div class="medal">满星</div>' : '') +
        '<div class="cd">' + lv.codename + '</div>' +
        '<div class="nm">' + lv.name + '</div>' +
        '<div class="ds">' + TERRAIN[lv.terrain].label + ' · ' + lv.threat.join('/') + '来敌 · ' + lv.waves.length + ' 波</div>' +
        '<div class="ft"><span class="stars">' + starsHtml + '</span><span>' + (save.best[lv.key] ? '最高 ' + save.best[lv.key] : '未通关') + '</span></div>' +
        (un ? '' : '<div class="lockbadge">需要累计 <b>' + lv.require + '</b> 星解锁<br><span style="font-size:11px">当前 ' + ts + ' 星</span></div>');
      var thumbBox = card.querySelector('.thumb');
      thumbBox.appendChild(thumbCanvas(lv.terrain));
      /* 外部美术：assets/levels/<key>.jpg 作为关卡封面，存在则覆盖程序缩略图 */
      if (window.BF && BF.Art) BF.Art.mount(thumbBox, BF.Art.coverUrl(lv.key));
      card.addEventListener('click', function () {
        if (!isUnlocked(lv)) { BF.audio.lock(); toast('还差 ' + (lv.require - totalStars()) + ' 星解锁此要塞'); return; }
        BF.audio.ui();
        openBrief(lv);
      });
      grid.appendChild(card);
    });
  }

  function openBrief(lv) {
    G.state = 'brief';
    hide('menu');
    show('brief');
    el('bfCode').textContent = 'SECTOR ' + ('0' + lv.id).slice(-2) + ' · ' + lv.codename;
    el('bfName').textContent = lv.name;
    el('bfTerrain').textContent = '地形：' + TERRAIN[lv.terrain].label + ' · 难度 ' + lv.difficulty;
    el('bfDesc').textContent = lv.brief;
    /* 外部美术：简报页封面 */
    if (window.BF && BF.Art && el('bfCover')) BF.Art.mount(el('bfCover'), BF.Art.coverUrl(lv.key));
    el('bfCore').textContent = lv.core;
    el('bfWaves').textContent = lv.waves.length;
    el('bfStar3').textContent = '核心≥88% 且命中≥22%';
    // 威胁列表
    var list = BF.Enemies.listFrom(lv.waves);
    list.sort(function (a, b) { return b.def.hp - a.def.hp; });
    el('bfThreat').innerHTML = list.map(function (x) {
      return '<span class="chip">' + x.def.name + ' ×' + x.n + '</span>';
    }).join('');
    el('bfView').textContent = view === 'fps' ? '第一人称' : '第三人称';
    el('bfStart').onclick = function () { BF.audio.ui(); startLevel(lv); };
  }

  /* ================= UI 绑定 ================= */
  function bindUI() {
    el('bfBack').onclick = function () { BF.audio.ui(); hide('brief'); show('menu'); G.state = 'menu'; };
    el('bfViewBtn').onclick = function () { BF.audio.ui(); toggleView(); el('bfView').textContent = view === 'fps' ? '第一人称' : '第三人称'; };

    el('pResume').onclick = function () { BF.audio.ui(); resumeGame(); };
    el('pRestart').onclick = function () { BF.audio.ui(); hide('pause'); startLevel(G.level); };
    el('pQuit').onclick = function () { BF.audio.ui(); quitToMenu(); };
    el('pFps').onclick = function () { if (view !== 'fps') toggleView(); };
    el('pTps').onclick = function () { if (view !== 'tps') toggleView(); };
    el('pMute').onclick = function () {
      save.settings.muted = !save.settings.muted; writeSave(); applySettings();
    };
    var ps = el('pSens');
    ps.oninput = function () {
      save.settings.sens = parseInt(ps.value, 10); writeSave();
      el('pSensVal').textContent = ps.value;
      el('sensRange').value = ps.value;
      el('sensVal').textContent = (parseInt(ps.value, 10) / 100).toFixed(2);
    };

    var sr = el('sensRange');
    el('sensRange').oninput = function () {
      save.settings.sens = parseInt(sr.value, 10); writeSave();
      el('sensVal').textContent = (save.settings.sens / 100).toFixed(2);
      ps.value = sr.value; el('pSensVal').textContent = sr.value;
    };
    el('muteBtn').onclick = function () {
      save.settings.muted = !save.settings.muted; writeSave(); applySettings();
    };
    el('helpBtn').onclick = function () { BF.audio.ui(); show('help'); };
    el('helpClose').onclick = function () { BF.audio.ui(); hide('help'); };
    el('wipeBtn').onclick = function () {
      if (!confirm('确定要清空全部星级与最高分记录吗？')) return;
      save.stars = {}; save.best = {};
      writeSave(); buildMenu();
      toast('存档已清空');
    };

    el('rsRetry').onclick = function () { BF.audio.ui(); hide('result'); startLevel(G.level); };
    el('rsMenu').onclick = function () { BF.audio.ui(); hide('result'); quitToMenu(); };
    el('rsNext').onclick = function () {
      BF.audio.ui();
      var nxt = LEVELS.filter(function (l) { return l.id === G.level.id + 1; })[0];
      hide('result');
      if (nxt && isUnlocked(nxt)) startLevel(nxt); else quitToMenu();
    };

    // 点击背景要塞预览旋转
    el('scene').addEventListener('click', function () {
      if (G.state === 'play' && !locked) requestLock();
    });
  }

  function applySettings() {
    BF.audio.setMuted(save.settings.muted);
    el('muteBtn').textContent = '音效 ' + (save.settings.muted ? '关' : '开');
    el('pMute').textContent = save.settings.muted ? '关' : '开';
    el('sensRange').value = save.settings.sens;
    el('pSens').value = save.settings.sens;
    el('sensVal').textContent = (save.settings.sens / 100).toFixed(2);
    el('pSensVal').textContent = save.settings.sens;
  }

  function quitToMenu() {
    G.state = 'menu';
    if (G.world) { G.world.dispose(); G.world = null; }
    clearEnemies();
    if (player.mesh) { scene.remove(player.mesh); player.mesh = null; }
    hide('hud'); hide('pause'); hide('result'); hide('brief');
    show('menu');
    buildMenu();
    // 菜单背景：造一个静态小场景
    buildMenuScene();
  }

  var menuWorld = null;
  function buildMenuScene() {
    var lv = LEVELS[Math.min(LEVELS.length - 1, Math.max(0, (save_stars_count() || 0))) ];
    menuWorld = BF.World.build(scene, lv);
    G.world = menuWorld;
    ctxObj.world = menuWorld;
    camera.position.set(0, 16, 46);
    camera.fov = 55; camera.updateProjectionMatrix();
    camera.lookAt(0, 4, 0);
    G.menuSpin = 0;
  }

  function save_stars_count() {
    var n = 0;
    LEVELS.forEach(function (l) { if ((save.stars[l.key] || 0) > 0) n++; });
    return n;
  }

  /* ================= 启动 ================= */
  BF.boot = function () {
    loadSave();
    initEngine();
    view = save.settings.view === 'fps' ? 'fps' : 'tps';
    applySettings();
    bindInput();
    bindUI();
    buildMenu();
    buildMenuScene();
    loop();
    hide('loading');
    show('menu');
    G.state = 'menu';

    // 菜单里缓慢旋转镜头（不接管 play 状态）
    setInterval(function () {
      if (G.state !== 'menu') return;
      G.menuSpin += 0.0016;
      var r = 52;
      camera.position.set(Math.sin(G.menuSpin) * r, 20 + Math.sin(G.menuSpin * 0.7) * 3, Math.cos(G.menuSpin) * r);
      camera.lookAt(0, 4, 0);
    }, 16);
  };

  /* 调试钩子（冒烟测试用，不影响游戏逻辑） */
  BF.__debug = {
    G: G,
    player: player,
    gun: gun,
    run: function () { return run; },
    enemies: function () { return G.enemies; },
    camera: function () { return camera; },
    view: function () { return view; },
    fireOnce: function () { fireOnce(); },
    startLevel: function (lv) { startLevel(lv); },
    endRun: function (win) { endRun(win); }
  };
})();

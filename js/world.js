/* 堡垒要塞 · 世界与场景构建（天空 / 地形 / 堡垒要塞本体 / 环境） */
(function () {
  'use strict';

  var W = {};

  function rnd32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function lam(color, opts) {
    var o = { color: color };
    if (opts) for (var k in opts) o[k] = opts[k];
    return new THREE.MeshLambertMaterial(o);
  }

  /* 渐变天空球 */
  function makeSky(top, hor, bot) {
    var c = document.createElement('canvas');
    c.width = 8; c.height = 256;
    var g = c.getContext('2d');
    var grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#' + ('000000' + top.toString(16)).slice(-6));
    grad.addColorStop(0.52, '#' + ('000000' + hor.toString(16)).slice(-6));
    grad.addColorStop(1, '#' + ('000000' + bot.toString(16)).slice(-6));
    g.fillStyle = grad; g.fillRect(0, 0, 8, 256);
    var tex = new THREE.CanvasTexture(c);
    var geo = new THREE.SphereGeometry(600, 24, 16);
    var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }));
    m.renderOrder = -1000;
    return m;
  }

  /* 水面 */
  function makeWater(color) {
    var g = new THREE.RingGeometry(34, 460, 64, 1);
    var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({
      color: color, transparent: true, opacity: 0.86, side: THREE.DoubleSide
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = -5.6;
    return m;
  }

  /* ---------- 环境装饰 ---------- */
  function scatter(scene, terrain, T, R) {
    var grp = new THREE.Group();
    var i, a, d, x, z, s, m;
    var n;

    function addAt(obj, dist0, dist1, minScale, maxScale, yBase) {
      var tries = 0;
      while (tries++ < 6) {
        a = R() * Math.PI * 2;
        d = dist0 + R() * (dist1 - dist0);
        x = Math.cos(a) * d; z = Math.sin(a) * d;
        if (Math.abs(x) < 34 && Math.abs(z) < 34) continue;
        if (d > dist0 + (dist1 - dist0) * 0.98) continue;
        break;
      }
      obj.position.set(x, yBase == null ? -6 : yBase, z);
      s = minScale + R() * (maxScale - minScale);
      obj.scale.setScalar(s);
      obj.rotation.y = R() * Math.PI * 2;
      grp.add(obj);
      return obj;
    }

    // 岩石（所有地形通用）
    var rockG = new THREE.IcosahedronGeometry(1, 0);
    var rockM = lam(T.rock);
    n = terrain === 'gobi' ? 46 : (terrain === 'skyline' ? 0 : 26);
    for (i = 0; i < n; i++) {
      m = new THREE.Mesh(rockG, rockM);
      m.rotation.set(R(), R(), R());
      addAt(m, 40, 240, 0.8, 2.6, -6 - R() * 0.6);
    }

    if (terrain === 'grass' || terrain === 'plain' || terrain === 'lake') {
      var treeCount = terrain === 'grass' ? 70 : 34;
      var trunkG = new THREE.CylinderGeometry(0.22, 0.3, 2.2, 6);
      var trunkM = lam(0x5b4326);
      var leafG = new THREE.ConeGeometry(1.5, 3.4, 7);
      var leafM = lam(terrain === 'grass' ? 0x37663a : 0x4a6b39);
      for (i = 0; i < treeCount; i++) {
        var t1 = new THREE.Group();
        var tr = new THREE.Mesh(trunkG, trunkM); tr.position.y = 1.1;
        var lf = new THREE.Mesh(leafG, leafM); lf.position.y = 3.0;
        t1.add(tr); t1.add(lf);
        addAt(t1, 42, 220, 0.85, 2.1, -6);
      }
    }

    if (terrain === 'beach') {
      var trunkG2 = new THREE.CylinderGeometry(0.18, 0.26, 4.4, 6);
      var pm = lam(0x8a6a3a);
      var leafG2 = new THREE.BoxGeometry(3.4, 0.08, 0.9);
      var gm = lam(0x4fae74, { side: THREE.DoubleSide });
      for (i = 0; i < 26; i++) {
        var pt = new THREE.Group();
        var tk = new THREE.Mesh(trunkG2, pm); tk.position.y = 2.2; tk.rotation.z = (R() - 0.5) * 0.35;
        pt.add(tk);
        for (var L = 0; L < 5; L++) {
          var lv = new THREE.Mesh(leafG2, gm);
          lv.position.y = 4.3;
          lv.rotation.y = L * Math.PI * 2 / 5;
          lv.rotation.z = -0.32;
          lv.translateX(1.5);
          pt.add(lv);
        }
        addAt(pt, 40, 200, 0.8, 1.5, -6);
      }
    }

    if (terrain === 'snow') {
      var pineG = new THREE.ConeGeometry(1.25, 4.2, 7);
      var pineM = lam(0x2f5a4a);
      var snowG = new THREE.ConeGeometry(1.05, 1.6, 7);
      var snowM = lam(0xf2f7ff);
      for (i = 0; i < 58; i++) {
        var p = new THREE.Group();
        var b = new THREE.Mesh(pineG, pineM); b.position.y = 2.1;
        var cap = new THREE.Mesh(snowG, snowM); cap.position.y = 3.4;
        p.add(b); p.add(cap);
        addAt(p, 42, 220, 0.9, 1.9, -6);
      }
      var moundG = new THREE.SphereGeometry(1, 8, 6);
      var moundM = lam(0xeef5ff);
      for (i = 0; i < 30; i++) {
        var mo = new THREE.Mesh(moundG, moundM);
        mo.scale.set(1.6 + R() * 2.4, 0.5 + R() * 0.5, 1.6 + R() * 2.4);
        addAt(mo, 38, 200, 0.7, 1.6, -6.2);
      }
    }

    if (terrain === 'gobi') {
      var duneG = new THREE.SphereGeometry(1, 10, 8);
      var duneM = lam(0xd9a75e);
      for (i = 0; i < 30; i++) {
        var du = new THREE.Mesh(duneG, duneM);
        du.scale.set(6 + R() * 12, 2 + R() * 2.4, 6 + R() * 12);
        addAt(du, 55, 230, 0.8, 1.5, -6.4);
      }
    }

    if (terrain === 'factory') {
      var boxG = new THREE.BoxGeometry(1, 1, 1);
      var contM = [0xa8542c, 0x4f7a6a, 0x8a8f52, 0x7a3f3a].map(function (c) { return lam(c); });
      for (i = 0; i < 46; i++) {
        var cb = new THREE.Mesh(boxG, contM[(R() * contM.length) | 0]);
        cb.scale.set(5.4, 2.4, 2.4);
        cb.position.y = 1.2;
        addAt(cb, 44, 190, 0.9, 1.6, -6);
        if (R() > 0.6) {
          var stack = new THREE.Mesh(boxG, contM[(R() * contM.length) | 0]);
          stack.scale.set(5.0, 2.3, 2.3);
          stack.position.set((R() - 0.5) * 0.6, 3.5, (R() - 0.5) * 0.6);
          cb.parent && cb.parent.add(stack);
        }
      }
      // 冷却塔 / 烟囱
      var towM = lam(0x8b8478);
      for (i = 0; i < 10; i++) {
        var cg = new THREE.CylinderGeometry(3.4, 4.6, 16, 12, 1, true);
        var ct = new THREE.Mesh(cg, towM);
        var wrap = new THREE.Group();
        ct.position.y = 8;
        wrap.add(ct);
        addAt(wrap, 70, 240, 0.7, 1.5, -6);
      }
    }

    if (terrain === 'city') {
      var wallG = new THREE.BoxGeometry(1, 1, 1);
      var brickM = lam(0x6b5a4a);
      var roofM = lam(0x9c3a30);
      for (i = 0; i < 34; i++) {
        var bld = new THREE.Group();
        var body = new THREE.Mesh(wallG, brickM);
        body.scale.set(4 + R() * 4, 4 + R() * 6, 4 + R() * 4);
        body.position.y = (body.scale.y) / 2;
        bld.add(body);
        var rf = new THREE.Mesh(wallG, roofM);
        rf.scale.set(body.scale.x * 1.35, 0.5, body.scale.z * 1.35);
        rf.position.y = body.scale.y;
        bld.add(rf);
        addAt(bld, 46, 220, 0.8, 1.7, -6);
      }
      // 远处山脊上的塔楼
      var pg = new THREE.BoxGeometry(6, 12, 6);
      var pm2 = lam(0x8a6a4a);
      for (i = 0; i < 8; i++) {
        var pag = new THREE.Mesh(pg, pm2);
        pag.position.y = 6;
        addAt(pag, 90, 230, 0.9, 1.6, -6);
      }
    }

    if (terrain === 'skyline') {
      // 下方云海
      var cloudMats = [0xffffff, 0xdfe9f7].map(function (c) {
        return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.42, depthWrite: false });
      });
      for (i = 0; i < 40; i++) {
        var r2 = 20 + R() * 260;
        var ang = R() * Math.PI * 2;
        var cl = new THREE.Mesh(new THREE.CircleGeometry(14 + R() * 26, 12), cloudMats[i % 2]);
        cl.rotation.x = -Math.PI / 2;
        cl.position.set(Math.cos(ang) * r2, -34 - R() * 26, Math.sin(ang) * r2);
        grp.add(cl);
      }
      // 远处浮空石柱
      var pilM = lam(0x7b869c);
      for (i = 0; i < 14; i++) {
        var pg2 = new THREE.Mesh(new THREE.CylinderGeometry(3 + R() * 5, 6 + R() * 7, 20 + R() * 40, 8), pilM);
        var ang2 = R() * Math.PI * 2, rr = 90 + R() * 180;
        pg2.position.set(Math.cos(ang2) * rr, -20 - R() * 10, Math.sin(ang2) * rr);
        grp.add(pg2);
      }
    }

    if (terrain === 'lake') {
      var reedM = lam(0x4f7a4a, { side: THREE.DoubleSide });
      var reedG = new THREE.BoxGeometry(0.12, 2.4, 0.12);
      for (i = 0; i < 120; i++) {
        var ang3 = R() * Math.PI * 2, rr3 = 38 + R() * 60;
        var patch = new THREE.Group();
        for (var k = 0; k < 5; k++) {
          var rd = new THREE.Mesh(reedG, reedM);
          rd.position.set((R() - 0.5) * 2, 1.2, (R() - 0.5) * 2);
          rd.rotation.z = (R() - 0.5) * 0.4;
          patch.add(rd);
        }
        patch.position.set(Math.cos(ang3) * rr3, -6, Math.sin(ang3) * rr3);
        grp.add(patch);
      }
    }

    scene.add(grp);
    return grp;
  }

  /* ---------- 雪 / 沙尘粒子 ---------- */
  function makeWeather(scene, T, terrain) {
    if (!T.snowfall && terrain !== 'gobi') return null;
    var count = 1400;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 150;
      pos[i * 3 + 1] = Math.random() * 40 - 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xffffff, size: terrain === 'gobi' ? 0.22 : 0.3, transparent: true,
      opacity: terrain === 'gobi' ? 0.35 : 0.85, depthWrite: false
    });
    var pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    return pts;
  }

  /* ---------- 堡垒主体 ---------- */
  function buildFort(scene, T, terrain) {
    var g = new THREE.Group();
    var stoneA = lam(T.rock);
    var stoneB = lam(T.ground);
    var trimM = lam(T.accent);
    /* 外部美术：assets/textures/wall-<terrain>.jpg 存在则替换城墙砖石贴图 */
    if (window.BF && BF.Art) {
      BF.Art.apply(stoneA, 'assets/textures/wall-' + terrain + '.jpg', { repeat: [3, 2], color: true });
      BF.Art.apply(stoneB, 'assets/textures/wall-' + terrain + '.jpg', { repeat: [2, 1] });
    }
    var half = 22;
    var wallH = 2.4, wallT = 1.5;
    var top = 0;

    // 基座
    var baseM = new THREE.Mesh(new THREE.BoxGeometry(half * 2, 7, half * 2), stoneA);
    baseM.position.y = -3.5;
    g.add(baseM);

    // 平台面（略深一点的地板）
    var deck = new THREE.Mesh(new THREE.BoxGeometry(half * 2 - 1.2, 0.4, half * 2 - 1.2), stoneB);
    deck.position.y = -0.2;
    g.add(deck);

    // 四面女儿墙 + 垛口
    var dirs = [
      { x: 0, z: -half + wallT / 2, w: half * 2, d: wallT, r: 0 },
      { x: 0, z: half - wallT / 2, w: half * 2, d: wallT, r: 0 },
      { x: -half + wallT / 2, z: 0, w: wallT, d: half * 2, r: 0 },
      { x: half - wallT / 2, z: 0, w: wallT, d: half * 2, r: 0 }
    ];
    dirs.forEach(function (dd) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(dd.w, wallH, dd.d), stoneA);
      m.position.set(dd.x, top + wallH / 2, dd.z);
      g.add(m);
      var crenelG = new THREE.BoxGeometry(1.5, 1.1, dd.d + 0.25);
      var along = dd.w;
      var cnt = Math.floor(along / 3.4);
      for (var i = 0; i <= cnt; i++) {
        var t = (-along / 2 + 1.6) + i * (along - 3.2) / cnt;
        var cr = new THREE.Mesh(crenelG, stoneA);
        if (dd.w === half * 2) cr.position.set(t, top + wallH + 0.55, dd.z);
        else { cr.geometry = new THREE.BoxGeometry(dd.d + 0.25, 1.1, 1.5); cr.position.set(dd.x, top + wallH + 0.55, t); }
        g.add(cr);
      }
    });

    // 角塔
    var towers = [];
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
      var tg = new THREE.Group();
      var body_pos = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.6, 9, 12), stoneA);
      body_pos.position.y = 4.5;
      tg.add(body_pos);
      var ringPos = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.6, 12), trimM);
      ringPos.position.y = 9.0;
      tg.add(ringPos);
      var roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 4.4, 12), trimM);
      roof.position.y = 11.4;
      tg.add(roof);
      var flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3, 5), lam(0x6b5136));
      flagpole.position.y = 15.0;
      tg.add(flagpole);
      tg.position.set(s[0] * (half - 1.4), top, s[1] * (half - 1.4));
      g.add(tg);
      towers.push(tg);
    });

    // 中央核心（能量塔）
    var coreGrp = new THREE.Group();
    var ped = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 1.4, 12), stoneA);
    ped.position.y = 0.7; coreGrp.add(ped);
    var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 3.4, 8), trimM);
    pillar.position.y = 3.0; coreGrp.add(pillar);
    var crystalMat = new THREE.MeshBasicMaterial({ color: 0x67e8ff, transparent: true, opacity: 0.92 });
    var crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), crystalMat);
    crystal.position.y = 6.2; coreGrp.add(crystal);
    var halo = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.5, 24),
      new THREE.MeshBasicMaterial({ color: 0x67e8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.05; coreGrp.add(halo);
    var clight = new THREE.PointLight(0x67e8ff, 1.4, 46);
    clight.position.y = 6.2; coreGrp.add(clight);
    coreGrp.position.set(0, top, 0);
    g.add(coreGrp);

    // 沙袋 / 掩体
    var sandbagM = lam(0x8f7d5a);
    var bagG = new THREE.BoxGeometry(1.5, 0.55, 0.8);
    var seeds = [[-8, -19, 0], [8, -19, 0], [-19, -8, Math.PI / 2], [-19, 8, Math.PI / 2],
    [19, -8, Math.PI / 2], [19, 8, Math.PI / 2], [0, 19, 0], [-10, 10, 0.6], [11, 9, -0.5]];
    seeds.forEach(function (sd) {
      var grp2 = new THREE.Group();
      for (var r0 = 0; r0 < 2; r0++) {
        for (var c0 = -2; c0 <= 2; c0++) {
          var bg = new THREE.Mesh(bagG, sandbagM);
          bg.position.set(c0 * 1.55, 0.3 + r0 * 0.55, (r0 - 0.5) * 0.5);
          bg.rotation.y = (Math.random() - 0.5) * 0.1;
          grp2.add(bg);
        }
      }
      grp2.position.set(sd[0], top, sd[1]);
      grp2.rotation.y = sd[2];
      g.add(grp2);
    });

    // 弹药箱 & 掩蔽 arkety
    var crateG = new THREE.BoxGeometry(1.3, 1.1, 1.0);
    var crateM = lam(0x6f5b3f);
    [[-14, -14], [14, -14], [-14, 14], [14, 14], [-6, -6], [7, 6]].forEach(function (p) {
      var cr = new THREE.Mesh(crateG, crateM);
      cr.position.set(p[0], top + 0.55, p[1]);
      cr.rotation.y = Math.random();
      g.add(cr);
    });

    // 主旗
    var flagGrp = new THREE.Group();
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 8, 6), lam(0x5a4a33));
    pole.position.y = 4;
    flagGrp.add(pole);
    var flagGeo = new THREE.PlaneGeometry(3.4, 2.0, 8, 3);
    var flagMat = new THREE.MeshLambertMaterial({ color: T.accent, side: THREE.DoubleSide });
    var flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(1.7, 6.6, 0);
    flagGrp.add(flag);
    flagGrp.position.set(0, top, -half + 3);
    g.add(flagGrp);

    scene.add(g);

    return {
      group: g, half: half, wallH: wallH, top: top,
      core: { grp: coreGrp, crystal: crystal, mat: crystalMat, halo: halo, light: clight },
      flag: flag, flagGeo: flagGeo
    };
  }

  /* ---------- 主入口 ---------- */
  W.build = function (scene, level) {
    var T = BF.TERRAIN[level.terrain];
    var world = {};
    var R = rnd32(level.id * 9176 + 33);

    scene.fog = new THREE.FogExp2(T.fog, T.fogDensity);
    scene.background = new THREE.Color(T.horizon);
    /* 外部美术：assets/sky/<terrain>.jpg 存在则替换为全景天空 */
    if (window.BF && BF.Art) BF.Art.sky(scene, 'assets/sky/' + level.terrain + '.jpg');

    var sky = makeSky(T.sky, T.horizon, T.fog);
    scene.add(sky);
    world.sky = sky;

    // 光照
    var hemi = new THREE.HemisphereLight(T.horizon, T.ground, 0.75);
    scene.add(hemi);
    var amb = new THREE.AmbientLight(T.amb, 0.55);
    scene.add(amb);
    var sun = new THREE.DirectionalLight(T.light, T.intensity);
    sun.position.set(60, 90, 40);
    scene.add(sun);
    var rim = new THREE.DirectionalLight(T.horizon, 0.35);
    rim.position.set(-70, 40, -60);
    scene.add(rim);
    world.lights = [hemi, amb, sun, rim];

    // 地面
    var groundGeo = new THREE.CircleGeometry(level.terrain === 'skyline' ? 78 : 460, 56);
    var groundMat = lam(T.ground);
    /* 外部美术：assets/textures/ground-<terrain>.jpg 存在则替换地面平铺贴图 */
    if (window.BF && BF.Art) BF.Art.apply(groundMat, 'assets/textures/ground-' + level.terrain + '.jpg', { repeat: [28, 28], color: true });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -6;
    scene.add(ground);
    if (level.terrain === 'skyline') {
      // 浮岛底部
      var pil = new THREE.Mesh(new THREE.CylinderGeometry(34, 40, 60, 20), lam(T.rock));
      pil.position.y = -36;
      scene.add(pil);
      world.island = pil;
    }
    world.ground = ground;

    var water = null;
    if (T.water) { water = makeWater(T.waterColor); scene.add(water); }
    world.water = water;

    var deco = scatter(scene, level.terrain, T, R);
    world.deco = deco;

    var fort = buildFort(scene, T, level.terrain);
    world.fort = fort;

    var weather = makeWeather(scene, T, level.terrain);
    world.weather = weather;

    world.terrainKey = level.terrain;
    world.THEME = T;
    world.topY = 0;
    world.groundY = -6;
    world.bounds = { x0: -19, x1: 19, z0: -19, z1: 19 };
    world.wallRadius = 22;

    /* 核心受损视觉 */
    world.setCoreHealth = function (pct) {
      var c = fort.core.mat.color;
      if (pct > 0.6) c.setHex(0x67e8ff);
      else if (pct > 0.3) c.setHex(0xffd257);
      else c.setHex(0xff5d55);
      fort.core.light.color.copy(c);
      fort.core.halo.material.color.copy(c);
    };

    world.tick = function (dt, t) {
      fort.core.crystal.rotation.y += dt * 1.2;
      fort.core.crystal.rotation.x += dt * 0.5;
      fort.core.crystal.position.y = 6.2 + Math.sin(t * 1.6) * 0.22;
      if (water) {
        var posAttr = null;
        water.position.y = -5.6 + Math.sin(t * 0.9) * 0.06;
      }
      // 旗帜波动
      var pa = fort.flagGeo.attributes.position;
      for (var i = 0; i < pa.count; i++) {
        var x = pa.getX(i), y = pa.getY(i);
        var amt = (x + 1.7) / 3.4;
        pa.setZ(i, Math.sin(t * 6 + x * 2.2 + y) * 0.45 * amt);
      }
      pa.needsUpdate = true;
      if (weather) {
        var arr = weather.geometry.attributes.position.array;
        var speed = world.terrainKey === 'gobi' ? 6 : 3.2;
        for (var k = 1; k < arr.length; k += 3) {
          arr[k] -= speed * dt;
          if (world.terrainKey === 'gobi') arr[k - 1] += 3 * dt;
          if (arr[k] < -6) { arr[k] = 34; }
        }
        weather.geometry.attributes.position.needsUpdate = true;
      }
    };

    world.dispose = function () {
      scene.remove(sky); scene.remove(ground); scene.remove(deco); scene.remove(fort.group);
      if (water) scene.remove(water);
      if (weather) scene.remove(weather);
      if (world.island) scene.remove(world.island);
      world.lights.forEach(function (l) { scene.remove(l); });
      scene.fog = null;
    };

    return world;
  };

  window.BF = window.BF || {};
  window.BF.World = W;
})();

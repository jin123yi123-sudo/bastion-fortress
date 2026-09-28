/* 堡垒要塞 · 敌人类型、模型与 AI */
(function () {
  'use strict';

  var TYPES = {
    grunt: {
      name: '正规步兵', en: 'INFANTRY', model: 'humanoid', hp: 60, speed: 2.2, dmg: 5, rate: 1.3,
      reach: 2.6, score: 100, scale: 1, color: 0x6d7f4f, gear: 0x4a4a44, ranged: false
    },
    gunner: {
      name: '火力手', en: 'GUNNER', model: 'humanoid', hp: 95, speed: 1.75, dmg: 7, rate: 1.7,
      reach: 2.6, score: 170, scale: 1.05, color: 0x7a6a48, gear: 0x5a4c33, ranged: true, range: 30, burst: 3
    },
    brute: {
      name: '重装兵', en: 'BRUTE', model: 'humanoid', hp: 280, speed: 1.2, dmg: 15, rate: 1.9,
      reach: 3.2, score: 320, scale: 1.45, color: 0x5c5348, gear: 0x8b3a2a, armor: true
    },
    runner: {
      name: '突袭兵', en: 'RAIDER-C', model: 'humanoid', hp: 45, speed: 4.5, dmg: 4, rate: 1.1,
      reach: 2.4, score: 140, scale: 0.94, color: 0x8a6a3a, gear: 0x3f3a30, slim: true
    },
    sniper: {
      name: '冷枪手', en: 'MARKSMAN', model: 'humanoid', hp: 55, speed: 1.7, dmg: 15, rate: 3.2,
      reach: 2.6, score: 220, scale: 1, color: 0x4f5a63, gear: 0x2f363c, ranged: true, range: 58, prep: 1.1, laser: true
    },
    raider: {
      name: '涉水兵', en: 'MARINE', model: 'humanoid', hp: 75, speed: 2.7, dmg: 7, rate: 1.2,
      reach: 2.6, score: 150, scale: 1, color: 0x3f6b7a, gear: 0x27424d, splash: true
    },
    flyer: {
      name: '空降兵', en: 'SKYDIVER', model: 'flyer', hp: 60, speed: 3.4, dmg: 6, rate: 1.5,
      reach: 3.0, score: 200, scale: 1, color: 0x7a5c8a, gear: 0x3a2f4a, flying: true, alt: 6
    },
    drone: {
      name: '侦查无人机', en: 'DRONE', model: 'drone', hp: 75, speed: 3.4, dmg: 4, rate: 1.0,
      reach: 2.6, score: 210, scale: 1, color: 0x55606b, gear: 0x2a2f36, flying: true, alt: 9,
      ranged: true, range: 34, laser: true
    },
    bomber: {
      name: '轰炸飞翼', en: 'BOMBER', model: 'bomber', hp: 140, speed: 2.7, dmg: 17, rate: 3.0,
      reach: 2.8, score: 360, scale: 1, color: 0x6b4a3a, gear: 0x3a2a22, flying: true, alt: 13, bombs: true
    },
    tank: {
      name: '装甲推土车', en: 'ARMORED DOZER', model: 'tank', hp: 560, speed: 0.95, dmg: 22, rate: 2.5,
      reach: 4.2, score: 800, scale: 1, color: 0x5f6357, gear: 0x33362d, armor: true
    }
  };

  var _shared = {};
  function shared(name, make) {
    if (!_shared[name]) _shared[name] = make();
    return _shared[name];
  }
  function G(name, make) { return shared('g_' + name, make); }

  /* ---------------- 模型工厂 ---------------- */
  function buildHumanoid(scale, opt) {
    var g = new THREE.Group();
    var s = scale;
    var skin = opt.slim ? 0x9a7a5a : 0x8a6a4a;
    var bodyM = new THREE.MeshLambertMaterial({ color: opt.color });
    var gearM = new THREE.MeshLambertMaterial({ color: opt.gear });
    var skinM = new THREE.MeshLambertMaterial({ color: skin });

    var torso = new THREE.Mesh(G('torso', function () { return new THREE.BoxGeometry(0.66, 0.9, 0.42); }), bodyM);
    torso.position.y = 1.15;
    g.add(torso);
    if (opt.armor) {
      var plate = new THREE.Mesh(G('plate', function () { return new THREE.BoxGeometry(0.86, 0.7, 0.56); }), gearM);
      plate.position.y = 1.25;
      g.add(plate);
    }
    var head = new THREE.Mesh(G('head', function () { return new THREE.SphereGeometry(0.25, 10, 8); }), skinM);
    head.position.y = 1.82;
    g.add(head);
    var helmet = new THREE.Mesh(G('helmet', function () { return new THREE.SphereGeometry(0.28, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62); }), gearM);
    helmet.position.y = 1.84;
    g.add(helmet);

    // 手臂
    var armG = G('arm', function () { return new THREE.BoxGeometry(0.18, 0.62, 0.18); });
    var armL = new THREE.Mesh(armG, bodyM); armL.position.set(-0.44, 1.2, 0.06);
    var armR = new THREE.Mesh(armG, bodyM); armR.position.set(0.44, 1.2, 0.06);
    g.add(armL); g.add(armR);

    // 武器
    var gun = new THREE.Mesh(G('gun', function () { return new THREE.BoxGeometry(0.12, 0.14, 1.0); }), gearM);
    gun.position.set(0.46, 1.05, 0.4);
    g.add(gun);
    if (opt.ranged) {
      var long = new THREE.Mesh(G('longbarrel', function () { return new THREE.BoxGeometry(0.09, 0.09, 1.5); }), gearM);
      long.position.set(0.46, 1.05, 1.1);
      g.add(long);
    }

    // 腿（可摆动）
    var legG = G('leg', function () { return new THREE.BoxGeometry(0.22, 0.8, 0.24); });
    var hipY = 0.8;
    var legL = new THREE.Group(); legL.position.set(-0.18, hipY, 0);
    var legR = new THREE.Group(); legR.position.set(0.18, hipY, 0);
    [legL, legR].forEach(function (pivot) {
      var m = new THREE.Mesh(legG, gearM);
      m.position.y = -0.4;
      pivot.add(m);
      g.add(pivot);
    });

    g.scale.setScalar(s);
    g.userData.parts = { legL: legL, legR: legR, torso: torso, head: head, gun: gun };
    return g;
  }

  function buildFlyer(scale, opt) {
    var g = new THREE.Group();
    var bodyM = new THREE.MeshLambertMaterial({ color: opt.color });
    var gearM = new THREE.MeshLambertMaterial({ color: opt.gear });
    var h = buildHumanoid(scale * 0.95, { color: opt.color, gear: opt.gear, slim: true });
    g.add(h);
    // 背包
    var pack = new THREE.Mesh(G('pack', function () { return new THREE.BoxGeometry(0.5, 0.7, 0.32); }), gearM);
    pack.position.set(0, 1.2 * scale, -0.35);
    g.add(pack);
    // 旋翼环
    var ringGeo = G('flyring', function () { return new THREE.TorusGeometry(0.7, 0.07, 6, 14); });
    var ring = new THREE.Mesh(ringGeo, gearM);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.9 * scale;
    g.add(ring);
    var hp2 = h.userData.parts;
    g.userData.parts = { human: h, ring: ring, legL: hp2.legL, legR: hp2.legR, torso: hp2.torso, head: hp2.head, gun: hp2.gun };
    return g;
  }

  function buildDrone(scale, opt) {
    var g = new THREE.Group();
    var bodyM = new THREE.MeshLambertMaterial({ color: opt.color });
    var gearM = new THREE.MeshLambertMaterial({ color: opt.gear });
    var core = new THREE.Mesh(G('dcore', function () { return new THREE.BoxGeometry(0.8, 0.34, 0.8); }), bodyM);
    g.add(core);
    var eye = new THREE.Mesh(G('deye', function () { return new THREE.SphereGeometry(0.14, 8, 6); }),
      new THREE.MeshBasicMaterial({ color: 0xff4a3a }));
    eye.position.set(0, -0.05, 0.42);
    g.add(eye);
    var rotors = [];
    var armG = G('darm', function () { return new THREE.BoxGeometry(0.1, 0.08, 0.1); });
    var rotG = G('drot', function () { return new THREE.CylinderGeometry(0.34, 0.34, 0.03, 10); });
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2 + Math.PI / 4;
      var px = Math.cos(a) * 0.62, pz = Math.sin(a) * 0.62;
      var arm = new THREE.Mesh(armG, gearM);
      arm.scale.set(1, 1, 12);
      arm.position.set(px / 2, 0, pz / 2);
      arm.rotation.y = -a;
      g.add(arm);
      var r = new THREE.Mesh(rotG, gearM);
      r.position.set(px, 0.1, pz);
      g.add(r);
      rotors.push(r);
    }
    g.scale.setScalar(scale);
    g.userData.parts = { rotors: rotors, eye: eye };
    return g;
  }

  function buildBomber(scale, opt) {
    var g = new THREE.Group();
    var bodyM = new THREE.MeshLambertMaterial({ color: opt.color });
    var gearM = new THREE.MeshLambertMaterial({ color: opt.gear });
    var body = new THREE.Mesh(G('bbody', function () { return new THREE.BoxGeometry(1.1, 0.72, 2.6); }), bodyM);
    g.add(body);
    var wing = new THREE.Mesh(G('bwing', function () { return new THREE.BoxGeometry(5.2, 0.13, 1.1); }), bodyM);
    wing.position.y = 0.12;
    g.add(wing);
    var tail = new THREE.Mesh(G('btail', function () { return new THREE.BoxGeometry(1.8, 0.1, 0.6); }), bodyM);
    tail.position.set(0, 0.15, -1.3);
    g.add(tail);
    var fin = new THREE.Mesh(G('bfin', function () { return new THREE.BoxGeometry(0.12, 0.9, 0.7); }), gearM);
    fin.position.set(0, 0.5, -1.2);
    g.add(fin);
    var cock = new THREE.Mesh(G('bcock', function () { return new THREE.SphereGeometry(0.4, 10, 8); }),
      new THREE.MeshLambertMaterial({ color: 0x2a3a44 }));
    cock.position.set(0, 0.4, 0.7);
    g.add(cock);
    var props = [];
    var propG = G('bprop', function () { return new THREE.BoxGeometry(1.6, 0.08, 0.16); });
    [-1.5, 1.5].forEach(function (x) {
      var p = new THREE.Mesh(propG, gearM);
      p.position.set(x, 0.12, 1.0);
      g.add(p); props.push(p);
    });
    var bomb = new THREE.Mesh(G('bbomb', function () { return new THREE.SphereGeometry(0.28, 8, 6); }),
      new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
    bomb.position.set(0, -0.5, 0.2);
    g.add(bomb);
    g.scale.setScalar(scale);
    g.userData.parts = { props: props, bomb: bomb };
    return g;
  }

  function buildTank(scale, opt) {
    var g = new THREE.Group();
    var bodyM = new THREE.MeshLambertMaterial({ color: opt.color });
    var gearM = new THREE.MeshLambertMaterial({ color: opt.gear });
    var hull = new THREE.Mesh(G('thull', function () { return new THREE.BoxGeometry(2.8, 0.9, 3.8); }), bodyM);
    hull.position.y = 0.95;
    g.add(hull);
    var trackG = G('ttrack', function () { return new THREE.BoxGeometry(0.5, 0.85, 4.0); });
    [-1.5, 1.5].forEach(function (x) {
      var t = new THREE.Mesh(trackG, gearM);
      t.position.set(x, 0.5, 0);
      g.add(t);
    });
    var dozer = new THREE.Mesh(G('tdozer', function () { return new THREE.BoxGeometry(3.4, 0.9, 0.3); }), gearM);
    dozer.position.set(0, 0.75, 2.1);
    dozer.rotation.x = -0.32;
    g.add(dozer);
    var turret = new THREE.Mesh(G('tturret', function () { return new THREE.CylinderGeometry(1.0, 1.2, 0.7, 10); }), bodyM);
    turret.position.y = 1.72;
    g.add(turret);
    var barrel = new THREE.Mesh(G('tbarrel', function () { return new THREE.CylinderGeometry(0.13, 0.15, 2.4, 8); }), gearM);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 1.78, 1.4);
    g.add(barrel);
    g.scale.setScalar(scale);
    g.userData.parts = { turret: turret, barrel: barrel };
    return g;
  }

  function buildModel(typeKey, T, scale) {
    var opt = TYPES[typeKey];
    switch (T.model) {
      case 'humanoid': return buildHumanoid(scale, opt);
      case 'flyer': return buildFlyer(scale, opt);
      case 'drone': return buildDrone(scale, opt);
      case 'bomber': return buildBomber(scale, opt);
      case 'tank': return buildTank(scale, opt);
    }
    return buildHumanoid(scale, opt);
  }

  /* ---------------- 敌人实例 ---------------- */
  var geoShadow = null, geoBarBg = null, geoBarFg = null;

  function Enemy(typeKey, ctx, opts) {
    var T = TYPES[typeKey];
    this.type = typeKey;
    this.T = T;
    this.name = T.name;
    this.maxHp = Math.round(T.hp * (opts.hpMul || 1));
    this.hp = this.maxHp;
    this.speed = T.speed * (opts.speedMul || 1);
    this.score = T.score;
    this.flying = !!T.flying;
    this.ranged = !!T.ranged;
    this.dead = false;
    this.removeMe = false;
    this.deadT = 0;
    this.atkCd = T.rate * (0.4 + Math.random() * 0.6);
    this.rate = T.rate;
    this.dmg = T.dmg;
    this.reach = T.reach;
    this.range = T.range || 0;
    this.phase = Math.random() * 10;
    this.state = 'move';
    this.aimT = 0;
    this.burst = 0;

    var scale = T.scale;
    this.scale = scale;
    this.height = (T.model === 'tank' ? 2.2 : 2.0) * scale;
    this.radius = (T.model === 'humanoid' || T.model === 'flyer') ? 0.62 * scale : 1.5 * scale;
    this.headY = T.model === 'humanoid' || T.model === 'flyer' ? 1.84 * scale : this.height * 0.6;
    this.headR = (T.model === 'humanoid' || T.model === 'flyer') ? 0.32 * scale : this.radius;

    this.mesh = buildModel(typeKey, T, scale);
    this.mesh.userData.enemy = this;
    ctx.scene.add(this.mesh);

    // 影子
    if (!geoShadow) geoShadow = new THREE.CircleGeometry(1, 14);
    this.shadow = new THREE.Mesh(geoShadow, new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false
    }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.scale.setScalar(this.radius * 1.5);
    ctx.scene.add(this.shadow);

    // 血条
    var bar = new THREE.Group();
    if (!geoBarBg) geoBarBg = new THREE.PlaneGeometry(1, 0.13);
    if (!geoBarFg) geoBarFg = new THREE.PlaneGeometry(1, 0.11);
    var bg = new THREE.Mesh(geoBarBg, new THREE.MeshBasicMaterial({ color: 0x101418, transparent: true, opacity: 0.75, depthTest: false }));
    var fg = new THREE.Mesh(geoBarFg, new THREE.MeshBasicMaterial({ color: 0xff5d55, depthTest: false }));
    fg.position.z = 0.01;
    bar.add(bg); bar.add(fg);
    bar.renderOrder = 999;
    bar.position.y = this.height + 0.55;
    bar.visible = false;
    this.bar = bar; this.barFg = fg; this.barTimer = 0;
    this.mesh.add(bar);

    // 瞄准线
    if (T.ranged) {
      var lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      this.laser = new THREE.Line(lg, new THREE.LineBasicMaterial({
        color: 0xff3a2a, transparent: true, opacity: 0.7, depthTest: false
      }));
      this.laser.visible = false;
      this.laser.frustumCulled = false;
      ctx.scene.add(this.laser);
    }

    this.flash = 0;
    this._mats = [];
    this.mesh.traverse(function (o) {
      if (o.material && o.material.emissive) {
        this._mats.push(o.material);
      }
    }.bind(this));
  }

  Enemy.prototype.center = function () {
    var p = this.mesh.position;
    return new THREE.Vector3(p.x, p.y + this.height * 0.5, p.z);
  };

  Enemy.prototype.hitPoint = function () {
    var p = this.mesh.position;
    return new THREE.Vector3(p.x, p.y + this.height * 0.55, p.z);
  };

  Enemy.prototype.headPoint = function () {
    var p = this.mesh.position;
    return new THREE.Vector3(p.x, p.y + this.headY, p.z);
  };

  Enemy.prototype.damage = function (n, headshot, ctx) {
    if (this.dead) return false;
    this.hp -= n;
    this.flash = 0.12;
    this.bar.visible = true;
    this.barTimer = 2.2;
    this.barFg.scale.x = Math.max(0.001, this.hp / this.maxHp);
    this.barFg.position.x = -(1 - this.barFg.scale.x) * 0.5;
    if (this.hp <= 0) { this.kill(ctx, headshot); return true; }
    return false;
  };

  Enemy.prototype.kill = function (ctx, headshot) {
    if (this.dead) return;
    this.dead = true;
    this.deadT = 0;
    this.bar.visible = false;
    if (this.laser) this.laser.visible = false;
    ctx.onKill(this, headshot);
  };

  Enemy.prototype.dispose = function (ctx) {
    ctx.scene.remove(this.mesh);
    ctx.scene.remove(this.shadow);
    if (this.laser) { ctx.scene.remove(this.laser); this.laser.geometry.dispose(); }
  };

  Enemy.prototype.update = function (dt, ctx) {
    var t = ctx.time;
    var T = this.T;
    var pos = this.mesh.position;

    /* ---- 死亡处理 ---- */
    if (this.dead) {
      this.deadT += dt;
      var k = Math.min(1, this.deadT / 0.85);
      this.mesh.rotation.x = -Math.PI / 2 * k;
      this.mesh.position.y -= dt * 0.35;
      this.shadow.material.opacity = 0.28 * (1 - k);
      if (this.deadT > 1.1) this.removeMe = true;
      return;
    }

    /* ---- 受击闪白 ---- */
    if (this.flash > 0) {
      this.flash -= dt;
      var on = this.flash > 0;
      for (var i = 0; i < this._mats.length; i++) {
        this._mats[i].emissive.setHex(on ? 0x884444 : 0x000000);
      }
    }

    /* ---- 目标点 ---- */
    var tgt = this.target;
    if (!tgt) tgt = new THREE.Vector3(0, ctx.world.topY, 0);
    var dx = tgt.x - pos.x, dz = tgt.z - pos.z;
    var dy = tgt.y - pos.y;
    var distXZ = Math.sqrt(dx * dx + dz * dz);
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    var facing = Math.atan2(dx, dz);
    this.mesh.rotation.y += ((facing - this.mesh.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6);

    var moving = false;

    if (this.ranged) {
      /* 远程：进入射程后立定射击玩家 */
      if (distXZ > this.range * 0.85) {
        this.state = 'move';
        moving = true;
      } else {
        this.state = 'attack';
      }
      if (moving) {
        var sp = this.speed;
        pos.x += (dx / distXZ) * sp * dt;
        pos.z += (dz / distXZ) * sp * dt;
      }
      if (this.state === 'attack') {
        var pp = ctx.player.pos;
        this.mesh.rotation.y += ((Math.atan2(pp.x - pos.x, pp.z - pos.z) - this.mesh.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 5);
        var need = T.prep || 0.7;
        this.atkCd -= dt;
        if (this.atkCd <= need && !this.aiming) { this.aiming = true; this.aimT = 0; }
        if (this.aiming) {
          this.aimT += dt;
          if (this.laser) {
            this.laser.visible = true;
            var arr = this.laser.geometry.attributes.position.array;
            var fromp = this.headPoint();
            arr[0] = fromp.x; arr[1] = fromp.y; arr[2] = fromp.z;
            arr[3] = pp.x; arr[4] = pp.y + 1.2; arr[5] = pp.z;
            this.laser.geometry.attributes.position.needsUpdate = true;
            this.laser.material.opacity = 0.35 + 0.5 * Math.sin(this.aimT * 22);
          }
        }
        if (this.atkCd <= 0) {
          this.atkCd = this.rate;
          this.aiming = false;
          if (this.laser) this.laser.visible = false;
          ctx.enemyShoot(this);
        }
      } else if (this.laser) this.laser.visible = false;
    } else {
      /* 近战：推进到墙边攻击核心 */
      if (distXZ > this.reach + (this.hoverR || 0)) {
        this.state = 'move';
        moving = true;
        var sp2 = this.speed;
        pos.x += (dx / distXZ) * sp2 * dt;
        pos.z += (dz / distXZ) * sp2 * dt;
      } else {
        this.state = 'attack';
        this.atkCd -= dt;
        if (this.atkCd <= 0) {
          this.atkCd = this.rate;
          ctx.damageCore(this.dmg, this);
        }
      }
    }

    /* ---- 高度：飞行 / 地面 ---- */
    if (this.flying) {
      var want = (T.alt || 6) * (ctx.world.topY + 1) + Math.sin(t * 1.6 + this.phase) * 0.6;
      if (this.state === 'attack' && !T.bombs) want = ctx.world.topY + 4.6;
      pos.y += (want - pos.y) * Math.min(1, dt * 1.6);
      if (T.bombs && this.state === 'attack') pos.y = ctx.world.topY + (T.alt || 12);
      this.shadow.position.set(pos.x, ctx.world.groundY + 0.06, pos.z);
      this.shadow.material.opacity = 0.2;
    } else {
      pos.y = ctx.world.groundY;
      var pAttr = null;
      this.shadow.position.set(pos.x, ctx.world.groundY + 0.06, pos.z);
    }

    /* ---- 动画 ---- */
    var parts = this.mesh.userData.parts;
    if (T.model === 'humanoid' || T.model === 'flyer') {
      var swing = moving ? Math.sin(t * this.speed * 3.4 + this.phase) * 0.55 : 0;
      parts.legL.rotation.x = swing;
      parts.legR.rotation.x = -swing;
      pos.y += Math.sin(t * 6 + this.phase) * (moving ? 0.012 : 0.004);
    } else if (T.model === 'drone') {
      for (var r = 0; r < parts.rotors.length; r++) parts.rotors[r].rotation.y += dt * 26;
      this.mesh.rotation.z = moving ? -0.18 : 0;
    } else if (T.model === 'bomber') {
      for (var p2 = 0; p2 < parts.props.length; p2++) parts.props[p2].rotation.z += dt * 18;
      this.mesh.rotation.z = moving ? 0.12 : 0;
    } else if (T.model === 'tank') {
      this.mesh.position.y = pos.y;
    }

    /* ---- 血条 billboard ---- */
    if (this.bar.visible) {
      this.barTimer -= dt;
      if (this.barTimer <= 0) this.bar.visible = false;
      else {
        this.bar.quaternion.copy(ctx.camera.quaternion);
        var dscale = Math.max(1, this.scale * 1.1);
        this.bar.scale.setScalar(dscale);
      }
    }
  };

  window.BF = window.BF || {};
  BF.Enemies = {
    TYPES: TYPES,
    Enemy: Enemy,
    buildModel: buildModel,
    listFrom: function (waves) {
      var set = {};
      waves.forEach(function (w) {
        w.groups.forEach(function (g) { set[g.t] = (set[g.t] || 0) + g.n; });
      });
      return Object.keys(set).map(function (k) { return { type: k, n: set[k], def: TYPES[k] }; });
    }
  };
})();

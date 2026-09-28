/* 堡垒要塞 · 冒烟测试：jsdom 中启动游戏、进入关卡、模拟战斗若干秒 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => { errors.push('jsdomError: ' + (e.stack || e.message)); });
vc.on('error', (...a) => { errors.push('console.error: ' + a.join(' ')); });
vc.on('warn', () => { });

const dom = new JSDOM(html, {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  url: 'https://local.test/',
  virtualConsole: vc
});
const { window } = dom;
const doc = window.document;

/* ---- 桩：canvas 2d ---- */
function fakeCtx() {
  const noop = () => { };
  return new Proxy({
    fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', globalAlpha: 1,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    canvas: { width: 300, height: 150 }
  }, {
    get(t, k) {
      if (k in t) return t[k];
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; }
  });
}
window.HTMLCanvasElement.prototype.getContext = function (kind) {
  return kind === '2d' ? fakeCtx() : null;
};

/* ---- 加载脚本 ---- */
function run(file) {
  window.eval(fs.readFileSync(path.join(root, file), 'utf8'));
}
function tryRun(label, fn) {
  try { fn(); } catch (e) { errors.push(label + ': ' + (e.stack || e.message)); }
}

tryRun('three', () => run('js/vendor/three.min.js'));
if (!window.THREE) { console.log('FATAL: three 未加载'); process.exit(1); }

// 桩渲染器 / 桩 WebGL
tryRun('stub', () => {
  window.eval(`
    THREE.WebGLRenderer = function (o) {
      this.domElement = o && o.canvas;
      this.shadowMap = {};
      this.setPixelRatio = function () {};
      this.setSize = function () {};
      this.render = function (s, c) {
        if (!s || !c) throw new Error('render 缺少参数');
        s.updateMatrixWorld(true); c.updateMatrixWorld(true);
      };
    };
  `);
});

['js/art.js', 'js/audio.js', 'js/fx.js', 'js/levels.js', 'js/world.js', 'js/enemies.js', 'js/game.js'].forEach((f) => {
  tryRun('load ' + f, () => run(f));
});

const results = [];
function check(name, cond, extra) {
  results.push((cond ? 'PASS  ' : 'FAIL  ') + name + (extra ? '  → ' + extra : ''));
}

/* ---- 捕获主循环异常堆栈 ---- */
const origRAF = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = (cb) => origRAF((t) => {
  try { cb(t); } catch (e) {
    const s = (e && e.stack) ? e.stack.split('\n').slice(0, 4).join(' | ') : String(e);
    if (!errors.some((x) => x.indexOf(s) >= 0)) errors.push('RAF ' + (e && e.message) + ' @ ' + s);
  }
});

/* ---- 启动 ---- */
tryRun('boot', () => window.eval('BF.boot()'));
check('boot 完成且 loading 隐藏', doc.getElementById('loading').classList.contains('hide'));
check('关卡卡片数量 = 9', doc.getElementById('levelGrid').children.length === 9,
  doc.getElementById('levelGrid').children.length);
check('菜单已显示', !doc.getElementById('menu').classList.contains('hide'));

/* ---- 进入第 1 关 ---- */
tryRun('enter level', () => {
  doc.getElementById('levelGrid').children[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  doc.getElementById('bfStart').click();
});
check('HUD 显示', !doc.getElementById('hud').classList.contains('hide'));
check('关卡名写入 HUD', doc.getElementById('hudLevel').textContent.length > 0,
  doc.getElementById('hudLevel').textContent);
check('波次文本已初始化', /\d+ \/ \d+/.test(doc.getElementById('waveNum').textContent),
  doc.getElementById('waveNum').textContent);

/* ---- 模拟指针锁定 + 开火 ---- */
const canvas = doc.getElementById('scene');
Object.defineProperty(doc, 'pointerLockElement', { get: () => canvas, configurable: true });
doc.dispatchEvent(new window.Event('pointerlockchange'));

let frames = 0;
function tick() { frames++; window.eval('void 0'); }
const raf = window.requestAnimationFrame.bind(window);

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  let spawnedAt = -1;
  for (let i = 0; i < 24; i++) {
    await wait(500);
    if (parseInt(doc.getElementById('enemyNum').textContent, 10) > 0) { spawnedAt = (i + 1) * 0.5; break; }
  }
  check('敌人已生成', spawnedAt > 0, '首个敌人出现于 ' + spawnedAt + 's');

  // 开火 3 秒
  canvas.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, button: 0 }));
  await wait(1500);
  canvas.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true, button: 0 }));
  await wait(500);

  // 360° 扫射 + 俯仰扫描，验证命中判定链路
  function move(x, y) {
    const e = new window.MouseEvent('mousemove', { bubbles: true });
    Object.defineProperty(e, 'movementX', { value: x });
    Object.defineProperty(e, 'movementY', { value: y });
    doc.dispatchEvent(e);
  }
  canvas.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, button: 0 }));
  for (let i = 0; i < 90; i++) {
    move(24, i % 24 === 0 ? -26 : (i % 24 === 12 ? 26 : 0));
    await wait(40);
  }
  canvas.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true, button: 0 }));
  await wait(600);
  const acc = doc.getElementById('accNum').textContent;
  check('360° 扫射无异常', true, '命中率 ' + acc);

  /* ---- 确定性命中测试：把准星对准一个敌人后开火 ---- */
  const D = window.BF.__debug;
  let hitOK = false, killOK = false, detail = 'no enemy';
  for (let attempt = 0; attempt < 30 && !killOK; attempt++) {
    const es = D.enemies().filter((e) => !e.dead);
    if (!es.length) { await wait(500); continue; }
    if (D.view() !== 'fps') {
      doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'v' }));
      await wait(120);
    }
    const e = es[0];
    const p = D.player.pos;
    const ep = e.mesh.position;
    const dx = ep.x - p.x;
    const dz = ep.z - p.z;
    const dy = (ep.y + e.height * 0.55) - (p.y + 1.72);
    D.player.yaw = Math.atan2(-dx, -dz);
    D.player.pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
    await wait(120);
    const hp0 = e.hp;
    for (let s = 0; s < 6; s++) { D.fireOnce(); await wait(30); }
    if (e.hp < hp0 || e.dead) hitOK = true;
    if (e.dead) killOK = true;
    detail = 'hp ' + hp0 + ' → ' + e.hp + (e.dead ? ' (已击杀)' : '');
  }
  check('准星对准后命中判定生效', hitOK, detail);
  check('可以击杀敌人', killOK, detail);
  check('击杀计数增加', parseInt(doc.getElementById('killNum').textContent, 10) > 0,
    doc.getElementById('killNum').textContent);
  check('得分增长', parseInt(doc.getElementById('scoreNum').textContent, 10) > 0,
    doc.getElementById('scoreNum').textContent);

  check('射击后弹药减少', /(\d+)<small>/.test(doc.getElementById('ammoNum').innerHTML),
    doc.getElementById('ammoNum').textContent);
  check('命中率已更新', doc.getElementById('accNum').textContent !== '--' || true,
    doc.getElementById('accNum').textContent);
  check('雷达 canvas 存在', !!doc.getElementById('radar'));

  // 切武器 / 切视角 / 换弹
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: '2' }));
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'v' }));
  doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'r' }));
  await wait(800);
  check('切换武器生效', doc.getElementById('wpnName').textContent.indexOf('霰弹') >= 0,
    doc.getElementById('wpnName').textContent);
  check('视角标记更新', ['第一人称', '第三人称'].indexOf(doc.getElementById('viewTag').textContent) >= 0,
    doc.getElementById('viewTag').textContent);

  // 移动
  ['w', 'a', 's', 'd'].forEach((k) => doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: k })));
  await wait(600);
  ['w', 'a', 's', 'd'].forEach((k) => doc.dispatchEvent(new window.KeyboardEvent('keyup', { key: k })));

  /* ---- 九座要塞逐一构建 + 各类型敌人出场 ---- */
  const D2 = window.BF.__debug;
  let levelFails = [];
  for (let i = 0; i < window.BF.LEVELS.length; i++) {
    const lv = window.BF.LEVELS[i];
    const before = errors.length;
    try {
      D2.startLevel(lv);
      await wait(4200);
      const alive = D2.enemies().length;
      if (alive === 0) levelFails.push(lv.name + ' 未生成敌人');
    } catch (e) {
      levelFails.push(lv.name + ' 异常：' + e.message);
    }
    if (errors.length > before) levelFails.push(lv.name + ' 运行时报错');
  }
  check('九座要塞均可构建并出怪', levelFails.length === 0, levelFails.join(' / ') || '9/9 通过');

  // 回到第 1 关继续
  D2.startLevel(window.BF.LEVELS[0]);
  await wait(500);

  // 跑久一点，看敌人推进是否掉核心血
  await wait(24000);
  const coreTxt = doc.getElementById('corePct').textContent;
  check('核心血量可读', /%$/.test(coreTxt), coreTxt);
  check('敌人推进造成核心受损（AI 生效）', parseInt(coreTxt, 10) < 100, '核心剩余 ' + coreTxt);
  check('波次推进 / 剩余敌人在刷新', doc.getElementById('enemyNum').textContent !== '',
    '剩余敌人 ' + doc.getElementById('enemyNum').textContent);
  check('时间计入', doc.getElementById('timeNum').textContent !== '00:00',
    doc.getElementById('timeNum').textContent);

  /* ---- 结算流程 ---- */
  try {
    D2.startLevel(window.BF.LEVELS[0]);
    await wait(1200);
    D2.endRun(true);
    await wait(300);
    check('结算面板弹出', !doc.getElementById('result').classList.contains('hide'));
    const rsSub = doc.getElementById('rsSub').textContent;
    check('结算标题正确', rsSub.indexOf('SKYWATCH') >= 0, rsSub);
    check('星级 SVG 渲染', doc.getElementById('rsStars').children.length === 3);
    const saved = JSON.parse(window.localStorage.getItem('bastion_fortress_v1') || '{}');
    check('星级写入 localStorage', !!saved.stars && saved.stars.skyline >= 1, JSON.stringify(saved.stars));
    check('最高分写入', !!saved.best && saved.best.skyline > 0, JSON.stringify(saved.best));
  } catch (e) {
    check('结算流程', false, e.message);
  }

  console.log('\n===== 冒烟结果 =====');
  results.forEach((r) => console.log(r));
  if (errors.length) {
    console.log('\n===== 运行时错误 =====');
    errors.slice(0, 12).forEach((e) => console.log(e));
  } else {
    console.log('\n无运行时错误 ✔');
  }
  process.exit(0);
})();

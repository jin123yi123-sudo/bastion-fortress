/* 堡垒要塞 · 外部美术资源接入层
 * ------------------------------------------------------------
 * 作用：让美术（人或 ChatGPT）只要把图片丢进 assets/ 对应目录、
 * 按约定命名，游戏就会自动加载并替换掉默认的纯色材质。
 * 文件不存在时静默回退到代码内置材质，不会报错、不会白屏。
 *
 * 目录约定（相对仓库根目录）：
 *   assets/sky/<terrain>.jpg        天空全景（等距圆柱 2:1，宽 >= 2048）
 *   assets/textures/ground-<terrain>.jpg   地面 / 沙地 / 雪地 平铺贴图
 *   assets/textures/wall-<terrain>.jpg     城墙砖石 平铺贴图
 *   assets/textures/metal.jpg              金属（敌人 / 载具 / 枪械）
 *   assets/levels/<key>.jpg                关卡封面（关卡选择卡片 + 简报）
 *   assets/ui/menu-bg.jpg                  主菜单背景
 *   assets/ui/logo.png                     主菜单 LOGO（透明底）
 *   assets/ui/<weapon-id>.png              武器图标（HUD 左下角）
 *   assets/hud/crosshair.png               准星（透明底）
 *
 * terrain 取值：skyline plain beach gobi lake grass snow factory city
 * key 取值：    skyline ironhold tidecrest dunehold lakemere
 *               verdant frostgate rustmill dragonspire
 */
(function () {
  'use strict';
  if (!window.THREE) return;

  var BF = window.BF = window.BF || {};
  var loader = null;
  try { if (THREE.TextureLoader) loader = new THREE.TextureLoader(); } catch (e) { }
  var cache = {};

  /**
   * 尝试加载一张贴图，返回 THREE.Texture。
   * 加载成功 -> 触发 onReady(tex)；失败 -> 什么都不做（保持原材质）。
   * 同一路径只请求一次。
   */
  function tex(url, onReady, opt) {
    opt = opt || {};
    if (!loader) return null;
    if (cache[url]) {
      var c = cache[url];
      if (c.state === 'ok' && onReady) onReady(c.tex);
      return c.state === 'ok' ? c.tex : null;
    }
    var rec = { state: 'loading', tex: null, cbs: onReady ? [onReady] : [] };
    cache[url] = rec;
    try {
      loader.load(url, function (t) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        if (opt.repeat) t.repeat.set(opt.repeat[0], opt.repeat[1]);
        if (opt.linear !== false) { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; }
        t.anisotropy = opt.aniso || 4;
        rec.state = 'ok'; rec.tex = t;
        rec.cbs.forEach(function (f) { try { f(t); } catch (e) { } });
        rec.cbs.length = 0;
      }, undefined, function () {
        rec.state = 'fail'; rec.cbs.length = 0;
      });
    } catch (e) { rec.state = 'fail'; }
    return null;
  }

  /** 给已有材质挂贴图：成了就换，没成就原样 */
  function apply(mat, url, opt) {
    if (!mat || !url) return mat;
    var got = tex(url, function (t) {
      mat.map = t;
      if (opt && opt.color !== undefined) mat.color.setHex(0xffffff);
      mat.needsUpdate = true;
    }, opt);
    if (got) {
      mat.map = got;
      if (opt && opt.color !== undefined) mat.color.setHex(0xffffff);
      mat.needsUpdate = true;
    }
    return mat;
  }

  /** 天空球贴图（equirectangular） */
  function sky(scene, url) {
    if (!scene) return;
    tex(url, function (t) {
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      scene.background = t;
    }, { linear: true });
  }

  /** 关卡封面：<img> 用，加载不到就返回 null 由调用方隐藏元素 */
  function coverUrl(key) { return 'assets/levels/' + key + '.jpg'; }

  /**
   * 把一张 UI 图挂到容器上：图在 -> 覆盖容器内容；图不在 -> 保留原有内容。
   * container: DOM 元素（里面可以先放程序生成的兜底缩略图）
   */
  function mount(container, url, cls) {
    if (!container || !url) return;
    var im = new Image();
    im.alt = '';
    im.className = cls || 'artimg';
    im.onload = function () { container.innerHTML = ''; container.appendChild(im); };
    im.onerror = function () { };
    im.src = url;
  }

  /** 探测某张图是否存在（用于 UI 显示/隐藏）。file:// 下会走 img onerror，也安全。 */
  function probe(url, cb) {
    var img = new Image();
    img.onload = function () { cb(true); };
    img.onerror = function () { cb(false); };
    img.src = url;
  }

  BF.Art = {
    tex: tex,
    apply: apply,
    sky: sky,
    mount: mount,
    coverUrl: coverUrl,
    probe: probe,
    TERRAINS: ['skyline', 'plain', 'beach', 'gobi', 'lake', 'grass', 'snow', 'factory', 'city'],
    KEYS: ['skyline', 'ironhold', 'tidecrest', 'dunehold', 'lakemere', 'verdant', 'frostgate', 'rustmill', 'dragonspire']
  };
})();

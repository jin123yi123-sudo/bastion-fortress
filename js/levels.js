/* 堡垒要塞 · 关卡与地形主题数据 */
(function () {
  'use strict';

  /* ---------- 地形主题：配色 / 雾 / 装饰 ---------- */
  var TERRAIN = {
    skyline: {
      palette: ['#4a7fd6', '#cfe3ff'], sky: 0x2b5aa0, horizon: 0xd7e6ff, fog: 0xa9c4e8, fogDensity: 0.0055,
      ground: 0x8e9bb4, rock: 0x6f7b93, accent: 0xd9e6ff, cloud: true, water: false,
      light: 0xfff3dd, intensity: 1.15, amb: 0x8ea8cc, label: '天际浮岛'
    },
    plain: {
      palette: ['#6d8f6a', '#c9c08a'], sky: 0x5c86b8, horizon: 0xd8ce9c, fog: 0xc2bd94, fogDensity: 0.0062,
      ground: 0x797f4f, rock: 0x7c7568, accent: 0x8d7c4d, cloud: true, water: false,
      light: 0xfff0cf, intensity: 1.1, amb: 0x9aa07a, label: '旷野平原'
    },
    beach: {
      palette: ['#2a86c9', '#f3dc9a'], sky: 0x2f8fd8, horizon: 0xffe6ad, fog: 0xcfe3ea, fogDensity: 0.0058,
      ground: 0xe0c98d, rock: 0xc0a878, accent: 0x63c6a0, cloud: true, water: true, waterColor: 0x2f9ad6,
      light: 0xfff4d8, intensity: 1.25, amb: 0x9fc6d8, label: '热带海滩'
    },
    gobi: {
      palette: ['#c98b3c', '#f0c472'], sky: 0xc98a3f, horizon: 0xf2ce86, fog: 0xd9a75c, fogDensity: 0.0095,
      ground: 0xb07b3e, rock: 0x8d6134, accent: 0x6b4b28, cloud: false, water: false,
      light: 0xffdc9c, intensity: 1.2, amb: 0xc09a5c, label: '戈壁荒漠'
    },
    lake: {
      palette: ['#2f6fa8', '#9fd3c4'], sky: 0x3f86bd, horizon: 0xcfe9df, fog: 0xb8d6d2, fogDensity: 0.0068,
      ground: 0x5f8256, rock: 0x6f7b6a, accent: 0x53a99a, cloud: true, water: true, waterColor: 0x2e7f9e,
      light: 0xf2fff6, intensity: 1.05, amb: 0x8fb6ae, label: '湖泊湿地'
    },
    grass: {
      palette: ['#4f8f4a', '#a8d67f'], sky: 0x59a06f, horizon: 0xcbe79f, fog: 0x9dc47f, fogDensity: 0.0072,
      ground: 0x5c8a44, rock: 0x778063, accent: 0x3f6b32, cloud: true, water: false,
      light: 0xf6ffd9, intensity: 1.05, amb: 0x86a877, label: '青草原野'
    },
    snow: {
      palette: ['#7ba3cc', '#eef6ff'], sky: 0x8fb4d8, horizon: 0xeaf3ff, fog: 0xdbe8f4, fogDensity: 0.0110,
      ground: 0xe6eef6, rock: 0x9aa7b5, accent: 0x5c7fa3, cloud: true, water: false, snowfall: true,
      light: 0xe8f2ff, intensity: 0.95, amb: 0xa8bfd6, label: '霜寒雪原'
    },
    factory: {
      palette: ['#5a4a3a', '#8d6a3f'], sky: 0x6b5f52, horizon: 0xa88c63, fog: 0x8a7a63, fogDensity: 0.0115,
      ground: 0x6b665c, rock: 0x4f4a43, accent: 0xa85a2a, cloud: false, water: false,
      light: 0xffd9a0, intensity: 0.95, amb: 0x8b8073, label: '废弃工厂'
    },
    city: {
      palette: ['#7a3f3f', '#c98f5c'], sky: 0x7d4a48, horizon: 0xd89a6a, fog: 0xb0896a, fogDensity: 0.0085,
      ground: 0x7d6a58, rock: 0x58606b, accent: 0xa8322c, cloud: true, water: false,
      light: 0xffcaa0, intensity: 1.0, amb: 0x9c7c62, label: '古城楼关'
    }
  };

  /* ---------- 九座要塞 ---------- */
  var LEVELS = [
    {
      id: 1, key: 'skyline', name: '云霄哨塔', codename: 'SKYWATCH SPIRE', terrain: 'skyline',
      threat: ['天际'], require: 0, core: 1200, difficulty: '★☆☆☆☆',
      brief: '悬浮于云海之上的高空哨塔，是王国最前沿的眼睛。常年没有地面威胁——但今天，成群的空降兵与轰炸飞翼正从云层裂隙里涌出，越过低垂的天际线直扑塔顶。',
      waves: [
        { groups: [{ t: 'flyer', n: 4, from: 'air' }] },
        { groups: [{ t: 'flyer', n: 5, from: 'air' }, { t: 'drone', n: 2, from: 'air' }] },
        { groups: [{ t: 'bomber', n: 2, from: 'air' }, { t: 'flyer', n: 4, from: 'air' }] },
        { groups: [{ t: 'bomber', n: 3, from: 'air' }, { t: 'drone', n: 3, from: 'air' }, { t: 'flyer', n: 4, from: 'air' }] }
      ]
    },
    {
      id: 2, key: 'ironhold', name: '铁壁营垒', codename: 'IRONHOLD KEEP', terrain: 'plain',
      threat: ['地面'], require: 2, core: 1300, difficulty: '★☆☆☆☆',
      brief: '扼守平原商道的方形石垒，四面开阔、毫无遮蔽。斥候来报：一支训练有素的敌国正规军正排着散兵线推进，他们什么都缺，就是不缺人数。',
      waves: [
        { groups: [{ t: 'grunt', n: 5, from: 'land' }] },
        { groups: [{ t: 'grunt', n: 6, from: 'land' }, { t: 'gunner', n: 2, from: 'land' }] },
        { groups: [{ t: 'runner', n: 5, from: 'land' }, { t: 'gunner', n: 3, from: 'land' }] },
        { groups: [{ t: 'grunt', n: 8, from: 'land' }, { t: 'brute', n: 1, from: 'land' }, { t: 'gunner', n: 3, from: 'land' }] }
      ]
    },
    {
      id: 3, key: 'tidecrest', name: '浪涌炮台', codename: 'TIDECREST BATTERY', terrain: 'beach',
      threat: ['海滩', '海面'], require: 4, core: 1400, difficulty: '★★☆☆☆',
      brief: '架在礁岩上的海防炮台，正面是一望无际的白浪。晨雾还没散，登陆艇的影子已经压上了滩头——他们会在浅水里涉渡，顶着炮火爬上沙滩。',
      waves: [
        { groups: [{ t: 'raider', n: 6, from: 'water' }] },
        { groups: [{ t: 'raider', n: 6, from: 'water' }, { t: 'gunner', n: 2, from: 'land' }] },
        { groups: [{ t: 'brute', n: 2, from: 'water' }, { t: 'raider', n: 6, from: 'water' }] },
        { groups: [{ t: 'gunner', n: 4, from: 'land' }, { t: 'grunt', n: 6, from: 'land' }] },
        { groups: [{ t: 'brute', n: 3, from: 'water' }, { t: 'raider', n: 7, from: 'water' }, { t: 'flyer', n: 2, from: 'air' }] }
      ]
    },
    {
      id: 4, key: 'dunehold', name: '黄沙棱堡', codename: 'DUNEHOLD REDOUBT', terrain: 'gobi',
      threat: ['戈壁', '沙丘'], require: 6, core: 1500, difficulty: '★★☆☆☆',
      brief: '嵌在沙丘背风面的一座棱堡，视野被风沙切得支离破碎。沙漠骑兵借着尘幕贴地疾行，而藏在远丘上的冷枪手，会让你在扣扳机前先听见自己的心跳。',
      waves: [
        { groups: [{ t: 'runner', n: 6, from: 'land' }] },
        { groups: [{ t: 'runner', n: 6, from: 'land' }, { t: 'sniper', n: 2, from: 'far' }] },
        { groups: [{ t: 'sniper', n: 3, from: 'far' }, { t: 'grunt', n: 6, from: 'land' }] },
        { groups: [{ t: 'brute', n: 2, from: 'land' }, { t: 'runner', n: 8, from: 'land' }] },
        { groups: [{ t: 'brute', n: 3, from: 'land' }, { t: 'sniper', n: 3, from: 'far' }, { t: 'runner', n: 7, from: 'land' }] }
      ]
    },
    {
      id: 5, key: 'lakemere', name: '静水水寨', codename: 'LAKEMERE GARRISON', terrain: 'lake',
      threat: ['湖泊', '湿地'], require: 8, core: 1600, difficulty: '★★★☆☆',
      brief: '半泡在湖水里的木石混合水寨，芦苇荡是天然的遮蔽。蛙人会贴着水面摸上来，侦查无人机贴着水雾低飞——雷达在湿气里不太灵，多用眼睛。',
      waves: [
        { groups: [{ t: 'raider', n: 5, from: 'water' }] },
        { groups: [{ t: 'raider', n: 6, from: 'water' }, { t: 'drone', n: 2, from: 'air' }] },
        { groups: [{ t: 'grunt', n: 7, from: 'land' }, { t: 'gunner', n: 2, from: 'land' }] },
        { groups: [{ t: 'drone', n: 4, from: 'air' }, { t: 'raider', n: 6, from: 'water' }] },
        { groups: [{ t: 'brute', n: 2, from: 'water' }, { t: 'gunner', n: 4, from: 'land' }, { t: 'raider', n: 7, from: 'water' }] }
      ]
    },
    {
      id: 6, key: 'verdant', name: '青野壁垒', codename: 'VERDANT BULWARK', terrain: 'grass',
      threat: ['草地', '林线'], require: 10, core: 1700, difficulty: '★★★☆☆',
      brief: '被齐腰野草包住的长墙要塞。看起来岁月静好，实际上整片原野都在敌人手里。草丛一动就是信号，别等到刺刀顶到脸上才开火。',
      waves: [
        { groups: [{ t: 'grunt', n: 6, from: 'land' }] },
        { groups: [{ t: 'runner', n: 6, from: 'land' }, { t: 'grunt', n: 5, from: 'land' }] },
        { groups: [{ t: 'gunner', n: 3, from: 'land' }, { t: 'brute', n: 2, from: 'land' }, { t: 'grunt', n: 6, from: 'land' }] },
        { groups: [{ t: 'runner', n: 9, from: 'land' }, { t: 'sniper', n: 2, from: 'far' }] },
        { groups: [{ t: 'brute', n: 3, from: 'land' }, { t: 'gunner', n: 4, from: 'land' }, { t: 'grunt', n: 7, from: 'land' }, { t: 'flyer', n: 2, from: 'air' }] }
      ]
    },
    {
      id: 7, key: 'frostgate', name: '霜寒关城', codename: 'FROSTGATE CITADEL', terrain: 'snow',
      threat: ['雪地', '天际'], require: 12, core: 1900, difficulty: '★★★★☆',
      brief: '风雪中的北境关城，城砖常年结着一层薄冰。重装兵踩着齐膝的积雪压上来，走得慢，但你打穿它护甲的机会也只有几秒。飘雪会吃掉你的视野。',
      waves: [
        { groups: [{ t: 'grunt', n: 7, from: 'land' }] },
        { groups: [{ t: 'brute', n: 2, from: 'land' }, { t: 'grunt', n: 6, from: 'land' }] },
        { groups: [{ t: 'sniper', n: 3, from: 'far' }, { t: 'gunner', n: 3, from: 'land' }] },
        { groups: [{ t: 'brute', n: 3, from: 'land' }, { t: 'runner', n: 6, from: 'land' }] },
        { groups: [{ t: 'flyer', n: 4, from: 'air' }, { t: 'gunner', n: 4, from: 'land' }] },
        { groups: [{ t: 'brute', n: 4, from: 'land' }, { t: 'sniper', n: 3, from: 'far' }, { t: 'gunner', n: 4, from: 'land' }, { t: 'grunt', n: 6, from: 'land' }] }
      ]
    },
    {
      id: 8, key: 'rustmill', name: '锈蚀机厂', codename: 'RUSTMILL FORTRESS', terrain: 'factory',
      threat: ['废弃工厂', '天际'], require: 14, core: 2100, difficulty: '★★★★☆',
      brief: '停产多年的工业区改成的钢甲要塞，四处是冷却塔和翻倒的集装箱。敌人的东西在这里不需要补给：自律无人机、机甲与装甲推土车，铁锈味里全是机油味。',
      waves: [
        { groups: [{ t: 'drone', n: 4, from: 'air' }] },
        { groups: [{ t: 'drone', n: 5, from: 'air' }, { t: 'grunt', n: 6, from: 'land' }] },
        { groups: [{ t: 'tank', n: 1, from: 'land' }, { t: 'drone', n: 4, from: 'air' }] },
        { groups: [{ t: 'tank', n: 1, from: 'land' }, { t: 'brute', n: 3, from: 'land' }, { t: 'drone', n: 4, from: 'air' }] },
        { groups: [{ t: 'tank', n: 2, from: 'land' }, { t: 'gunner', n: 5, from: 'land' }, { t: 'drone', n: 5, from: 'air' }] },
        { groups: [{ t: 'tank', n: 2, from: 'land' }, { t: 'brute', n: 4, from: 'land' }, { t: 'sniper', n: 3, from: 'far' }, { t: 'drone', n: 5, from: 'air' }] }
      ]
    },
    {
      id: 9, key: 'dragonspire', name: '龙脊城楼', codename: 'DRAGONSPIRE GATE', terrain: 'city',
      threat: ['城楼', '天际', '地面'], require: 16, core: 2400, difficulty: '★★★★★',
      brief: '王都最后一道关，骑在龙脊山脊上的双重城楼。所有前面没打完的仗，都会在这里打完：投石车、重甲步兵、云梯、轰炸飞翼——守得住，王国还在。',
      waves: [
        { groups: [{ t: 'grunt', n: 8, from: 'land' }] },
        { groups: [{ t: 'brute', n: 3, from: 'land' }, { t: 'grunt', n: 8, from: 'land' }] },
        { groups: [{ t: 'gunner', n: 5, from: 'land' }, { t: 'bomber', n: 2, from: 'air' }] },
        { groups: [{ t: 'tank', n: 1, from: 'land' }, { t: 'brute', n: 4, from: 'land' }, { t: 'sniper', n: 3, from: 'far' }] },
        { groups: [{ t: 'bomber', n: 4, from: 'air' }, { t: 'flyer', n: 6, from: 'air' }, { t: 'gunner', n: 4, from: 'land' }] },
        { groups: [{ t: 'tank', n: 2, from: 'land' }, { t: 'brute', n: 5, from: 'land' }, { t: 'gunner', n: 6, from: 'land' }, { t: 'sniper', n: 3, from: 'far' }, { t: 'bomber', n: 3, from: 'air' }] }
      ]
    }
  ];

  window.BF = window.BF || {};
  window.BF.TERRAIN = TERRAIN;
  window.BF.LEVELS = LEVELS;
})();

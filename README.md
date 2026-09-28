# 堡垒要塞 · BASTION FORTRESS

浏览器端 3D 要塞防守射击游戏。Three.js 单页实现，零构建、零依赖安装，双击 `index.html` 即可运行。

## 玩法

在九座不同命名的要塞防御工事里据守射击，打退一波波从不同方向来袭的敌人，按表现拿 1–3 星，累计星数解锁后续要塞，旧关卡可反复重刷刷高分。

- **视角**：`V` 随时切换第一人称 / 第三人称
- **移动**：`WASD` · `Shift` 疾跑 · `Space` 跳跃
- **射击**：鼠标左键 · 右键精确瞄准（狙击开镜）
- **武器**：`1` 突击步枪 / `2` 战斗霰弹枪 / `3` 精准狙击枪 · `R` 换弹
- **其他**：`ESC` 暂停

星级规则：通关即 1 星；核心耐久剩余 ≥ 60% 得 2 星；≥ 88% 且命中率 ≥ 22% 得 3 星。

## 九座要塞

| # | 要塞 | 地形 | 主要来敌方向 |
|---|---|---|---|
| 01 | 云霄哨塔 SKYWATCH SPIRE | 天际浮岛 | 空降兵、无人机、轰炸飞翼 |
| 02 | 铁壁营垒 IRONHOLD KEEP | 旷野平原 | 步兵、火力手、突袭兵 |
| 03 | 浪涌炮台 TIDECREST BATTERY | 热带海滩 | 涉水兵抢滩 |
| 04 | 黄沙棱堡 DUNEHOLD REDOUBT | 戈壁荒漠 | 突袭兵 + 远丘冷枪手 |
| 05 | 静水水寨 LAKEMERE GARRISON | 湖泊湿地 | 蛙人、低飞无人机 |
| 06 | 青野壁垒 VERDANT BULWARK | 青草原野 | 混编步兵 |
| 07 | 霜寒关城 FROSTGATE CITADEL | 霜寒雪原 | 重装兵、冷枪手、空降兵 |
| 08 | 锈蚀机厂 RUSTMILL FORTRESS | 废弃工厂 | 无人机、装甲推土车 |
| 09 | 龙脊城楼 DRAGONSPIRE GATE | 古城楼 | 全兵种总攻 |

## 运行

```
# 直接打开
双击 index.html

# 或本地服务器（推荐，贴图加载更稳）
npx serve .
```

## 美术资源

游戏内置程序化生成的几何体与纯色材质。需要替换成正式美术时，把图片按命名规范放进 `assets/` 即可自动生效，**无需改代码**，缺失的文件会自动回退到内置材质。

完整规范见 [`ART_GUIDE.md`](./ART_GUIDE.md)。

## 结构

```
index.html            页面骨架 + 全部 UI 层
css/style.css         UI 样式
js/art.js             外部美术接入层（assets/ 自动加载 + 回退）
js/audio.js           WebAudio 程序化音效
js/levels.js          九关数据与地形主题
js/world.js           地形 / 堡垒 / 天气 / 装饰构建
js/enemies.js         敌人类型与 AI
js/fx.js              曳光、爆炸、粒子等特效
js/game.js            主控：状态机、战斗、UI、存档
js/vendor/three.min.js  Three.js r134（本地化，离线可用）
tests/smoke.js        jsdom 冒烟测试
```

测试：`node tests/smoke.js`（需 `NODE_PATH` 指向含 jsdom 的 node_modules）。

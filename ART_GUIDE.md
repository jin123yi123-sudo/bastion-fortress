# 美术资源投放规范 · ART GUIDE

> 给美术（人 / ChatGPT / 任何图像生成工具）看的。
> **核心规则：只需把图片放进 `assets/` 下对应目录、按文件名命名，游戏会自动识别并替换默认材质。
> 不需要改任何代码。文件不存在 → 游戏保持现在的样子，不会报错、不会白屏、不会缺图裂图。**

---

## 0. 路径总览（相对仓库根目录）

```
assets/
├─ sky/         天空全景（每关一张）
├─ textures/    地面 / 城墙 平铺贴图
├─ levels/      九座要塞的封面图（关卡卡片 + 战前简报）
├─ ui/          主菜单背景、LOGO、武器图标
├─ hud/         准星等 HUD 元件
└─ enemies/     敌人立绘（用于后续简报页，当前版本预留）
```

**命名硬性要求**：全小写，只用 `a-z 0-9 -`，**不要空格、不要中文、不要大写**。格式优先 `.jpg`（照片类）/ `.png`（需要透明底的类）。

---

## 1. 关卡封面 `assets/levels/`（**优先级最高，效果最明显**）

九张横版封面，文件名为关卡 key：

| 文件名 | 要塞 | 场景描述（给生成工具的 prompt 参考） |
|---|---|---|
| `skyline.jpg` | 云霄哨塔 | 悬浮在云海之上的高空哨塔，蓝天、积云、阳光强烈，塔身石砌带旗 |
| `ironhold.jpg` | 铁壁营垒 | 旷野平原上的方形石砌堡垒，黄昏侧光，长草、远处山脊 |
| `tidecrest.jpg` | 浪涌炮台 | 热带海滩炮台，白沙、椰树、碧蓝海浪拍岸，阳光明亮 |
| `dunehold.jpg` | 黄沙棱堡 | 戈壁荒漠中的棱堡，橙黄沙丘、热浪扭曲、天空泛沙色 |
| `lakemere.jpg` | 静水水寨 | 湖泊湿地水寨，芦苇荡、平静水面倒影、清晨薄雾 |
| `verdant.jpg` | 青野壁垒 | 青草原野长墙要塞，齐腰野草、起伏丘陵、柔和天光 |
| `frostgate.jpg` | 霜寒关城 | 雪原关城，厚积雪、飘雪、冷蓝色调、城墙挂冰凌 |
| `rustmill.jpg` | 锈蚀机厂 | 废弃工厂要塞，锈蚀钢架、冷却塔、锈红与灰褐、霾雾 |
| `dragonspire.jpg` | 龙脊城楼 | 古城楼关隘，青砖朱漆、飞檐斗拱、山脊长城、暮色 |

- **尺寸**：1200 × 600 px（2:1 横版），最低 800 × 400。
- **构图**：画面中下部放要塞主体（会裁成 150px 高的横条），上部留天空/远景。
- **风格**：写实偏厚涂，军事题材，**不要放人物、不要放 UI 文字、不要水印**。

## 2. 天空全景 `assets/sky/`

等距圆柱投影（equirectangular）全景，宽高比严格 **2:1**，建议 **4096 × 2048**（最低 2048 × 1024）。
文件名为地形 key：`skyline.jpg` `plain.jpg` `beach.jpg` `gobi.jpg` `lake.jpg` `grass.jpg` `snow.jpg` `factory.jpg` `city.jpg`

> 注意：这里用的是**地形 key 不是关卡 key**，`plain / grass / snow / factory / city` 与关卡 key 不同，别写错。

- 要求：左右边缘必须能无缝拼接；地平线在画面垂直中线；不要有太阳以外的强光源；不要地面物体。

## 3. 地面贴图 `assets/textures/`

命名：`ground-<terrain>.jpg`，terrain 同上九种。
- **尺寸**：1024 × 1024，**必须可无缝平铺（seamless tileable）**。
- 内容：纯地表材质特写，俯视角度、无阴影、无物体、光照均匀。
  - `ground-plain.jpg` 干草地 / `ground-gobi.jpg` 龟裂沙砾 / `ground-snow.jpg` 积雪
  - `ground-beach.jpg` 白沙 / `ground-grass.jpg` 青草 / `ground-lake.jpg` 湿泥苔藓
  - `ground-factory.jpg` 水泥混凝土地 / `ground-city.jpg` 青砖铺地 / `ground-skyline.jpg` 灰白岩石

## 4. 城墙砖石贴图 `assets/textures/`

命名：`wall-<terrain>.jpg`，同样 1024 × 1024、可无缝平铺。
- 内容：竖直墙面的砖石/材质特写，正视、光照均匀、无窗无门无藤蔓（可带轻微风化污渍）。
  - `wall-city.jpg` 青灰城砖 + 朱漆点缀 / `wall-factory.jpg` 锈蚀钢板铆钉
  - `wall-snow.jpg` 结冰石块 / `wall-gobi.jpg` 夯土砖 / 其余为对应色调的石砌

## 5. UI 元件 `assets/ui/`

| 文件名 | 尺寸 | 说明 |
|---|---|---|
| `menu-bg.jpg` | 1920 × 1080 | 主菜单背景。会被压暗并做渐隐遮罩，**中上部构图**，下部会被卡片盖住 |
| `logo.png` | 高 ≤ 200px，透明底 PNG | 游戏标题 LOGO「堡垒要塞 / BASTION FORTRESS」。透明背景，深色描边以便压在背景上看清 |
| `ar.png` `sg.png` `sr.png` | 各 128 × 96，透明底 | 武器图标，依次为突击步枪 / 霰弹枪 / 狙击枪。**侧视、枪口朝右、水平居中、去除背景** |

## 6. HUD `assets/hud/`

| 文件名 | 尺寸 | 说明 |
|---|---|---|
| `crosshair.png` | 128 × 128，透明底 | 准星。白色或琥珀色，中心留空（中心必须透明，否则挡视线） |

## 7. 敌人立绘 `assets/enemies/`（预留，当前版本尚未接入渲染）

命名（英文代号小写）：
`infantry.png` `gunner.png` `brute.png` `raider.png` `marksman.png` `marine.png` `skydriver.png` `drone.png` `bomber.png` `dozer.png`

对应中文：正规步兵 / 火力手 / 重装兵 / 突袭兵 / 冷枪手 / 涉水兵 / 空降兵 / 侦查无人机 / 轰炸飞翼 / 装甲推土车
尺寸 512 × 512，透明底，全身立绘，正面朝前。

---

## 8. 批量交付时的自检清单

- [ ] 文件名全小写、无空格无中文
- [ ] `.jpg` 用于照片类（天空/地面/封面），`.png` 用于需透明底（LOGO/图标/准星/立绘）
- [ ] 平铺贴图（ground-/wall-）左右上下无缝
- [ ] 天空图严格 2:1
- [ ] 单张不超过 2 MB（贴图类建议 ≤ 800 KB）
- [ ] 图上**不带任何文字、水印、UI 元素**

## 9. 生效方式

放进 `assets/` 后直接刷新页面即可（GitHub Pages 上等 1–2 分钟 CDN 生效）。
本地双击 `index.html` 也一样生效（浏览器允许同源加载同目录图片；若用 `file://` 遇到贴图不显示，改用本地服务器 `npx serve` 即可）。

**不需要改代码，不需要告诉程序图在哪。**

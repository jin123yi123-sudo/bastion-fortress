# 给 ChatGPT 的美术需求（复制整段发过去）

```
你是一位游戏美术。我正在做一个浏览器端 3D 要塞防守射击游戏《堡垒要塞 BASTION FORTRESS》
（Three.js 单页，军事写实偏厚涂风格，无 UI 文字、无水印）。
现在需要你补齐美术素材。请按下面的严格命名和尺寸出图，一次给完九关封面这一批。

【这一批要什么】九张关卡封面横版图，2:1，1200×600px，JPG。
构图要求：画面中下部是要塞主体（横幅会被裁成约 150px 高的横条，所以主体别太靠边），
上部留天空/远景；不要出现人物、文字、水印、UI。

文件名与内容一一对应（文件名必须完全一致，小写、连字符）：

1. skyline.jpg —— 云霄哨塔：悬浮在云海之上的高空石砌哨塔，蓝天积云，阳光强烈，塔顶有旗
2. ironhold.jpg —— 铁壁营垒：旷野平原上的方形石砌堡垒，黄昏侧光，长草与远处山脊
3. tidecrest.jpg —— 浪涌炮台：热带海滩炮台，白沙、椰树、碧蓝海浪拍岸，阳光明亮
4. dunehold.jpg —— 黄沙棱堡：戈壁荒漠中的棱堡，橙黄沙丘、热浪扭曲、天空泛沙色
5. lakemere.jpg —— 静水水寨：湖泊湿地水寨，芦苇荡、平静水面倒影、清晨薄雾
6. verdant.jpg —— 青野壁垒：青草原野长墙要塞，齐腰野草、起伏丘陵、柔和天光
7. frostgate.jpg —— 霜寒关城：雪原关城，厚积雪、飘雪、冷蓝色调、城墙挂冰凌
8. rustmill.jpg —— 锈蚀机厂：废弃工厂要塞，锈蚀钢架、冷却塔、锈红与灰褐、霾雾
9. dragonspire.jpg —— 龙脊城楼：古城楼关隘，青砖朱漆、飞檐斗拱、山脊长城、暮色

【重要】全部九张保持统一的光照方向与色调体系（同一天不同时段可以变，但笔触和质感要一致），
让它们在关卡选择界面排成一列时看起来是一套。

请逐张生成，每张命名按上面列表，并告诉我你出的图分别对应哪个文件名。
```

---

## 第二批（可选，效果次一级）

天空全景九张，等距圆柱投影，严格 2:1，4096×2048，左右边缘必须无缝拼接、地平线在正中间：
`skyline.jpg` `plain.jpg` `beach.jpg` `gobi.jpg` `lake.jpg` `grass.jpg` `snow.jpg` `factory.jpg` `city.jpg`

对应场景：高空云海 / 旷野黄昏 / 热带碧空 / 沙暴橙天 / 湖上晨雾 / 草原天光 / 阴沉雪天 / 工业霾灰 / 古城暮色

## 第三批（可选，贴图）

1024×1024 无缝平铺（seamless tileable），俯视、光照均匀、无物体无阴影：
- `ground-plain.jpg` 干草地、`ground-gobi.jpg` 龟裂沙砾、`ground-snow.jpg` 积雪、`ground-beach.jpg` 白沙、
  `ground-grass.jpg` 青草、`ground-lake.jpg` 湿泥苔藓、`ground-factory.jpg` 水泥地、`ground-city.jpg` 青砖铺地、`ground-skyline.jpg` 灰白岩石
- `wall-*.jpg`（同样九个后缀）：对应色调的竖直砖石/材质墙面特写，正视、光照均匀

## 第四批（可选，UI）

- `menu-bg.jpg` 1920×1080 主菜单背景（中上部构图，下部会被卡片遮住）
- `logo.png` 透明底，标题「堡垒要塞 / BASTION FORTRESS」，高 ≤200px，深色描边
- `ar.png` `sg.png` `sr.png` 各 128×96 透明底武器图标：突击步枪 / 霰弹枪 / 狙击枪，侧视、枪口朝右、去背景
- `hud/crosshair.png` 128×128 透明底准星，中心必须镂空

---

## 拿到图之后放哪

放进仓库的 `assets/` 目录，按类型分文件夹：

```
assets/levels/     ← 九张关卡封面（第一批）
assets/sky/        ← 天空全景（第二批）
assets/textures/   ← ground-*.jpg / wall-*.jpg（第三批）
assets/ui/         ← menu-bg.jpg / logo.png / ar.png / sg.png / sr.png（第四批）
assets/hud/        ← crosshair.png
```

游戏已经写了自动接入层：图放进去就会自动替换掉默认的程序化材质，**不需要改任何代码**；
某个文件没放，游戏就用原来的样子，不会报错。完整规范见仓库根目录 `ART_GUIDE.md`。

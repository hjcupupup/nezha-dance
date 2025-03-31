# 哪吒炫舞 - H5 音乐节奏游戏

一个以中国神话角色"哪吒"为主题的 HTML5 音乐节奏游戏。玩家需要跟随屏幕上显示的指令，按下正确的按键来让哪吒跳舞。

## 游戏特性

- 使用 Three.js 创建的 3D 哪吒角色模型
- 随节奏生成的指令系统
- 四级判定系统（Perfect/Good/Bad/Miss）
- 连击计数与加分系统
- 随分数增加的难度调整

## 如何游玩

1. 打开游戏网页
2. 点击"开始游戏"按钮
3. 使用键盘上的方向键（↑↓←→）和空格键来匹配屏幕上升起的指令
4. 当指令移动到判定线时按下对应按键可获得分数
5. 尽可能达成高分和高连击

## 技术栈

- HTML5
- CSS3
- JavaScript
- Three.js (3D 渲染)

## 项目结构

```
nahao-dance-game/
├── assets/         # 游戏资源（音效等）
├── css/            # 样式文件
├── js/             # JavaScript代码
│   ├── model.js    # 3D模型管理
│   ├── commands.js # 指令系统
│   ├── dancer.js   # 角色动画控制
│   └── game.js     # 游戏主逻辑
├── models/         # 3D模型文件（如有）
└── index.html      # 游戏主页面
```

## 本地开发

要在本地运行游戏，您需要使用本地服务器（由于浏览器安全限制）。以下是一些方法：

使用 Python 简易服务器：

```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

或使用 Node.js 的 http-server：

```bash
# 安装http-server
npm install -g http-server

# 运行服务器
http-server
```

然后在浏览器中访问 `http://localhost:8000` 或对应端口。

## 未来计划

- 添加音乐与背景
- 增加更多动作和特效
- 优化移动设备支持
- 添加更多角色和关卡

## 关于 Blender 中的哪吒模型

游戏中使用的哪吒 3D 模型是基于 Blender 创建的简化版本。模型包括：

- 角色头部（含特征性的双髻和额头红点）
- 动态肢体用于配合舞蹈动作
- 中国风服装设计

## 许可

本项目使用 MIT 许可。

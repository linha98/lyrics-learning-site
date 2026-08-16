# 歌词学习网站

一个手机优先的日语歌词学习网站，歌词数据由本地 `data.json` 维护，不依赖腾讯文档或其他在线表格。
可自由切换显示 **日文歌词 / 罗马音 / 中文 / 语法解释** 四种内容，字体可缩放，支持深色/浅色主题。

## 在线访问

https://linha98.github.io/lyrics-learning-site/

## 功能

- 📱 移动端优先，手机上阅读清晰
- 🎚 四个开关：日文、罗马音、中文、解释，随意组合
- 🔤 字体放大/缩小（A− / A+）
- 🌗 深色 / 浅色主题切换
- 🔍 26 首歌，可搜索、快速切换
- 💾 自动记住你的显示偏好、字体、上次看的歌

## 文件结构

```
我的歌词网站/
├── index.html      # 页面
├── style.css       # 样式
├── app.js          # 逻辑
├── data.json       # 歌词数据（本地维护）
├── extract_data.py # 旧版腾讯文档导入脚本（保留但不使用）
└── README.md
```

## 本地预览

浏览器直接双击 `index.html` 会因为浏览器安全策略无法读取 `data.json`。
请用一个本地服务器打开：

```bash
cd 我的歌词网站
python3 -m http.server 8080
# 然后浏览器打开 http://localhost:8080
```

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库（例如 `lyrics`）。
2. 把本文件夹里的所有文件上传到仓库根目录：
   ```bash
   cd 我的歌词网站
   git init
   git add .
   git commit -m "歌词学习网站"
   git branch -M main
   git remote add origin https://github.com/你的用户名/lyrics.git
   git push -u origin main
   ```
3. 打开仓库 **Settings → Pages**，Source 选 `Deploy from a branch`，
   分支选 `main`、目录选 `/ (root)`，保存。
4. 稍等一会，访问 `https://你的用户名.github.io/lyrics/` 即可。手机上也直接能开。

> 全部是静态文件，无需任何后端。

## 更新歌词数据

直接编辑项目根目录的 `data.json`。歌曲顺序由 `songs` 数组决定；每首歌包含 `id`、`title` 和二维 `stanzas`，每句固定包含 `jp`、`romaji`、`cn`、`note` 四个字段。空段落不要写入数组。

新增歌曲时，请保持 ID 唯一、按需要的位置插入 `songs`，并在修改后确认 JSON 可解析、歌曲数与页面编号正确。

> `extract_data.py` 是保留的旧版腾讯文档导入脚本，当前项目不使用它。不要运行该脚本，否则会重新生成并覆盖本地维护的 `data.json`。

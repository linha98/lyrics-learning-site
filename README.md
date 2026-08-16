# 歌词学习网站

一个手机优先的日语歌词学习网站，数据来自腾讯文档《无望之泪歌词-语法解析完善》。
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
├── data.json       # 歌词数据（从腾讯文档导出）
├── extract_data.py # 重新导出数据的脚本（可选）
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

歌词是构建时从腾讯文档导出的静态 `data.json`。文档更新后想同步：
重新运行 `extract_data.py`（需在装有腾讯文档连接器的 WorkBuddy 环境里），
它会重新生成 `data.json`，再提交推送即可。
或直接让我帮你重新导出。

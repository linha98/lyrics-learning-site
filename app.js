(function () {
  "use strict";

  var LS = {
    fields: "lyx_fields",
    song: "lyx_song",
    font: "lyx_font",
    theme: "lyx_theme",
  };

  var state = {
    data: null,
    songs: [],
    current: 0,
    fields: { jp: true, romaji: true, cn: true, note: false },
    font: 1.28,
  };

  var el = {
    lyrics: document.getElementById("lyrics"),
    songTitle: document.getElementById("songTitle"),
    songSub: document.getElementById("songSub"),
    chips: document.getElementById("chips"),
    songList: document.getElementById("songList"),
    songCount: document.getElementById("songCount"),
    search: document.getElementById("search"),
    drawer: document.getElementById("drawer"),
    drawerMask: document.getElementById("drawerMask"),
    appHeader: document.querySelector(".app-header"),
    menuBtn: document.getElementById("menuBtn"),
    themeBtn: document.getElementById("themeBtn"),
    statusMessage: document.getElementById("statusMessage"),
  };

  /* ---------- 持久化 ---------- */
  function load() {
    try {
      var f = JSON.parse(localStorage.getItem(LS.fields));
      if (f) state.fields = Object.assign(state.fields, f);
    } catch (e) {}
    var font = parseFloat(localStorage.getItem(LS.font));
    if (font) state.font = font;
  }
  function saveFields() { localStorage.setItem(LS.fields, JSON.stringify(state.fields)); }

  /* ---------- 主题 ---------- */
  function setTheme(theme, persist) {
    theme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelector('meta[name="theme-color"]').setAttribute(
      "content", theme === "light" ? "#ffffff" : "#0f1115"
    );
    el.themeBtn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    el.themeBtn.setAttribute(
      "aria-label", theme === "light" ? "切换到深色主题" : "切换到浅色主题"
    );
    if (persist) localStorage.setItem(LS.theme, theme);
  }

  function applyThemeInit() {
    var stored = localStorage.getItem(LS.theme);
    var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setTheme(stored === "light" || stored === "dark" ? stored : (prefersLight ? "light" : "dark"), false);
  }
  el.themeBtn.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(cur === "light" ? "dark" : "light", true);
  });

  /* ---------- 字体 ---------- */
  function applyFont() {
    document.documentElement.style.setProperty("--jp-size", state.font.toFixed(2) + "rem");
    localStorage.setItem(LS.font, state.font);
  }
  document.getElementById("fontPlus").addEventListener("click", function () {
    state.font = Math.min(2.0, state.font + 0.08); applyFont();
  });
  document.getElementById("fontMinus").addEventListener("click", function () {
    state.font = Math.max(0.9, state.font - 0.08); applyFont();
  });

  /* ---------- chips ---------- */
  function refreshChips() {
    Array.prototype.forEach.call(el.chips.children, function (btn) {
      var k = btn.getAttribute("data-key");
      var active = !!state.fields[k];
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }
  el.chips.addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    var k = btn.getAttribute("data-key");
    state.fields[k] = !state.fields[k];
    // 至少保留一项
    if (!state.fields.jp && !state.fields.romaji && !state.fields.cn && !state.fields.note) {
      state.fields[k] = true;
    }
    saveFields(); refreshChips(); render();
  });

  /* ---------- 抽屉 ---------- */
  var previousFocus = null;

  function setBackgroundInert(value) {
    el.appHeader.toggleAttribute("inert", value);
    el.lyrics.toggleAttribute("inert", value);
    if (value) {
      el.appHeader.setAttribute("aria-hidden", "true");
      el.lyrics.setAttribute("aria-hidden", "true");
    } else {
      el.appHeader.removeAttribute("aria-hidden");
      el.lyrics.removeAttribute("aria-hidden");
    }
  }

  function openDrawer() {
    if (el.drawer.classList.contains("open")) return;
    previousFocus = document.activeElement;
    el.drawer.removeAttribute("inert");
    el.drawer.setAttribute("aria-hidden", "false");
    el.drawer.classList.add("open");
    el.drawerMask.classList.add("open");
    el.menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("drawer-open");
    setBackgroundInert(true);
    el.search.focus();
  }

  function closeDrawer() {
    if (!el.drawer.classList.contains("open")) return;
    el.drawer.classList.remove("open");
    el.drawerMask.classList.remove("open");
    el.drawer.setAttribute("aria-hidden", "true");
    el.drawer.setAttribute("inert", "");
    el.menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("drawer-open");
    setBackgroundInert(false);
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    else el.menuBtn.focus();
  }

  el.menuBtn.addEventListener("click", openDrawer);
  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  el.drawerMask.addEventListener("click", closeDrawer);
  el.drawer.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDrawer();
      return;
    }
    if (e.key !== "Tab") return;
    var focusable = Array.prototype.filter.call(
      el.drawer.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
      function (node) { return node.offsetParent !== null; }
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  el.search.addEventListener("input", function () { renderSongList(this.value.trim()); });

  function renderSongList(filter) {
    filter = (filter || "").toLowerCase();
    el.songList.innerHTML = "";
    state.songs.forEach(function (s, i) {
      if (filter && s.title.toLowerCase().indexOf(filter) === -1) return;
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "song-item" + (i === state.current ? " active" : "");
      btn.setAttribute("aria-current", i === state.current ? "true" : "false");
      btn.innerHTML = '<span class="idx">' + (i + 1) + '</span><span>' + escapeHtml(s.title) + '</span>';
      btn.addEventListener("click", function () {
        selectSong(i); closeDrawer();
      });
      li.appendChild(btn);
      el.songList.appendChild(li);
    });
    if (!el.songList.children.length) {
      var empty = document.createElement("li");
      empty.className = "song-empty";
      empty.textContent = "没有找到歌曲";
      el.songList.appendChild(empty);
    }
  }

  /* ---------- 选歌 & 渲染 ---------- */
  function selectSong(i) {
    state.current = i;
    localStorage.setItem(LS.song, state.songs[i].title);
    render();
    renderSongList(el.search.value.trim());
    el.statusMessage.textContent = "已切换到《" + state.songs[i].title + "》";
    window.scrollTo(0, 0);
  }

  function render() {
    var song = state.songs[state.current];
    if (!song) return;
    el.songTitle.textContent = song.title;
    document.title = song.title + " · 歌词学习";
    var lineCount = song.stanzas.reduce(function (a, s) { return a + s.length; }, 0);
    el.songSub.textContent = song.stanzas.length + " 段 · " + lineCount + " 句";

    var f = state.fields;
    var html = "";
    song.stanzas.forEach(function (stz) {
      html += '<div class="stanza">';
      stz.forEach(function (line) {
        var parts = "";
        if (f.jp && line.jp) parts += '<div class="l-jp" lang="ja">' + escapeHtml(line.jp) + "</div>";
        if (f.romaji && line.romaji) parts += '<div class="l-romaji">' + escapeHtml(line.romaji) + "</div>";
        if (f.cn && line.cn) parts += '<div class="l-cn">' + escapeHtml(line.cn) + "</div>";
        if (f.note) {
          parts += line.note
            ? '<div class="l-note">' + escapeHtml(line.note) + "</div>"
            : '<div class="l-note l-note-empty">该句暂无解释</div>';
        }
        if (parts) html += '<div class="line">' + parts + "</div>";
      });
      html += "</div>";
    });
    el.lyrics.innerHTML = html || '<div class="empty-hint">这首歌暂无内容</div>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- 初始化 ---------- */
  function init(data) {
    state.data = data;
    state.songs = data.songs || [];
    el.songCount.textContent = state.songs.length;

    // 恢复上次歌曲
    var last = localStorage.getItem(LS.song);
    var idx = 0;
    if (last) {
      var found = state.songs.findIndex(function (s) { return s.title === last; });
      if (found >= 0) idx = found;
    }
    state.current = idx;

    refreshChips();
    applyFont();
    renderSongList("");
    render();
  }

  applyThemeInit();
  load();

  fetch("data.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(init)
    .catch(function (err) {
      el.lyrics.innerHTML = '<div class="empty-hint">数据加载失败：' + escapeHtml(err.message) +
        "<br/><br/>如果是本地直接双击打开的，请通过本地服务器访问（见 README）。</div>";
      el.songTitle.textContent = "加载失败";
    });
})();

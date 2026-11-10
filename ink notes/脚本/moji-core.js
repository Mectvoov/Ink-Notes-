/* 墨记 · 共用核心 moji-core
 * 由 脚本/首页.js、脚本/索引.js、脚本/分类选择器.js 首次调用时通过 dv.view 加载，
 * 结果挂在 window.__MOJI_CORE__，之后所有页面复用同一份函数与摘要缓存。
 * 只在这里改逻辑，三个页面同时生效；任何页面都不再复制一份实现。
 */
(async () => {
  const KEY = "__MOJI_CORE__";
  if (window[KEY]) return;

  const CONFIG_PATH = "ink notes/分类配置.md";
  const HUB_DIR = "ink notes/分类/";
  const DIARY_ROOT = "ink notes/日记";
  const PICKER_VIEW = "ink notes/脚本/分类选择器";
  const HOME_VIEW = "ink notes/脚本/首页";
  const INDEX_VIEW = "ink notes/脚本/索引";
  const HOLE = "未分类";
  const FENCE = String.fromCharCode(96).repeat(3);
  const NAME_MAX = 8;
  const FALLBACK_CATEGORIES = ["生活", "工作", "学习", "灵感", HOLE];
  const WEEKDAYS_LONG = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
  const WEEKDAYS_SHORT = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const DIGITS_CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const FENCE_BLOCK = new RegExp(FENCE + "[\\s\\S]*?" + FENCE, "g");

  const pad2 = value => {
    const n = Number(value) || 0;
    return n < 10 ? "0" + n : String(n);
  };

  /* ---------- 日期与时间 ---------- */

  function date(value) {
    return dv.date(value);
  }

  function isoDate(value) {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "string") return value.slice(0, 10);
    if (value && typeof value.toFormat === "function") {
      try {
        return value.toFormat("yyyy-MM-dd");
      } catch (err) {
        /* 落到下面的兜底 */
      }
    }
    if (typeof value === "number") {
      const stamp = new Date(value);
      if (!Number.isNaN(stamp.getTime())) {
        return stamp.getFullYear() + "-" + pad2(stamp.getMonth() + 1) + "-" + pad2(stamp.getDate());
      }
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.getFullYear() + "-" + pad2(value.getMonth() + 1) + "-" + pad2(value.getDate());
    }
    const fallback = new Date(value);
    if (!Number.isNaN(fallback.getTime())) {
      return fallback.getFullYear() + "-" + pad2(fallback.getMonth() + 1) + "-" + pad2(fallback.getDate());
    }
    return String(value).slice(0, 10);
  }

  function pageDate(page) {
    return isoDate(page && page.date);
  }

  /* YAML 可能把 15:23:45 解析成 55425（sexagesimal），这里统一还原成 HH:mm:ss */
  function formatTime(value) {
    if (value === null || value === undefined || value === "") return "--:--:--";
    if (typeof value === "number" && Number.isFinite(value)) {
      const total = Math.abs(Math.floor(value));
      return pad2(Math.floor(total / 3600) % 24) + ":" + pad2(Math.floor(total / 60) % 60) + ":" + pad2(total % 60);
    }
    const text = String(value).trim();
    const parts = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (parts) return pad2(parts[1]) + ":" + parts[2] + ":" + (parts[3] || "00");
    return text;
  }

  function pageKey(page) {
    const name = page && page.file && page.file.name ? page.file.name : "";
    return pageDate(page) + " " + formatTime(page && page.time) + " " + name;
  }

  function weekdayNumber(value) {
    if (value && typeof value.weekday === "number") return value.weekday;
    const day = value instanceof Date ? value : new Date(isoDate(value) + "T00:00:00");
    if (Number.isNaN(day.getTime())) return 1;
    const index = day.getDay();
    return index === 0 ? 7 : index;
  }

  function weekdayLong(value) {
    return WEEKDAYS_LONG[weekdayNumber(value) - 1];
  }

  function weekdayShort(value) {
    return WEEKDAYS_SHORT[weekdayNumber(value) - 1];
  }

  function chineseMonth(value) {
    let year;
    let month;
    if (value && typeof value.year === "number" && typeof value.month === "number") {
      year = value.year;
      month = value.month;
    } else {
      const day = value instanceof Date ? value : new Date(isoDate(value) + "T00:00:00");
      year = day.getFullYear();
      month = day.getMonth() + 1;
    }
    const y = String(year).split("").map(digit => DIGITS_CN[Number(digit)] || "").join("");
    const m = month <= 9 ? DIGITS_CN[month] : "\u5341" + (month === 10 ? "" : DIGITS_CN[month - 10]);
    return y + "\u5e74 " + m + "\u6708";
  }

  /* ---------- 文本 ---------- */

  function display(value, fallback) {
    const empty = fallback === undefined ? HOLE : fallback;
    if (Array.isArray(value)) return value.length ? value.join(" \u00b7 ") : empty;
    if (value === null || value === undefined || value === "") return empty;
    return String(value);
  }

  function excerpt(raw, limit) {
    const max = limit || 30;
    const text = String(raw || "")
      .replace(FENCE_BLOCK, " ")
      .replace(/^---[\s\S]*?---\s*/, "")
      .replace(/<div class="mj-entry-meta">[\s\S]*?<\/div>/g, "")
      .replace(/%%[\s\S]*?%%/g, "")
      .replace(/!\[\[[^\]]+\]\]/g, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/^#{1,6}\s+.*$/gm, "")
      .replace(/^>\s*\[![^\]]+\]\s*$/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/^-\s*$/gm, "")
      .replace(/^[-*_]{3,}\s*$/gm, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > max ? text.slice(0, max - 1) + "\u2026" : text;
  }

  const excerptCache = new Map();

  async function cachedExcerpt(file) {
    if (!file) return "";
    const stamp = file.stat && typeof file.stat.mtime === "number" ? file.stat.mtime : 0;
    const hit = excerptCache.get(file.path);
    if (hit && hit.stamp === stamp) return hit.text;
    let text = "";
    try {
      text = excerpt(await app.vault.cachedRead(file));
    } catch (err) {
      text = "";
    }
    excerptCache.set(file.path, { stamp, text });
    return text;
  }

  function clearCache() {
    excerptCache.clear();
  }

  function firstImage(raw) {
    const wiki = String(raw || "").match(/!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
    if (wiki) return wiki[1].trim();
    const markdown = String(raw || "").match(/!\[[^\]]*\]\(([^)]+)\)/);
    return markdown ? markdown[1].trim() : "";
  }

  function resolveImage(imagePath) {
    if (!imagePath) return null;
    return app.metadataCache.getFirstLinkpathDest(imagePath, "")
      || app.vault.getAbstractFileByPath(imagePath)
      || app.vault.getFiles().find(file => file.path.endsWith("/" + imagePath) || file.name === imagePath)
      || null;
  }

  /* ---------- DOM ---------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function link(path, label, className) {
    const node = el("a", "internal-link " + (className || ""), label);
    node.href = path;
    node.dataset.href = path;
    return node;
  }

  /* ---------- 分类 ---------- */

  function nameIssue(value) {
    const name = value === null || value === undefined ? "" : String(value).trim();
    if (!name) return "名称不能为空";
    if (name.length > NAME_MAX) return "名称最多 " + NAME_MAX + " 个字";
    if (/[\\/:*?"<>|#^\[\]]/.test(name)) return '名称不能包含 \\ / : * ? " < > | # ^ [ ]';
    if (/[\u0000-\u001f\u007f]/.test(name)) return "名称不能包含控制字符";
    if (name === "." || name === "..") return "名称不可用";
    if (/^[.\-]/.test(name)) return "名称不能以 . 或 - 开头";
    if (/[. \u3000]$/.test(name)) return "名称不能以空格或 . 结尾";
    if (/\u3000/.test(name)) return "名称不能包含全角空格";
    return null;
  }

  function configFile() {
    return app.vault.getAbstractFileByPath(CONFIG_PATH);
  }

  function configuredCategories() {
    const file = configFile();
    const cache = file ? app.metadataCache.getFileCache(file) : null;
    const stored = cache && cache.frontmatter ? cache.frontmatter.categories : null;
    if (Array.isArray(stored) && stored.length) return stored.map(String);
    return FALLBACK_CATEGORIES.slice();
  }

  function categories(pages) {
    const names = [];
    const push = value => {
      const name = value === null || value === undefined ? "" : String(value).trim();
      if (name && names.indexOf(name) < 0) names.push(name);
    };
    configuredCategories().forEach(push);
    (pages || []).forEach(page => push(page && page.category));
    const holeIndex = names.indexOf(HOLE);
    if (holeIndex >= 0) names.splice(holeIndex, 1);
    names.push(HOLE);
    return names;
  }

  function hubLink(name) {
    return HUB_DIR + name;
  }

  function hubPath(name) {
    return hubLink(name) + ".md";
  }

  function hubText(name) {
    return [
      "---",
      "type: category",
      'category: "' + name + '"',
      "cssclasses:",
      "  - moji-index",
      "---",
      "",
      '<div class="mj-index-heading"><span>' + name + "</span></div>",
      "",
      FENCE + "dataview",
      'TABLE WITHOUT ID file.link AS "\u7b14\u8bb0", dateformat(date, "yyyy/MM/dd") AS "\u65e5\u671f", time AS "\u65f6\u95f4"',
      'FROM "' + DIARY_ROOT + '"',
      'WHERE type = "diary" AND category = "' + name + '"',
      "SORT date DESC, time DESC",
      FENCE,
      ""
    ].join("\n");
  }

  async function ensureHub(name) {
    const path = hubPath(name);
    const existing = app.vault.getAbstractFileByPath(path);
    if (existing) return existing;
    try {
      return await app.vault.create(path, hubText(name));
    } catch (err) {
      return null;
    }
  }

  async function saveCategories(list) {
    const ordered = (list || []).filter(name => name && name !== HOLE);
    ordered.push(HOLE);
    const file = configFile();
    if (file) {
      try {
        await app.fileManager.processFrontMatter(file, data => {
          data.categories = ordered;
        });
      } catch (err) {
        /* 配置写失败不影响单篇日记改分类 */
      }
    }
    for (const name of ordered) await ensureHub(name);
    return ordered;
  }

  /* 先把编辑器缓冲区落盘，避免 processFrontMatter 抢写正在输入的内容 */
  async function flushEditor(file) {
    if (!file) return;
    try {
      const leaf = app.workspace.activeLeaf;
      const view = leaf && leaf.view;
      if (view && view.file && view.file.path === file.path && view.editor && typeof view.editor.save === "function") {
        await view.editor.save();
      }
    } catch (err) {
      /* 拿不到编辑器就跳过 */
    }
  }

  async function setCategory(pageOrFile, name) {
    const file = pageOrFile && pageOrFile.file
      ? app.vault.getAbstractFileByPath(pageOrFile.file.path)
      : pageOrFile;
    if (!file || !name) return false;
    await ensureHub(name);
    await flushEditor(file);
    await app.fileManager.processFrontMatter(file, data => {
      data.category = name;
      data.category_ref = "[[" + hubLink(name) + "|" + name + "]]";
    });
    return true;
  }

  async function addCategory(rawName, pages) {
    const name = String(rawName === null || rawName === undefined ? "" : rawName).trim();
    const issue = nameIssue(name);
    if (issue) return { ok: false, error: issue };
    const current = categories(pages);
    if (current.indexOf(name) >= 0) return { ok: false, error: "\u5206\u7c7b\u5df2\u5b58\u5728" };
    const next = current.filter(item => item !== HOLE).concat([name]);
    const list = await saveCategories(next);
    refresh();
    return { ok: true, list };
  }

  async function renameCategory(oldName, rawName, pages) {
    const name = String(rawName === null || rawName === undefined ? "" : rawName).trim();
    if (oldName === HOLE) return { ok: false, error: "\u672a\u5206\u7c7b\u4e0d\u53ef\u6539\u540d" };
    const issue = nameIssue(name);
    if (issue) return { ok: false, error: issue };
    const current = categories(pages);
    if (name === oldName) return { ok: true, list: current };
    if (current.indexOf(name) >= 0) return { ok: false, error: "\u5df2\u6709\u540c\u540d\u5206\u7c7b" };

    const oldHub = app.vault.getAbstractFileByPath(hubPath(oldName));
    const targetPath = hubPath(name);
    try {
      if (oldHub && !app.vault.getAbstractFileByPath(targetPath)) {
        await app.fileManager.renameFile(oldHub, targetPath);
      }
    } catch (err) {
      return { ok: false, error: "\u5206\u7c7b\u9875\u6539\u540d\u5931\u8d25" };
    }
    const newHub = app.vault.getAbstractFileByPath(targetPath);
    if (newHub) {
      try {
        await app.vault.modify(newHub, hubText(name));
      } catch (err) {
        /* 内容刷新失败不影响链接 */
      }
    } else {
      await ensureHub(name);
    }

    for (const page of (pages || []).filter(item => String(item && item.category ? item.category : "") === oldName)) {
      await setCategory(page, name);
    }
    const list = await saveCategories(current.map(item => (item === oldName ? name : item)));
    refresh();
    return { ok: true, list };
  }

  async function removeCategory(name, pages) {
    if (!name || name === HOLE) return false;
    const affected = (pages || []).filter(page => String(page && page.category ? page.category : "") === name);
    const message = affected.length
      ? "\u5220\u9664\u5206\u7c7b\u201c" + name + "\u201d\uff1f" + affected.length + " \u7bc7\u65e5\u8bb0\u5c06\u79fb\u5230\u201c\u672a\u5206\u7c7b\u201d\u3002"
      : "\u5220\u9664\u5206\u7c7b\u201c" + name + "\u201d\uff1f";
    if (!window.confirm(message)) return false;
    for (const page of affected) await setCategory(page, HOLE);
    const hub = app.vault.getAbstractFileByPath(hubPath(name));
    if (hub) {
      try {
        if (app.fileManager.trashFile) await app.fileManager.trashFile(hub);
        else await app.vault.delete(hub, true);
      } catch (err) {
        /* 删不掉就留着 */
      }
    }
    await saveCategories(categories(pages).filter(item => item !== name));
    refresh();
    return true;
  }

  async function deleteDiary(page) {
    const file = page && page.file ? app.vault.getAbstractFileByPath(page.file.path) : null;
    if (!file) return false;
    const label = page.file.name;
    if (!window.confirm("\u5220\u9664\u201c" + label + "\u201d\uff1f")) return false;
    try {
      if (app.fileManager.trashFile) await app.fileManager.trashFile(file);
      else await app.vault.delete(file, true);
      excerptCache.delete(file.path);
      return true;
    } catch (err) {
      return false;
    }
  }

  /* ---------- 右键菜单 ---------- */

  let activeMenu = null;

  function closeMenu() {
    if (activeMenu) {
      activeMenu.remove();
      activeMenu = null;
    }
  }

  function showPageMenu(event, page, list) {
    event.preventDefault();
    event.stopPropagation();
    closeMenu();

    const menu = el("div", "mj-context-menu");
    menu.setAttribute("role", "menu");
    menu.appendChild(el("div", "mj-context-heading", "\u79fb\u52a8\u5230\u5206\u7c7b"));

    const current = String(page && page.category ? page.category : HOLE);
    (list || categories([])).forEach(name => {
      const item = el("button", "mj-context-item", name);
      item.type = "button";
      if (name === current) item.classList.add("is-current");
      item.addEventListener("click", async clickEvent => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        closeMenu();
        await setCategory(page, name);
        refresh();
      });
      menu.appendChild(item);
    });

    menu.appendChild(el("div", "mj-context-divider"));
    const remove = el("button", "mj-context-item is-danger", "\u5220\u9664");
    remove.type = "button";
    remove.addEventListener("click", async clickEvent => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      closeMenu();
      await deleteDiary(page);
      refresh();
    });
    menu.appendChild(remove);

    document.body.appendChild(menu);
    const width = menu.offsetWidth || 180;
    const height = menu.offsetHeight || 260;
    menu.style.left = Math.max(12, Math.min(event.clientX, window.innerWidth - width - 12)) + "px";
    menu.style.top = Math.max(12, Math.min(event.clientY, window.innerHeight - height - 12)) + "px";
    activeMenu = menu;
    window.setTimeout(() => {
      document.addEventListener("click", closeMenu, { once: true });
    }, 0);
  }

  /* ---------- 数据 ---------- */

  function refresh() {
    try {
      app.commands.executeCommandById("dataview:refresh-views");
    } catch (err) {
      /* 刷新失败无碍 */
    }
  }

  function allPages() {
    let pages = [];
    try {
      pages = dv.pages('"' + DIARY_ROOT + '"').where(page => page.type === "diary").array();
    } catch (err) {
      pages = [];
    }
    return pages
      .filter(page => page && page.file && page.date)
      .sort((a, b) => pageKey(b).localeCompare(pageKey(a)));
  }

  function diaryText(now) {
    const dateText = now.toFormat("yyyy-MM-dd");
    const timeText = now.toFormat("HH:mm:ss");
    return [
      "---",
      "type: diary",
      "date: " + dateText,
      "week: " + now.toFormat("kkkk-'W'WW"),
      "weekday: " + weekdayLong(now),
      'time: "' + timeText + '"',
      "category: " + HOLE,
      'category_ref: "[[' + hubLink(HOLE) + "|" + HOLE + ']]"',
      "mood:",
      "weather:",
      "tags:",
      "  - \u65e5\u8bb0",
      "cover:",
      "cssclasses:",
      "  - moji-diary",
      "---",
      "",
      '<div class="mj-entry-meta">',
      '  <span class="mj-entry-date">' + now.toFormat("yyyy/MM/dd") + "</span>",
      '  <span class="mj-entry-time">' + timeText + "</span>",
      '  <span class="mj-entry-weekday">' + weekdayLong(now) + "</span>",
      "</div>",
      "",
      FENCE + "dataviewjs",
      'dv.view("' + PICKER_VIEW + '")',
      FENCE,
      "",
      "## \u4eca\u65e5\u8bb0\u5f55",
      ""
    ].join("\n");
  }

  async function createDiary() {
    const now = date("now");
    const year = now.toFormat("yyyy");
    const month = now.toFormat("MM");
    const folder = DIARY_ROOT + "/" + year + "/" + month;
    for (const path of [DIARY_ROOT + "/" + year, folder]) {
      if (!app.vault.getAbstractFileByPath(path)) await app.vault.createFolder(path);
    }
    const stamp = now.toFormat("yyyy-MM-dd-HHmmss");
    let target = folder + "/" + stamp + ".md";
    let suffix = 2;
    while (app.vault.getAbstractFileByPath(target)) {
      target = folder + "/" + stamp + "-" + suffix + ".md";
      suffix += 1;
    }
    const file = await app.vault.create(target, diaryText(now));
    await app.workspace.getLeaf("tab").openFile(file);
    return file;
  }

  const api = {
    KEY,
    CONFIG_PATH,
    HUB_DIR,
    DIARY_ROOT,
    PICKER_VIEW,
    HOME_VIEW,
    INDEX_VIEW,
    HOLE,
    FENCE,
    NAME_MAX,
    FALLBACK_CATEGORIES,
    WEEKDAYS_LONG,
    WEEKDAYS_SHORT,
    date,
    isoDate,
    pageDate,
    pageKey,
    formatTime,
    weekdayNumber,
    weekdayLong,
    weekdayShort,
    chineseMonth,
    display,
    excerpt,
    cachedExcerpt,
    clearCache,
    firstImage,
    resolveImage,
    el,
    link,
    nameIssue,
    configuredCategories,
    categories,
    hubLink,
    hubPath,
    hubText,
    ensureHub,
    saveCategories,
    flushEditor,
    setCategory,
    addCategory,
    renameCategory,
    removeCategory,
    deleteDiary,
    showPageMenu,
    closeMenu,
    refresh,
    allPages,
    diaryText,
    createDiary
  };

  window[KEY] = api;
})();

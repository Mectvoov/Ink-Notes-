/* 墨记 · 全部日记索引
 * 用法（ink notes/日记索引.md 内唯一一行）：dv.view("ink notes/脚本/索引")
 * 共用逻辑来自 ink notes/脚本/moji-core.js；摘要按 mtime 缓存，滚动分页渲染。
 * 顶部提供分类查看：点分类筛掉其它分类，再点一次回到全部。
 */
(async () => {
  if (!window.__MOJI_CORE__) {
    try {
      await dv.view("ink notes/脚本/moji-core");
    } catch (err) {
      /* core 缺失时下面会给出提示 */
    }
  }
  const M = window.__MOJI_CORE__;
  if (!M) {
    dv.paragraph("\u26a0\ufe0f \u58a8\u8bb0\uff1a\u627e\u4e0d\u5230 ink notes/\u811a\u672c/moji-core.js\uff0c\u7d22\u5f15\u9875\u65e0\u6cd5\u6e32\u67d3\u3002");
    return;
  }

  const make = M.el;
  const container = dv.container;
  container.classList.add("mj-index-page");

  const pages = M.allPages();
  const categoryList = M.categories(pages);
  const BATCH = 40;
  const ALL = "\u5168\u90e8";

  if (!pages.length) {
    container.appendChild(make("div", "mj-index-empty", "\u8fd8\u6ca1\u6709\u65e5\u8bb0"));
    return;
  }

  /* ---------- 逐篇构建行（只建一次，筛选时复用） ---------- */

  const entries = [];
  const counts = new Map();

  for (const page of pages) {
    const day = M.date(M.pageDate(page));
    if (!day) continue;

    const category = M.display(page.category);
    counts.set(category, (counts.get(category) || 0) + 1);

    const file = app.vault.getAbstractFileByPath(page.file.path);
    let raw = "";
    let summary = "";
    if (file) {
      try {
        raw = await app.vault.cachedRead(file);
      } catch (err) {
        raw = "";
      }
      summary = await M.cachedExcerpt(file);
    }

    const row = make("div", "mj-index-entry");
    row.dataset.category = category;

    const dateBlock = make("div", "mj-index-date");
    dateBlock.appendChild(make("strong", "", day.toFormat("dd")));
    dateBlock.appendChild(make("span", "mj-index-time", M.formatTime(page.time)));
    dateBlock.appendChild(make("span", "mj-index-weekday", M.weekdayShort(day)));

    const copy = make("div", "mj-index-copy");
    copy.appendChild(M.link(page.file.path, summary || "\u7a7a\u767d\u65e5\u8bb0", "mj-index-link"));

    const meta = make("div", "mj-index-meta");
    meta.appendChild(make("span", "", category));
    if (page.mood) meta.appendChild(make("span", "", String(page.mood)));
    if (page.weather) meta.appendChild(make("span", "", String(page.weather)));
    copy.appendChild(meta);

    row.appendChild(dateBlock);
    row.appendChild(copy);

    const imagePath = M.firstImage(raw);
    const imageFile = imagePath ? M.resolveImage(imagePath) : null;
    if (imageFile) {
      const thumbnail = make("img", "mj-index-thumb");
      thumbnail.src = app.vault.getResourcePath(imageFile);
      thumbnail.alt = "";
      row.classList.add("has-thumb");
      row.appendChild(thumbnail);
    }

    row.title = "\u53f3\u952e\uff1a\u79fb\u52a8\u5206\u7c7b\u6216\u5220\u9664";
    row.addEventListener("contextmenu", event => M.showPageMenu(event, page, categoryList));

    entries.push({ row, month: M.chineseMonth(day), category });
  }

  /* ---------- 分类查看条 ---------- */

  const filterBar = make("div", "mj-index-filter");
  const filterHead = make("div", "mj-filter-head");
  filterHead.appendChild(make("span", "mj-filter-label", "\u5206\u7c7b\u67e5\u770b"));
  filterHead.appendChild(make("span", "mj-filter-hint", "\u70b9\u4e00\u4e0b\u53ea\u770b\u8fd9\u4e00\u7c7b\uff0c\u518d\u70b9\u4e00\u4e0b\u56de\u5230\u5168\u90e8"));
  filterBar.appendChild(filterHead);

  const chipRow = make("div", "mj-filter-chips");
  filterBar.appendChild(chipRow);

  const listRegion = make("div", "mj-index-list");
  container.appendChild(filterBar);
  container.appendChild(listRegion);

  const usedCategories = categoryList.filter(name => counts.has(name));
  const ordered = usedCategories.slice();
  for (const [name] of counts) {
    if (!ordered.includes(name)) ordered.push(name);
  }

  let activeCategory = null;
  let shown = 0;
  let moreButton = null;
  let lastMonth = "";
  let chips = [];

  function matches(entry) {
    return !activeCategory || entry.category === activeCategory;
  }

  function visibleEntries() {
    return entries.filter(matches);
  }

  function renderMore() {
    const remaining = visibleEntries().length - shown;
    if (remaining <= 0) {
      if (moreButton && moreButton.parentNode) moreButton.remove();
      return;
    }
    if (!moreButton) {
      moreButton = make("button", "mj-load-more", "");
      moreButton.type = "button";
      moreButton.addEventListener("click", () => flush(BATCH));
    } else if (moreButton.parentNode) {
      moreButton.remove();
    }
    moreButton.textContent = "\u5c55\u5f00\u66f4\u591a\u65e5\u8bb0\uff08\u8fd8\u6709 " + remaining + " \u7bc7\uff09";
    listRegion.appendChild(moreButton);
  }

  function flush(count) {
    if (moreButton && moreButton.parentNode) moreButton.remove();
    const pool = visibleEntries();
    let appended = 0;
    while (shown < pool.length && appended < count) {
      const entry = pool[shown];
      if (entry.month !== lastMonth) {
        lastMonth = entry.month;
        listRegion.appendChild(make("div", "mj-index-month", entry.month));
      }
      listRegion.appendChild(entry.row);
      shown += 1;
      appended += 1;
    }
    renderMore();
  }

  function renderList() {
    listRegion.replaceChildren();
    shown = 0;
    lastMonth = "";
    moreButton = null;
    const pool = visibleEntries();
    if (!pool.length) {
      listRegion.appendChild(make("div", "mj-index-empty", "\u8fd9\u4e2a\u5206\u7c7b\u8fd8\u6ca1\u6709\u65e5\u8bb0"));
      return;
    }
    flush(BATCH);
  }

  function paintChips() {
    chipRow.replaceChildren();
    chips = [];

    const all = make("button", "mj-filter-chip", ALL + " " + entries.length);
    all.type = "button";
    all.dataset.category = "";
    all.addEventListener("click", () => pick(null));
    chipRow.appendChild(all);
    chips.push(all);

    for (const name of ordered) {
      const chip = make("button", "mj-filter-chip", name + " " + (counts.get(name) || 0));
      chip.type = "button";
      chip.dataset.category = name;
      chip.addEventListener("click", () => pick(activeCategory === name ? null : name));
      chipRow.appendChild(chip);
      chips.push(chip);
    }

    for (const chip of chips) {
      const value = chip.dataset.category || null;
      chip.classList.toggle("is-active", value === activeCategory);
    }
  }

  function pick(name) {
    activeCategory = name;
    for (const chip of chips) {
      const value = chip.dataset.category || null;
      chip.classList.toggle("is-active", value === activeCategory);
    }
    renderList();
  }

  paintChips();
  renderList();

  container.appendChild(make("div", "mj-index-foot", "\u5171 " + entries.length + " \u7bc7\u65e5\u8bb0"));
})();

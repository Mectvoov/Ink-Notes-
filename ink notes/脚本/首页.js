/* 墨记 · 首页仪表盘
 * 用法（ink notes/首页.md 内唯一一行）：dv.view("ink notes/脚本/首页")
 * 全部共用逻辑来自 ink notes/脚本/moji-core.js。
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
    dv.paragraph("\u26a0\ufe0f \u58a8\u8bb0\uff1a\u627e\u4e0d\u5230 ink notes/\u811a\u672c/moji-core.js\uff0c\u9996\u9875\u65e0\u6cd5\u6e32\u67d3\u3002");
    return;
  }

  const make = M.el;
  const container = dv.container;
  container.classList.add("mj-dashboard");

  const pages = M.allPages();
  const todayDate = M.date("today");
  const today = M.isoDate(todayDate);
  const monthPrefix = todayDate.toFormat("yyyy-MM");

  const dateSet = new Set(pages.map(M.pageDate));
  const pageSet = new Map();
  pages.forEach(page => {
    const key = M.pageDate(page);
    if (!pageSet.has(key)) pageSet.set(key, page);
  });

  let streak = 0;
  let cursor = todayDate;
  if (!dateSet.has(cursor.toFormat("yyyy-MM-dd"))) cursor = cursor.minus({ days: 1 });
  while (dateSet.has(cursor.toFormat("yyyy-MM-dd"))) {
    streak += 1;
    cursor = cursor.minus({ days: 1 });
  }

  /* ---------- 今日 ---------- */

  const todayPanel = make("section", "mj-today");
  const todayCopy = make("div", "mj-today-copy");
  todayCopy.appendChild(make("div", "mj-kicker", dateSet.has(today) ? "TODAY \u00b7 \u5df2\u8bb0\u5f55" : "TODAY \u00b7 \u7b49\u5f85\u843d\u7b14"));

  const todayHeading = make("h2", "", todayDate.toFormat("M\u6708d\u65e5"));
  todayHeading.dataset.mojiToday = today;
  todayCopy.appendChild(todayHeading);

  const weekdayTail = todayDate.weekday === 7
    ? "\u65e5"
    : ["\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d"][todayDate.weekday - 1];
  todayCopy.appendChild(make("div", "mj-date-line", todayDate.toFormat("yyyy\u5e74 \u00b7 \u661f\u671f") + weekdayTail));

  const todayActions = make("div", "mj-actions");
  const createButton = make("button", "mj-action mj-action-primary", "\u521b\u5efa\u65e5\u8bb0");
  createButton.type = "button";
  createButton.addEventListener("click", async () => {
    createButton.disabled = true;
    createButton.textContent = "\u521b\u5efa\u4e2d\u2026";
    try {
      await M.createDiary();
      M.clearCache();
      M.refresh();
    } catch (error) {
      console.error("Failed to create diary", error);
      createButton.disabled = false;
      createButton.textContent = "\u521b\u5efa\u65e5\u8bb0";
    }
  });
  todayActions.appendChild(createButton);
  todayActions.appendChild(M.link("ink notes/\u65e5\u8bb0\u7d22\u5f15", "\u5168\u90e8\u65e5\u8bb0", "mj-action"));

  const todayNote = pageSet.get(today);
  if (todayNote) {
    const meta = make("div", "mj-today-meta");
    meta.appendChild(make("span", "mj-chip", M.display(todayNote.category)));
    meta.appendChild(make("span", "mj-chip", M.display(todayNote.mood, "\u5fc3\u60c5\u672a\u8bb0\u5f55")));
    if (todayNote.weather) meta.appendChild(make("span", "mj-chip", M.display(todayNote.weather)));
    todayCopy.appendChild(meta);
  }

  todayPanel.appendChild(todayCopy);
  todayPanel.appendChild(todayActions);
  container.appendChild(todayPanel);

  /* ---------- 统计 ---------- */

  const stats = make("section", "mj-stats");
  [
    [String(pages.length), "\u7d2f\u8ba1\u7bc7\u6570"],
    [String(pages.filter(page => M.pageDate(page).startsWith(monthPrefix)).length), "\u672c\u6708\u8bb0\u5f55"],
    [String(streak), "\u8fde\u7eed\u5929\u6570"]
  ].forEach(([value, label]) => {
    const cell = make("div", "mj-stat");
    cell.appendChild(make("strong", "", value));
    cell.appendChild(make("span", "", label));
    stats.appendChild(cell);
  });
  container.appendChild(stats);

  /* ---------- 最近日记 ---------- */

  const index = make("section", "mj-section mj-index-page mj-home-index");
  const indexHead = make("div", "mj-section-head");
  indexHead.appendChild(make("h2", "", "\u65e5\u8bb0\u7d22\u5f15"));
  index.appendChild(indexHead);

  if (pages.length) {
    let currentMonth = "";
    for (const page of pages.slice(0, 10)) {
      const day = M.date(M.pageDate(page));
      if (!day) continue;

      const month = M.chineseMonth(day);
      if (month !== currentMonth) {
        currentMonth = month;
        index.appendChild(make("div", "mj-index-month", month));
      }

      const file = app.vault.getAbstractFileByPath(page.file.path);
      let raw = "";
      let summary = "";
      if (file) {
        try {
          raw = await app.vault.cachedRead(file);
          summary = M.excerpt(raw);
        } catch (err) {
          summary = "";
        }
      }

      const row = make("div", "mj-index-entry");
      const dateBlock = make("div", "mj-index-date");
      dateBlock.appendChild(make("strong", "", day.toFormat("dd")));
      dateBlock.appendChild(make("span", "mj-index-time", M.formatTime(page.time)));
      dateBlock.appendChild(make("span", "mj-index-weekday", M.weekdayShort(day)));

      const copy = make("div", "mj-index-copy");
      copy.appendChild(M.link(page.file.path, summary || "\u7a7a\u767d\u65e5\u8bb0", "mj-index-link"));
      const meta = make("div", "mj-index-meta");
      meta.appendChild(make("span", "", M.display(page.category)));
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
      row.addEventListener("contextmenu", event => M.showPageMenu(event, page, M.categories(pages)));
      index.appendChild(row);
    }

    if (pages.length > 10) {
      const more = make("div", "mj-section-foot");
      more.appendChild(M.link("ink notes/\u65e5\u8bb0\u7d22\u5f15", "\u67e5\u770b\u5168\u90e8 " + pages.length + " \u7bc7", "mj-action"));
      index.appendChild(more);
    }
  } else {
    index.appendChild(make("div", "mj-empty", "\u7b2c\u4e00\u7bc7\u65e5\u8bb0\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002"));
  }
  container.appendChild(index);

  /* ---------- 分类管理 ---------- */

  const categorySection = make("section", "mj-section mj-categories");
  const categoryHead = make("div", "mj-section-head");
  categoryHead.appendChild(make("h2", "", "\u5206\u7c7b\u7ba1\u7406"));
  categorySection.appendChild(categoryHead);

  const categoryManager = make("div", "mj-category-manager");
  let editingCategory = null;
  let categoryError = "";

  function renderCategoryManager() {
    categoryManager.replaceChildren();
    const counts = new Map();
    pages.forEach(page => {
      const category = M.display(page.category);
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    const list = make("div", "mj-category-manage-list");
    M.categories(pages).forEach(category => {
      const item = make("div", "mj-category-manage-item");

      if (category === editingCategory) {
        item.classList.add("is-editing");
        const editForm = make("form", "mj-category-edit-form");
        const input = make("input", "mj-category-input");
        input.type = "text";
        input.maxLength = M.NAME_MAX;
        input.value = category;
        input.setAttribute("aria-label", "\u65b0\u7684\u5206\u7c7b\u540d\u79f0");
        const save = make("button", "mj-small-action", "\u4fdd\u5b58");
        save.type = "submit";
        const cancel = make("button", "mj-small-action", "\u53d6\u6d88");
        cancel.type = "button";
        cancel.addEventListener("click", () => {
          editingCategory = null;
          categoryError = "";
          renderCategoryManager();
        });
        editForm.addEventListener("submit", async event => {
          event.preventDefault();
          const result = await M.renameCategory(category, input.value, pages);
          if (!result.ok) {
            categoryError = result.error;
            renderCategoryManager();
            return;
          }
          editingCategory = null;
          categoryError = "";
        });
        editForm.appendChild(input);
        editForm.appendChild(save);
        editForm.appendChild(cancel);
        item.appendChild(editForm);
        list.appendChild(item);
        return;
      }

      item.appendChild(M.link(M.hubLink(category), category, "mj-category-manage-name"));
      item.appendChild(make("span", "mj-category-manage-count", String(counts.get(category) || 0)));

      if (category !== M.HOLE) {
        const actions = make("div", "mj-category-manage-actions");
        const rename = make("button", "mj-small-action", "\u6539\u540d");
        rename.type = "button";
        rename.addEventListener("click", () => {
          editingCategory = category;
          categoryError = "";
          renderCategoryManager();
        });
        const remove = make("button", "mj-small-action is-danger", "\u5220\u9664");
        remove.type = "button";
        remove.addEventListener("click", async () => {
          await M.removeCategory(category, pages);
        });
        actions.appendChild(rename);
        actions.appendChild(remove);
        item.appendChild(actions);
      }
      list.appendChild(item);
    });

    if (categoryError) categoryManager.appendChild(make("div", "mj-category-error", categoryError));

    const addForm = make("form", "mj-category-add");
    const input = make("input", "mj-category-input");
    input.type = "text";
    input.maxLength = M.NAME_MAX;
    input.placeholder = "\u65b0\u5206\u7c7b\u540d\u79f0";
    const add = make("button", "mj-action", "\u6dfb\u52a0");
    add.type = "submit";
    addForm.appendChild(input);
    addForm.appendChild(add);
    addForm.addEventListener("submit", async event => {
      event.preventDefault();
      const result = await M.addCategory(input.value, pages);
      if (!result.ok) {
        categoryError = result.error;
        renderCategoryManager();
      }
    });

    categoryManager.appendChild(list);
    categoryManager.appendChild(addForm);
  }

  renderCategoryManager();
  categorySection.appendChild(categoryManager);
  container.appendChild(categorySection);
})();

/* 墨记 · 日记分类选择器
 * 用法：日记正文里的 dataviewjs 块
 *   dv.view("ink notes/脚本/分类选择器")
 * 行为：从 ink notes/脚本/moji-core.js 取分类列表，点一下就把分类写回当前笔记的
 *       frontmatter（category / category_ref），并按需补建分类 hub 页。
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
    dv.paragraph("\u26a0\ufe0f \u58a8\u8bb0\uff1a\u627e\u4e0d\u5230 ink notes/\u811a\u672c/moji-core.js\uff0c\u5206\u7c7b\u9009\u62e9\u5668\u65e0\u6cd5\u6e32\u67d3\u3002");
    return;
  }

  let page = null;
  try {
    page = dv.current();
  } catch (err) {
    page = null;
  }
  const file = page && page.file
    ? app.vault.getAbstractFileByPath(page.file.path)
    : app.workspace.getActiveFile();
  if (!file || file.extension !== "md") return;

  const front = () => ((app.metadataCache.getFileCache(file) || {}).frontmatter || {});
  if (front().type !== "diary") return;

  const root = dv.el("div", "");
  root.classList.add("mj-picker");

  const label = document.createElement("span");
  label.className = "mj-picker-label";
  label.textContent = "\u5206\u7c7b";

  const chips = document.createElement("div");
  chips.className = "mj-picker-chips";

  const status = document.createElement("span");
  status.className = "mj-picker-status";

  root.appendChild(label);
  root.appendChild(chips);
  root.appendChild(status);

  let list = M.categories(M.allPages());
  let active = String(front().category || M.HOLE).trim() || M.HOLE;
  if (list.indexOf(active) < 0) list.unshift(active);
  let busy = false;
  let flashTimer = 0;

  function flash(text) {
    status.textContent = text;
    window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => {
      status.textContent = "";
    }, 2400);
  }

  function paint() {
    chips.textContent = "";
    list.forEach(name => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "mj-picker-chip" + (name === active ? " is-active" : "");
      chip.textContent = name;
      chip.title = name === active ? "\u5f53\u524d\u5206\u7c7b" : "\u70b9\u51fb\u5f52\u5165\u300c" + name + "\u300d";
      chip.addEventListener("click", () => {
        choose(name);
      });
      chips.appendChild(chip);
    });

    const add = document.createElement("button");
    add.type = "button";
    add.className = "mj-picker-chip mj-picker-add";
    add.textContent = "\uff0b \u65b0\u5206\u7c7b";
    add.addEventListener("click", showAdd);
    chips.appendChild(add);
  }

  async function choose(name) {
    if (busy) return;
    if (name === active && front().category === name) return;

    busy = true;
    flash("\u4fdd\u5b58\u4e2d\u2026");
    try {
      if (list.indexOf(name) < 0) {
        const added = await M.addCategory(name, M.allPages());
        if (!added.ok) {
          flash(added.error);
          busy = false;
          return;
        }
        list = added.list.slice();
        if (list.indexOf(active) < 0) list.unshift(active);
      }
      await M.setCategory(file, name);
      active = name;
      paint();
      flash("\u5df2\u5f52\u5165\u300c" + name + "\u300d");
    } catch (err) {
      console.error("\u58a8\u8bb0\uff1a\u5206\u7c7b\u5199\u5165\u5931\u8d25", err);
      flash("\u4fdd\u5b58\u5931\u8d25");
    } finally {
      busy = false;
    }
  }

  function showAdd() {
    chips.textContent = "";

    const form = document.createElement("form");
    form.className = "mj-picker-form";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = M.NAME_MAX;
    input.className = "mj-category-input mj-picker-input";
    input.placeholder = "\u65b0\u5206\u7c7b\u540d\u79f0\uff081-" + M.NAME_MAX + " \u5b57\uff09";

    const save = document.createElement("button");
    save.type = "submit";
    save.className = "mj-small-action";
    save.textContent = "\u4fdd\u5b58";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "mj-small-action";
    cancel.textContent = "\u53d6\u6d88";
    cancel.addEventListener("click", () => paint());

    form.appendChild(input);
    form.appendChild(save);
    form.appendChild(cancel);

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const issue = M.nameIssue(input.value);
      if (issue) {
        flash(issue);
        return;
      }
      await choose(input.value.trim());
    });

    chips.appendChild(form);
    window.setTimeout(() => input.focus(), 0);
  }

  paint();
})();

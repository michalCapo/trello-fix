(() => {
  const listSelector = '[data-testid="list"]';
  const records = new Map();
  let composers = new Map();
  let openLists = [];
  let board = null;
  let scheduled = false;
  let dragging = false;

  function listId(list) {
    return list.getAttribute('data-card-drop-list-id')
      || list.querySelector('[data-card-drop-list-id]')?.getAttribute('data-card-drop-list-id');
  }

  function setDragging(value) {
    dragging = value;
    for (const list of records.keys()) {
      list.classList.toggle('tfp-board-dragging', value);
      if (!value) list.classList.remove('tfp-board-drop-hover');
    }
  }

  function open(list) {
    if (dragging) return;
    openLists = openLists.filter(entry => entry.list !== list);
    openLists.push({ list, id: listId(list) });
    if (openLists.length > 2) openLists.shift();
    update();
    list.querySelector('[data-testid="card-name"][href], button:not(.tfp-board-tab)')
      ?.focus({ preventScroll: true });
    // Reveal this list without scrolling the page vertically.
    const shell = records.get(list).shell;
    const scroller = shell.parentElement;
    const bounds = scroller.getBoundingClientRect();
    const rect = shell.getBoundingClientRect();
    if (rect.left < bounds.left) scroller.scrollLeft += rect.left - bounds.left;
    else if (rect.right > bounds.right) scroller.scrollLeft += rect.right - bounds.right;
  }

  function cleanup(list, record) {
    list.classList.remove('tfp-board-list', 'tfp-board-collapsed',
      'tfp-board-dragging', 'tfp-board-drop-hover');
    record.shell.classList.remove('tfp-board-shell', 'tfp-board-collapsed-shell');
    record.cards.classList.remove('tfp-board-drop-zone');
    record.button.remove();
    records.delete(list);
  }

  function updateComposers(cardOpen) {
    const next = new Map();
    if (!cardOpen) {
      const rows = new Set([...records.values()].map(record => record.shell.parentElement));
      for (const row of rows) {
        const shell = row.lastElementChild;
        if (!shell || shell.querySelector(`${listSelector}, input, textarea, [contenteditable="true"]`)) continue;
        const container = shell.matches('[data-testid="list-composer-button-container"]') ? shell
          : shell.querySelector('[data-testid="list-composer-button-container"], [data-testid="list-composer-button"]');
        const button = container?.matches('button, [role="button"]') ? container
          : (container || shell).querySelector('button, [role="button"]') || container;
        if (!button) continue;
        if (!container && !/^\+?\s*Add (?:another |a )?list$/i.test(button.textContent.trim())) continue;
        next.set(button, shell);
      }
    }
    for (const [button, shell] of composers) {
      if (next.has(button)) continue;
      button.classList.remove('tfp-board-add');
      shell.classList.remove('tfp-board-add-shell');
    }
    for (const [button, shell] of next) {
      if (!button.classList.contains('tfp-board-add')) button.classList.add('tfp-board-add');
      if (!shell.classList.contains('tfp-board-add-shell')) shell.classList.add('tfp-board-add-shell');
    }
    composers = next;
  }

  function update() {
    scheduled = false;
    const boardId = location.pathname.match(/^\/b\/([^/]+)/)?.[1];
    if (boardId && boardId !== board) {
      board = boardId;
      openLists = [];
    }
    const lists = [...document.querySelectorAll(listSelector)];
    for (const [list, record] of records) {
      if (!lists.includes(list)) cleanup(list, record);
    }
    for (const list of lists) {
      const cards = list.querySelector('[data-testid="list-cards"]');
      const name = list.querySelector('[data-testid="list-name"]');
      // Leave unknown layouts alone rather than covering native controls.
      if (!cards || !name) {
        if (records.has(list)) cleanup(list, records.get(list));
        continue;
      }
      let record = records.get(list);
      if (record && record.cards !== cards) {
        cleanup(list, record);
        record = null;
      }
      if (!record) {
        const shell = list.closest('[data-testid="list-wrapper"]')
          || (list.parentElement.tagName === 'LI' ? list.parentElement : list);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tfp-board-tab';
        button.setAttribute('aria-expanded', 'false');
        button.innerHTML = '<span class="tfp-board-count"></span><span class="tfp-board-name"></span>';
        button.addEventListener('click', () => open(list));
        // The tab is a control, not a draggable Trello list header.
        button.addEventListener('pointerdown', event => event.stopPropagation());
        button.addEventListener('dragstart', event => {
          event.preventDefault();
          event.stopPropagation();
        });
        list.append(button);
        record = { shell, cards, button };
        records.set(list, record);
      }
      const title = name.value ?? name.textContent.trim();
      const count = cards.querySelectorAll('[data-testid="list-card"]').length;
      const countLabel = record.button.querySelector('.tfp-board-count');
      const nameLabel = record.button.querySelector('.tfp-board-name');
      if (countLabel.textContent !== String(count)) countLabel.textContent = count;
      if (nameLabel.textContent !== title) nameLabel.textContent = title;
      const label = `Open ${title}, ${count} ${count === 1 ? 'card' : 'cards'}`;
      if (record.button.getAttribute('aria-label') !== label) {
        record.button.setAttribute('aria-label', label);
        record.button.title = label;
      }
      list.classList.add('tfp-board-list');
      cards.classList.add('tfp-board-drop-zone');
    }
    // Keep both selections when React replaces list nodes; discard removed lists.
    openLists = openLists.map(entry => {
      const list = records.has(entry.list) ? entry.list
        : [...records.keys()].find(list => entry.id && listId(list) === entry.id);
      return list ? { list, id: listId(list) } : null;
    }).filter(Boolean);
    if (!openLists.length && records.size) {
      const list = records.keys().next().value;
      openLists.push({ list, id: listId(list) });
    }
    // Full-page card navigation forwards native board drag coordinates. Keep
    // those cards laid out behind the overlay, then restore the selected lists.
    const cardOpen = !!document.querySelector('[role="dialog"][data-testid="card-back-name"]');
    for (const [list, record] of records) {
      const collapsed = !cardOpen && !openLists.some(entry => entry.list === list);
      record.collapsed = collapsed;
      record.spaced = !cardOpen;
      list.classList.toggle('tfp-board-collapsed', collapsed);
      record.shell.classList.toggle('tfp-board-shell', record.spaced);
      record.shell.classList.toggle('tfp-board-collapsed-shell', collapsed);
      record.button.hidden = !collapsed;
    }
    updateComposers(cardOpen);
    if (!records.size) {
      openLists = [];
      setDragging(false);
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  // Keep Trello's real list-cards element exposed to its native drag lifecycle.
  // No move requests or synthetic drop events are needed.
  addEventListener('dragstart', event => {
    const list = event.target.closest?.(listSelector);
    const card = event.target.closest?.('[data-testid="list-card"]')
      || event.target.querySelector?.('[data-testid="list-card"]');
    if (list && card && event.target !== list) setDragging(true);
  }, true);
  addEventListener('dragover', event => {
    if (!dragging) return;
    const target = event.target.closest?.('.tfp-board-collapsed');
    for (const list of records.keys()) {
      list.classList.toggle('tfp-board-drop-hover', list === target);
    }
  }, true);
  addEventListener('dragleave', event => {
    const list = event.target.closest?.('.tfp-board-collapsed');
    if (list && !list.contains(event.relatedTarget)) list.classList.remove('tfp-board-drop-hover');
  }, true);
  for (const type of ['drop', 'dragend']) {
    addEventListener(type, () => {
      // Finish after Trello's drop handlers, including handlers that stop bubbling.
      setTimeout(() => { setDragging(false); schedule(); }, 0);
    }, true);
  }
  addEventListener('keydown', event => {
    if (event.key === 'Escape') setDragging(false);
  });
  addEventListener('blur', () => setDragging(false));
  addEventListener('popstate', schedule);
  new MutationObserver(mutations => {
    if (mutations.some(mutation => {
      if (mutation.attributeName === 'class') {
        // React can overwrite our classes. Ignore our own class mutations.
        return [...records].some(([list, record]) =>
          (mutation.target === list && (!list.classList.contains('tfp-board-list')
            || list.classList.contains('tfp-board-collapsed') !== record.collapsed))
          || (mutation.target === record.shell
            && (record.shell.classList.contains('tfp-board-collapsed-shell') !== record.collapsed
              || record.shell.classList.contains('tfp-board-shell') !== record.spaced))
          || (mutation.target === record.cards && !record.cards.classList.contains('tfp-board-drop-zone')))
          || [...composers].some(([button, shell]) =>
            (mutation.target === button && !button.classList.contains('tfp-board-add'))
            || (mutation.target === shell && !shell.classList.contains('tfp-board-add-shell')));
      }
      return !mutation.target.closest?.('.tfp-board-tab');
    })) schedule();
  }).observe(document.body, {
    childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['data-testid', 'data-card-drop-list-id', 'class'],
  });
  update();
})();

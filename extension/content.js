(() => {
  // Use Trello's semantic hooks, not its generated CSS class names.
  const selector = '[role="dialog"][data-testid="card-back-name"]';
  let marked = new Map();
  let scheduled = false;

  function update() {
    scheduled = false;
    const next = new Map();
    const mark = (element, name) => {
      if (!element) return;
      if (!next.has(element)) next.set(element, new Set());
      next.get(element).add(name);
    };

    for (const card of document.querySelectorAll(selector)) {
      const main = card.querySelector('main');
      if (!main) continue;
      const layout = main.parentElement;
      const panel = Array.from(layout.children).find(el => el.tagName === 'ASIDE'
        && !el.classList.contains('tfp-column-nav'));
      mark(card, 'tfp-card');
      mark(main, 'tfp-main');
      mark(layout, 'tfp-layout');
      mark(panel, 'tfp-panel');
      for (const child of layout.children) {
        if (child.getAttribute('role') === 'slider') mark(child, 'tfp-resizer');
      }
      // Remove size limits on shells without moving React-owned elements.
      for (let shell = layout.parentElement; shell && shell !== card; shell = shell.parentElement) {
        mark(shell, 'tfp-shell');
      }
      for (const nav of card.querySelectorAll('nav')) mark(nav, 'tfp-toolbar');
      const frame = card.closest('#overlay-contents');
      if (frame) {
        mark(frame, 'tfp-frame');
        mark(frame.parentElement, 'tfp-overlay');
      }
    }

    for (const [element, names] of marked) {
      for (const name of names) {
        if (!next.get(element)?.has(name)) element.classList.remove(name);
      }
    }
    for (const [element, names] of next) {
      for (const name of names) {
        if (!element.classList.contains(name)) element.classList.add(name);
      }
    }
    marked = next;
  }

  const observer = new MutationObserver(records => {
    // React may replace a class list while switching between desktop and mobile.
    // Ignore our own class additions so they cannot start an observer loop.
    const changed = records.some(record => {
      if (record.attributeName !== 'class') return true;
      const names = marked.get(record.target);
      return names && [...names].some(name => !record.target.classList.contains(name));
    });
    if (!changed) return;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-testid', 'aria-hidden', 'class']
  });
  update();
})();

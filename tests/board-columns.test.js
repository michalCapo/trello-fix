// Run with `await runBoardColumnTests()` in this local browser fixture.
async function runBoardColumnTests() {
  const results = [];
  const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const lists = () => [...document.querySelectorAll('[data-testid="list"]')];
  const open = () => lists().filter(list => !list.classList.contains('tfp-board-collapsed'));
  const check = (condition, name) => {
    if (!condition) throw new Error(name);
    results.push(name);
  };
  populate();
  await settle();
  check(open().length === 1 && open()[0] === lists()[0], 'First list open by default');
  check(lists().every(list => list.querySelector('.tfp-board-tab')), 'Every list gets a tab');
  check(lists()[4].querySelector('.tfp-board-count').textContent === '0', 'Empty list gets a zero count');
  check(lists()[1].getBoundingClientRect().height < document.querySelector('#board').clientHeight / 2,
    'Closed rail is only as tall as its tab');
  const header = lists()[0].querySelector('[data-testid="list-name"]');
  const clickHeader = (x, y) => document.elementFromPoint(x, y)
    .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  const nameText = document.createRange();
  nameText.selectNodeContents(header.firstChild);
  const textRect = nameText.getBoundingClientRect();
  clickHeader(textRect.left + 2, textRect.top + textRect.height / 2);
  check(open().length === 0, 'Clicking the list name text collapses the list');
  lists()[0].querySelector('.tfp-board-tab').click();
  const headerRect = header.getBoundingClientRect();
  clickHeader(headerRect.right - 4, headerRect.top + headerRect.height / 2);
  await settle();
  check(open().length === 0, 'Clicking blank header space collapses the list');
  lists()[0].querySelector('.tfp-board-tab').click();
  check(open().length === 1 && open()[0] === lists()[0], 'Clicking a closed rail opens it');
  const composer = document.querySelector('#list-composer');
  const addButton = () => composer.querySelector('button');
  check(getComputedStyle(addButton()).writingMode === 'vertical-rl', 'Add-list button uses vertical text');
  check(composer.getBoundingClientRect().width === 56, 'Add-list column is as narrow as closed lists');
  const row = document.querySelector('#board');
  if (row.scrollWidth <= row.clientWidth) {
    const bounds = row.getBoundingClientRect();
    const left = row.firstElementChild.getBoundingClientRect().left - bounds.left;
    const right = bounds.right - composer.getBoundingClientRect().right;
    check(Math.abs(left - right) <= 1, 'All columns including Add list are horizontally centered');
  } else {
    check(row.firstElementChild.getBoundingClientRect().left >= row.getBoundingClientRect().left,
      'Overflowing columns start inside the scrollable viewport');
  }
  addButton().click();
  await settle();
  check(!!composer.querySelector('input') && !composer.classList.contains('tfp-board-add-shell')
    && composer.getBoundingClientRect().width > 56, 'Native list form opens at normal width');
  composer.querySelector('[data-cancel]').click();
  await settle();
  check(composer.classList.contains('tfp-board-add-shell'), 'Cancel restores the narrow add-list button');
  addButton().className = '';
  await settle();
  check(addButton().classList.contains('tfp-board-add'), 'React class updates restore add-list styling');
  lists()[1].querySelector('.tfp-board-tab').click();
  check(open().length === 2 && open().includes(lists()[0]) && open().includes(lists()[1]),
    'Opening a second list keeps the first open');
  check(lists()[1].querySelector('[data-testid="list-card"]').getBoundingClientRect().height > 0,
    'Opening restores native cards');
  check(lists()[0].querySelector('[data-testid="list-card"]').getBoundingClientRect().height > 0,
    'First list stays visible with a second list open');
  lists()[2].querySelector('.tfp-board-tab').click();
  check(open().length === 3 && [0, 1, 2].every(index => open().includes(lists()[index])),
    'Opening a third list keeps the others open');
  lists()[3].querySelector('.tfp-board-tab').click();
  check(open().length === 3 && [1, 2, 3].every(index => open().includes(lists()[index])),
    'Opening a fourth list closes the oldest open list');
  check(lists()[0].querySelector('[data-testid="list-card"]').getBoundingClientRect().height === 0,
    'Oldest list cards are hidden after opening a fourth list');
  const originalOpen = lists()[1];
  const otherOpen = lists()[2];
  const thirdOpen = lists()[3];
  const card = originalOpen.querySelector('[data-testid="list-card"]');
  const transfer = new DataTransfer();
  card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  check(lists().every(list => list.classList.contains('tfp-board-dragging')), 'Native card drag activates rail hit testing');
  const target = lists()[4].querySelector('[data-testid="list-cards"]');
  target.closest('[data-testid="list-wrapper"]').scrollIntoView({ block: 'nearest', inline: 'nearest' });
  const rect = target.getBoundingClientRect();
  const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + 90);
  check(hit === target, 'Closed rail exposes original native drop target');
  const over = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: transfer });
  target.dispatchEvent(over);
  check(over.defaultPrevented, 'Native list accepts dragover');
  check(lists()[4].classList.contains('tfp-board-drop-hover'), 'Closed target has drop feedback');
  target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  card.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: transfer }));
  await settle();
  check(target.contains(card), 'Native drop moves card into empty closed list');
  check(open().length === 3 && [originalOpen, otherOpen, thirdOpen].every(list => open().includes(list)),
    'Dropping preserves all open lists');
  check(lists()[4].querySelector('.tfp-board-count').textContent === '1', 'Destination count updates');
  check(lists()[1].querySelector('.tfp-board-count').textContent === '1', 'Source count updates');
  const replacement = originalOpen.cloneNode(true);
  replacement.querySelector('.tfp-board-tab').remove();
  originalOpen.replaceWith(replacement);
  await settle();
  const kept = () => open().length === 3 && [replacement, otherOpen, thirdOpen].every(list => open().includes(list));
  check(kept(), 'React replacement keeps all selections by list ID');
  lists()[0].className = '';
  await settle();
  check(lists()[0].classList.contains('tfp-board-collapsed'), 'React class updates restore collapsed state');
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('data-testid', 'card-back-name');
  document.body.append(dialog);
  await settle();
  check(open().length === lists().length && lists().every(list => list.querySelector('.tfp-board-tab').hidden),
    'Full-page card dialog preserves native board geometry');
  check(!composer.classList.contains('tfp-board-add-shell'), 'Full-page card preserves native composer geometry');
  dialog.remove();
  await settle();
  check(kept(), 'Closing full-page card restores all selected columns');
  check(composer.classList.contains('tfp-board-add-shell'), 'Closing full-page card restores vertical add-list button');
  const sourceCard = replacement.querySelector('[data-testid="list-card"]');
  sourceCard.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() }));
  lists()[4].querySelector('.tfp-board-tab').click();
  check(kept(), 'Clicks during a drag cannot switch lists');
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  check(lists().every(list => !list.classList.contains('tfp-board-dragging')), 'Escape clears drag state');
  replacement.closest('[data-testid="list-wrapper"]').remove();
  await settle();
  check(open().length === 2 && open().includes(otherOpen) && open().includes(thirdOpen),
    'Removing one open list keeps the others open');
  document.querySelector('#board').replaceChildren();
  await settle();
  populate();
  await settle();
  check(open().length === 1 && open()[0] === lists()[0], 'Board remount resets safely');
  return { passed: results.length, results };
}

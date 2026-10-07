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
  lists()[1].querySelector('.tfp-board-tab').click();
  check(open().length === 2 && open().includes(lists()[0]) && open().includes(lists()[1]),
    'Opening a second list keeps the first open');
  check(lists()[1].querySelector('[data-testid="list-card"]').getBoundingClientRect().height > 0,
    'Opening restores native cards');
  check(lists()[0].querySelector('[data-testid="list-card"]').getBoundingClientRect().height > 0,
    'First list stays visible with a second list open');
  lists()[2].querySelector('.tfp-board-tab').click();
  check(open().length === 2 && open().includes(lists()[1]) && open().includes(lists()[2]),
    'Opening a third list closes the oldest open list');
  check(lists()[0].querySelector('[data-testid="list-card"]').getBoundingClientRect().height === 0,
    'Oldest list cards are hidden after opening a third list');
  const originalOpen = lists()[1];
  const otherOpen = lists()[2];
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
  check(open().length === 2 && open().includes(originalOpen) && open().includes(otherOpen),
    'Dropping preserves both open lists');
  check(lists()[4].querySelector('.tfp-board-count').textContent === '1', 'Destination count updates');
  check(lists()[1].querySelector('.tfp-board-count').textContent === '1', 'Source count updates');
  const replacement = originalOpen.cloneNode(true);
  replacement.querySelector('.tfp-board-tab').remove();
  originalOpen.replaceWith(replacement);
  await settle();
  check(open().includes(replacement) && open().includes(otherOpen) && open().length === 2,
    'React replacement keeps both selections by list ID');
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
  dialog.remove();
  await settle();
  check(open().length === 2 && open().includes(replacement) && open().includes(otherOpen),
    'Closing full-page card restores both selected columns');
  const sourceCard = replacement.querySelector('[data-testid="list-card"]');
  sourceCard.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() }));
  lists()[4].querySelector('.tfp-board-tab').click();
  check(open().length === 2 && open().includes(replacement) && open().includes(otherOpen),
    'Clicks during a drag cannot switch lists');
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  check(lists().every(list => !list.classList.contains('tfp-board-dragging')), 'Escape clears drag state');
  replacement.closest('[data-testid="list-wrapper"]').remove();
  await settle();
  check(open().length === 1 && open()[0] === otherOpen, 'Removing one open list keeps the other open');
  document.querySelector('#board').replaceChildren();
  await settle();
  populate();
  await settle();
  check(open().length === 1 && open()[0] === lists()[0], 'Board remount resets safely');
  return { passed: results.length, results };
}

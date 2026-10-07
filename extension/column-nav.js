(() => {
  const dialogSelector = '[role="dialog"][data-testid="card-back-name"]';
  let scheduled = false;
  let context = null;
  let drag = null;
  let forwarding = false;

  function cardId(href) {
    return new URL(href, location.href).pathname.match(/^\/c\/([^/]+)/)?.[1];
  }

  function cardNumber(href) {
    return new URL(href, location.href).pathname.match(/^\/c\/[^/]+\/(\d+)(?:-|\/?$)/)?.[1];
  }

  function cardSource(card) {
    return [...document.querySelectorAll('[data-testid="list"] [data-testid="card-name"][href]')]
      .find(source => cardId(source.href) === cardId(card.href));
  }

  function cardBadges(item, selector, member = false) {
    const elements = [...item.querySelectorAll(selector)];
    return elements.filter(element => !elements.some(other => other !== element && other.contains(element)))
      .map(element => {
        const image = member && (element.matches('img') ? element : element.querySelector('img'));
        const visual = image || (member && [element, ...element.querySelectorAll('*')].find(node => {
          const style = getComputedStyle(node);
          return style.backgroundImage !== 'none'
            || !['transparent', 'rgba(0, 0, 0, 0)'].includes(style.backgroundColor);
        })) || element.querySelector('[data-testid="avatar"], [role="img"]') || element;
        const style = getComputedStyle(visual);
        const text = element.textContent.trim();
        const named = element.querySelector('[title], [aria-label]');
        const name = element.getAttribute('title') || element.getAttribute('aria-label')
          || image?.alt || visual.getAttribute('title') || visual.getAttribute('aria-label')
          || named?.getAttribute('title') || named?.getAttribute('aria-label') || text;
        const fallback = member && !image && style.backgroundImage === 'none'
          && ['transparent', 'rgba(0, 0, 0, 0)'].includes(style.backgroundColor);
        return {
          text: member ? (image ? '' : text || name.split(/\s+/).slice(0, 2).map(word => word[0]).join('')) : text,
          name,
          src: image ? image.currentSrc || image.src : '',
          color: fallback ? 'var(--ds-text-inverse, #fff)' : style.color,
          background: fallback ? 'var(--ds-background-neutral-bold, #44546f)' : style.backgroundColor,
          backgroundImage: style.backgroundImage,
        };
      });
  }

  function badgeElement(badge, member) {
    const element = document.createElement('span');
    element.className = member ? 'tfp-column-member' : 'tfp-column-label';
    element.title = badge.name;
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', badge.name || (member ? 'Member' : 'Label'));
    element.style.color = member ? '#fff' : badge.color;
    element.style.backgroundColor = badge.background;
    element.style.backgroundImage = badge.backgroundImage;
    if (badge.src) {
      const image = document.createElement('img');
      image.src = badge.src;
      image.alt = '';
      image.draggable = false;
      element.append(image);
    } else {
      element.textContent = badge.text;
    }
    return element;
  }

  function revealCurrent(list) {
    const active = list.querySelector('[aria-current]');
    if (!active || !list.isConnected) return;
    const left = active.getBoundingClientRect().left - list.getBoundingClientRect().left;
    if (left < 0) list.scrollLeft += left;
    else if (left + active.offsetWidth > list.clientWidth) {
      list.scrollLeft += left + active.offsetWidth - list.clientWidth;
    }
  }

  function boardCard(href) {
    return cardSource({ href })?.closest('[data-testid="list-card"]');
  }

  function draggableCard(href) {
    const card = boardCard(href);
    const source = card?.closest('[draggable="true"]') || card?.querySelector('[draggable="true"]');
    return source && source.closest('[data-testid="list"]') === card.closest('[data-testid="list"]')
      && !source.matches('[data-testid="list"]') ? source : null;
  }

  // Let Trello save positions through its own board drag handlers.
  function forwardDrag(type, target, event, after = false) {
    const rect = target.getBoundingClientRect();
    const forwarded = new DragEvent(type, {
      bubbles: true, cancelable: true, dataTransfer: event.dataTransfer,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height * (after ? 0.75 : 0.25),
    });
    forwarding = true;
    try {
      (type === 'dragend' && !target.isConnected ? document : target).dispatchEvent(forwarded);
    } finally {
      forwarding = false;
    }
    return forwarded;
  }

  function clearDropMarker() {
    drag?.nav.querySelectorAll('[data-drop-edge]').forEach(link => {
      delete link.dataset.dropEdge;
    });
  }

  function endDrag(event) {
    if (!drag) return;
    forwardDrag('dragend', drag.source, event || { dataTransfer: drag.dataTransfer });
    clearDropMarker();
    drag.link.classList.remove('tfp-column-dragging');
    drag = null;
    schedule();
  }

  function startDrag(link, event) {
    const source = draggableCard(link.href);
    if (!source || !event.dataTransfer) return false;
    drag = { source, link, nav: link.closest('.tfp-column-nav'), dataTransfer: event.dataTransfer };
    if (forwardDrag('dragstart', source, event).defaultPrevented) {
      endDrag(event);
      return false;
    }
    link.classList.add('tfp-column-dragging');
    return true;
  }

  // Registered before Trello starts its window capture drag lifecycle. Stop
  // the strip events there; forward only board events with board coordinates.
  for (const type of ['dragstart', 'dragenter', 'dragover', 'dragleave', 'drop', 'dragend']) {
    addEventListener(type, event => {
      if (forwarding) return;
      const link = event.target.closest?.('.tfp-column-cards a');
      if (type === 'dragstart') {
        if (!link) return;
        event.stopImmediatePropagation();
        if (!startDrag(link, event)) event.preventDefault();
        return;
      }
      if (!drag) return;
      event.stopImmediatePropagation();
      if (type === 'dragend') return endDrag(event);
      clearDropMarker();
      if (!drag.nav.contains(event.target) || type === 'dragleave') {
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
        if (type === 'drop') endDrag(event);
        return;
      }
      const list = drag.nav.querySelector('ul');
      const links = [...list.querySelectorAll('a')];
      const targetLink = links.find(link => event.clientX < link.getBoundingClientRect().right) || links.at(-1);
      if (!targetLink) return;
      const rect = targetLink.getBoundingClientRect();
      const after = event.clientX > rect.left + rect.width / 2;
      const target = boardCard(targetLink.href);
      if (!target || target.closest('[data-testid="list"]') !== drag.source.closest('[data-testid="list"]')) return;
      if (!forwardDrag('dragover', target, event, after).defaultPrevented) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      targetLink.dataset.dropEdge = after ? 'after' : 'before';
      if (type === 'drop') {
        forwardDrag('drop', target, event, after);
        endDrag(event);
      } else {
        const bounds = list.getBoundingClientRect();
        if (event.clientX < bounds.left + 32) list.scrollLeft -= 24;
        else if (event.clientX > bounds.right - 32) list.scrollLeft += 24;
      }
    }, true);
  }

  const resizeObserver = new ResizeObserver(entries => {
    for (const { target } of entries) revealCurrent(target);
  });
  const observedLists = new Set();

  function update() {
    scheduled = false;
    // Board placeholders and unrelated updates must not replace a drag source.
    if (drag) {
      if (drag.nav.isConnected && drag.source.isConnected && drag.nav.closest(dialogSelector)) return;
      endDrag();
    }
    for (const list of observedLists) {
      if (list.isConnected) continue;
      resizeObserver.unobserve(list);
      observedLists.delete(list);
    }
    const dialogs = document.querySelectorAll(dialogSelector);
    if (!dialogs.length) context = null;
    for (const dialog of dialogs) {
      const layout = dialog.querySelector('main')?.parentElement;
      if (!layout) continue;
      const currentId = cardId(location.href);
      const lists = [...document.querySelectorAll('[data-testid="list"]')];
      const currentColumn = lists.find(list => [...list.querySelectorAll('[data-testid="list-card"]')]
        .some(item => item.getAttribute('data-card-drop-card-id') === currentId
          || [...item.querySelectorAll('[data-testid="card-name"][href]')]
            .some(link => cardId(link.href) === currentId)));
      if (!context || context.currentId !== currentId || !context.column?.isConnected) {
        context = { currentId, column: currentColumn, cards: [] };
      }
      // A move may remove the card before Trello inserts it into the new list.
      if (context.column && !currentColumn) continue;
      const column = context.column;
      const name = column?.querySelector('[data-testid="list-name"]')?.textContent.trim();
      const cards = column ? [...column.querySelectorAll('[data-testid="list-card"]')].map(item => {
        const source = item.querySelector('[data-testid="card-name"][href]');
        const id = item.getAttribute('data-card-drop-card-id');
        const title = source?.textContent.trim()
          || item.querySelector('[data-testid="smart-links-container-layered-link"]')?.textContent.trim();
        const href = source?.href || (id ? `/c/${id}` : '');
        const isCurrent = href && (cardId(href) === currentId || id === currentId);
        const members = cardBadges(item, '[data-testid="card-front-member"], [data-testid="mirror-card-member"], [data-testid="member-avatar"], [data-testid="avatar"]', true);
        const labels = cardBadges(item, '[data-testid="compact-card-label"], [data-testid="card-label"], [data-testid="card-front-label"], .card-label');
        return {
          title, href, id,
          number: cardNumber(href) || (isCurrent ? cardNumber(location.href) : undefined),
          members: isCurrent && !members.length
            ? cardBadges(dialog, '[data-testid="card-back-member-avatar"]', true) : members,
          labels: isCurrent && !labels.length
            ? cardBadges(dialog, '[data-testid="card-back-labels-container"] [data-testid="card-label"]') : labels,
        };
      }).filter(card => card.title && card.href) : [];

      const previousIndex = context.cards.findIndex(card => cardId(card.href) === currentId || card.id === currentId);
      const moved = currentColumn && column !== currentColumn && previousIndex >= 0;
      context.cards = cards;
      if (moved) {
        // Stay in the original list. At its end, select the previous card.
        const next = cards[Math.min(previousIndex, cards.length - 1)];
        if (next) {
          const source = cardSource(next);
          if (source) source.click();
          else location.assign(next.href);
          schedule();
          continue;
        }
      }

      let nav = dialog.querySelector('.tfp-column-nav');
      if (!nav) {
        nav = document.createElement('aside');
        nav.className = 'tfp-column-nav';
        nav.setAttribute('aria-label', 'Cards in this list');
        nav.innerHTML = '<ul class="tfp-column-cards"></ul><p class="tfp-column-empty"></p>';
        nav.addEventListener('wheel', event => {
          if (event.ctrlKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
          const list = nav.querySelector('ul');
          const step = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 20
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? list.clientWidth : 1;
          const next = Math.max(0, Math.min(list.scrollWidth - list.clientWidth,
            list.scrollLeft + event.deltaY * step));
          if (next === list.scrollLeft) return;
          event.preventDefault();
          event.stopPropagation();
          list.scrollLeft = next;
        }, { passive: false });
        const header = dialog.querySelector('header');
        (header || layout).before(nav);
        resizeObserver.observe(nav.querySelector('ul'));
        observedLists.add(nav.querySelector('ul'));
      }

      // Leave the list intact during unrelated edits and activity updates.
      const signature = JSON.stringify([currentId, name, cards.map(({ title, href, number, members, labels }) =>
        [title, href, number, members, labels, !!draggableCard(href)])]);
      if (nav.dataset.signature === signature) continue;
      nav.dataset.signature = signature;
      nav.setAttribute('aria-label', name ? `Cards in ${name}` : 'Cards in this list');
      const empty = nav.querySelector('.tfp-column-empty');
      empty.hidden = cards.length > 0;
      empty.textContent = column ? 'No cards left in this list.'
        : 'Open this card from its board to see the cards in its list. Clear board filters to see all cards.';
      const list = nav.querySelector('ul');
      const focusedHref = list.contains(document.activeElement) ? document.activeElement.href : null;
      list.replaceChildren(...cards.map(card => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = card.href;
        const title = document.createElement('span');
        title.className = 'tfp-column-title';
        title.textContent = card.title;
        title.title = card.title;
        link.append(title);
        if (card.number || card.members.length || card.labels.length) {
          const badges = document.createElement('span');
          badges.className = 'tfp-column-badges';
          badges.append(...card.members.map(member => badgeElement(member, true)),
            ...card.labels.map(label => badgeElement(label, false)));
          if (card.number) {
            const number = document.createElement('span');
            number.className = 'tfp-column-number';
            number.textContent = `#${card.number}`;
            number.title = `Card number ${card.number}`;
            badges.append(number);
          }
          link.append(badges);
        }
        link.dir = 'auto';
        link.draggable = !!draggableCard(card.href);
        if (link.draggable) {
          link.title = 'Drag to reorder in this list. Alt+Shift+Left/Right also moves this card.';
          link.setAttribute('aria-keyshortcuts', 'Alt+Shift+ArrowLeft Alt+Shift+ArrowRight');
          link.addEventListener('keydown', event => {
            if (!event.altKey || !event.shiftKey || !['ArrowLeft', 'ArrowRight'].includes(event.key) || drag) return;
            event.preventDefault();
            const after = event.key === 'ArrowRight';
            const neighbor = item[after ? 'nextElementSibling' : 'previousElementSibling']?.querySelector('a');
            const target = neighbor && boardCard(neighbor.href);
            if (!target) return;
            const input = { dataTransfer: new DataTransfer() };
            if (!startDrag(link, input)) return;
            if (forwardDrag('dragover', target, input, after).defaultPrevented) {
              forwardDrag('drop', target, input, after);
            }
            endDrag(input);
          });
        }
        if (cardId(card.href) === currentId || card.id === currentId) link.setAttribute('aria-current', 'page');
        link.addEventListener('click', event => {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          const source = cardSource(card);
          if (link.hasAttribute('aria-current')) {
            event.preventDefault();
          } else if (source) {
            // Let Trello's router and edit handling own the card transition.
            event.preventDefault();
            source.click();
          }
        });
        item.append(link);
        return item;
      }));
      const active = list.querySelector('[aria-current]');
      if (focusedHref) {
        const focused = [...list.querySelectorAll('a')].find(link => link.href === focusedHref);
        (focused || active)?.focus({ preventScroll: true });
      }
      requestAnimationFrame(() => revealCurrent(list));
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  new MutationObserver(records => {
    if (records.some(record => !(record.target.nodeType === Node.ELEMENT_NODE
      ? record.target : record.target.parentElement)?.closest('.tfp-column-nav'))) schedule();
  }).observe(document.body, {
    childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['href', 'data-testid', 'data-card-drop-list-id', 'draggable',
      'src', 'srcset', 'alt', 'title', 'aria-label', 'style', 'class', 'data-color']
  });
  addEventListener('popstate', schedule);
  update();
})();

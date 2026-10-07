(() => {
  const viewers = new Map();

  function enhance(viewer, image) {
    const stage = viewer.parentElement;
    const originalStyle = image.getAttribute('style');
    const originalTitle = viewer.getAttribute('title');
    const events = new AbortController();
    const options = { capture: true, signal: events.signal };
    let width = 0, height = 0, scale = 1, x = 0, y = 0, pointer = null;

    stage.classList.add('tfp-image-stage');
    viewer.classList.add('tfp-image-viewer');
    viewer.title = 'Scroll to zoom · Drag to pan · Double-click or press 0 to fit';

    function render() {
      image.style.setProperty('width', `${width}px`, 'important');
      image.style.setProperty('height', `${height}px`, 'important');
      image.style.setProperty('transform', `translate(${x}px, ${y}px) scale(${scale})`, 'important');
    }

    function fit() {
      if (!image.naturalWidth || !image.naturalHeight) return;
      // Reserve room for Trello's close button and attachment information.
      const ratio = Math.min(1, Math.max(1, stage.clientWidth - 32) / image.naturalWidth,
        Math.max(1, stage.clientHeight - 140) / image.naturalHeight);
      width = image.naturalWidth * ratio;
      height = image.naturalHeight * ratio;
      scale = 1;
      x = (stage.clientWidth - width) / 2;
      y = 60 + (Math.max(1, stage.clientHeight - 140) - height) / 2;
      render();
    }

    function zoom(next, clientX, clientY) {
      if (!width) return;
      const rect = stage.getBoundingClientRect();
      const px = clientX - rect.left, py = clientY - rect.top;
      next = Math.min(16, Math.max(0.25, next));
      const ratio = next / scale;
      x = px - (px - x) * ratio;
      y = py - (py - y) * ratio;
      scale = next;
      render();
    }

    viewer.addEventListener('wheel', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
      const delta = Math.max(-240, Math.min(240, event.deltaY * unit));
      zoom(scale * Math.exp(-delta * 0.003), event.clientX, event.clientY);
    }, { ...options, passive: false });

    viewer.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointer) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      viewer.setPointerCapture(event.pointerId);
      viewer.focus({ preventScroll: true });
      viewer.classList.add('tfp-image-dragging');
    }, options);

    viewer.addEventListener('pointermove', event => {
      if (event.pointerId !== pointer?.id) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      x += event.clientX - pointer.x;
      y += event.clientY - pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      render();
    }, options);

    function end(event) {
      if (event.pointerId !== pointer?.id) return;
      pointer = null;
      viewer.classList.remove('tfp-image-dragging');
      if (viewer.hasPointerCapture(event.pointerId)) viewer.releasePointerCapture(event.pointerId);
    }
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      viewer.addEventListener(name, end, options);
    }
    // Prevent Trello's native click zoom from competing with the canvas transform.
    viewer.addEventListener('click', event => event.stopImmediatePropagation(), options);
    viewer.addEventListener('dblclick', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      fit();
    }, options);
    viewer.addEventListener('keydown', event => {
      if (!['+', '=', '-', '0', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (['0', 'Enter', ' '].includes(event.key)) fit();
      else {
        const rect = stage.getBoundingClientRect();
        zoom(scale * (event.key === '-' ? 1 / 1.25 : 1.25),
          rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    }, options);
    image.addEventListener('dragstart', event => event.preventDefault(), options);
    image.addEventListener('load', fit, { signal: events.signal });
    window.addEventListener('resize', fit, { signal: events.signal });
    fit();

    return { image, dispose() {
      events.abort();
      stage.classList.remove('tfp-image-stage');
      viewer.classList.remove('tfp-image-viewer', 'tfp-image-dragging');
      if (originalStyle === null) image.removeAttribute('style');
      else image.setAttribute('style', originalStyle);
      if (originalTitle === null) viewer.removeAttribute('title');
      else viewer.setAttribute('title', originalTitle);
    } };
  }

  function update() {
    for (const [viewer, state] of viewers) {
      if (!viewer.isConnected || viewer.querySelector('img') !== state.image) {
        state.dispose();
        viewers.delete(viewer);
      }
    }
    for (const viewer of document.querySelectorAll('[data-testid="image-viewer"]')) {
      const image = viewer.querySelector('img');
      if (image && !viewers.has(viewer)) viewers.set(viewer, enhance(viewer, image));
    }
  }

  const observer = new MutationObserver(update);
  observer.observe(document.body, { childList: true, subtree: true });
  update();
})();

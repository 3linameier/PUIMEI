/* PUIMEI mööbel — image lightbox with per-item gallery.
   Any element with class "gallery-open" and a data-images JSON array
   opens a full-size viewer; multiple images show prev/next + thumbnails. */
(function () {
  var overlay, imgEl, thumbsEl, counterEl, prevBtn, nextBtn, closeBtn;
  var currentImages = [];
  var currentIndex = 0;
  var lastFocused = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    var closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
    var chevron = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="14 5 8 12 14 19"/></svg>';
    overlay.innerHTML =
      '<div class="lightbox-backdrop"></div>' +
      '<div class="lightbox-body">' +
        '<figure class="lightbox-figure">' +
          '<div class="lightbox-stage">' +
            '<img class="lightbox-img" alt="">' +
            '<button type="button" class="lightbox-close" aria-label="Sulge">' + closeIcon + '</button>' +
            '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Eelmine pilt">' + chevron + '</button>' +
            '<button type="button" class="lightbox-nav lightbox-next" aria-label="Järgmine pilt">' + chevron + '</button>' +
          '</div>' +
          '<figcaption class="lightbox-caption"><span class="lightbox-counter"></span></figcaption>' +
        '</figure>' +
        '<div class="lightbox-thumbs"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var bodyEl = overlay.querySelector('.lightbox-body');
    imgEl = overlay.querySelector('.lightbox-img');
    thumbsEl = overlay.querySelector('.lightbox-thumbs');
    counterEl = overlay.querySelector('.lightbox-counter');
    prevBtn = overlay.querySelector('.lightbox-prev');
    nextBtn = overlay.querySelector('.lightbox-next');
    closeBtn = overlay.querySelector('.lightbox-close');

    overlay.querySelector('.lightbox-backdrop').addEventListener('click', close);
    bodyEl.addEventListener('click', function (e) { if (e.target === bodyEl) close(); });
    overlay.querySelector('.lightbox-figure').addEventListener('click', function (e) { if (e.target === e.currentTarget) close(); });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(currentIndex - 1); });
    nextBtn.addEventListener('click', function () { show(currentIndex + 1); });
    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(currentIndex - 1);
      else if (e.key === 'ArrowRight') show(currentIndex + 1);
    });
  }

  function show(index) {
    var len = currentImages.length;
    currentIndex = (index + len) % len;
    var item = currentImages[currentIndex];
    imgEl.src = item.src;
    imgEl.alt = item.alt || '';
    counterEl.textContent = len > 1 ? (currentIndex + 1) + ' / ' + len : '';
    var multi = len > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
    thumbsEl.hidden = !multi;
    var thumbBtns = thumbsEl.querySelectorAll('.lightbox-thumb');
    for (var i = 0; i < thumbBtns.length; i++) {
      thumbBtns[i].classList.toggle('active', i === currentIndex);
    }
  }

  function open(images, startIndex) {
    if (!overlay) build();
    currentImages = images;
    thumbsEl.innerHTML = '';
    if (images.length > 1) {
      images.forEach(function (item, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'lightbox-thumb';
        b.setAttribute('aria-label', (i + 1) + '. pilt');
        var t = document.createElement('img');
        t.src = item.src;
        t.alt = '';
        b.appendChild(t);
        b.addEventListener('click', function () { show(i); });
        thumbsEl.appendChild(b);
      });
    }
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('lightbox-open');
    show(startIndex || 0);
    closeBtn.focus();
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove('lightbox-open');
    imgEl.src = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var triggers = document.querySelectorAll('.gallery-open');
    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var raw = trigger.getAttribute('data-images');
        var paths = [];
        try { paths = JSON.parse(raw); } catch (e) { paths = []; }
        if (!paths.length) return;
        var pic = trigger.querySelector('img');
        var alt = pic ? pic.alt : '';
        var images = paths.map(function (src) { return { src: src, alt: alt }; });
        open(images, 0);
      });
    });
  });
})();

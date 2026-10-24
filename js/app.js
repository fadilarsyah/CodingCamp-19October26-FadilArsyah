'use strict';

/* ============================================================
   THEME TOGGLE  (dark / light)
   ============================================================ */
(function initTheme() {
  const btn   = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('ft_theme') || 'light';
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('ft_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('ft_theme', 'dark');
    }
  });
})();


/* ============================================================
   1. GREETING & CLOCK
   ============================================================ */
(function initGreeting() {
  const timeEl   = document.getElementById('current-time');
  const ampmEl   = document.getElementById('clock-ampm');
  const dateEl   = document.getElementById('current-date');
  const prefixEl = document.getElementById('greeting-prefix');
  const nameEl   = document.getElementById('greeting-name');
  const nameBtn  = document.getElementById('greeting-name-btn');
  const fmtBtn   = document.getElementById('time-format-toggle');

  // Format toggle: 12H / 24H
  let use24h = localStorage.getItem('ft_24h') === 'true';
  fmtBtn.textContent = use24h ? '24H' : '12H';
  fmtBtn.addEventListener('click', () => {
    use24h = !use24h;
    localStorage.setItem('ft_24h', use24h);
    fmtBtn.textContent = use24h ? '24H' : '12H';
    tick();
  });

  // Editable name
  const savedName = localStorage.getItem('ft_name') || 'Friend';
  nameEl.textContent = savedName;

  nameBtn.addEventListener('click', openNameModal);

  function getGreetingPrefix(hour) {
    if (hour >= 5  && hour < 12) return 'Good morning,';
    if (hour >= 12 && hour < 17) return 'Good afternoon,';
    if (hour >= 17 && hour < 21) return 'Good evening,';
    return 'Good night,';
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  function tick() {
    const now  = new Date();
    const hour = now.getHours();

    if (use24h) {
      timeEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
      ampmEl.textContent = '';
    } else {
      const t = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      });
      const parts = t.split(' ');       // e.g. ["12:25:36", "PM"]
      timeEl.textContent = parts[0];
      ampmEl.textContent = parts[1] || '';
    }

    dateEl.textContent   = formatDate(now);
    prefixEl.textContent = getGreetingPrefix(hour);
    nameEl.textContent   = localStorage.getItem('ft_name') || 'Friend';
  }

  tick();
  setInterval(tick, 1000);

  /* ---- name modal ---- */
  const overlayEl   = document.getElementById('name-modal-overlay');
  const nameInput   = document.getElementById('name-input');
  const nameSaveBtn = document.getElementById('name-save-btn');
  const nameCancel  = document.getElementById('name-cancel-btn');

  function openNameModal() {
    nameInput.value = localStorage.getItem('ft_name') || 'Friend';
    overlayEl.classList.add('visible');
    nameInput.focus();
    nameInput.select();
  }

  nameSaveBtn.addEventListener('click', () => {
    const v = nameInput.value.trim();
    if (v) { localStorage.setItem('ft_name', v); nameEl.textContent = v; }
    overlayEl.classList.remove('visible');
  });

  nameCancel.addEventListener('click', () => overlayEl.classList.remove('visible'));

  overlayEl.addEventListener('click', e => {
    if (e.target === overlayEl) overlayEl.classList.remove('visible');
  });

  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  nameSaveBtn.click();
    if (e.key === 'Escape') nameCancel.click();
  });
})();


/* ============================================================
   2. FOCUS TIMER
   ============================================================ */
(function initTimer() {
  const CIRCUMFERENCE = 2 * Math.PI * 88; // 552.92…

  const displayEl   = document.getElementById('timer-display');
  const labelEl     = document.getElementById('timer-label');
  const ringEl      = document.getElementById('timer-progress-ring');
  const startBtn    = document.getElementById('timer-start');
  const stopBtn     = document.getElementById('timer-stop');
  const resetBtn    = document.getElementById('timer-reset');
  const sessionsEl  = document.getElementById('sessions-count');
  const soundToggle = document.getElementById('sound-toggle-btn');
  const soundIcon   = document.getElementById('sound-icon');
  const tabs        = document.querySelectorAll('.timer-tab');

  let totalSeconds  = 25 * 60;
  let secondsLeft   = totalSeconds;
  let intervalId    = null;
  let running       = false;
  let sessions      = parseInt(localStorage.getItem('ft_sessions') || '0', 10);
  let soundOn       = localStorage.getItem('ft_sound') !== 'false';

  sessionsEl.textContent = sessions;
  updateSoundUI();

  /* ---- ring helper ---- */
  function setRing(fraction) {
    // fraction 1 = full ring, 0 = empty
    const offset = CIRCUMFERENCE * (1 - fraction);
    ringEl.style.strokeDashoffset = offset;
  }

  /* ---- render ---- */
  function render() {
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(secondsLeft % 60).padStart(2, '0');
    displayEl.textContent = `${m}:${s}`;
    setRing(secondsLeft / totalSeconds);
  }

  function setLabel(txt) { labelEl.textContent = txt; }

  function syncButtons() {
    startBtn.disabled = running || secondsLeft === 0;
    stopBtn.disabled  = !running;
  }

  /* ---- session tabs ---- */
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (running) return;           // don't switch mid-session
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      totalSeconds = parseInt(tab.dataset.minutes, 10) * 60;
      secondsLeft  = totalSeconds;
      ringEl.classList.remove('done');
      setLabel('READY');
      render();
      syncButtons();
    });
  });

  /* ---- finish ---- */
  function finish() {
    clearInterval(intervalId);
    running = false;
    ringEl.classList.add('done');
    setLabel('DONE!');
    sessions++;
    localStorage.setItem('ft_sessions', sessions);
    sessionsEl.textContent = sessions;
    if (soundOn) playBeep();
    syncButtons();
  }

  /* ---- beep (Web Audio API) ---- */
  function playBeep() {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch { /* audio not available */ }
  }

  /* ---- sound toggle ---- */
  function updateSoundUI() {
    soundToggle.lastChild.textContent = soundOn ? ' Sound On' : ' Sound Off';
    // mute/unmute icon
    const mutePath = soundIcon.querySelector('path:last-child');
    if (mutePath) mutePath.style.opacity = soundOn ? '1' : '0.3';
  }

  soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    localStorage.setItem('ft_sound', soundOn);
    updateSoundUI();
  });
  soundToggle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') soundToggle.click(); });

  /* ---- controls ---- */
  startBtn.addEventListener('click', () => {
    if (running || secondsLeft <= 0) return;
    running = true;
    ringEl.classList.remove('done');
    setLabel('RUNNING');
    syncButtons();
    intervalId = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        secondsLeft = 0;
        render();
        finish();
      } else {
        render();
      }
    }, 1000);
  });

  stopBtn.addEventListener('click', () => {
    if (!running) return;
    clearInterval(intervalId);
    running = false;
    setLabel('PAUSED');
    syncButtons();
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    running      = false;
    secondsLeft  = totalSeconds;
    ringEl.classList.remove('done');
    setLabel('READY');
    render();
    syncButtons();
  });

  /* ---- init ---- */
  setRing(1);
  render();
  syncButtons();
})();


/* ============================================================
   3. TO-DO LIST
   ============================================================ */
(function initTodo() {
  const STORAGE_KEY = 'dashboard_todos';

  const formEl         = document.getElementById('todo-form');
  const inputEl        = document.getElementById('todo-input');
  const listEl         = document.getElementById('todo-list');
  const countEl        = document.getElementById('todo-count');
  const clearDoneBtn   = document.getElementById('clear-done-btn');
  const filterBtns     = document.querySelectorAll('.todo-tab');
  const overlayEl      = document.getElementById('modal-overlay');
  const modalInputEl   = document.getElementById('modal-input');
  const modalSaveBtn   = document.getElementById('modal-save');
  const modalCancelBtn = document.getElementById('modal-cancel');

  let todos     = load();
  let editingId = null;
  let filter    = 'all'; // 'all' | 'active' | 'done'

  /* ---- persistence ---- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }

  /* ---- mutations ---- */
  function addTodo(text) {
    todos.push({ id: Date.now(), text: text.trim(), done: false });
    save(); render();
  }

  function toggleTodo(id) {
    const t = todos.find(t => t.id === id);
    if (t) { t.done = !t.done; save(); render(); }
  }

  function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    save(); render();
  }

  function updateTodo(id, newText) {
    const t = todos.find(t => t.id === id);
    if (t && newText.trim()) { t.text = newText.trim(); save(); render(); }
  }

  /* ---- render ---- */
  function render() {
    listEl.innerHTML = '';

    const visible = todos.filter(t =>
      filter === 'all'    ? true :
      filter === 'active' ? !t.done :
      t.done
    );

    if (visible.length === 0) {
      const p = document.createElement('p');
      p.style.cssText = 'color:var(--text-muted);font-size:.85rem;text-align:center;padding:1.2rem 0';
      p.textContent = filter === 'done' ? 'No completed tasks.' : 'No tasks here!';
      listEl.appendChild(p);
    } else {
      visible.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.done ? ' done' : '');

        const cb = document.createElement('input');
        cb.type      = 'checkbox';
        cb.className = 'todo-checkbox';
        cb.checked   = todo.done;
        cb.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.done ? 'incomplete' : 'complete'}`);
        cb.addEventListener('change', () => toggleTodo(todo.id));

        const span = document.createElement('span');
        span.className   = 'todo-text';
        span.textContent = todo.text;

        const actions = document.createElement('div');
        actions.className = 'todo-actions';

        const editBtn = document.createElement('button');
        editBtn.className   = 'btn-icon';
        editBtn.textContent = '✏️';
        editBtn.setAttribute('aria-label', `Edit: ${todo.text}`);
        editBtn.addEventListener('click', () => openModal(todo.id, todo.text));

        const delBtn = document.createElement('button');
        delBtn.className   = 'btn-icon';
        delBtn.textContent = '🗑️';
        delBtn.setAttribute('aria-label', `Delete: ${todo.text}`);
        delBtn.addEventListener('click', () => deleteTodo(todo.id));

        actions.append(editBtn, delBtn);
        li.append(cb, span, actions);
        listEl.appendChild(li);
      });
    }

    // count
    const remaining = todos.filter(t => !t.done).length;
    countEl.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} remaining`;
  }

  /* ---- filter tabs ---- */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      render();
    });
  });

  /* ---- clear done ---- */
  clearDoneBtn.addEventListener('click', () => {
    todos = todos.filter(t => !t.done);
    save(); render();
  });

  /* ---- edit modal ---- */
  function openModal(id, text) {
    editingId          = id;
    modalInputEl.value = text;
    overlayEl.classList.add('visible');
    modalInputEl.focus();
    modalInputEl.select();
  }

  function closeModal() { overlayEl.classList.remove('visible'); editingId = null; }

  modalSaveBtn.addEventListener('click', () => {
    if (editingId !== null) updateTodo(editingId, modalInputEl.value);
    closeModal();
  });
  modalCancelBtn.addEventListener('click', closeModal);
  overlayEl.addEventListener('click', e => { if (e.target === overlayEl) closeModal(); });
  modalInputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter')  modalSaveBtn.click();
    if (e.key === 'Escape') closeModal();
  });

  /* ---- form submit ---- */
  formEl.addEventListener('submit', e => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    addTodo(text);
    inputEl.value = '';
    inputEl.focus();
  });

  render();
})();


/* ============================================================
   4. QUICK LINKS
   ============================================================ */
(function initLinks() {
  const STORAGE_KEY = 'dashboard_links';

  const gridEl          = document.getElementById('links-grid');
  const addHeaderBtn    = document.getElementById('add-link-header-btn');
  const linkOverlayEl   = document.getElementById('link-modal-overlay');
  const linkNameInput   = document.getElementById('link-name');
  const linkUrlInput    = document.getElementById('link-url');
  const linkSaveBtn     = document.getElementById('link-save-btn');
  const linkCancelBtn   = document.getElementById('link-cancel-btn');

  let links = load();

  /* ---- persistence ---- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)); }

  /* ---- mutations ---- */
  function addLink(name, url) {
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    links.push({ id: Date.now(), name: name.trim(), url });
    save(); render();
  }

  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    save(); render();
  }

  /* ---- render ---- */
  function render() {
    gridEl.innerHTML = '';

    links.forEach(link => {
      const card = document.createElement('a');
      card.href      = link.url;
      card.target    = '_blank';
      card.rel       = 'noopener noreferrer';
      card.className = 'link-card';

      // favicon
      const img = document.createElement('img');
      img.className = 'link-card-favicon';
      img.alt       = '';
      try {
        const origin = new URL(link.url).origin;
        img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=32`;
      } catch { img.style.display = 'none'; }
      img.onerror = () => { img.style.display = 'none'; };

      // label
      const lbl = document.createElement('span');
      lbl.className   = 'link-card-label';
      lbl.textContent = link.name;

      // delete button
      const del = document.createElement('button');
      del.className   = 'link-card-delete';
      del.textContent = '✕';
      del.setAttribute('aria-label', `Remove ${link.name}`);
      del.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        deleteLink(link.id);
      });

      card.append(img, lbl, del);
      gridEl.appendChild(card);
    });

    // "Add Link" placeholder card
    const addCard = document.createElement('div');
    addCard.className = 'link-card-add';
    addCard.setAttribute('role', 'button');
    addCard.setAttribute('tabindex', '0');
    addCard.setAttribute('aria-label', 'Add new link');

    const plus = document.createElement('span');
    plus.className   = 'link-card-add-icon';
    plus.textContent = '+';

    const addLbl = document.createElement('span');
    addLbl.textContent = 'Add Link';

    addCard.append(plus, addLbl);
    addCard.addEventListener('click', openLinkModal);
    addCard.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openLinkModal(); });
    gridEl.appendChild(addCard);
  }

  /* ---- modal ---- */
  function openLinkModal() {
    linkNameInput.value = '';
    linkUrlInput.value  = '';
    linkOverlayEl.classList.add('visible');
    linkNameInput.focus();
  }

  function closeLinkModal() { linkOverlayEl.classList.remove('visible'); }

  addHeaderBtn.addEventListener('click', openLinkModal);

  linkSaveBtn.addEventListener('click', () => {
    const name = linkNameInput.value.trim();
    const url  = linkUrlInput.value.trim();
    if (!name || !url) return;
    addLink(name, url);
    closeLinkModal();
  });

  linkCancelBtn.addEventListener('click', closeLinkModal);
  linkOverlayEl.addEventListener('click', e => { if (e.target === linkOverlayEl) closeLinkModal(); });

  linkUrlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  linkSaveBtn.click();
    if (e.key === 'Escape') closeLinkModal();
  });

  render();
})();

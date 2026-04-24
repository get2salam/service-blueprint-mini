const CONFIG = {
  slug: 'service-blueprint-mini',
  title: 'Service Blueprint Mini',
  boardTitle: 'Service blueprint',
  boardSubtitle: 'A compact board for shaping better delivery and handoffs.',
  categories: ['Intake', 'Delivery', 'Review', 'Expansion'],
  states: ['Fragile', 'Improving', 'Reliable', 'Signature'],
  items: [
    {
      title: 'Fast discovery intake',
      category: 'Intake',
      state: 'Reliable',
      score: 9,
      effort: 2,
      health: 8,
      ttv: 30,
      owner: 'Founder',
      handoff: 'Discovery call -> scoped summary',
      note: 'A stronger intake reduces confusion everywhere else.',
    },
    {
      title: 'Mid-project visibility update',
      category: 'Delivery',
      state: 'Improving',
      score: 8,
      effort: 3,
      health: 6,
      ttv: 45,
      owner: 'Project lead',
      handoff: 'Weekly async update -> client reply',
      note: 'Clients relax when they can see progress without needing to chase.',
    },
    {
      title: 'Expansion checkpoint',
      category: 'Expansion',
      state: 'Fragile',
      score: 6,
      effort: 2,
      health: 4,
      ttv: 20,
      owner: 'Founder',
      handoff: 'Outcome recap -> next-scope offer',
      note: 'Still too easy to miss the moment when extra help would feel natural.',
    },
  ],
};

const STORAGE_KEY = `${CONFIG.slug}/state/v2`;
const NUMBER_FIELDS = new Set(['score', 'effort', 'health', 'ttv']);
const refs = {
  boardTitle: document.querySelector('[data-role="board-title"]'),
  boardSubtitle: document.querySelector('[data-role="board-subtitle"]'),
  stats: document.querySelector('[data-role="stats"]'),
  insights: document.querySelector('[data-role="insights"]'),
  count: document.querySelector('[data-role="count"]'),
  list: document.querySelector('[data-role="list"]'),
  editor: document.querySelector('[data-role="editor"]'),
  secondaryPrimary: document.querySelector('[data-role="secondary-primary"]'),
  secondarySecondary: document.querySelector('[data-role="secondary-secondary"]'),
  search: document.querySelector('[data-field="search"]'),
  category: document.querySelector('[data-field="category"]'),
  status: document.querySelector('[data-field="status"]'),
  importFile: document.querySelector('#import-file'),
};

const toastHost = (() => {
  const host = document.createElement('div');
  host.className = 'toast-host';
  document.body.appendChild(host);
  return host;
})();

function showToast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  toastHost.appendChild(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));
  setTimeout(() => {
    node.classList.remove('is-visible');
    setTimeout(() => node.remove(), 200);
  }, 2200);
}

function uid() {
  return `${CONFIG.slug}_${Math.random().toString(36).slice(2, 10)}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function normalize(item = {}) {
  return {
    id: item.id || uid(),
    title: item.title || 'New stage',
    category: CONFIG.categories.includes(item.category) ? item.category : CONFIG.categories[0],
    state: CONFIG.states.includes(item.state) ? item.state : CONFIG.states[0],
    score: Number(item.score ?? 7),
    effort: Number(item.effort ?? 3),
    health: Number(item.health ?? 5),
    ttv: Number(item.ttv ?? 30),
    owner: item.owner || 'Owner',
    handoff: item.handoff || 'Current handoff or transition',
    note: item.note || 'Capture what makes this stage strong or fragile.',
  };
}

function priority(item) {
  const stateBoost = item.state === 'Fragile' ? 12 : item.state === 'Improving' ? 8 : item.state === 'Reliable' ? 4 : 2;
  return item.score * 6 + (11 - item.health) * 4 + stateBoost + Math.max(0, 60 - item.ttv) / 4 - item.effort * 4;
}

function seedState() {
  return {
    boardTitle: CONFIG.boardTitle,
    boardSubtitle: CONFIG.boardSubtitle,
    items: CONFIG.items.map((item) => normalize(item)),
    ui: { search: '', category: 'all', status: 'all', selectedId: null },
  };
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    return {
      ...seedState(),
      ...parsed,
      items: (parsed.items || []).map((item) => normalize(item)),
      ui: { ...seedState().ui, ...(parsed.ui || {}) },
    };
  } catch (error) {
    console.warn('Falling back to seed state', error);
    return seedState();
  }
}

let state = hydrate();
if (!state.ui.selectedId && state.items[0]) state.ui.selectedId = state.items[0].id;

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function filteredItems() {
  const query = state.ui.search.trim().toLowerCase();
  return [...state.items]
    .filter((item) => state.ui.category === 'all' || item.category === state.ui.category)
    .filter((item) => state.ui.status === 'all' || item.state === state.ui.status)
    .filter((item) => !query || `${item.title} ${item.note} ${item.category} ${item.state} ${item.owner} ${item.handoff}`.toLowerCase().includes(query))
    .sort((a, b) => priority(b) - priority(a) || a.ttv - b.ttv);
}

function selectedItem() {
  return state.items.find((item) => item.id === state.ui.selectedId) || filteredItems()[0] || null;
}

function commit(nextState) {
  state = nextState;
  if (!state.ui.selectedId && state.items[0]) state.ui.selectedId = state.items[0].id;
  persist();
  render();
}

function updateSelected(field, value) {
  const target = selectedItem();
  if (!target) return;
  commit({
    ...state,
    items: state.items.map((item) => item.id === target.id ? { ...item, [field]: NUMBER_FIELDS.has(field) ? Number(value) : value } : item),
  });
}

function addItem() {
  const item = normalize({ title: 'New stage', owner: 'Owner', handoff: 'Stage handoff' });
  commit({
    ...state,
    items: [item, ...state.items],
    ui: { ...state.ui, selectedId: item.id },
  });
  showToast('Added a new service stage.');
}

function removeSelected() {
  const target = selectedItem();
  if (!target) return;
  const nextItems = state.items.filter((item) => item.id !== target.id);
  commit({
    ...state,
    items: nextItems,
    ui: { ...state.ui, selectedId: nextItems[0]?.id || null },
  });
  showToast('Removed service stage.');
}

function exportState() {
  const blob = new Blob([JSON.stringify({ schema: `${CONFIG.slug}/v2`, ...state }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${CONFIG.slug}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Downloaded backup.');
}

async function importState(file) {
  const raw = await file.text();
  const parsed = JSON.parse(raw);
  commit({
    ...seedState(),
    ...parsed,
    items: (parsed.items || []).map((item) => normalize(item)),
    ui: { ...seedState().ui, ...(parsed.ui || {}) },
  });
  showToast('Imported backup.');
}

function markReliable() {
  const target = selectedItem();
  if (!target) return;
  commit({
    ...state,
    items: state.items.map((item) => item.id === target.id ? { ...item, state: 'Reliable', health: Math.max(item.health, 7) } : item),
  });
  showToast('Marked this stage reliable.');
}

function strengthenHandoff() {
  const target = selectedItem();
  if (!target) return;
  commit({
    ...state,
    items: state.items.map((item) => item.id === target.id ? {
      ...item,
      health: Math.min(10, item.health + 1),
      state: item.state === 'Fragile' ? 'Improving' : item.state,
      effort: Math.max(1, item.effort - 1),
    } : item),
  });
  showToast('Improved this handoff step.');
}

function raiseRedFlag() {
  const target = selectedItem();
  if (!target) return;
  commit({
    ...state,
    items: state.items.map((item) => item.id === target.id ? { ...item, state: 'Fragile', health: Math.max(1, item.health - 2) } : item),
  });
  showToast('Flagged this stage as fragile.');
}

function toneForHealth(item) {
  if (item.health <= 4) return 'danger';
  if (item.health <= 7) return 'warn';
  return 'success';
}

function renderStats(items) {
  const fragile = state.items.filter((item) => item.state === 'Fragile').length;
  const avgHealth = state.items.length ? (state.items.reduce((sum, item) => sum + item.health, 0) / state.items.length).toFixed(1) : '0.0';
  const avgTtv = state.items.length ? Math.round(state.items.reduce((sum, item) => sum + item.ttv, 0) / state.items.length) : 0;
  const signature = state.items.filter((item) => item.state === 'Signature').length;
  const cards = [
    ['Stages', String(state.items.length), 'delivery stages in this blueprint'],
    ['Fragile', String(fragile), 'places where quality could wobble'],
    ['Average health', avgHealth, `${signature} signature stages`],
    ['Avg. time-to-value', `${avgTtv} min`, 'how quickly the client feels progress'],
  ];
  refs.stats.innerHTML = cards.map(([label, valueText, note]) => `
    <article class="card stat">
      <span>${label}</span>
      <strong>${valueText}</strong>
      <small>${note}</small>
    </article>
  `).join('');
  refs.count.textContent = items[0] ? `Top: ${items[0].title}` : 'No stages';
}

function renderInsights(items) {
  const weakest = [...state.items].sort((a, b) => a.health - b.health)[0];
  const fastest = [...state.items].sort((a, b) => a.ttv - b.ttv)[0];
  const strongest = items[0];
  const cards = [
    {
      label: 'Most urgent weak point',
      title: weakest?.title || 'No stage yet',
      body: weakest ? `${weakest.health}/10 health with owner ${weakest.owner}.` : 'Add a service stage to reveal weak points.',
    },
    {
      label: 'Fastest value moment',
      title: fastest?.title || 'No stage yet',
      body: fastest ? `${fastest.ttv} minutes to value via ${fastest.handoff}.` : 'Time-to-value surfaces here once stages exist.',
    },
    {
      label: 'Highest leverage fix',
      title: strongest?.title || 'No stage yet',
      body: strongest ? `Priority ${priority(strongest)} with state ${strongest.state}.` : 'The strongest stage fix will appear here.',
    },
  ];
  refs.insights.innerHTML = cards.map((card) => `
    <article class="card insight-card">
      <p class="eyebrow">${card.label}</p>
      <h3>${card.title}</h3>
      <p>${card.body}</p>
    </article>
  `).join('');
}

function renderList(items) {
  if (!items.length) {
    refs.list.innerHTML = `
      <div class="empty">
        <strong>No service stages yet</strong>
        <p>Add the stages your clients move through and tighten the weak spots.</p>
      </div>
    `;
    return;
  }

  refs.list.innerHTML = items.map((item) => `
    <button class="item ${item.id === state.ui.selectedId ? 'is-selected' : ''}" type="button" data-id="${item.id}">
      <div class="item-top">
        <strong>${item.title}</strong>
        <span class="score">${priority(item)}</span>
      </div>
      <p>${item.handoff}</p>
      <div class="badge-row">
        <span class="pill ${toneForHealth(item)}">Health ${item.health}/10</span>
        <span class="pill">${item.ttv} min</span>
        <span class="pill">${item.owner}</span>
      </div>
      <div class="meta">
        <span>${item.category}</span>
        <span>${item.state}</span>
        <span>Leverage ${item.score}/10</span>
        <span>Friction ${item.effort}/10</span>
      </div>
    </button>
  `).join('');
}

function renderEditor(item) {
  if (!item) {
    refs.editor.innerHTML = `
      <div class="empty">
        <strong>No selection</strong>
        <p>Pick a service stage or create a new one.</p>
      </div>
    `;
    return;
  }

  refs.editor.innerHTML = `
    <div class="editor-head">
      <div>
        <p class="eyebrow">Stage editor</p>
        <h3>${item.title}</h3>
      </div>
      <span class="score">Priority ${priority(item)}</span>
    </div>
    <div class="editor-grid">
      <label class="field">
        <span>Stage title</span>
        <input type="text" data-item-field="title" value="${escapeHtml(item.title)}" />
      </label>
      <label class="field">
        <span>Owner</span>
        <input type="text" data-item-field="owner" value="${escapeHtml(item.owner)}" />
      </label>
      <label class="field">
        <span>Handoff</span>
        <input type="text" data-item-field="handoff" value="${escapeHtml(item.handoff)}" />
      </label>
      <label class="field">
        <span>Stage note</span>
        <textarea data-item-field="note">${escapeHtml(item.note)}</textarea>
      </label>
      <div class="field-grid">
        <label class="field">
          <span>Type</span>
          <select data-item-field="category">${CONFIG.categories.map((entry) => `<option value="${entry}" ${item.category === entry ? 'selected' : ''}>${entry}</option>`).join('')}</select>
        </label>
        <label class="field">
          <span>Status</span>
          <select data-item-field="state">${CONFIG.states.map((entry) => `<option value="${entry}" ${item.state === entry ? 'selected' : ''}>${entry}</option>`).join('')}</select>
        </label>
      </div>
      <div class="field-grid three">
        <label class="field range-wrap">
          <span>Health</span>
          <input type="range" min="1" max="10" data-item-field="health" value="${item.health}" />
          <output>${item.health} / 10</output>
        </label>
        <label class="field range-wrap">
          <span>Leverage</span>
          <input type="range" min="1" max="10" data-item-field="score" value="${item.score}" />
          <output>${item.score} / 10</output>
        </label>
        <label class="field range-wrap">
          <span>Friction</span>
          <input type="range" min="1" max="10" data-item-field="effort" value="${item.effort}" />
          <output>${item.effort} / 10</output>
        </label>
      </div>
      <label class="field">
        <span>Time to value (minutes)</span>
        <input type="number" min="5" step="5" data-item-field="ttv" value="${item.ttv}" />
      </label>
      <div class="quick-actions">
        <button class="btn" type="button" data-action="strengthen-handoff">Strengthen handoff</button>
        <button class="btn" type="button" data-action="mark-reliable">Mark reliable</button>
        <button class="btn" type="button" data-action="raise-red-flag">Raise red flag</button>
      </div>
      <div class="editor-actions">
        <span class="helper">${item.owner} owns this step, with ${item.ttv} minutes to value.</span>
        <button class="btn btn-danger" type="button" data-action="remove-current">Remove</button>
      </div>
    </div>
  `;
}

function renderPanels() {
  const weakPoints = [...state.items].sort((a, b) => a.health - b.health || priority(b) - priority(a));
  refs.secondaryPrimary.innerHTML = `
    <div class="secondary-head">
      <div>
        <p class="eyebrow">Weak point queue</p>
        <h3>Where delivery needs attention</h3>
      </div>
      <span class="chip">${weakPoints.length} stages</span>
    </div>
    <div class="stack">
      ${weakPoints.slice(0, 4).map((item) => `
        <div class="mini-card">
          <div class="inline-split">
            <strong>${item.title}</strong>
            <span class="pill ${toneForHealth(item)}">${item.health}/10</span>
          </div>
          <p>${item.owner} · ${item.handoff} · ${item.ttv} min to value.</p>
        </div>
      `).join('') || `<div class="empty"><strong>No stages yet</strong><p>Map the service journey to reveal weak spots.</p></div>`}
    </div>
  `;

  const byCategory = CONFIG.categories.map((entry) => ({ entry, count: state.items.filter((item) => item.category === entry).length }));
  refs.secondarySecondary.innerHTML = `
    <div class="secondary-head">
      <div>
        <p class="eyebrow">Journey mix</p>
        <h3>Where the service is concentrated</h3>
      </div>
      <span class="chip">${state.items.length} stages</span>
    </div>
    <ul class="metric-list">
      ${byCategory.map(({ entry, count }) => `<li><span>${entry}</span><strong>${count}</strong></li>`).join('')}
      <li><span>Fastest value stage</span><strong>${state.items.length ? [...state.items].sort((a, b) => a.ttv - b.ttv)[0].title : '—'}</strong></li>
    </ul>
  `;
}

function render() {
  refs.boardTitle.textContent = state.boardTitle;
  refs.boardSubtitle.textContent = state.boardSubtitle;
  refs.search.value = state.ui.search;
  refs.category.innerHTML = `<option value="all">All types</option>${CONFIG.categories.map((entry) => `<option value="${entry}" ${state.ui.category === entry ? 'selected' : ''}>${entry}</option>`).join('')}`;
  refs.status.innerHTML = `<option value="all">All statuses</option>${CONFIG.states.map((entry) => `<option value="${entry}" ${state.ui.status === entry ? 'selected' : ''}>${entry}</option>`).join('')}`;
  const items = filteredItems();
  if (!items.some((item) => item.id === state.ui.selectedId)) state.ui.selectedId = items[0]?.id || null;
  renderStats(items);
  renderInsights(items);
  renderList(items);
  renderEditor(selectedItem());
  renderPanels();
}

document.addEventListener('click', (event) => {
  const itemButton = event.target.closest('.item');
  if (itemButton) {
    commit({ ...state, ui: { ...state.ui, selectedId: itemButton.dataset.id } });
    return;
  }

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'new') addItem();
  if (action === 'reset') { commit(seedState()); showToast('Re-seeded sample board.'); }
  if (action === 'remove-current') removeSelected();
  if (action === 'export') exportState();
  if (action === 'import') refs.importFile.click();
  if (action === 'strengthen-handoff') strengthenHandoff();
  if (action === 'mark-reliable') markReliable();
  if (action === 'raise-red-flag') raiseRedFlag();
});

document.addEventListener('input', (event) => {
  const field = event.target.dataset.field;
  if (field === 'search') {
    commit({ ...state, ui: { ...state.ui, search: event.target.value } });
    return;
  }
  const itemField = event.target.dataset.itemField;
  if (itemField) updateSelected(itemField, event.target.value);
});

document.addEventListener('change', async (event) => {
  const field = event.target.dataset.field;
  if (field === 'category' || field === 'status') {
    commit({ ...state, ui: { ...state.ui, [field]: event.target.value } });
    return;
  }
  if (event.target.id === 'import-file') {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importState(file);
    } catch (error) {
      console.error(error);
      showToast('Import failed.');
    } finally {
      event.target.value = '';
    }
  }
});

document.addEventListener('keydown', (event) => {
  if (event.target.closest('input, textarea, select')) return;
  if (event.key.toLowerCase() === 'n') {
    event.preventDefault();
    addItem();
  }
  if (event.key === '/') {
    event.preventDefault();
    refs.search.focus();
  }
});

render();

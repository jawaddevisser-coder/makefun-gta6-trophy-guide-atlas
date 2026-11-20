// Vice City Atlas — the guide's whole front end in one module: it loads the
// trophy list and the atlas (districts + roadmap), renders the map, the
// checklist, the planner and the roadmap, and keeps progress in localStorage.
const PROGRESS_KEY = 'vice-city-atlas-progress-v1';
const SETTINGS_KEY = 'vice-city-atlas-settings-v1';
const SUGGESTED_ROUTE = ['vice-city', 'ocean-beach', 'port-gellhorn', 'key-lento', 'kelly-county', 'lummox-county', 'mariana-county', 'statewide'];
const KIND_LABELS = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', crime: 'Crime & heists', side: 'Side quests', misc: 'Misc', completion: 'Completion', platinum: 'Platinum', online: 'Online' };

let trophies = [];
let sourceIndex = {};
let districts = [];
let roadmap = null;
let earned = new Set();
let settings = { spoiler: false, hideEarned: false, kind: 'all', grade: 'all', district: 'all', query: '', route: [], view: 'atlas' };

function loadStored() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
    if (Array.isArray(saved)) earned = new Set(saved.filter((id) => Number.isInteger(id)));
  } catch { earned = new Set(); }
  try {
    const kept = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (kept && typeof kept === 'object') settings = { ...settings, ...kept };
  } catch { /* keep defaults */ }
}

function saveStored() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function districtById(id) {
  return districts.find((d) => d.id === id) || { id, name: id, blurb: '', color: '#22d3ee', short: id };
}

function districtCounts() {
  const counts = {};
  for (const d of districts) counts[d.id] = { total: 0, done: 0 };
  for (const t of trophies) {
    const c = counts[t.district] || (counts[t.district] = { total: 0, done: 0 });
    c.total += 1;
    if (earned.has(t.id)) c.done += 1;
  }
  return counts;
}

function gradeCounts() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.id)) counts[t.grade] += 1;
  return counts;
}

function trophyVisible(t) {
  if (settings.hideEarned && earned.has(t.id)) return false;
  if (settings.kind !== 'all') {
    if (settings.kind === 'missable') { if (!t.missable) return false; }
    else if (settings.kind === 'online') { return false; }
    else if (t.kind !== settings.kind) return false;
  }
  if (settings.grade !== 'all' && t.grade !== settings.grade) return false;
  if (settings.district !== 'all' && t.district !== settings.district) return false;
  if (settings.query) {
    const q = settings.query.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function displayName(t) {
  if (settings.spoiler && t.kind === 'story' && !earned.has(t.id)) return 'Hidden story trophy';
  return t.name;
}

function displayDescription(t) {
  if (settings.spoiler && t.kind === 'story' && !earned.has(t.id)) return '??? — earn it to reveal. Spoiler-free mode is on.';
  return t.description;
}

function gradeBadge(t) {
  return `<span class="grade grade-${t.grade}">${t.grade}</span>`;
}

function flagChips(t) {
  let html = '';
  if (t.missable) html += '<span class="flag flag-missable">⚠ Possibly missable</span>';
  if (t.unconfirmed) html += '<span class="flag flag-unconfirmed">Unconfirmed — not yet verified</span>';
  return html;
}

function updateProgressUI() {
  const total = trophies.length || 55;
  const done = earned.size;
  const earnedLine = document.getElementById('earnedLine');
  earnedLine.textContent = `${done} / ${total} earned`;
  const g = gradeCounts();
  document.getElementById('gradeCounts').textContent = `Platinum ${g.platinum}/1 · Gold ${g.gold}/2 · Silver ${g.silver}/6 · Bronze ${g.bronze}/46`;
  document.getElementById('progressFill').style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
}

function renderMap() {
  const map = document.getElementById('map');
  const counts = districtCounts();
  const regions = districts.filter((d) => d.points);
  let svg = `<svg viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stylised map of Leonida">`;
  svg += `<rect x="0" y="0" width="1000" height="560" fill="#0a1226"/>`;
  svg += `<text class="map-sea" x="920" y="120">LEONIDA</text><text class="map-sea" x="920" y="140">BAY</text>`;
  svg += `<text class="map-sea" x="60" y="548">GULF OF LEONIDA</text>`;
  for (const d of regions) {
    const c = counts[d.id] || { total: 0, done: 0 };
    svg += `<g class="map-region" data-district="${d.id}" tabindex="0" role="button" aria-label="${d.name}, ${c.done} of ${c.total} trophies earned">`;
    svg += `<polygon points="${d.points}" fill="${d.color}" fill-opacity="0.32"/>`;
    svg += `<text class="map-label" x="${d.label[0]}" y="${d.label[1]}">${d.short}</text>`;
    svg += `<text class="map-count" x="${d.countPos[0]}" y="${d.countPos[1]}">${c.done}/${c.total} earned</text>`;
    svg += `</g>`;
  }
  svg += `</svg>`;
  map.innerHTML = svg;
  map.querySelectorAll('.map-region').forEach((region) => {
    const go = () => jumpToDistrict(region.dataset.district);
    region.addEventListener('click', go);
    region.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); go(); } });
  });
  const statewide = districtById('statewide');
  const sc = counts.statewide || { total: 0, done: 0 };
  document.getElementById('statewideCard').innerHTML =
    `<h2>Statewide</h2><p class="big">${sc.done} / ${sc.total} earned</p>` +
    `<p>${statewide.blurb}</p>` +
    `<button type="button" data-district="statewide">See the statewide trophies</button>`;
  document.querySelector('#statewideCard button').addEventListener('click', () => jumpToDistrict('statewide'));
}

function jumpToDistrict(districtId) {
  const section = document.getElementById(`district-${districtId}`);
  if (!section) return;
  document.querySelectorAll('.district-section').forEach((s) => s.classList.remove('highlight'));
  section.classList.add('highlight');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderDistrictSections() {
  const counts = districtCounts();
  const host = document.getElementById('districtSections');
  host.innerHTML = '';
  for (const d of districts) {
    const c = counts[d.id] || { total: 0, done: 0 };
    const section = document.createElement('section');
    section.className = 'district-section';
    section.id = `district-${d.id}`;
    section.style.borderTop = `4px solid ${d.color}`;
    const list = trophies.filter((t) => t.district === d.id);
    const cards = list.map((t) => {
      const isEarned = earned.has(t.id);
      return `<button type="button" class="trophy-card${isEarned ? ' earned' : ''}" data-trophy="${t.id}">
        <span class="row">${gradeBadge(t)}<span class="kind-tag">${KIND_LABELS[t.kind] || t.kind}</span></span>
        <span class="trophy-name">${escapeHtml(displayName(t))}</span>
        <span class="trophy-desc">${escapeHtml(displayDescription(t))}</span>
        <span>${flagChips(t)}</span>
      </button>`;
    }).join('');
    section.innerHTML = `<div class="district-head"><h2>${escapeHtml(d.name)}</h2><span class="blurb">${escapeHtml(d.blurb)}</span><span class="count">${c.done} / ${c.total} earned</span></div><div class="card-grid">${cards}</div>`;
    host.appendChild(section);
  }
  host.querySelectorAll('.trophy-card').forEach((card) => {
    card.addEventListener('click', () => openDetail(Number(card.dataset.trophy)));
  });
}

function renderChecklist() {
  const list = document.getElementById('trophyList');
  const visible = trophies.filter(trophyVisible);
  const meta = document.getElementById('listMeta');
  if (settings.kind === 'online') {
    meta.textContent = '0 trophies — GTA 6 has no online trophies. All 55 are offline single-player.';
  } else {
    meta.textContent = `Showing ${visible.length} of ${trophies.length} trophies · ${earned.size} earned`;
  }
  if (!visible.length) {
    list.innerHTML = '<p class="empty-note">No trophies match these filters. Loosen the search or clear a filter.</p>';
    return;
  }
  list.innerHTML = '';
  for (const t of visible) {
    const isEarned = earned.has(t.id);
    const row = document.createElement('div');
    row.className = `trophy-row${isEarned ? ' earned' : ''}`;
    row.innerHTML = `<input type="checkbox" ${isEarned ? 'checked' : ''} aria-label="Mark ${escapeHtml(t.name)} earned">
      ${gradeBadge(t)}
      <span><span class="trophy-name">${escapeHtml(displayName(t))}</span><br>
      <span class="trophy-desc">${escapeHtml(displayDescription(t))}</span><br>
      <span class="flag flag-district">${escapeHtml(districtById(t.district).name)}</span> ${flagChips(t)}</span>
      <span class="kind-tag">${KIND_LABELS[t.kind] || t.kind}</span>`;
    row.querySelector('input').addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(t.id);
    });
    row.addEventListener('click', (event) => {
      if (event.target.tagName !== 'INPUT') openDetail(t.id);
    });
    list.appendChild(row);
  }
}

function renderPlanner() {
  const counts = districtCounts();
  const picker = document.getElementById('districtPicker');
  picker.innerHTML = '';
  for (const d of districts) {
    const c = counts[d.id] || { total: 0, done: 0 };
    const inRoute = settings.route.includes(d.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${d.name} (${c.done}/${c.total})${inRoute ? ' ✓' : ''}`;
    button.addEventListener('click', () => {
      if (!settings.route.includes(d.id)) { settings.route.push(d.id); saveStored(); renderPlanner(); }
    });
    picker.appendChild(button);
  }
  const routeList = document.getElementById('routeList');
  routeList.innerHTML = '';
  if (!settings.route.length) {
    routeList.innerHTML = '<li class="empty-note">Your route is empty. Add districts, or take the suggested route.</li>';
  }
  let remaining = 0;
  settings.route.forEach((districtId, index) => {
    const d = districtById(districtId);
    const c = counts[districtId] || { total: 0, done: 0 };
    remaining += c.total - c.done;
    const stop = document.createElement('li');
    stop.className = 'route-stop';
    stop.innerHTML = `<span class="num">${index + 1}</span>
      <span class="info"><strong>${escapeHtml(d.name)}</strong><span>${c.done}/${c.total} earned · ${c.total - c.done} left · ${escapeHtml(d.blurb)}</span></span>
      <button type="button" data-move="up" aria-label="Move up">↑</button>
      <button type="button" data-move="down" aria-label="Move down">↓</button>
      <button type="button" data-move="remove" aria-label="Remove">✕</button>`;
    stop.querySelector('[data-move="up"]').addEventListener('click', () => moveRouteStop(index, -1));
    stop.querySelector('[data-move="down"]').addEventListener('click', () => moveRouteStop(index, 1));
    stop.querySelector('[data-move="remove"]').addEventListener('click', () => {
      settings.route.splice(index, 1);
      saveStored();
      renderPlanner();
    });
    routeList.appendChild(stop);
  });
  document.getElementById('routeSummary').textContent = settings.route.length
    ? `${settings.route.length} stops · ${remaining} trophies left on your route · ${earned.size} of ${trophies.length} earned overall`
    : '';
}

function moveRouteStop(index, delta) {
  const next = index + delta;
  if (next < 0 || next >= settings.route.length) return;
  const [moved] = settings.route.splice(index, 1);
  settings.route.splice(next, 0, moved);
  saveStored();
  renderPlanner();
}

function renderRoadmap() {
  const facts = document.getElementById('roadmapFacts');
  facts.innerHTML = roadmap.facts.map((f) => `<div class="fact"><strong>${escapeHtml(f.label)}</strong>${escapeHtml(f.value)}</div>`).join('');
  const stages = document.getElementById('roadmapStages');
  stages.innerHTML = '';
  for (const stage of roadmap.stages) {
    const card = document.createElement('article');
    card.className = 'stage';
    card.innerHTML = `<h3>Stage ${stage.stage} — ${escapeHtml(stage.name)}</h3>
      <p class="meta">${escapeHtml(stage.time)} · ${escapeHtml(stage.trophies)}</p>
      <ol>${stage.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
      ${stage.stage === 1 ? '<p class="warn">⚠ Watch out: Positive Mental Attitude is the only possibly missable trophy — do Lucia’s balcony meditation in Chapter 1 before the chapter ends.</p>' : ''}`;
    stages.appendChild(card);
  }
}

function openDetail(id) {
  const t = trophies.find((x) => x.id === id);
  if (!t) return;
  const body = document.getElementById('detailBody');
  const isEarned = earned.has(t.id);
  const hidden = settings.spoiler && t.kind === 'story' && !isEarned;
  const sourceLinks = t.sources.map((key) => {
    const s = sourceIndex[key];
    return s ? `<li><a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a></li>` : '';
  }).join('');
  body.innerHTML = `
    ${gradeBadge(t)} <span class="kind-tag">${KIND_LABELS[t.kind] || t.kind}</span>
    <span class="flag flag-district">${escapeHtml(districtById(t.district).name)}</span> ${flagChips(t)}
    <h2>${escapeHtml(hidden ? 'Hidden story trophy' : t.name)}</h2>
    <p class="official">Official description: ${escapeHtml(hidden ? '??? — earn it to reveal.' : t.description)}</p>
    <h3>Guide</h3>
    <p>${escapeHtml(hidden ? 'Spoiler-free mode is on. Earn this trophy to reveal its guide.' : t.guide)}</p>
    <h3>Sources</h3>
    <ul class="sources">${sourceLinks}</ul>
    <p class="official">Sources: ${t.sources.map((key) => escapeHtml(sourceIndex[key] ? sourceIndex[key].name : key)).join('; ')}.</p>
    <button type="button" class="earned-toggle" id="detailEarned">${isEarned ? '✓ Earned — unmark' : 'Mark as earned'}</button>`;
  document.getElementById('detail').hidden = false;
  document.getElementById('detailEarned').addEventListener('click', () => {
    toggleEarned(t.id);
    openDetail(t.id);
  });
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id);
  else earned.add(id);
  saveStored();
  updateProgressUI();
  renderDistrictSections();
  renderChecklist();
  renderPlanner();
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  window.setTimeout(() => { toast.hidden = true; }, 3000);
}

function exportProgress() {
  const payload = { app: 'vice-city-atlas', version: 1, earned: [...earned].sort((a, b) => a - b), route: settings.route };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vice-city-atlas-progress.json';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Progress exported.');
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error('bad file');
      earned = new Set(data.earned.filter((id) => Number.isInteger(id) && trophies.some((t) => t.id === id)));
      if (Array.isArray(data.route)) settings.route = data.route.filter((id) => districts.some((d) => d.id === id));
      saveStored();
      updateProgressUI();
      renderDistrictSections();
      renderChecklist();
      renderPlanner();
      showToast(`Progress imported: ${earned.size} trophies earned.`);
    } catch {
      showToast('That file is not a Vice City Atlas progress export.');
    }
  };
  reader.readAsText(file);
}

function renderAll() {
  updateProgressUI();
  renderMap();
  renderDistrictSections();
  renderChecklist();
  renderPlanner();
  renderRoadmap();
}

function switchView(view) {
  settings.view = view;
  saveStored();
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  for (const name of ['atlas', 'checklist', 'planner', 'roadmap']) {
    document.getElementById(`view-${name}`).hidden = name !== view;
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

async function bootAtlas() {
  loadStored();
  const [trophyData, atlasData] = await Promise.all([
    fetch('data/trophies.json').then((r) => r.json()),
    fetch('data/atlas.json').then((r) => r.json()),
  ]);
  trophies = trophyData.trophies;
  sourceIndex = trophyData.sources;
  districts = atlasData.districts;
  roadmap = atlasData.roadmap;
  const districtFilter = document.getElementById('districtFilter');
  for (const d of districts) {
    const option = document.createElement('option');
    option.value = d.id;
    option.textContent = d.name;
    districtFilter.appendChild(option);
  }
  document.getElementById('spoilerToggle').checked = settings.spoiler;
  document.getElementById('hideEarned').checked = settings.hideEarned;
  document.getElementById('kindFilter').value = settings.kind;
  document.getElementById('gradeFilter').value = settings.grade;
  document.getElementById('districtFilter').value = settings.district;
  document.getElementById('searchInput').value = settings.query;
  document.querySelectorAll('#tabs button').forEach((b) => {
    b.addEventListener('click', () => switchView(b.dataset.view));
  });
  document.getElementById('spoilerToggle').addEventListener('change', (event) => {
    settings.spoiler = event.target.checked;
    saveStored();
    renderDistrictSections();
    renderChecklist();
  });
  document.getElementById('hideEarned').addEventListener('change', (event) => {
    settings.hideEarned = event.target.checked;
    saveStored();
    renderChecklist();
  });
  document.getElementById('kindFilter').addEventListener('change', (event) => {
    settings.kind = event.target.value;
    saveStored();
    renderChecklist();
  });
  document.getElementById('gradeFilter').addEventListener('change', (event) => {
    settings.grade = event.target.value;
    saveStored();
    renderChecklist();
  });
  document.getElementById('districtFilter').addEventListener('change', (event) => {
    settings.district = event.target.value;
    saveStored();
    renderChecklist();
  });
  document.getElementById('searchInput').addEventListener('input', (event) => {
    settings.query = event.target.value;
    saveStored();
    renderChecklist();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', (event) => {
    if (event.target.files && event.target.files[0]) importProgress(event.target.files[0]);
    event.target.value = '';
  });
  document.getElementById('suggestedRoute').addEventListener('click', () => {
    settings.route = [...SUGGESTED_ROUTE];
    saveStored();
    renderPlanner();
  });
  document.getElementById('clearRoute').addEventListener('click', () => {
    settings.route = [];
    saveStored();
    renderPlanner();
  });
  document.getElementById('detailClose').addEventListener('click', () => {
    document.getElementById('detail').hidden = true;
  });
  renderAll();
  switchView(settings.view || 'atlas');
}

bootAtlas();

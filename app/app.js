const grid = document.getElementById("environmentGrid");
const searchInput = document.getElementById("searchInput");
const platformFilter = document.getElementById("platformFilter");
const statusFilter = document.getElementById("statusFilter");
const count = document.getElementById("environmentCount");
const emptyMessage = document.getElementById("emptyMessage");
const errorMessage = document.getElementById("errorMessage");
const clearFilters = document.getElementById("clearFilters");
let environments = [];

function escapeHtml(value) {
  return String(value).replace(/[&<>\'\"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  })[character]);
}

function safeUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
  } catch {
    return '#';
  }
}

async function checkStatus(url) {
  try {
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store'
    });
    return 'Available';
  } catch {
    return 'Unavailable';
  }
}

function render(items) {
  grid.innerHTML = '';
  count.textContent = `${items.length} environment${items.length === 1 ? '' : 's'} found`;
  emptyMessage.classList.toggle('hidden', items.length !== 0);

  items.forEach(environment => {
    const article = document.createElement('article');
    article.className = 'environment-card';

    const statusClass = environment.status === 'Available'
      ? 'status-available'
      : 'status-unavailable';

    article.innerHTML = `
      <div class="card-top">
        <h2>${escapeHtml(environment.name)}</h2>
        <span class="version">${escapeHtml(environment.version)}</span>
      </div>
      <div class="details">
        <div><span class="detail-label">Platform</span>${escapeHtml(environment.platform)}</div>
        <div><span class="detail-label">Purpose</span>${escapeHtml(environment.purpose)}</div>
      </div>
      <span class="status ${statusClass}">${escapeHtml(environment.status)}</span>
      <a class="open-button" href="${safeUrl(environment.url)}" target="_blank" rel="noopener noreferrer">Open environment</a>`;

    grid.appendChild(article);
  });
}

function applyFilters() {
  const search = searchInput.value.toLowerCase().trim();
  const platform = platformFilter.value;
  const status = statusFilter.value;

  render(environments.filter(item => {
    const text = `${item.name} ${item.version} ${item.platform} ${item.purpose}`.toLowerCase();
    return text.includes(search) &&
      (platform === 'all' || item.platform === platform) &&
      (status === 'all' || item.status === status);
  }));
}

async function loadEnvironments() {
  try {
    const response = await fetch('versions.json', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    environments = await response.json();

    environments = await Promise.all(
      environments.map(async env => ({
        ...env,
        status: await checkStatus(env.url)
      }))
    );

    const platforms = [...new Set(environments.map(item => item.platform))].sort();

    platforms.forEach(platform => {
      const option = document.createElement('option');
      option.value = platform;
      option.textContent = platform;
      platformFilter.appendChild(option);
    });

    render(environments);
  } catch (error) {
    errorMessage.textContent = `Unable to load versions.json: ${error.message}`;
    errorMessage.classList.remove('hidden');
  }
}

searchInput.addEventListener('input', applyFilters);
platformFilter.addEventListener('change', applyFilters);
statusFilter.addEventListener('change', applyFilters);
clearFilters.addEventListener('click', () => {
  searchInput.value = '';
  platformFilter.value = 'all';
  statusFilter.value = 'all';
  applyFilters();
  searchInput.focus();
});

loadEnvironments();
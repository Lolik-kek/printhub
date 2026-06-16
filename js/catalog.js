function fmtWeight(w) { return parseFloat(w).toString(); }
function fmtDate(d) {
  return new Date(d).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '');
}

function materialCard(m) {
  return `<div class="product-card" data-kind="Материал">
    <div class="product-img"><img src="${esc(m.image)}" alt="${esc(m.name)}" loading="lazy"><span class="product-badge">${esc(m.badge || m.type)}</span></div>
    <div class="product-body">
      <div class="product-name">${esc(m.name)}</div>
      <div class="product-meta"><span><i class="fas fa-cube"></i> ${esc(m.type)}</span><span><i class="fas fa-weight-hanging"></i> ${fmtWeight(m.weight_kg)} кг</span><span><i class="fas fa-industry"></i> ${esc(m.brand)}</span></div>
      <div class="product-price">${formatPrice(m.price)}</div>
      <div class="product-rating"><span class="stars">${renderStars(m.rating)}</span> (${m.reviews})</div>
      <button class="btn-cart" onclick="addToCart(event)">В корзину</button>
    </div></div>`;
}
function printerCard(p) {
  return `<div class="product-card" data-kind="Принтер">
    <div class="product-img"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"><span class="product-badge">${esc(p.badge)}</span></div>
    <div class="product-body">
      <div class="product-name">${esc(p.name)}</div>
      <div class="product-meta"><span><i class="fas fa-layer-group"></i> ${esc(p.type)}</span><span><i class="fas fa-ruler-combined"></i> ${esc(p.build_volume)}</span><span><i class="fas fa-industry"></i> ${esc(p.brand)}</span></div>
      <div class="product-price">${formatPrice(p.price)}</div>
      <div class="product-rating"><span class="stars">${renderStars(p.rating)}</span> (${p.reviews})</div>
      <button class="btn-cart" onclick="addToCart(event)">В корзину</button>
    </div></div>`;
}
function newsCard(n) {
  return `<div class="news-card" data-category="${esc(n.category)}">
    <div class="news-img"><img src="${esc(n.image)}" alt="${esc(n.title)}" loading="lazy"></div>
    <div class="news-body">
      <span class="news-tag">${esc(n.category)}</span>
      <h3 class="news-title">${esc(n.title)}</h3>
      <p class="news-excerpt">${esc(n.excerpt)}</p>
      <div class="news-footer"><span class="news-date">${fmtDate(n.published_at)}</span><a class="news-source" href="${esc(n.link)}" target="_blank" rel="noopener">Читать <i class="fas fa-arrow-right"></i></a></div>
    </div></div>`;
}

async function initCatalog(opts) {
  const grid = document.getElementById(opts.gridId);
  if (!grid) return;
  grid.innerHTML = `<p style="color:#888;grid-column:1/-1;padding:20px 0">Загрузка…</p>`;

  let rows = [];
  try {
    const { data, error } = await sb.from(opts.table).select('*');
    if (error) throw error;
    rows = data || [];
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<p style="color:#b85450;grid-column:1/-1;padding:20px 0">Не удалось загрузить данные из базы. Проверьте подключение к интернету.</p>`;
    return;
  }

  const bar = grid.closest('.page-content')?.querySelector('.filter-bar');
  const sel = bar?.querySelector('.filter-select');
  let currentFilter = bar?.querySelector('.filter-chip.active')?.textContent.trim() || 'Все';
  let currentSort = (sel && opts.sortMap && opts.sortMap[sel.value]) || opts.defaultSort || null;

  function render() {
    let list = rows.slice();
    if (currentFilter && currentFilter !== 'Все') list = list.filter(r => opts.filterFn(r, currentFilter));
    if (currentSort) list.sort(currentSort);
    grid.innerHTML = list.length
      ? list.map(opts.cardFn).join('')
      : `<p style="color:#888;grid-column:1/-1;padding:20px 0">По выбранному фильтру ничего не найдено.</p>`;
  }

  if (bar) {
    bar.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.textContent.trim();
        render();
      });
    });
    if (sel && opts.sortMap) {
      sel.addEventListener('change', () => {
        currentSort = opts.sortMap[sel.value] || opts.defaultSort;
        render();
      });
    }
  }
  render();
}

const priceRatingSort = {
  'По рейтингу': (a, b) => b.rating - a.rating || b.reviews - a.reviews,
  'По цене ↑': (a, b) => a.price - b.price,
  'По цене ↓': (a, b) => b.price - a.price,
  'Новинки': (a, b) => b.id - a.id,
};

function initMaterials() {
  initCatalog({
    table: 'materials', gridId: 'materials-grid', cardFn: materialCard,
    filterFn: (m, f) => {
      if (f === 'PLA') return /PLA/i.test(m.type);
      if (f === 'PETG') return /PETG/i.test(m.type);
      if (f === 'ASA') return /ASA/i.test(m.type);
      if (f === 'Переработанные') return m.recycled === true;
      return true;
    },
    sortMap: priceRatingSort,
    defaultSort: (a, b) => a.sort_order - b.sort_order,
  });
}
function initPrinters() {
  initCatalog({
    table: 'printers', gridId: 'printers-grid', cardFn: printerCard,
    filterFn: (p, f) => {
      if (f === 'FDM') return p.type === 'FDM';
      if (/MSLA|Смола/i.test(f)) return p.type === 'MSLA';
      return true;
    },
    sortMap: priceRatingSort,
    defaultSort: (a, b) => a.sort_order - b.sort_order,
  });
}
function initNews() {
  initCatalog({
    table: 'news', gridId: 'news-grid', cardFn: newsCard,
    filterFn: (n, f) => n.category === f,
    defaultSort: (a, b) => new Date(b.published_at) - new Date(a.published_at),
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('materials-grid')) initMaterials();
  if (document.getElementById('printers-grid')) initPrinters();
  if (document.getElementById('news-grid')) initNews();
});

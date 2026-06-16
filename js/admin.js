const ADMIN_SCHEMA = {
  materials: {
    title: 'материал',
    table: 'materials',
    columns: [
      { key: 'image', label: '', type: 'img' },
      { key: 'name', label: 'Название' },
      { key: 'type', label: 'Тип' },
      { key: 'brand', label: 'Бренд' },
      { key: 'price', label: 'Цена', type: 'price' },
      { key: 'badge', label: 'Бейдж' },
    ],
    fields: [
      { key: 'name', label: 'Название', full: true, required: true },
      { key: 'type', label: 'Тип (PLA, PETG, ASA…)', required: true },
      { key: 'brand', label: 'Бренд' },
      { key: 'price', label: 'Цена, ₽', input: 'number', required: true },
      { key: 'weight_kg', label: 'Вес, кг', input: 'number', step: '0.1' },
      { key: 'rating', label: 'Рейтинг (0–5)', input: 'number', step: '0.1' },
      { key: 'reviews', label: 'Отзывов', input: 'number' },
      { key: 'badge', label: 'Бейдж (напр. «Хит»)' },
      { key: 'sort_order', label: 'Порядок сортировки', input: 'number' },
      { key: 'recycled', label: 'Переработанный материал', input: 'checkbox' },
      { key: 'image', label: 'Ссылка на изображение', full: true },
    ],
  },
  printers: {
    title: 'принтер',
    table: 'printers',
    columns: [
      { key: 'image', label: '', type: 'img' },
      { key: 'name', label: 'Название' },
      { key: 'type', label: 'Тип' },
      { key: 'build_volume', label: 'Область печати' },
      { key: 'brand', label: 'Бренд' },
      { key: 'price', label: 'Цена', type: 'price' },
    ],
    fields: [
      { key: 'name', label: 'Название', full: true, required: true },
      { key: 'type', label: 'Тип (FDM, MSLA)', required: true },
      { key: 'brand', label: 'Бренд' },
      { key: 'build_volume', label: 'Область печати (напр. 256×256×256 мм)' },
      { key: 'price', label: 'Цена, ₽', input: 'number', required: true },
      { key: 'rating', label: 'Рейтинг (0–5)', input: 'number', step: '0.1' },
      { key: 'reviews', label: 'Отзывов', input: 'number' },
      { key: 'badge', label: 'Бейдж' },
      { key: 'sort_order', label: 'Порядок сортировки', input: 'number' },
      { key: 'image', label: 'Ссылка на изображение', full: true },
    ],
  },
  news: {
    title: 'новость',
    table: 'news',
    columns: [
      { key: 'image', label: '', type: 'img' },
      { key: 'title', label: 'Заголовок' },
      { key: 'category', label: 'Категория' },
      { key: 'published_at', label: 'Дата', type: 'date' },
    ],
    fields: [
      { key: 'title', label: 'Заголовок', full: true, required: true },
      { key: 'category', label: 'Категория' },
      { key: 'source', label: 'Источник' },
      { key: 'published_at', label: 'Дата публикации', input: 'date' },
      { key: 'excerpt', label: 'Краткое описание', input: 'textarea', full: true },
      { key: 'link', label: 'Ссылка на статью', full: true },
      { key: 'image', label: 'Ссылка на изображение', full: true },
    ],
  },
};

const ORDER_STATUSES = ['Новый', 'В обработке', 'В печати', 'Готов', 'Выполнен', 'Отменён'];
const STATUS_CLASS = {
  'Новый': 's-new', 'В обработке': 's-process', 'В печати': 's-print',
  'Готов': 's-ready', 'Выполнен': 's-done', 'Отменён': 's-cancel',
};

let adminData = { materials: [], printers: [], news: [], orders: [] };
let adminEditState = { entity: null, id: null };

function adminMsg(text, ok = true) {
  const el = document.getElementById('admin-msg');
  if (!el) return;
  el.textContent = text;
  el.className = 'admin-msg ' + (ok ? 'ok' : 'err');
  clearTimeout(adminMsg._t);
  adminMsg._t = setTimeout(() => { el.className = 'admin-msg'; }, 4000);
}

async function adminInit() {
  const loading = document.getElementById('admin-loading');
  const gate = document.getElementById('admin-gate');
  const app = document.getElementById('admin-app');

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    loading.style.display = 'none';
    document.getElementById('admin-gate-text').textContent = 'Войдите в аккаунт администратора, чтобы открыть панель управления.';
    gate.style.display = 'block';
    return;
  }

  let isAdmin = false;
  try {
    const { data, error } = await sb.rpc('is_admin');
    if (error) throw error;
    isAdmin = data === true;
  } catch (e) { console.error(e); }

  if (!isAdmin) {
    loading.style.display = 'none';
    document.getElementById('admin-gate-text').textContent = 'Ваш аккаунт не имеет прав администратора. Обратитесь к владельцу сервиса.';
    document.getElementById('admin-gate-btn').textContent = 'На главную';
    document.getElementById('admin-gate-btn').setAttribute('href', 'index.html');
    gate.style.display = 'block';
    return;
  }

  loading.style.display = 'none';
  app.style.display = 'block';
  document.getElementById('admin-user-email').textContent = session.user.email;

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  await Promise.all([
    adminLoad('materials'), adminLoad('printers'),
    adminLoad('news'), adminLoadOrders(),
  ]);
}

async function adminLoad(entity) {
  const schema = ADMIN_SCHEMA[entity];
  const { data, error } = await sb.from(schema.table).select('*').order('id', { ascending: true });
  if (error) { adminMsg('Ошибка загрузки: ' + error.message, false); return; }
  adminData[entity] = data || [];
  adminRenderTable(entity);
}

function adminRenderTable(entity) {
  const schema = ADMIN_SCHEMA[entity];
  const rows = adminData[entity];
  const table = document.getElementById('table-' + entity);
  document.getElementById('count-' + entity).textContent = `Всего записей: ${rows.length}`;

  const head = '<thead><tr><th>ID</th>' +
    schema.columns.map(c => `<th>${esc(c.label)}</th>`).join('') +
    '<th style="text-align:right">Действия</th></tr></thead>';

  if (!rows.length) {
    table.innerHTML = head + `<tbody><tr><td colspan="${schema.columns.length + 2}" class="admin-empty">Записей пока нет</td></tr></tbody>`;
    return;
  }

  const body = rows.map(r => {
    const cells = schema.columns.map(c => {
      const v = r[c.key];
      if (c.type === 'img') return `<td>${v ? `<img class="thumb" src="${esc(v)}" alt="">` : '—'}</td>`;
      if (c.type === 'price') return `<td>${formatPrice(v)}</td>`;
      if (c.type === 'date') return `<td>${v ? esc(v) : '—'}</td>`;
      return `<td>${esc(v != null && v !== '' ? v : '—')}</td>`;
    }).join('');
    return `<tr><td>${r.id}</td>${cells}<td>
      <div class="admin-row-actions" style="justify-content:flex-end">
        <button class="admin-btn admin-btn-ghost" onclick="adminEdit('${entity}',${r.id})"><i class="fas fa-pen"></i></button>
        <button class="admin-btn admin-btn-danger" onclick="adminAskDelete('${entity}',${r.id})"><i class="fas fa-trash"></i></button>
      </div></td></tr>`;
  }).join('');

  table.innerHTML = head + '<tbody>' + body + '</tbody>';
}

function adminOpenModal(entity, record) {
  const schema = ADMIN_SCHEMA[entity];
  adminEditState = { entity, id: record ? record.id : null };
  document.getElementById('admin-modal-title').textContent =
    (record ? 'Редактировать ' : 'Добавить ') + schema.title;

  const grid = document.getElementById('admin-modal-fields');
  grid.innerHTML = schema.fields.map(f => {
    const val = record && record[f.key] != null ? record[f.key] : '';
    const cls = f.full ? 'full' : '';
    if (f.input === 'checkbox') {
      const checked = record && record[f.key] === true ? 'checked' : '';
      return `<div class="${cls}"><label class="admin-check"><input type="checkbox" id="fld-${f.key}" ${checked}> ${esc(f.label)}</label></div>`;
    }
    if (f.input === 'textarea') {
      return `<div class="${cls}"><label>${esc(f.label)}</label><textarea class="input-field" id="fld-${f.key}">${esc(val)}</textarea></div>`;
    }
    const type = f.input === 'number' ? 'number' : (f.input === 'date' ? 'date' : 'text');
    const step = f.step ? `step="${f.step}"` : '';
    return `<div class="${cls}"><label>${esc(f.label)}${f.required ? ' *' : ''}</label>
      <input class="input-field" id="fld-${f.key}" type="${type}" ${step} value="${esc(val)}"></div>`;
  }).join('');

  document.getElementById('admin-modal').classList.add('active');
}
function adminCloseModal() { document.getElementById('admin-modal').classList.remove('active'); }

function adminAddNew(entity) { adminOpenModal(entity, null); }
function adminEdit(entity, id) {
  const rec = adminData[entity].find(r => r.id === id);
  adminOpenModal(entity, rec);
}

async function adminSave() {
  const { entity, id } = adminEditState;
  const schema = ADMIN_SCHEMA[entity];
  const payload = {};
  for (const f of schema.fields) {
    const el = document.getElementById('fld-' + f.key);
    if (!el) continue;
    if (f.input === 'checkbox') { payload[f.key] = el.checked; continue; }
    let v = el.value.trim();
    if (v === '') { payload[f.key] = (f.required && f.input === 'number') ? 0 : (f.input === 'number' ? null : (v || null)); }
    else if (f.input === 'number') { payload[f.key] = Number(v); }
    else { payload[f.key] = v; }
    if (f.required && (v === '' || v == null)) {
      adminMsg(`Поле «${f.label}» обязательно для заполнения.`, false);
      return;
    }
  }

  const btn = document.getElementById('admin-modal-save');
  btn.disabled = true;
  let error;
  if (id == null) {
    ({ error } = await sb.from(schema.table).insert(payload));
  } else {
    ({ error } = await sb.from(schema.table).update(payload).eq('id', id));
  }
  btn.disabled = false;

  if (error) { adminMsg('Не удалось сохранить: ' + error.message, false); return; }
  adminCloseModal();
  adminMsg(id == null ? `Добавлен новый ${schema.title}.` : 'Изменения сохранены.');
  await adminLoad(entity);
}

function adminAskDelete(entity, id) {
  const schema = ADMIN_SCHEMA[entity];
  const rec = adminData[entity].find(r => r.id === id);
  const name = rec ? (rec.name || rec.title || ('#' + id)) : ('#' + id);
  document.getElementById('admin-confirm-title').textContent = `Удалить ${schema.title}?`;
  document.getElementById('admin-confirm-text').textContent = `«${name}» будет удалён без возможности восстановления.`;
  const ok = document.getElementById('admin-confirm-ok');
  ok.onclick = () => adminDelete(entity, id);
  document.getElementById('admin-confirm').classList.add('active');
}
function adminCloseConfirm() { document.getElementById('admin-confirm').classList.remove('active'); }

async function adminDelete(entity, id) {
  const schema = ADMIN_SCHEMA[entity];
  const { error } = await sb.from(schema.table).delete().eq('id', id);
  adminCloseConfirm();
  if (error) { adminMsg('Не удалось удалить: ' + error.message, false); return; }
  adminMsg('Запись удалена.');
  await adminLoad(entity);
}

async function adminLoadOrders() {
  const { data, error } = await sb
    .from('orders')
    .select('id, email, subtotal, discount, total, status, created_at, order_items(title, qty, unit_price, kind)')
    .order('created_at', { ascending: false });
  if (error) { adminMsg('Ошибка загрузки заказов: ' + error.message, false); return; }
  adminData.orders = data || [];
  adminRenderOrders();
}

function adminRenderOrders() {
  const list = document.getElementById('orders-list');
  const orders = adminData.orders;
  document.getElementById('count-orders').textContent = `Всего заказов: ${orders.length}`;
  if (!orders.length) { list.innerHTML = `<div class="admin-empty">Заказов пока нет</div>`; return; }

  list.innerHTML = orders.map(o => {
    const date = new Date(o.created_at).toLocaleString('ru');
    const items = (o.order_items || []).map(it =>
      `${esc(it.title)} <span style="color:#999">×${it.qty} — ${formatPrice(it.unit_price)}</span>`).join('<br>');
    const opts = ORDER_STATUSES.map(s =>
      `<option value="${esc(s)}" ${s === o.status ? 'selected' : ''}>${esc(s)}</option>`).join('');
    return `<div class="order-card">
      <div class="order-card-head">
        <div>
          <div class="oc-id">Заказ №${o.id}</div>
          <div class="oc-meta">${esc(o.email || 'без email')} · ${date}</div>
        </div>
        <span class="admin-status ${STATUS_CLASS[o.status] || ''}">${esc(o.status)}</span>
      </div>
      <div class="order-card-items">${items || '<span style="color:#999">нет позиций</span>'}</div>
      <div class="order-card-foot">
        <label style="font-size:13px;color:#666">Статус:</label>
        <select class="input-field" style="width:auto;padding:8px 12px" id="ord-status-${o.id}">${opts}</select>
        <button class="admin-btn admin-btn-ghost" onclick="adminSaveOrderStatus(${o.id})"><i class="fas fa-save"></i> Применить</button>
        <span class="oc-total">${formatPrice(o.total)}</span>
      </div>
    </div>`;
  }).join('');
}

async function adminSaveOrderStatus(id) {
  const status = document.getElementById('ord-status-' + id).value;
  const { error } = await sb.from('orders').update({ status }).eq('id', id);
  if (error) { adminMsg('Не удалось обновить статус: ' + error.message, false); return; }
  adminMsg(`Статус заказа №${id} обновлён: ${status}.`);
  await adminLoadOrders();
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'admin-modal') adminCloseModal();
  if (e.target.id === 'admin-confirm') adminCloseConfirm();
});

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-admin')) adminInit();
});

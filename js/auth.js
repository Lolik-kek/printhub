async function phCurrentUser() {
  try {
    const { data: { session } } = await sb.auth.getSession();
    return session ? session.user : null;
  } catch (e) { return null; }
}

function phDisplayName(user) {
  return (user && (user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : ''))) || 'Аккаунт';
}

async function phUpdateHeader() {
  const btn = document.getElementById('authBtn');
  if (!btn) return;
  const user = await phCurrentUser();
  if (user) {
    btn.textContent = phDisplayName(user);
    btn.setAttribute('href', 'profile.html');
    btn.classList.remove('auth-btn');
    btn.classList.add('user-name');
    phShowAdminLink(user);
  } else {
    btn.textContent = 'Вход / Регистрация';
    btn.setAttribute('href', 'login.html');
    btn.classList.add('auth-btn');
    btn.classList.remove('user-name');
  }
}

async function phShowAdminLink() {
  const menu = document.getElementById('navMenu');
  if (!menu || document.getElementById('adminNavItem')) return;
  let isAdmin = false;
  try {
    const { data } = await sb.rpc('is_admin');
    isAdmin = data === true;
  } catch (e) { isAdmin = false; }
  if (!isAdmin) return;
  const li = document.createElement('li');
  li.className = 'nav-item';
  li.id = 'adminNavItem';
  li.innerHTML = '<a href="admin.html" class="nav-link" style="color:#0064e0;font-weight:700">АДМИН</a>';
  menu.appendChild(li);
}

function phMsg(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) { alert(text); return; }
  el.textContent = text;
  el.style.display = 'block';
  el.style.color = ok ? '#15803d' : '#dc2626';
}

async function phLoginSubmit(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  if (!email || !password) { phMsg('auth-msg', 'Введите email и пароль.'); return; }
  phMsg('auth-msg', 'Вход…', true);
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    phMsg('auth-msg', error.message.includes('Email not confirmed')
      ? 'Email не подтверждён. Проверьте письмо или попросите отключить подтверждение email.'
      : 'Неверный email или пароль.');
    return;
  }
  location.href = 'profile.html';
}

async function phRegisterSubmit(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirm = document.getElementById('reg-confirm')?.value;
  if (!name || !email || !password) { phMsg('auth-msg', 'Заполните имя, email и пароль.'); return; }
  if (password.length < 6) { phMsg('auth-msg', 'Пароль должен быть не короче 6 символов.'); return; }
  if (confirm != null && password !== confirm) { phMsg('auth-msg', 'Пароли не совпадают.'); return; }
  phMsg('auth-msg', 'Регистрация…', true);
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
  if (error) { phMsg('auth-msg', error.message); return; }
  if (data.session) {
    location.href = 'profile.html';
  } else {
    phMsg('auth-msg', 'Аккаунт создан! Подтвердите email по ссылке из письма, затем войдите.', true);
  }
}

async function phLogout() {
  await sb.auth.signOut();
  location.href = 'index.html';
}

async function phRenderProfile() {
  const root = document.getElementById('profile-root');
  if (!root) return;
  const user = await phCurrentUser();
  if (!user) { location.href = 'login.html'; return; }

  const name = phDisplayName(user);
  const initials = name.slice(0, 2).toUpperCase();
  const created = user.created_at ? new Date(user.created_at).toLocaleDateString('ru') : '—';

  let ordersHtml = '<p style="color:#888">Загрузка заказов…</p>';
  root.innerHTML = profileMarkup(name, initials, user.email, created, ordersHtml);

  const { data: orders, error } = await sb
    .from('orders')
    .select('id, total, status, created_at, order_items(title, qty, unit_price, kind)')
    .order('created_at', { ascending: false });

  if (error) {
    ordersHtml = '<p style="color:#888">Не удалось загрузить заказы.</p>';
  } else if (!orders || orders.length === 0) {
    ordersHtml = '<p style="color:#888">Заказов пока нет. Загляните в <a href="cart.html" style="color:#0064e0">корзину</a>.</p>';
  } else {
    ordersHtml = orders.map(o => {
      const items = (o.order_items || []).map(it => `${esc(it.title)} ×${it.qty}`).join(', ');
      const date = new Date(o.created_at).toLocaleDateString('ru');
      return `<div class="order-item">
        <div><div class="order-id">Заказ №${o.id}</div><div class="order-date">${date} · ${esc(items)}</div></div>
        <div style="text-align:right">
          <span class="order-status status-process">${esc(o.status)}</span>
          <div class="order-price" style="margin-top:6px">${formatPrice(o.total)}</div>
        </div></div>`;
    }).join('');
  }
  root.innerHTML = profileMarkup(name, initials, user.email, created, ordersHtml);
}

function profileMarkup(name, initials, email, created, ordersHtml) {
  return `<div class="profile-layout">
    <div>
      <div class="profile-main-card">
        <div class="profile-avatar">${esc(initials)}</div>
        <div class="profile-name">${esc(name)}</div>
        <div class="profile-email">${esc(email)}</div>
        <div class="profile-fields">
          <div><div class="pf-label">Email</div><div class="pf-val">${esc(email)}</div></div>
          <div><div class="pf-label">Регистрация</div><div class="pf-val">${esc(created)}</div></div>
        </div>
        <button class="btn-secondary" style="border-color:#ddd;color:#dc2626" onclick="phLogout()"><i class="fas fa-sign-out-alt"></i> Выйти</button>
      </div>
      <div class="profile-main-card">
        <h3>История заказов</h3>
        ${ordersHtml}
      </div>
    </div>
    <div class="rules-card">
      <h3>Правила оформления</h3>
      <div class="rule-item"><div class="rule-num">1</div><div>Загрузите модель в формате STL или OBJ и выберите материал.</div></div>
      <div class="rule-item"><div class="rule-num">2</div><div>Проверьте расчёт стоимости в калькуляторе перед заказом.</div></div>
      <div class="rule-item"><div class="rule-num">3</div><div>Оплата после подтверждения параметров печати менеджером.</div></div>
      <div class="rule-item"><div class="rule-num">4</div><div>Срок изготовления — от 24 часов в зависимости от загрузки.</div></div>
    </div>
  </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  phUpdateHeader();
  if (document.getElementById('profile-root')) phRenderProfile();
});

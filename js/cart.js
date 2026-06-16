const CART_KEY = 'printhub_cart';
const DISCOUNT_RATE = 0.05;

const Cart = {
  get() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } },
  save(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); Cart.updateBadge(); },
  add(item) {
    const items = Cart.get();
    const ex = items.find(i => i.name === item.name && i.kind === item.kind);
    if (ex) ex.qty += (item.qty || 1);
    else items.push({ name: item.name, price: item.price, image: item.image, kind: item.kind, qty: item.qty || 1 });
    Cart.save(items);
  },
  setQty(i, q) { const items = Cart.get(); if (items[i]) { items[i].qty = Math.max(1, q); Cart.save(items); } },
  remove(i) { const items = Cart.get(); items.splice(i, 1); Cart.save(items); },
  clear() { localStorage.removeItem(CART_KEY); Cart.updateBadge(); },
  count() { return Cart.get().reduce((s, i) => s + i.qty, 0); },
  subtotal() { return Cart.get().reduce((s, i) => s + i.price * i.qty, 0); },
  updateBadge() {
    const n = Cart.count();
    document.querySelectorAll('.nav-cart-link').forEach(l => {
      let b = l.querySelector('.cart-count');
      if (n > 0) { if (!b) { b = document.createElement('span'); b.className = 'cart-count'; l.appendChild(b); } b.textContent = n; }
      else if (b) b.remove();
    });
  }
};

function addToCart(e) {
  e.stopPropagation();
  const card = e.target.closest('.product-card');
  if (!card) return;
  const name = card.querySelector('.product-name')?.textContent.trim() || 'Товар';
  const price = parseInt((card.querySelector('.product-price')?.textContent || '0').replace(/[^0-9]/g, '')) || 0;
  const image = card.querySelector('.product-img img')?.getAttribute('src') || '';
  const kind = card.dataset.kind || 'Товар';
  Cart.add({ name, price, image, kind });
  const btn = e.target.closest('.btn-cart');
  if (btn) { const t = btn.textContent; btn.textContent = '✓ Добавлено'; btn.disabled = true; setTimeout(() => { btn.textContent = t; btn.disabled = false; }, 1000); }
}

function renderCart() {
  const root = document.getElementById('cart-root');
  if (!root) return;
  const items = Cart.get();
  if (items.length === 0) {
    root.innerHTML = `<div class="cart-empty">
      <div class="cart-empty-icon">🛒</div>
      <h2>Корзина пуста</h2>
      <p>Выберите, с чего начать:</p>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        <a href="calc.html" class="btn-primary"><i class="fas fa-cube"></i> 3D-печать</a>
        <a href="printers.html" class="btn-primary" style="background:#fff;color:#0064e0;border:1px solid #d0e5ff"><i class="fas fa-print"></i> Принтеры</a>
        <a href="materials.html" class="btn-primary" style="background:#fff;color:#0064e0;border:1px solid #d0e5ff"><i class="fas fa-layer-group"></i> Материалы</a>
      </div>
    </div>`;
    return;
  }
  const subtotal = Cart.subtotal();
  const discount = Math.round(subtotal * DISCOUNT_RATE);
  const total = subtotal - discount;
  const itemsHtml = items.map((it, i) => `
    <div class="cart-item">
      <div class="cart-item-img">${it.image ? `<img src="${esc(it.image)}" alt="${esc(it.name)}">` : '🧊'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(it.name)}</div>
        <div class="cart-item-sub">${esc(it.kind)} · ${formatPrice(it.price)}/шт.</div>
        <div class="qty-control"><button class="qty-btn" onclick="cartQty(${i},-1)">−</button><span class="qty-value">${it.qty}</span><button class="qty-btn" onclick="cartQty(${i},1)">+</button></div>
      </div>
      <div class="cart-item-price">${formatPrice(it.price * it.qty)}</div>
      <button class="cart-item-remove" onclick="cartRemove(${i})"><i class="fas fa-times"></i></button>
    </div>`).join('');
  root.innerHTML = `<div class="cart-layout">
    <div>
      <div class="cart-items-title">Товары в корзине <span style="color:#999;font-weight:400;font-size:18px">(${Cart.count()})</span></div>
      ${itemsHtml}
    </div>
    <div class="cart-summary">
      <h3>Итого</h3>
      <div class="summary-row"><span>Товары (${Cart.count()} шт.)</span><span>${formatPrice(subtotal)}</span></div>
      <div class="summary-row"><span>Доставка</span><span style="color:#15803d;font-weight:600">Бесплатно</span></div>
      <div class="summary-row"><span>Скидка 5%</span><span style="color:#dc2626;font-weight:600">−${formatPrice(discount)}</span></div>
      <div class="summary-row total"><span>К оплате</span><span class="total-val">${formatPrice(total)}</span></div>
      <button class="btn-checkout" onclick="checkout()">Оформить заказ</button>
      <p id="checkout-msg" style="display:none;text-align:center;font-size:14px;margin-top:12px"></p>
      <p style="text-align:center;font-size:13px;color:#999;margin-top:14px"><i class="fas fa-lock"></i> Безопасная оплата. Защита покупателя.</p>
    </div>
  </div>`;
}

function cartQty(i, d) { const items = Cart.get(); if (items[i]) { Cart.setQty(i, items[i].qty + d); renderCart(); } }
function cartRemove(i) { Cart.remove(i); renderCart(); }

async function checkout() {
  const items = Cart.get();
  if (items.length === 0) return;
  const user = await phCurrentUser();
  if (!user) {
    phMsg('checkout-msg', 'Войдите в аккаунт, чтобы оформить заказ. Перенаправляем…');
    setTimeout(() => location.href = 'login.html', 1300);
    return;
  }
  phMsg('checkout-msg', 'Оформляем заказ…', true);
  const subtotal = Cart.subtotal();
  const discount = Math.round(subtotal * DISCOUNT_RATE);
  const total = subtotal - discount;

  const { data: order, error } = await sb.from('orders')
    .insert({ user_id: user.id, email: user.email, subtotal, discount, total })
    .select().single();
  if (error) { phMsg('checkout-msg', 'Не удалось оформить заказ: ' + error.message); return; }

  const rows = items.map(it => ({ order_id: order.id, kind: it.kind, title: it.name, unit_price: it.price, qty: it.qty }));
  const { error: e2 } = await sb.from('order_items').insert(rows);
  if (e2) { phMsg('checkout-msg', 'Заказ создан, но позиции не сохранились: ' + e2.message); return; }

  Cart.clear();
  const root = document.getElementById('cart-root');
  if (root) {
    root.innerHTML = `<div class="cart-empty">
      <div class="cart-empty-icon" style="opacity:1">✅</div>
      <h2>Заказ №${order.id} оформлен!</h2>
      <p>Спасибо за заказ на сумму ${formatPrice(total)}. Мы свяжемся с вами для подтверждения.</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="profile.html" class="btn-primary">Мои заказы</a>
        <a href="index.html" class="btn-secondary" style="color:#0064e0;border-color:#d0e5ff">На главную</a>
      </div>
    </div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  renderCart();
});

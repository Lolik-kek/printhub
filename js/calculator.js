function calcPrice() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const ru = (n) => Math.round(n).toLocaleString('ru');
  const num = (id, def) => {
    const el = document.getElementById(id);
    if (!el) return def;
    const v = parseFloat(el.value);
    return isNaN(v) ? def : v;
  };
  if (!document.getElementById('price-val')) return;
  const addBtn = document.getElementById('add-print-btn');

  const model = window.phModel || null;
  if (!model) {
    set('vol-display', 'Загрузите модель для расчёта');
    ['b-vol', 'b-mass', 'b-mat', 'b-work', 'b-post', 'b-setup', 'b-copies', 'b-complexity', 'b-total'].forEach(id => set(id, '—'));
    set('price-val', '—');
    if (addBtn) addBtn.style.display = 'none';
    window.phLastTotal = 0;
    return;
  }

  const fill = num('c-fill', 20);
  const matRate = num('c-mat', 1);
  const qual = num('c-qual', 1);
  const post = num('c-post', 0);
  let copies = Math.round(num('c-copies', 1));
  if (copies < 1) copies = 1;

  const volMm = model.volumeMm3;
  const density = 1.24;
  const shellMm = 1.2;
  const shellVol = Math.min(volMm * 0.85, (model.areaMm2 || 0) * shellMm);
  const coreVol = Math.max(0, volMm - shellVol);
  const materialMm3 = shellVol + (fill / 100) * coreVol;
  const mass = (materialMm3 / 1000) * density;

  const matCost = mass * matRate;
  const printTimeH = (mass / 12) * qual * model.complexityMult;
  const machineCost = printTimeH * 90;
  const perUnit = matCost + machineCost + post;

  const setup = 250;
  const total = setup + perUnit * copies;
  window.phLastTotal = total;

  set('vol-display', 'Объём модели: ' + Math.round(volMm).toLocaleString('ru') + ' мм³');
  set('b-vol', Math.round(volMm).toLocaleString('ru') + ' мм³');
  set('b-mass', '~' + (mass < 100 ? mass.toFixed(1) : Math.round(mass)) + ' г');
  set('b-mat', ru(matCost) + ' ₽');
  set('b-work', ru(machineCost) + ' ₽');
  set('b-post', ru(post) + ' ₽');
  set('b-setup', ru(setup) + ' ₽');
  set('b-copies', '×' + copies);
  set('b-complexity', model.complexityLabel + ' (×' + model.complexityMult + ')');
  set('b-total', ru(total) + ' ₽');
  set('price-val', ru(total));
  if (addBtn) addBtn.style.display = '';
}

function addPrintToCart() {
  if (typeof calcPrice === 'function') calcPrice();
  const total = window.phLastTotal || 0;
  if (total <= 0) return;
  const model = window.phModel;
  const name = model ? ('3D-печать: ' + model.filename) : 'Услуга 3D-печати';
  if (typeof Cart !== 'undefined') {
    Cart.add({ name: name, price: Math.round(total), image: '', kind: 'Услуга 3D-печати' });
    const btn = document.getElementById('add-print-btn');
    if (btn) { const t = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i> Добавлено в корзину'; btn.disabled = true; setTimeout(() => { btn.innerHTML = t; btn.disabled = false; }, 1300); }
  }
}

calcPrice();

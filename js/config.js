const SUPABASE_URL = 'https://semejizqopkauoaqnnty.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0PtxeKyassEu20hdjTa8Kw_dyzLBTW2';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.sb = sb;

function renderStars(rating) {
  const full = Math.max(0, Math.min(5, Math.floor((Number(rating) || 0) + 0.25)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function formatPrice(n) {
  return (Number(n) || 0).toLocaleString('ru') + ' ₽';
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

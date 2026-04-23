export const money = (n) =>
  n == null ? '—' : new Intl.NumberFormat('uz-UZ').format(Number(n)) + " so'm";

export const dateStr = (d) =>
  d ? new Date(d).toLocaleDateString('uz-UZ', { year:'numeric', month:'short', day:'numeric' }) : '—';

export const searchFilter = (items, query, fields) => {
  if (!query || !query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(item =>
    fields.some(f => String(item[f] ?? '').toLowerCase().includes(q))
  );
};

export const enrBadge = (s) => {
  const map = {
    active:   { cls:'badge-green',  label:'Faol' },
    finished: { cls:'badge-blue',   label:'Tugatdi' },
    dropped:  { cls:'badge-red',    label:'Tark etdi' },
  };
  return map[s] || { cls:'badge-gray', label: s || '—' };
};

export const payBadge = (t) => {
  const map = {
    cash:  { cls:'badge-amber',  label:'Naqd' },
    click: { cls:'badge-blue',   label:'Click' },
    payme: { cls:'badge-green',  label:'Payme' },
    karta: { cls:'badge-violet', label:'Karta' },
  };
  return map[t] || { cls:'badge-gray', label: t || '—' };
};

export const roleBadge = (r) => {
  const map = {
    SUPERADMIN: { cls:'badge-red',    label:'Super Admin' },
    ADMIN:      { cls:'badge-violet', label:'Admin' },
  };
  return map[r] || { cls:'badge-gray', label: r || '—' };
};

export const catBadge = (c) => {
  const map = {
    ijara:    { cls:'badge-red',    label:'Ijara' },
    maosh:    { cls:'badge-blue',   label:'Maosh' },
    jihozlar: { cls:'badge-violet', label:'Jihozlar' },
    kommunal: { cls:'badge-amber',  label:'Kommunal' },
    marketing:{ cls:'badge-teal',   label:'Marketing' },
    boshqa:   { cls:'badge-gray',   label:'Boshqa' },
  };
  return map[c] || { cls:'badge-gray', label: c || 'boshqa' };
};

export const currentMonth = () => new Date().toISOString().slice(0, 7);
import React, { useEffect, useState } from 'react';
import { expenseAPI } from '../api';
import { getResult } from '../api';
import { Modal, Table, Badge, Spinner, ConfirmModal, FormGroup, StatCard } from '../components/UI';
import { money, catBadge } from '../utils';
import { useToast } from '../hooks/useToast';

const CATEGORIES = ['ijara','maosh','jihozlar','kommunal','marketing','boshqa'];

export default function ExpensesPage() {
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [from, setFrom]         = useState('');
  const [to, setTo]             = useState('');
  const [modal, setModal]       = useState(false);
  const [del, setDel]           = useState(null);
  const [sumModal, setSumModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({ amount:'', description:'', category:'boshqa', expense_date:'' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to)   params.to   = to;
    const [eR, sR] = await Promise.all([expenseAPI.getAll(Object.keys(params).length ? params : null), expenseAPI.summary(Object.keys(params).length ? params : null)]);
    setExpenses(getResult(eR));
    setSummary(sR.ok ? sR.data?.result : null);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast("Miqdor kiriting", 'error');
    if (!form.description.trim()) return toast("Tavsif kiriting", 'error');
    setSaving(true);
    const body = { amount:Number(form.amount), description:form.description.trim(), category:form.category };
    if (form.expense_date) body.expense_date = form.expense_date;
    const r = await expenseAPI.create(body);
    setSaving(false);
    if (r.ok) { toast("Harajat kiritildi ✓", 'success'); setModal(false); load(); }
    else toast(r.data?.message || 'Xatolik', 'error');
  };

  const doDelete = async () => {
    const r = await expenseAPI.delete(del.id);
    if (r.ok) { toast("O'chirildi", 'success'); setDel(null); load(); }
    else toast(r.data?.message || 'Xatolik', 'error');
  };

  return (
    <div>
      {/* Summary cards */}
      {summary && (
        <div className="stats-grid mb-24">
          <StatCard icon="💰" iconBg="#dcfce7" value={money(summary.total_income)}  label="Jami tushum"  color="var(--green)" />
          <StatCard icon="💸" iconBg="#fee2e2" value={money(summary.total_expense)} label="Jami harajat" color="var(--red)" />
          <StatCard
            icon={summary.net_profit >= 0 ? "📈" : "📉"}
            iconBg={summary.net_profit >= 0 ? "#dcfce7" : "#fee2e2"}
            value={money(Math.abs(summary.net_profit))}
            label={summary.net_profit >= 0 ? "Sof foyda" : "Zarar"}
            color={summary.net_profit >= 0 ? "var(--green)" : "var(--red)"}
          />
          <StatCard icon="📋" iconBg="var(--surface3)" value={summary.expense_count || expenses.length} label="Yozuvlar" />
        </div>
      )}

      {/* Filters */}
      <div className="search-row" style={{ flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
          <div>
            <label className="form-label">Dan</label>
            <input type="date" className="form-control" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Gacha</label>
            <input type="date" className="form-control" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={load}>🔍 Filter</button>
          {(from || to) && <button className="btn btn-ghost" onClick={() => { setFrom(''); setTo(''); setTimeout(load, 0); }}>✕ Tozalash</button>}
        </div>
        <div className="flex-gap" style={{ marginLeft:'auto' }}>
          <button className="btn btn-secondary" onClick={() => setSumModal(true)}>📊 Kategoriyalar</button>
          <button className="btn btn-primary" onClick={() => { setForm({ amount:'', description:'', category:'boshqa', expense_date:'' }); setModal(true); }}>
            + Harajat kiritish
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Harajatlar</div>
          <span className="badge badge-gray">{expenses.length} ta</span>
        </div>
        {loading ? <Spinner /> : (
          <Table headers={['#', 'Miqdor', 'Tavsif', 'Kategoriya', 'Sana', 'Yaratgan', 'Amallar']}>
            {expenses.map(e => {
              const b = catBadge(e.category);
              return (
                <tr key={e.id}>
                  <td className="color-text-4 mono">#{e.id}</td>
                  <td className="mono fw-700" style={{ color:'var(--red)' }}>{money(e.amount)}</td>
                  <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.description}</td>
                  <td><Badge cls={b.cls} label={b.label} /></td>
                  <td className="fs-12">{e.expense_date}</td>
                  <td className="color-text-4 fs-12">{e.creator_name || '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-icon btn-xs" onClick={() => setDel(e)}>🗑</button>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      {/* Create modal */}
      {modal && (
        <Modal title="Yangi harajat" onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Bekor</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 Saqlash'}</button>
          </>}
        >
          <FormGroup label="Miqdor (so'm)" required>
            <input type="number" className="form-control" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="500 000" />
          </FormGroup>
          <FormGroup label="Tavsif" required>
            <input className="form-control" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ijara to'lovi, kompyuter ta'miri..." />
          </FormGroup>
          <div className="form-row">
            <FormGroup label="Kategoriya">
              <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Sana">
              <input type="date" className="form-control" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} />
            </FormGroup>
          </div>
        </Modal>
      )}

      {/* Category summary modal */}
      {sumModal && summary && (
        <Modal title="Kategoriya bo'yicha harajatlar" onClose={() => setSumModal(false)}
          footer={<button className="btn btn-secondary" onClick={() => setSumModal(false)}>Yopish</button>}
        >
          <Table headers={['Kategoriya', 'Miqdor', 'Ulush']}>
            {Object.entries(summary.by_category || {})
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const b   = catBadge(cat);
                const pct = summary.total_expense > 0 ? Math.round((amt / summary.total_expense) * 100) : 0;
                return (
                  <tr key={cat}>
                    <td><Badge cls={b.cls} label={b.label} /></td>
                    <td className="mono fw-700">{money(amt)}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div className="progress-bar" style={{ flex:1 }}>
                          <div className="progress-fill" style={{ width:`${pct}%`, background:'var(--red)' }} />
                        </div>
                        <span className="mono fw-700 fs-12" style={{ width:30 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </Table>
        </Modal>
      )}

      {del && <ConfirmModal msg={`"${del.description}" harajatini o'chirasizmi?`} onConfirm={doDelete} onCancel={() => setDel(null)} />}
    </div>
  );
}

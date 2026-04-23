import React, { useEffect, useState } from 'react';
import { adminAPI } from '../api';
import { getResult } from '../api';
import { Modal, Table, Badge, Spinner, ConfirmModal, SearchBar, FormGroup } from '../components/UI';
import { roleBadge, dateStr, searchFilter } from '../utils';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

// SUPERADMIN foydalanuvchi yarata oladi, ADMIN esa faqat ko'rish/tahrirlash/o'chirish
const ROLES = ['SUPERADMIN', 'ADMIN'];

export default function UsersPage() {
  const toast       = useToast();
  const { user }    = useAuth();
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [modal, setModal]     = useState(null);
  const [del, setDel]         = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ full_name:'', username:'', password:'', role:'ADMIN' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    setUsers(getResult(await adminAPI.getUsers()));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ full_name:'', username:'', password:'', role:'ADMIN' });
    setModal({ mode:'create' });
  };
  const openEdit = (u) => {
    setForm({ full_name:u.full_name, username:u.username, password:'', role:u.role });
    setModal({ mode:'edit', user:u });
  };

  const save = async () => {
    if (!form.full_name || !form.username) return toast("Barcha maydonlarni to'ldiring", 'error');
    if (modal.mode === 'create' && !form.password) return toast('Parol kiriting', 'error');
    setSaving(true);
    const body = { full_name:form.full_name, username:form.username, role:form.role };
    if (form.password) body.password = form.password;
    const r = modal.mode === 'edit'
      ? await adminAPI.updateUser(modal.user.id, body)
      : await adminAPI.createUser(body);
    setSaving(false);
    if (r.ok) { toast(modal.mode === 'edit' ? 'Yangilandi ✓' : 'Yaratildi ✓', 'success'); setModal(null); load(); }
    else toast(r.data?.message || 'Xatolik', 'error');
  };

  const doDelete = async () => {
    const r = await adminAPI.deleteUser(del.id);
    if (r.ok) { toast("O'chirildi", 'success'); setDel(null); load(); }
    else toast(r.data?.message || 'Xatolik', 'error');
  };

  const visible = searchFilter(users, q, ['full_name','username','role']);
  if (loading) return <Spinner />;

  return (
    <div>
      <div className="search-row">
        <SearchBar value={q} onChange={setQ} placeholder="Ism, username, rol..." />
        {/* Faqat SUPERADMIN yangi foydalanuvchi qo'sha oladi */}
        {isSuperAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Yangi foydalanuvchi
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="info-box info-box-amber mb-16">
          <span>ℹ️</span>
          <span>Yangi foydalanuvchi qo'shish faqat SUPERADMIN uchun mavjud.</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Barcha foydalanuvchilar</div>
          <span className="badge badge-gray">{visible.length} ta</span>
        </div>
        <Table headers={['#', 'Ism Familiya', 'Username', 'Rol', 'Yaratilgan', 'Amallar']}>
          {visible.map(u => {
            const rb = roleBadge(u.role);
            return (
              <tr key={u.id}>
                <td className="color-text-4 mono">#{u.id}</td>
                <td className="fw-700">{u.full_name}</td>
                <td className="mono color-text-3" style={{ fontSize:12 }}>{u.username}</td>
                <td><Badge cls={rb.cls} label={rb.label} /></td>
                <td className="color-text-4 fs-12">{dateStr(u.created_at)}</td>
                <td>
                  <div className="flex-gap">
                    <button className="btn btn-secondary btn-icon btn-xs" title="Tahrirlash" onClick={() => openEdit(u)}>✏️</button>
                    <button className="btn btn-danger btn-icon btn-xs" title="O'chirish" onClick={() => setDel(u)}>🗑</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'edit' ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
          onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Bekor</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 Saqlash'}</button>
          </>}
        >
          <FormGroup label="Ism Familiya" required>
            <input className="form-control" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Ism va Familiya" />
          </FormGroup>
          <FormGroup label="Username" required>
            <input className="form-control" value={form.username} onChange={e => set('username', e.target.value)} placeholder="username" />
          </FormGroup>
          <FormGroup label={modal.mode === 'edit' ? "Yangi parol (bo'sh qolsa o'zgarmaydi)" : "Parol"} required={modal.mode === 'create'}>
            <input type="password" className="form-control" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
          </FormGroup>
          <FormGroup label="Rol" required>
            <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </FormGroup>
        </Modal>
      )}

      {del && (
        <ConfirmModal
          msg={`"${del.full_name}" foydalanuvchisini o'chirasizmi?`}
          onConfirm={doDelete}
          onCancel={() => setDel(null)}
        />
      )}
    </div>
  );
}
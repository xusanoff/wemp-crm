import React, { useEffect, useState } from 'react';
import { courseAPI } from '../api';
import { getResult } from '../api';
import { Modal, Table, Spinner, ConfirmModal, SearchBar, FormGroup } from '../components/UI';
import { money } from '../utils';
import { useToast } from '../hooks/useToast';

// Faqat Kurslar — Guruhlar olib tashlandi (yakka ta'limda guruh avtomatik)
export function CoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [modal, setModal]     = useState(null);
  const [del, setDel]         = useState(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ name:'', price:'', duration_months:'1' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    setCourses(getResult(await courseAPI.getAll()));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name:'', price:'', duration_months:'1' }); setModal({ mode:'create' }); };
  const openEdit   = (c) => { setForm({ name:c.name, price:String(c.price), duration_months:String(c.duration_months) }); setModal({ mode:'edit', course:c }); };

  const save = async () => {
    if (!form.name.trim() || !form.price) return toast("Ism va narx kiriting", 'error');
    const dm = parseInt(form.duration_months);
    if (isNaN(dm) || dm < 1) return toast("Davomiylik noto'g'ri", 'error');
    setSaving(true);
    const body = { name:form.name.trim(), price:Number(form.price), duration_months:dm };
    const r = modal.mode === 'edit'
      ? await courseAPI.update(modal.course.id, body)
      : await courseAPI.create(body);
    setSaving(false);
    if (r.ok) { toast(modal.mode==='edit'?'Yangilandi ✓':'Yaratildi ✓','success'); setModal(null); load(); }
    else toast(r.data?.message||'Xatolik','error');
  };

  const doDelete = async () => {
    const r = await courseAPI.delete(del.id);
    if (r.ok) { toast("O'chirildi",'success'); setDel(null); load(); }
    else toast(r.data?.message||'Xatolik','error');
  };

  const visible = q ? courses.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())) : courses;
  if (loading) return <Spinner />;

  return (
    <div>
      <div className="search-row">
        <SearchBar value={q} onChange={setQ} placeholder="Kurs nomi..." />
        <button className="btn btn-primary" onClick={openCreate}>+ Yangi kurs</button>
      </div>

      <div className="info-box info-box-blue mb-16">
        <span>💡</span>
        <span>Kurslar faqat ro'yxat uchun. Har bir o'quvchi uchun alohida dars jadvali avtomatik yaratiladi.</span>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Barcha kurslar</div>
          <span className="badge badge-blue">{visible.length} ta</span>
        </div>
        <Table headers={['#','Nomi','Oylik narx','Davomiylik','Jami narx','Amallar']}>
          {visible.map(c=>(
            <tr key={c.id}>
              <td className="color-text-4 mono">#{c.id}</td>
              <td className="fw-700">{c.name}</td>
              <td className="mono">{money(c.price)}</td>
              <td><span className="badge badge-blue">{c.duration_months} oy</span></td>
              <td className="mono fw-700" style={{color:'var(--blue)'}}>{money(c.total_price)}</td>
              <td>
                <div className="flex-gap">
                  <button className="btn btn-secondary btn-icon btn-xs" onClick={()=>openEdit(c)}>✏️</button>
                  <button className="btn btn-danger btn-icon btn-xs" onClick={()=>setDel(c)}>🗑</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {modal && (
        <Modal title={modal.mode==='edit'?'Kursni tahrirlash':'Yangi kurs'} onClose={()=>setModal(null)}
          footer={<><button className="btn btn-secondary" onClick={()=>setModal(null)}>Bekor</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'⏳...':'💾 Saqlash'}</button></>}
        >
          <FormGroup label="Kurs nomi" required>
            <input className="form-control" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Python dasturlash" />
          </FormGroup>
          <div className="form-row">
            <FormGroup label="Oylik narx (so'm)" required>
              <input type="number" className="form-control" min="0" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="1 200 000" />
            </FormGroup>
            <FormGroup label="Davomiylik (oy)" required>
              <input type="number" className="form-control" min="1" max="36" value={form.duration_months} onChange={e=>set('duration_months',e.target.value)} />
            </FormGroup>
          </div>
          {form.price && form.duration_months && (
            <div className="info-box info-box-blue">
              💡 Jami kurs narxi: <strong>{money(Number(form.price)*Number(form.duration_months))}</strong>
            </div>
          )}
        </Modal>
      )}
      {del && <ConfirmModal msg={`"${del.name}" kursini o'chirasizmi?`} onConfirm={doDelete} onCancel={()=>setDel(null)} />}
    </div>
  );
}
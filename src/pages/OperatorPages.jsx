import React, { useEffect, useState } from 'react';
import { studentAPI, paymentAPI, courseAPI, adminAPI } from '../api';
import { getResult } from '../api';
import { Modal, Table, Badge, Spinner, ConfirmModal, SearchBar, FormGroup } from '../components/UI';
import { enrBadge, payBadge, dateStr, money, searchFilter, currentMonth } from '../utils';
import { useToast } from '../hooks/useToast';

// ─────────────────────────────────────────────────────────────
// STUDENTS — Yakka ta'lim
// Har bir o'quvchi uchun kurs, o'qituvchi, dars vaqti, sana kiritiladi
// Avtomatik: shaxsiy guruh + Du-Ju darslar + qarz yaratiladi
// ─────────────────────────────────────────────────────────────
export function StudentsPage() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [courses, setCourses]   = useState([]);
  const [users, setUsers]       = useState([]);   // O'qituvchilar (barcha userlar)
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState('');
  const [modal, setModal]       = useState(null);
  const [del, setDel]           = useState(null);
  const [detail, setDetail]     = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus]     = useState('active');
  const [saving, setSaving]     = useState(false);

  const emptyForm = { full_name:'', phone_number:'', comment:'', course_id:'', teacher_id:'', lesson_time:'10:00', start_date:'' };
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    const [sR, cR, uR] = await Promise.all([
      studentAPI.getAll(),
      courseAPI.getAll(),
      adminAPI.getUsers(),
    ]);
    setStudents(getResult(sR));
    setCourses(getResult(cR));
    setUsers(getResult(uR));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setModal({ mode:'create' }); };
  const openEdit   = (s) => {
    setForm({
      full_name:    s.full_name,
      phone_number: s.phone_number || '',
      comment:      s.comment || '',
      course_id:    '',   // kurs o'zgartirilmaydi edit da
      teacher_id:   s.teacher_id || '',
      lesson_time:  s.lesson_time?.slice(0,5) || '10:00',
      start_date:   s.start_date || '',
    });
    setModal({ mode:'edit', student:s });
  };

  const openDetail = async (id) => {
    const [sR, dR] = await Promise.all([studentAPI.getOne(id), studentAPI.getDebt(id)]);
    setDetail({ student: sR.data?.result, debt: dR.data?.result });
  };

  const save = async () => {
    if (!form.full_name.trim()) return toast('Ism kiriting', 'error');

    if (modal.mode === 'create') {
      if (!form.course_id)           return toast('Kurs tanlang', 'error');
      if (!form.teacher_id)          return toast("O'qituvchi tanlang", 'error');
      if (!form.lesson_time)         return toast('Dars vaqtini kiriting', 'error');
      if (!form.start_date)          return toast('Boshlanish sanasini kiriting', 'error');

      setSaving(true);
      const body = {
        full_name:    form.full_name.trim(),
        phone_number: form.phone_number || undefined,
        comment:      form.comment || undefined,
        course_id:    Number(form.course_id),
        teacher_id:   Number(form.teacher_id),
        lesson_time:  form.lesson_time,
        start_date:   form.start_date,
      };
      const r = await studentAPI.create(body);
      setSaving(false);
      if (r.ok) {
        const d = r.data?.result;
        toast(d?.info || "O'quvchi yaratildi ✓", 'success');
        setModal(null); load();
      } else toast(r.data?.message || 'Xatolik', 'error');

    } else {
      setSaving(true);
      const body = {
        full_name:    form.full_name.trim(),
        phone_number: form.phone_number || undefined,
        comment:      form.comment || undefined,
        teacher_id:   form.teacher_id ? Number(form.teacher_id) : undefined,
        lesson_time:  form.lesson_time || undefined,
        start_date:   form.start_date || undefined,
      };
      const r = await studentAPI.update(modal.student.id, body);
      setSaving(false);
      if (r.ok) { toast('Yangilandi ✓', 'success'); setModal(null); load(); }
      else toast(r.data?.message || 'Xatolik', 'error');
    }
  };

  const doDelete = async () => {
    const r = await studentAPI.delete(del.id);
    if (r.ok) { toast("O'chirildi", 'success'); setDel(null); load(); }
    else toast(r.data?.message || 'Xatolik', 'error');
  };

  const changeEnrollStatus = async () => {
    if (!statusModal?.enrollment_id) return;
    const r = await studentAPI.updateEnrollment(statusModal.enrollment_id, { status: newStatus });
    if (r.ok) { toast('Holat yangilandi ✓', 'success'); setStatusModal(null); load(); }
    else toast(r.data?.message || 'Xatolik', 'error');
  };

  const selectedCourse = courses.find(c => c.id === Number(form.course_id));
  const visible = searchFilter(students, q, ['full_name','phone_number','course_name','teacher_name']);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="search-row">
        <SearchBar value={q} onChange={setQ} placeholder="Ism, telefon, kurs, o'qituvchi..." />
        <button className="btn btn-primary" onClick={openCreate}>+ Yangi o'quvchi</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Barcha o'quvchilar</div>
          <span className="badge badge-blue">{visible.length} ta</span>
        </div>
        <Table headers={['#','Ism','Telefon','Kurs',"O'qituvchi",'Dars vaqti','Oy','Holat','Amallar']}>
          {visible.map(s => {
            const eb = enrBadge(s.enrollment_status);
            return (
              <tr key={s.id}>
                <td className="color-text-4 mono">#{s.id}</td>
                <td>
                  <button className="btn btn-ghost" style={{padding:0,fontWeight:700,color:'var(--blue)'}} onClick={()=>openDetail(s.id)}>
                    {s.full_name}
                  </button>
                </td>
                <td className="mono">{s.phone_number||'—'}</td>
                <td>
                  {s.course_name
                    ? <><span className="fw-700">{s.course_name}</span><br/><span className="fs-12 color-text-4">{s.lesson_time?.slice(0,5)} · Du-Ju</span></>
                    : '—'}
                </td>
                <td>{s.teacher_name||'—'}</td>
                <td className="fs-12">{s.start_date ? `${s.start_date} → ${s.end_date||'?'}` : '—'}</td>
                <td>
                  {s.current_month_number && s.duration_months ? (
                    <span className="badge badge-violet">{s.current_month_number}-oy / {s.duration_months}</span>
                  ) : '—'}
                </td>
                <td>
                  {s.enrollment_id ? (
                    <button
                      className={`badge ${eb.cls}`}
                      style={{cursor:'pointer',border:'none',font:'inherit'}}
                      onClick={()=>{ setNewStatus(s.enrollment_status); setStatusModal(s); }}
                      title="Holat o'zgartirish"
                    >
                      {eb.label} ✏️
                    </button>
                  ) : (
                    <span className="badge badge-gray">Yozilmagan</span>
                  )}
                </td>
                <td>
                  <div className="flex-gap">
                    <button className="btn btn-secondary btn-icon btn-xs" onClick={()=>openEdit(s)}>✏️</button>
                    <button className="btn btn-danger btn-icon btn-xs" onClick={()=>setDel(s)}>🗑</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>

      {/* Yaratish / Tahrirlash Modali */}
      {modal && (
        <Modal
          title={modal.mode==='edit' ? "O'quvchini tahrirlash" : "Yangi o'quvchi (yakka ta'lim)"}
          onClose={()=>setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={()=>setModal(null)}>Bekor</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'⏳...':'💾 Saqlash'}</button>
          </>}
        >
          <FormGroup label="Ism Familiya" required>
            <input className="form-control" value={form.full_name} onChange={e=>set('full_name',e.target.value)} placeholder="To'liq ism" />
          </FormGroup>
          <FormGroup label="Telefon raqam">
            <input className="form-control" value={form.phone_number} onChange={e=>set('phone_number',e.target.value)} placeholder="+998901234567" />
          </FormGroup>

          {modal.mode === 'create' && (
            <FormGroup label="Kurs" required>
              <select className="form-control" value={form.course_id} onChange={e=>set('course_id',e.target.value)}>
                <option value="">Tanlang...</option>
                {courses.map(c=>(
                  <option key={c.id} value={c.id}>
                    {c.name} — {money(c.total_price)} ({c.duration_months} oy)
                  </option>
                ))}
              </select>
            </FormGroup>
          )}

          <FormGroup label={modal.mode==='edit' ? "O'qituvchini o'zgartirish" : "O'qituvchi"} required={modal.mode==='create'}>
            <select className="form-control" value={form.teacher_id} onChange={e=>set('teacher_id',e.target.value)}>
              <option value="">{modal.mode==='edit' ? '— Ozgartirmaslik —' : 'Tanlang...'}</option>
              {users.map(u=>(
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role})
                </option>
              ))}
            </select>
          </FormGroup>

          <div className="form-row">
            <FormGroup label="Dars vaqti (Du-Ju har kuni)" required={modal.mode==='create'}>
              <input type="time" className="form-control" value={form.lesson_time} onChange={e=>set('lesson_time',e.target.value)} />
            </FormGroup>
            <FormGroup label="Boshlanish sanasi" required={modal.mode==='create'}>
              <input type="date" className="form-control" value={form.start_date} onChange={e=>set('start_date',e.target.value)} />
            </FormGroup>
          </div>

          <FormGroup label="Izoh">
            <textarea className="form-control" rows={2} value={form.comment} onChange={e=>set('comment',e.target.value)} placeholder="Ixtiyoriy..." />
          </FormGroup>

          {modal.mode==='create' && form.course_id && form.teacher_id && form.start_date && (
            <div className="info-box info-box-blue">
              <span>💡</span>
              <div>
                <div>Saqlanishi bilan <strong>avtomatik</strong>:</div>
                <div>✅ Shaxsiy guruh yaratiladi</div>
                <div>✅ Du-Ju ({selectedCourse?.duration_months||'?'} oy) darslar yaratiladi</div>
                <div>✅ Jami qarz: <strong>{money(selectedCourse?.total_price)}</strong> hisoblanadi</div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Holat o'zgartirish */}
      {statusModal && (
        <Modal title={`${statusModal.full_name} — Kurs holati`} onClose={()=>setStatusModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={()=>setStatusModal(null)}>Bekor</button>
            <button className="btn btn-primary" onClick={changeEnrollStatus}>💾 Saqlash</button>
          </>}
        >
          <div className="mb-16">
            <div className="color-text-3 fs-12 mb-4">Kurs</div>
            <div className="fw-700">{statusModal.course_name||'—'}</div>
          </div>
          <FormGroup label="Yangi holat">
            <select className="form-control" value={newStatus} onChange={e=>setNewStatus(e.target.value)}>
              <option value="active">Faol</option>
              <option value="finished">Tugatdi</option>
              <option value="dropped">Tark etdi</option>
            </select>
          </FormGroup>
        </Modal>
      )}

      {/* Batafsil modal */}
      {detail && (
        <Modal title={`${detail.student?.full_name||''} — Batafsil`} onClose={()=>setDetail(null)} size="lg"
          footer={<button className="btn btn-secondary" onClick={()=>setDetail(null)}>Yopish</button>}
        >
          {detail.debt && (
            <div className="grid-3 mb-16">
              {[
                { label:'Jami qarz',   val:money(detail.debt.total_debt),      color:'var(--text)' },
                { label:"To'langan",   val:money(detail.debt.total_paid),      color:'var(--green)' },
                { label:'Qolgan qarz', val:money(detail.debt.total_remaining), color:'var(--red)' },
              ].map((item,i)=>(
                <div key={i} className="card" style={{padding:16,textAlign:'center'}}>
                  <div className="mono fw-700" style={{fontSize:16,color:item.color}}>{item.val}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{color:'var(--text-3)',textAlign:'center',fontSize:13}}>
            ID: #{detail.student?.id} · Tel: {detail.student?.phone_number||'—'}
          </div>
        </Modal>
      )}

      {del && <ConfirmModal msg={`"${del.full_name}" o'quvchisini o'chirasizmi?`} onConfirm={doDelete} onCancel={()=>setDel(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────
export function PaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [del, setDel]           = useState(null);
  const [debtInfo, setDebtInfo] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [q, setQ]               = useState('');
  const [form, setForm] = useState({ student_id:'', payment_type:'cash', for_month:currentMonth(), amount:'', comment:'' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    const [pR, sR] = await Promise.all([paymentAPI.getAll(), studentAPI.getAll()]);
    setPayments(getResult(pR));
    setStudents(getResult(sR));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadDebt = async (id) => {
    if (!id) { setDebtInfo(null); return; }
    const r = await studentAPI.getDebt(id);
    if (r.ok) setDebtInfo(r.data?.result);
  };

  const save = async () => {
    if (!form.student_id)                        return toast("O'quvchi tanlang", 'error');
    if (!form.amount || Number(form.amount) <= 0) return toast("Miqdor kiriting", 'error');
    setSaving(true);
    const body = { ...form, student_id:Number(form.student_id), amount:Number(form.amount) };
    const r = await paymentAPI.create(body);
    setSaving(false);
    if (r.ok) { toast("To'lov qabul qilindi ✓", 'success'); setModal(false); load(); }
    else toast(r.data?.message || 'Xatolik', 'error');
  };

  const doDelete = async () => {
    const r = await paymentAPI.delete(del.id);
    if (r.ok) { toast("O'chirildi", 'success'); setDel(null); load(); }
    else toast(r.data?.message || 'Xatolik', 'error');
  };

  const studentName = id => students.find(s=>s.id===id)?.full_name || `#${id}`;
  const visible = q ? payments.filter(p=>studentName(p.student_id).toLowerCase().includes(q.toLowerCase())) : payments;

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="search-row">
        <SearchBar value={q} onChange={setQ} placeholder="O'quvchi ismi..." />
        <button className="btn btn-primary" onClick={()=>{ setForm({student_id:'',payment_type:'cash',for_month:currentMonth(),amount:'',comment:''}); setDebtInfo(null); setModal(true); }}>
          + To'lov qabul qilish
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">To'lovlar tarixi</div>
          <span className="badge badge-blue">{visible.length} ta</span>
        </div>
        <Table headers={['#',"O'quvchi","Miqdor","Tur","Oy","Sana","Amallar"]}>
          {visible.map(p => {
            const b = payBadge(p.payment_type);
            return (
              <tr key={p.id}>
                <td className="color-text-4 mono">#{p.id}</td>
                <td className="fw-700">{studentName(p.student_id)}</td>
                <td className="mono fw-700" style={{color:'var(--green)'}}>{money(p.amount)}</td>
                <td><Badge cls={b.cls} label={b.label} /></td>
                <td>{p.for_month}</td>
                <td className="color-text-4 fs-12">{dateStr(p.payment_date)}</td>
                <td><button className="btn btn-danger btn-icon btn-xs" onClick={()=>setDel(p)}>🗑</button></td>
              </tr>
            );
          })}
        </Table>
      </div>

      {modal && (
        <Modal title="To'lov qabul qilish" onClose={()=>setModal(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setModal(false)}>Bekor</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'⏳...':'✅ Qabul qilish'}</button></>}
        >
          <FormGroup label="O'quvchi" required>
            <select className="form-control" value={form.student_id} onChange={e=>{ set('student_id',e.target.value); loadDebt(e.target.value); }}>
              <option value="">Tanlang...</option>
              {students.map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </FormGroup>
          {debtInfo && (
            <div className={`info-box mb-16 ${debtInfo.total_remaining>0?'info-box-red':'info-box-green'}`}>
              <span>{debtInfo.total_remaining>0?'⚠️':'✅'}</span>
              <span>Qolgan: <strong>{money(debtInfo.total_remaining)}</strong> · To'langan: <strong>{money(debtInfo.total_paid)}</strong></span>
            </div>
          )}
          <div className="form-row">
            <FormGroup label="To'lov turi" required>
              <select className="form-control" value={form.payment_type} onChange={e=>set('payment_type',e.target.value)}>
                <option value="cash">💵 Naqd</option>
                <option value="click">📱 Click</option>
                <option value="payme">📲 Payme</option>
                <option value="karta">💳 Karta</option>
              </select>
            </FormGroup>
            <FormGroup label="Oy" required>
              <input type="month" className="form-control" value={form.for_month} onChange={e=>set('for_month',e.target.value)} />
            </FormGroup>
          </div>
          <FormGroup label="Miqdor (so'm)" required>
            <input type="number" className="form-control" min="0" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="1 000 000" />
          </FormGroup>
          <FormGroup label="Izoh">
            <textarea className="form-control" rows={2} value={form.comment} onChange={e=>set('comment',e.target.value)} placeholder="Ixtiyoriy..." />
          </FormGroup>
        </Modal>
      )}

      {del && <ConfirmModal msg={`To'lov #${del.id} ni o'chirasizmi?`} onConfirm={doDelete} onCancel={()=>setDel(null)} />}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { studentAPI, lessonAPI, managerAPI, courseModuleAPI } from '../api';
import { getResult } from '../api';
import { Modal, Table, Badge, Spinner, FormGroup } from '../components/UI';
import { useToast } from '../hooks/useToast';

const WEEK_DAYS = ['Du','Se','Cho','Pa','Ju','Sha','Ya'];
const getDayName = (d) => { if (!d) return ''; const w = new Date(d).getDay(); return WEEK_DAYS[w===0?6:w-1]||''; };

// ─── LESSONS ────────────────────────────────────────────────
export function LessonsPage() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [selStudent, setSelStudent] = useState('');
  const [lessons, setLessons]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [filter, setFilter]     = useState('all');
  const [cancelModal, setCancelModal] = useState(false);
  const [moveModal, setMoveModal]     = useState(null);
  const [cancelForm, setCancelForm] = useState({ cancel_date:'', reason:'' });
  const [moveForm, setMoveForm]     = useState({ new_date:'', reason:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async()=>{ setStudents(getResult(await studentAPI.getAll())); })(); }, []);

  const loadLessons = async (sid, f) => {
    if (!sid) return;
    setLoading(true);
    const r = await lessonAPI.byStudent(sid, f==='rescheduled'?{only_rescheduled:'true'}:null);
    setLessons(getResult(r));
    setLoading(false);
  };

  const onStudentChange = (v) => { setSelStudent(v); setFilter('all'); loadLessons(v,'all'); };
  const onFilter = (f) => { setFilter(f); loadLessons(selStudent,f); };

  const doCancel = async () => {
    if (!cancelForm.cancel_date) return toast("Sana tanlang",'error');
    setSaving(true);
    const r = await lessonAPI.cancel({ student_id:Number(selStudent), cancel_date:cancelForm.cancel_date, reason:cancelForm.reason||null });
    setSaving(false);
    if (r.ok) { toast(r.data?.result?.warning||'Bekor qilindi ✓', r.data?.result?.warning?'info':'success'); setCancelModal(false); loadLessons(selStudent,filter); }
    else toast(r.data?.message||'Xatolik','error');
  };

  const doMove = async () => {
    if (!moveForm.new_date) return toast("Yangi sana kiriting",'error');
    setSaving(true);
    const r = await lessonAPI.move(moveModal.id, { new_date:moveForm.new_date, reason:moveForm.reason||null });
    setSaving(false);
    if (r.ok) { toast("Ko'chirildi ✓",'success'); setMoveModal(null); loadLessons(selStudent,filter); }
    else toast(r.data?.message||'Xatolik','error');
  };

  const doRestore = async (id) => {
    const r = await lessonAPI.restore(id);
    if (r.ok) { toast("Qayta faollashtirildi ✓",'success'); loadLessons(selStudent,filter); }
    else toast(r.data?.message||'Xatolik','error');
  };

  const visible = filter==='cancelled' ? lessons.filter(l=>l.is_cancelled) : filter==='rescheduled' ? lessons.filter(l=>l.is_rescheduled) : lessons;
  const selName = students.find(s=>s.id===Number(selStudent))?.full_name||'';

  return (
    <div>
      <div style={{display:'flex',gap:12,alignItems:'flex-end',marginBottom:20}}>
        <div style={{flex:1,maxWidth:360}}>
          <label className="form-label">O'quvchi tanlang</label>
          <select className="form-control" value={selStudent} onChange={e=>onStudentChange(e.target.value)}>
            <option value="">Tanlang...</option>
            {students.map(s=><option key={s.id} value={s.id}>{s.full_name}{s.course_name?` — ${s.course_name}`:''}</option>)}
          </select>
        </div>
        {selStudent && <button className="btn btn-secondary" onClick={()=>{setCancelForm({cancel_date:'',reason:''});setCancelModal(true);}}>🚫 Darsni bekor qilish</button>}
      </div>

      {selStudent && (
        <div className="tab-bar mb-16">
          {[['all','Barchasi'],['cancelled','Bekor'],['rescheduled','Surilgan']].map(([f,l])=>(
            <button key={f} className={`tab-btn${filter===f?' active':''}`} onClick={()=>onFilter(f)}>{l}</button>
          ))}
        </div>
      )}

      {!selStudent ? (
        <div className="card" style={{padding:64,textAlign:'center',color:'var(--text-4)'}}>
          <div style={{fontSize:40,marginBottom:12}}>📅</div>
          <div className="fw-700 fs-13">Darslarni ko'rish uchun o'quvchi tanlang</div>
        </div>
      ) : loading ? <Spinner /> : (
        <div className="card">
          <div className="card-header"><div className="card-title">📅 {selName} — Darslar</div><span className="badge badge-blue">{visible.length} ta</span></div>
          <Table headers={['Sana','Kun','Vaqt','Holat','Sabab','Amallar']}>
            {visible.map(l=>(
              <tr key={l.id}>
                <td className="fw-700">{l.lesson_date}</td>
                <td><span className="badge badge-gray">{getDayName(l.lesson_date)}</span></td>
                <td className="mono">{l.lesson_time?.slice(0,5)}</td>
                <td>{l.is_cancelled?<Badge cls="badge-red" label="Bekor"/>:<Badge cls="badge-green" label="Faol"/>}</td>
                <td className="color-text-4 fs-12">{l.cancel_reason||'—'}</td>
                <td>
                  <div className="flex-gap">
                    {l.is_cancelled && !l.is_rescheduled && <button className="btn btn-success btn-xs" onClick={()=>doRestore(l.id)}>↩️</button>}
                    {!l.is_cancelled && <button className="btn btn-secondary btn-xs" onClick={()=>{setMoveForm({new_date:'',reason:''});setMoveModal(l);}}>📅 Ko'chirish</button>}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {cancelModal && (
        <Modal title="Darsni bekor qilish" onClose={()=>setCancelModal(false)}
          footer={<><button className="btn btn-secondary" onClick={()=>setCancelModal(false)}>Bekor</button><button className="btn btn-danger" onClick={doCancel} disabled={saving}>{saving?'⏳...':'🚫 Bekor qilish'}</button></>}
        >
          <div className="info-box info-box-amber mb-16"><span>⚠️</span><span>Keyingi Du-Ju kunga suriladi.</span></div>
          <FormGroup label="Sana" required><input type="date" className="form-control" value={cancelForm.cancel_date} onChange={e=>setCancelForm(p=>({...p,cancel_date:e.target.value}))}/></FormGroup>
          <FormGroup label="Sabab"><input className="form-control" value={cancelForm.reason} onChange={e=>setCancelForm(p=>({...p,reason:e.target.value}))} placeholder="Kasallik..."/></FormGroup>
        </Modal>
      )}

      {moveModal && (
        <Modal title={`Ko'chirish — ${moveModal.lesson_date}`} onClose={()=>setMoveModal(null)}
          footer={<><button className="btn btn-secondary" onClick={()=>setMoveModal(null)}>Bekor</button><button className="btn btn-primary" onClick={doMove} disabled={saving}>{saving?'⏳...':"📅 Ko'chirish"}</button></>}
        >
          <FormGroup label="Yangi sana" required><input type="date" className="form-control" value={moveForm.new_date} onChange={e=>setMoveForm(p=>({...p,new_date:e.target.value}))}/></FormGroup>
          <FormGroup label="Sabab"><input className="form-control" value={moveForm.reason} onChange={e=>setMoveForm(p=>({...p,reason:e.target.value}))}/></FormGroup>
        </Modal>
      )}
    </div>
  );
}

// ─── ATTENDANCE ──────────────────────────────────────────────
const LESSON_TYPES = [
  { val:'dars',        label:'📖 Dars',        color:'var(--blue)' },
  { val:'savol-javob', label:'❓ Savol-Javob',  color:'var(--violet)' },
  { val:'project',     label:'🛠 Project',      color:'var(--teal)' },
];

export function AttendancePage() {
  const toast = useToast();
  const [students, setStudents]     = useState([]);
  const [selStudent, setSelStudent] = useState(null);
  const [lessons, setLessons]       = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [markModal, setMarkModal]   = useState(null);
  const [attEntry, setAttEntry]     = useState({ status:'keldi', arrival_time:'', module_id:'', module_lesson_id:'', lesson_type:'dars' });
  const [modules, setModules]       = useState([]);   // kurs modullari
  const [moduleLessons, setModuleLessons] = useState([]); // tanlangan modul darslar
  const [reportModal, setReportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => { (async()=>{ setStudents(getResult(await studentAPI.getAll())); setLoading(false); })(); }, []);

  const pickStudent = async (s) => {
    setSelStudent(s);
    setLessons([]); setAttendance([]);
    const [lR, aR] = await Promise.all([managerAPI.getStudentLessons(s.id), managerAPI.getAttendance({student_id:s.id})]);
    setLessons(getResult(lR));
    setAttendance(getResult(aR));
    // Kurs modullarini yuklash
    if (s.course_id) {
      const mR = await courseModuleAPI.getModules(s.course_id);
      setModules(getResult(mR));
    }
  };

  const onModuleChange = async (moduleId) => {
    setAttEntry(p=>({...p, module_id:moduleId, module_lesson_id:''}));
    if (moduleId) {
      const r = await courseModuleAPI.getLessons(moduleId);
      setModuleLessons(getResult(r));
    } else {
      setModuleLessons([]);
    }
  };

  const openMark = async (lesson) => {
    const r = await managerAPI.getAttendance({ lesson_id: lesson.id });
    const existing = getResult(r);
    const found = existing.find(a => a.student_id === selStudent.id);
    setAttEntry({
      status:           found?.status       || 'keldi',
      arrival_time:     found?.arrival_time || '',
      module_id:        found?.module_id    || '',
      module_lesson_id: found?.module_lesson_id || '',
      lesson_type:      found?.lesson_type  || 'dars',
    });
    // Agar mavjud module_id bo'lsa, darslarni yuklaymiz
    if (found?.module_id) {
      const r2 = await courseModuleAPI.getLessons(found.module_id);
      setModuleLessons(getResult(r2));
    }
    setMarkModal(lesson);
  };

  const submitAtt = async () => {
    const records = [{
      student_id:       selStudent.id,
      status:           attEntry.status,
      arrival_time:     attEntry.status==='keldi' ? (attEntry.arrival_time||null) : null,
      module_id:        attEntry.module_id     ? Number(attEntry.module_id)     : null,
      module_lesson_id: attEntry.module_lesson_id ? Number(attEntry.module_lesson_id) : null,
      lesson_type:      attEntry.lesson_type || 'dars',
    }];
    setSaving(true);
    const r = await managerAPI.markAttendance({ lesson_id: markModal.id, records });
    setSaving(false);
    if (r.ok) {
      toast('Davomat saqlandi ✓','success');
      setMarkModal(null);
      const aR = await managerAPI.getAttendance({ student_id: selStudent.id });
      setAttendance(getResult(aR));
    } else toast(r.data?.message||'Xatolik','error');
  };

  const attForLesson = (lid) => attendance.find(a => a.lesson_id === lid);
  const activeLessons = lessons.filter(l=>!l.is_cancelled);
  const keldi   = attendance.filter(a=>a.status==='keldi').length;
  const kelmadi = attendance.filter(a=>a.status==='kelmadi').length;
  const pct     = (keldi+kelmadi) > 0 ? Math.round((keldi/(keldi+kelmadi))*100) : null;

  if (loading) return <Spinner />;

  if (!selStudent) {
    return (
      <div>
        <div style={{marginBottom:18, fontSize:14, color:'var(--text-3)', fontWeight:600}}>Davomat belgilash uchun o'quvchi tanlang:</div>
        <div className="stats-grid">
          {students.map(s=>(
            <div key={s.id} className="stat-card" style={{cursor:'pointer'}} onClick={()=>pickStudent(s)}>
              <div style={{fontSize:28,marginBottom:8}}>🎒</div>
              <div style={{fontWeight:800,fontSize:15}}>{s.full_name}</div>
              <div style={{fontSize:12,color:'var(--text-4)',marginTop:4}}>{s.course_name||'Kurs yo\'q'}</div>
              <div style={{fontSize:12,color:'var(--text-4)'}}>{s.teacher_name||'—'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <button className="btn btn-secondary" onClick={()=>setSelStudent(null)}>← Orqaga</button>
        <div>
          <div className="fw-800" style={{fontSize:16}}>{selStudent.full_name}</div>
          <div className="fs-12 color-text-4">{selStudent.course_name} · {selStudent.teacher_name||'—'} · Du-Ju {selStudent.lesson_time?.slice(0,5)}</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          {pct !== null && (
            <div style={{textAlign:'right'}}>
              <div className="fw-700" style={{fontSize:18,color:pct>=75?'var(--green)':pct>=50?'var(--amber)':'var(--red)'}}>{pct}%</div>
              <div className="fs-12 color-text-4">✅{keldi} ❌{kelmadi}</div>
            </div>
          )}
          <button className="btn btn-secondary btn-sm" onClick={()=>setReportModal(true)}>📊 Hisobot</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">📅 Darslar ({activeLessons.length} ta)</div></div>
        <Table headers={['Sana','Kun','Vaqt','Davomat','Modul / Dars','Tur','Kelgan soat','Amallar']}>
          {activeLessons.map(l => {
            const att = attForLesson(l.id);
            const lt = LESSON_TYPES.find(t=>t.val===att?.lesson_type) || LESSON_TYPES[0];
            return (
              <tr key={l.id}>
                <td className="fw-700">{l.lesson_date}</td>
                <td><span className="badge badge-gray">{getDayName(l.lesson_date)}</span></td>
                <td className="mono">{l.lesson_time?.slice(0,5)}</td>
                <td>
                  {att
                    ? att.status==='keldi'
                      ? <span className="badge badge-green">✅ Keldi</span>
                      : <span className="badge badge-red">❌ Kelmadi</span>
                    : <span className="badge badge-gray">—</span>}
                </td>
                <td className="fs-12">
                  {att?.module_title && <div className="fw-600">{att.module_title}</div>}
                  {att?.module_lesson_title && <div className="color-text-4">{att.module_lesson_title}</div>}
                  {!att?.module_title && '—'}
                </td>
                <td>
                  {att ? <span style={{fontSize:11,fontWeight:700,color:lt.color}}>{lt.label}</span> : '—'}
                </td>
                <td className="mono color-text-3">{att?.arrival_time||'—'}</td>
                <td>
                  <button className="btn btn-secondary btn-xs" onClick={()=>openMark(l)}>
                    {att ? '✏️ O\'zgartirish' : '➕ Belgilash'}
                  </button>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>

      {/* Davomat belgilash modali */}
      {markModal && (
        <Modal
          title={`Davomat — ${markModal.lesson_date} ${getDayName(markModal.lesson_date)}`}
          onClose={()=>setMarkModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={()=>setMarkModal(null)}>Bekor</button>
            <button className="btn btn-primary" onClick={submitAtt} disabled={saving}>{saving?'⏳...':'💾 Saqlash'}</button>
          </>}
        >
          <div className="fw-700 mb-16" style={{fontSize:15}}>{selStudent.full_name}</div>

          {/* Holat */}
          <FormGroup label="Holat" required>
            <div style={{display:'flex',gap:12}}>
              {[{v:'keldi',l:'✅ Keldi',c:'var(--green)',b:'var(--green-l)'},{v:'kelmadi',l:'❌ Kelmadi',c:'var(--red)',b:'var(--red-l)'}].map(o=>(
                <button key={o.v} style={{flex:1,padding:'12px',borderRadius:10,border:`2px solid ${attEntry.status===o.v?o.c:'var(--border)'}`,background:attEntry.status===o.v?o.b:'var(--surface)',color:attEntry.status===o.v?o.c:'var(--text-3)',fontWeight:700,fontSize:15,cursor:'pointer',transition:'all .15s'}}
                  onClick={()=>setAttEntry(p=>({...p,status:o.v,arrival_time:o.v==='kelmadi'?'':p.arrival_time}))}>{o.l}</button>
              ))}
            </div>
          </FormGroup>

          {attEntry.status==='keldi' && (
            <FormGroup label="Kelgan soat (ixtiyoriy)">
              <input type="time" className="form-control" value={attEntry.arrival_time} onChange={e=>setAttEntry(p=>({...p,arrival_time:e.target.value}))} />
            </FormGroup>
          )}

          {/* Dars turi */}
          <FormGroup label="Dars turi">
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {LESSON_TYPES.map(t=>(
                <button key={t.val} style={{padding:'7px 14px',borderRadius:8,border:`2px solid ${attEntry.lesson_type===t.val?t.color:'var(--border)'}`,background:attEntry.lesson_type===t.val?'var(--surface2)':'var(--surface)',color:attEntry.lesson_type===t.val?t.color:'var(--text-3)',fontWeight:600,fontSize:13,cursor:'pointer',transition:'all .15s'}}
                  onClick={()=>setAttEntry(p=>({...p,lesson_type:t.val}))}>{t.label}</button>
              ))}
            </div>
          </FormGroup>

          {/* Modul tanlash */}
          {modules.length > 0 && (
            <>
              <FormGroup label="Modul (ixtiyoriy)">
                <select className="form-control" value={attEntry.module_id} onChange={e=>onModuleChange(e.target.value)}>
                  <option value="">— Modul tanlash —</option>
                  {modules.map(m=><option key={m.id} value={m.id}>{m.order_num}. {m.title}</option>)}
                </select>
              </FormGroup>

              {attEntry.module_id && moduleLessons.length > 0 && (
                <FormGroup label="Dars (ixtiyoriy)">
                  <select className="form-control" value={attEntry.module_lesson_id} onChange={e=>setAttEntry(p=>({...p,module_lesson_id:e.target.value}))}>
                    <option value="">— Dars tanlash —</option>
                    {moduleLessons.map(l=><option key={l.id} value={l.id}>{l.order_num}. {l.title}</option>)}
                  </select>
                </FormGroup>
              )}
            </>
          )}
        </Modal>
      )}

      {/* Hisobot */}
      {reportModal && (
        <Modal title={`📊 ${selStudent.full_name} — Davomat hisoboti`} onClose={()=>setReportModal(false)}
          footer={<button className="btn btn-secondary" onClick={()=>setReportModal(false)}>Yopish</button>}
        >
          <div className="grid-3 mb-16">
            {[{l:'Jami darslar',v:activeLessons.length,c:'var(--text)'},{l:'Keldi',v:keldi,c:'var(--green)'},{l:'Kelmadi',v:kelmadi,c:'var(--red)'}].map((i,idx)=>(
              <div key={idx} className="card" style={{padding:16,textAlign:'center'}}>
                <div className="fw-800" style={{fontSize:28,color:i.c}}>{i.v}</div>
                <div className="stat-label">{i.l}</div>
              </div>
            ))}
          </div>
          {pct !== null && (
            <div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                <div className="progress-bar" style={{flex:1,height:12}}>
                  <div className="progress-fill" style={{width:`${pct}%`,background:pct>=75?'var(--green)':pct>=50?'var(--amber)':'var(--red)',height:'100%'}}/>
                </div>
                <span className="fw-800" style={{fontSize:20,color:pct>=75?'var(--green)':pct>=50?'var(--amber)':'var(--red)'}}>{pct}%</span>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
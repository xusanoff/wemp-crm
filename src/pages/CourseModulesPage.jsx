import React, { useEffect, useState } from 'react';
import { courseAPI, courseModuleAPI } from '../api';
import { getResult } from '../api';
import { Modal, Table, Badge, Spinner, ConfirmModal, FormGroup } from '../components/UI';
import { useToast } from '../hooks/useToast';

const API_BASE = process.env.REACT_APP_API_URL || 'https://wemp-crm-api-qbht.vercel.app/api';

export default function CourseModulesPage() {
  const toast = useToast();

  // Kurs tanlash
  const [courses, setCourses]   = useState([]);
  const [selCourse, setSelCourse] = useState(null);

  // Modullar
  const [modules, setModules]   = useState([]);
  const [selModule, setSelModule] = useState(null);

  // Modul darslar
  const [lessons, setLessons]   = useState([]);

  const [loading, setLoading]   = useState(false);
  const [modal, setModal]       = useState(null);   // { type: 'module'|'lesson', mode: 'create'|'edit', data? }
  const [del, setDel]           = useState(null);   // { type, item }
  const [fileModal, setFileModal] = useState(null); // modul_lesson
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ title:'', order_num:'1', description:'' });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  useEffect(() => {
    (async () => { setCourses(getResult(await courseAPI.getAll())); })();
  }, []);

  const loadModules = async (courseId) => {
    setLoading(true);
    setSelModule(null); setLessons([]);
    const r = await courseModuleAPI.getModules(courseId);
    setModules(getResult(r));
    setLoading(false);
  };

  const loadLessons = async (moduleId) => {
    setLoading(true);
    const r = await courseModuleAPI.getLessons(moduleId);
    setLessons(getResult(r));
    setLoading(false);
  };

  const pickCourse = (c) => { setSelCourse(c); loadModules(c.id); };
  const pickModule = (m) => { setSelModule(m); loadLessons(m.id); };

  const openModal = (type, mode, item=null) => {
    setForm({ title: item?.title||'', order_num: String(item?.order_num||1), description: item?.description||'' });
    setModal({ type, mode, item });
  };

  const save = async () => {
    if (!form.title.trim()) return toast('Nom kiriting', 'error');
    const body = { title: form.title.trim(), order_num: Number(form.order_num)||1, description: form.description||undefined };
    setSaving(true);
    let r;
    if (modal.type === 'module') {
      r = modal.mode === 'create'
        ? await courseModuleAPI.createModule(selCourse.id, body)
        : await courseModuleAPI.updateModule(modal.item.id, body);
    } else {
      r = modal.mode === 'create'
        ? await courseModuleAPI.createLesson(selModule.id, body)
        : await courseModuleAPI.updateLesson(selModule.id, modal.item.id, body);
    }
    setSaving(false);
    if (r.ok) {
      toast(modal.mode === 'create' ? 'Yaratildi ✓' : 'Yangilandi ✓', 'success');
      setModal(null);
      if (modal.type === 'module') loadModules(selCourse.id);
      else loadLessons(selModule.id);
    } else toast(r.data?.message||'Xatolik','error');
  };

  const doDelete = async () => {
    let r;
    if (del.type === 'module') r = await courseModuleAPI.deleteModule(del.item.id);
    else r = await courseModuleAPI.deleteLesson(selModule.id, del.item.id);
    if (r.ok) {
      toast("O'chirildi",'success'); setDel(null);
      if (del.type === 'module') { loadModules(selCourse.id); setSelModule(null); setLessons([]); }
      else loadLessons(selModule.id);
    } else toast(r.data?.message||'Xatolik','error');
  };

  // Fayl yuklash
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading]   = useState(false);

  const doUpload = async () => {
    if (!uploadFile) return toast('Fayl tanlang','error');
    const fd = new FormData();
    fd.append('file', uploadFile);
    setUploading(true);
    const r = await courseModuleAPI.uploadFile(selModule.id, fileModal.id, fd);
    setUploading(false);
    if (r.ok) {
      toast('Fayl yuklandi ✓','success');
      setFileModal(null); setUploadFile(null);
      loadLessons(selModule.id);
    } else toast('Fayl yuklashda xatolik','error');
  };

  const doDeleteFile = async (lesson) => {
    const r = await courseModuleAPI.deleteFile(selModule.id, lesson.id);
    if (r.ok) { toast('Fayl o\'chirildi','success'); loadLessons(selModule.id); }
    else toast(r.data?.message||'Xatolik','error');
  };

  // Fayl URL — backend /file endpoint orqali
  const fileUrl = (lesson) => {
    const base = API_BASE.replace('/api', '');
    return `${base}/api/course-modules/${selModule?.id}/lessons/${lesson.id}/file`;
  };

  return (
    <div>
      {/* Kurs tanlash */}
      {!selCourse ? (
        <div>
          <div style={{marginBottom:16, fontSize:14, color:'var(--text-3)', fontWeight:600}}>
            Modullarni ko'rish uchun kurs tanlang:
          </div>
          <div className="stats-grid">
            {courses.map(c => (
              <div key={c.id} className="stat-card" style={{cursor:'pointer'}} onClick={()=>pickCourse(c)}>
                <div style={{fontSize:28, marginBottom:8}}>📚</div>
                <div style={{fontWeight:800, fontSize:15}}>{c.name}</div>
                <div style={{fontSize:12, color:'var(--text-4)', marginTop:4}}>{c.duration_months} oy</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20}}>
            <button className="btn btn-secondary" onClick={()=>{setSelCourse(null);setSelModule(null);setModules([]);setLessons([]);}}>← Orqaga</button>
            <div className="fw-800" style={{fontSize:16}}>📚 {selCourse.name}</div>
            <button className="btn btn-primary" style={{marginLeft:'auto'}} onClick={()=>openModal('module','create')}>
              + Yangi modul
            </button>
          </div>

          <div className="grid-2">
            {/* Modullar */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">📂 Modullar</div>
                <span className="badge badge-blue">{modules.length} ta</span>
              </div>
              {loading && !selModule ? <Spinner /> : (
                <div style={{maxHeight:500, overflowY:'auto'}}>
                  {modules.length === 0 && (
                    <div style={{padding:40, textAlign:'center', color:'var(--text-4)'}}>Modul yo'q</div>
                  )}
                  {modules.map(m => (
                    <div key={m.id}
                      style={{
                        padding:'13px 16px', borderBottom:'1px solid var(--border)',
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
                        background: selModule?.id === m.id ? 'var(--blue-ll)' : '',
                        transition:'background .1s',
                      }}
                      onClick={()=>pickModule(m)}
                    >
                      <div>
                        <div className="fw-700">{m.order_num}. {m.title}</div>
                        <div className="fs-12 color-text-4">{m.lesson_count} ta dars</div>
                      </div>
                      <div className="flex-gap" onClick={e=>e.stopPropagation()}>
                        <button className="btn btn-secondary btn-icon btn-xs" onClick={()=>openModal('module','edit',m)}>✏️</button>
                        <button className="btn btn-danger btn-icon btn-xs" onClick={()=>setDel({type:'module',item:m})}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Darslar */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  {selModule ? `📝 ${selModule.title}` : '📝 Darslar'}
                </div>
                {selModule && (
                  <button className="btn btn-primary btn-sm" onClick={()=>openModal('lesson','create')}>
                    + Dars
                  </button>
                )}
              </div>
              {!selModule ? (
                <div style={{padding:48, textAlign:'center', color:'var(--text-4)'}}>
                  Modul tanlang
                </div>
              ) : loading ? <Spinner /> : (
                <div style={{maxHeight:500, overflowY:'auto'}}>
                  {lessons.length === 0 && (
                    <div style={{padding:40, textAlign:'center', color:'var(--text-4)'}}>Dars yo'q</div>
                  )}
                  {lessons.map(l => (
                    <div key={l.id} style={{padding:'13px 16px', borderBottom:'1px solid var(--border)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <div>
                          <div className="fw-700">{l.order_num}. {l.title}</div>
                          {l.description && <div className="fs-12 color-text-4">{l.description}</div>}
                        </div>
                        <div className="flex-gap">
                          <button className="btn btn-secondary btn-icon btn-xs" onClick={()=>openModal('lesson','edit',l)}>✏️</button>
                          <button className="btn btn-danger btn-icon btn-xs" onClick={()=>setDel({type:'lesson',item:l})}>🗑</button>
                        </div>
                      </div>

                      {/* Fayl bo'limi */}
                      <div style={{marginTop:8, display:'flex', alignItems:'center', gap:8}}>
                        {l.has_file ? (
                          <>
                            <a
                              href={fileUrl(l)}
                              target="_blank" rel="noreferrer"
                              className="btn btn-success btn-xs"
                            >
                              {l.file_type === 'pdf' ? '📄 PDF ko\'rish' : '🖼 Rasm ko\'rish'}
                            </a>
                            <span className="fs-12 color-text-4">{l.file_name}</span>
                            <button className="btn btn-danger btn-xs" onClick={()=>doDeleteFile(l)}>🗑 Fayl</button>
                          </>
                        ) : (
                          <button className="btn btn-secondary btn-xs" onClick={()=>{ setFileModal(l); setUploadFile(null); }}>
                            📎 Fayl yuklash
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modul/Dars yaratish/tahrirlash modali */}
      {modal && (
        <Modal
          title={`${modal.mode==='create'?'Yangi':'Tahrirlash'} — ${modal.type==='module'?'Modul':'Dars'}`}
          onClose={()=>setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={()=>setModal(null)}>Bekor</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'⏳...':'💾 Saqlash'}</button>
          </>}
        >
          <FormGroup label="Nomi" required>
            <input className="form-control" value={form.title} onChange={e=>set('title',e.target.value)}
              placeholder={modal.type==='module'?"1-Modul: Kirish":"1-Dars: O'zgaruvchilar"} />
          </FormGroup>
          <FormGroup label="Tartib raqami">
            <input type="number" className="form-control" min="1" value={form.order_num} onChange={e=>set('order_num',e.target.value)} />
          </FormGroup>
          <FormGroup label="Tavsif">
            <textarea className="form-control" rows={2} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Ixtiyoriy..." />
          </FormGroup>
        </Modal>
      )}

      {/* Fayl yuklash modali */}
      {fileModal && (
        <Modal
          title={`📎 Fayl yuklash — ${fileModal.title}`}
          onClose={()=>{setFileModal(null);setUploadFile(null);}}
          footer={<>
            <button className="btn btn-secondary" onClick={()=>{setFileModal(null);setUploadFile(null);}}>Bekor</button>
            <button className="btn btn-primary" onClick={doUpload} disabled={uploading||!uploadFile}>
              {uploading?'⏳ Yuklanmoqda...':'📤 Yuklash'}
            </button>
          </>}
        >
          <div className="info-box info-box-blue mb-16">
            <span>💡</span>
            <span>Ruxsat berilgan formatlar: <strong>PDF, PNG, JPG, JPEG, WEBP</strong>. Maksimal hajm: 50MB</span>
          </div>
          <FormGroup label="Fayl tanlang" required>
            <input
              type="file"
              className="form-control"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={e=>setUploadFile(e.target.files[0])}
            />
          </FormGroup>
          {uploadFile && (
            <div className="info-box info-box-green">
              <span>✅</span>
              <span>{uploadFile.name} ({(uploadFile.size/1024/1024).toFixed(2)} MB)</span>
            </div>
          )}
        </Modal>
      )}

      {del && (
        <ConfirmModal
          msg={`"${del.item.title}" ${del.type==='module'?'modulini':'darsni'} o'chirasizmi?`}
          onConfirm={doDelete}
          onCancel={()=>setDel(null)}
        />
      )}
    </div>
  );
}

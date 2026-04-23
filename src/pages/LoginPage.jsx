import React, { useState } from 'react';
import { authAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function LoginPage() {
  const { login }   = useAuth();
  const toast       = useToast();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handle = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) return toast('Username kiriting', 'error');
    if (!form.password)        return toast('Parol kiriting', 'error');

    setLoading(true);
    const r = await authAPI.login({ username: form.username.trim(), password: form.password });
    setLoading(false);

    if (r.ok && r.data?.result) {
      const d = r.data.result;
      // d = { access_token, full_name, user_id, role, type_id }
      login(d.access_token, d);
      toast(`Xush kelibsiz, ${d.full_name || d.role}!`, 'success');
    } else {
      toast(r.data?.message || 'Username yoki parol xato', 'error');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <div className="auth-logo-icon">🎓</div>
          <div>
            <div className="auth-logo-name">EduCRM</div>
            <div className="auth-logo-sub">O'quv markazi boshqaruvi</div>
          </div>
        </div>

        <div className="auth-title">Tizimga kirish</div>
        <div className="auth-sub">Hisobingiz ma'lumotlarini kiriting</div>

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              placeholder="username kiriting"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Parol</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-control"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position:'absolute', right:10, top:'50%',
                  transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer',
                  color:'var(--text-4)', fontSize:16, padding:4
                }}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading
              ? <><span style={{ animation:'spin .7s linear infinite', display:'inline-block' }}>⏳</span> Kirish...</>
              : '→ Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}

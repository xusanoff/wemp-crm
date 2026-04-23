import React from 'react';

// ── Modal ────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, size }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal${size === 'lg' ? ' modal-lg' : size === 'xl' ? ' modal-xl' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Confirm Modal ────────────────────────────────────────────
export function ConfirmModal({ msg, onConfirm, onCancel, dangerous = true }) {
  return (
    <Modal
      title="Tasdiqlash"
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>Bekor qilish</button>
          <button
            className={`btn ${dangerous ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            Tasdiqlash
          </button>
        </>
      }
    >
      <div className="info-box info-box-red">
        <span>⚠️</span>
        <span>{msg}</span>
      </div>
    </Modal>
  );
}

// ── Table ────────────────────────────────────────────────────
export function Table({ headers, children, empty = "Ma'lumot topilmadi", loading }) {
  const hasRows = React.Children.count(children) > 0;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {loading
            ? <tr className="td-empty"><td colSpan={headers.length}><div className="spinner-wrap"><div className="spinner" /></div></td></tr>
            : !hasRows
            ? <tr className="td-empty"><td colSpan={headers.length}>{empty}</td></tr>
            : children}
        </tbody>
      </table>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────
export function Badge({ cls, label }) {
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Spinner ──────────────────────────────────────────────────
export function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>;
}

// ── FormGroup ────────────────────────────────────────────────
export function FormGroup({ label, children, required }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span style={{ color:'var(--red)', marginLeft:3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── SearchBar ────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Qidirish...' }) {
  return (
    <div className="search-input-wrap">
      <input
        className="form-control"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ── PageHeader ───────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="search-row" style={{ marginBottom: 20 }}>
      <div className="flex-1">
        {subtitle && <div className="fs-12 color-text-4 mb-4">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────
export function EmptyState({ icon = '📋', message = "Ma'lumot topilmadi", action }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-4)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color:'var(--text-3)' }}>{message}</div>
      {action}
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────
export function StatCard({ icon, iconBg, value, label, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrap" style={{ background: iconBg || 'var(--surface3)' }}>
        {icon}
      </div>
      <div className="stat-val" style={color ? { color, fontSize: 22 } : {}}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

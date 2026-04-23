import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider }         from './hooks/useToast';

import LoginPage        from './pages/LoginPage';
import Dashboard        from './pages/Dashboard';
import UsersPage        from './pages/UsersPage';
import { StudentsPage, PaymentsPage } from './pages/OperatorPages';
import { CoursesPage }               from './pages/AcademicPages';
import CourseModulesPage             from './pages/CourseModulesPage';
import { LessonsPage, AttendancePage } from './pages/LessonAttendancePages';
import ExpensesPage from './pages/ExpensesPage';

const PAGE_META = {
  dashboard:      { title:'Dashboard',           sub:'Umumiy ko\'rinish' },
  users:          { title:'Foydalanuvchilar',    sub:'Tizim xodimlari boshqaruvi' },
  students:       { title:"O'quvchilar",         sub:'Yakka ta\'lim — kurs, o\'qituvchi, jadval' },
  payments:       { title:"To'lovlar",           sub:'To\'lovlar qabul qilish va tarixi' },
  courses:        { title:'Kurslar',             sub:'O\'quv kurslari boshqaruvi' },
  course_modules: { title:'Kurs Modullari',      sub:'Modullar, darslar va fayl yuklash' },
  lessons:        { title:'Darslar',             sub:'O\'quvchi dars jadvali va boshqaruv' },
  attendance:     { title:'Davomat',             sub:'Davomat belgilash — modul, dars, tur' },
  expenses:       { title:'Harajatlar',          sub:'Moliyaviy xarajatlar va hisobot' },
};

const NAV = [
  { section:'Asosiy', items:[
    { key:'dashboard', icon:'📊', label:'Dashboard', roles:['SUPERADMIN','ADMIN'] },
  ]},
  { section:'Boshqaruv', items:[
    { key:'users', icon:'👥', label:'Foydalanuvchilar', roles:['SUPERADMIN','ADMIN'] },
  ]},
  { section:"O'quvchilar", items:[
    { key:'students', icon:'🎒', label:"O'quvchilar", roles:['SUPERADMIN','ADMIN'] },
    { key:'payments', icon:'💳', label:"To'lovlar",   roles:['SUPERADMIN','ADMIN'] },
  ]},
  { section:"O'quv jarayoni", items:[
    { key:'courses',        icon:'📚', label:'Kurslar',         roles:['SUPERADMIN','ADMIN'] },
    { key:'course_modules', icon:'📂', label:'Kurs Modullari',  roles:['SUPERADMIN','ADMIN'] },
    { key:'lessons',        icon:'📅', label:'Darslar',         roles:['SUPERADMIN','ADMIN'] },
    { key:'attendance',     icon:'✅', label:'Davomat',         roles:['SUPERADMIN','ADMIN'] },
  ]},
  { section:'Moliya', items:[
    { key:'expenses', icon:'💸', label:'Harajatlar', roles:['SUPERADMIN','ADMIN'] },
  ]},
];

const PAGES = {
  dashboard:      Dashboard,
  users:          UsersPage,
  students:       StudentsPage,
  payments:       PaymentsPage,
  courses:        CoursesPage,
  course_modules: CourseModulesPage,
  lessons:        LessonsPage,
  attendance:     AttendancePage,
  expenses:       ExpensesPage,
};

function Sidebar({ page, setPage, user, logout }) {
  const role = user?.role || '';
  return (
    <aside className="sidebar">
      <div className="sidebar-logo-wrap">
        <div className="sidebar-logo-icon">🎓</div>
        <div><div className="sidebar-app-name">EduCRM</div><div className="sidebar-app-sub">Boshqaruv paneli</div></div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(({ section, items }) => {
          const visible = items.filter(i => i.roles.includes(role));
          if (visible.length === 0) return null;
          return (
            <div key={section} className="nav-section">
              <div className="nav-section-label">{section}</div>
              {visible.map(item => (
                <div key={item.key} className={`nav-item${page===item.key?' active':''}`} onClick={()=>setPage(item.key)}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-block">
          <div className="user-avatar">{(user?.full_name||'U').charAt(0).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="user-name" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.full_name||'Foydalanuvchi'}</div>
            <div className="user-role">{role}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Chiqish">⎋</button>
        </div>
      </div>
    </aside>
  );
}

function AppInner() {
  const { user, logout } = useAuth();
  const [page, setPage]  = useState('dashboard');
  if (!user) return <LoginPage />;
  const meta     = PAGE_META[page] || {};
  const PageComp = PAGES[page]     || Dashboard;
  return (
    <div className="layout">
      <Sidebar page={page} setPage={setPage} user={user} logout={logout} />
      <main className="main">
        <div className="topbar">
          <div>
            <div className="page-title">{meta.title||page}</div>
            <div className="page-sub">{meta.sub||''}</div>
          </div>
        </div>
        <div className="content"><PageComp key={page} /></div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider><ToastProvider><AppInner /></ToastProvider></AuthProvider>
  );
}
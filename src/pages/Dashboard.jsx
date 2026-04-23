import React, { useEffect, useState } from 'react';
import { adminAPI, studentAPI, courseAPI, paymentAPI, expenseAPI } from '../api';
import { getResult } from '../api';
import { Spinner, StatCard, Badge, Table } from '../components/UI';
import { money, dateStr, payBadge } from '../utils';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user }  = useAuth();
  const isAdmin   = ['SUPERADMIN','ADMIN'].includes(user?.role);
  const [state, setState] = useState({
    students:[], courses:[], payments:[],
    summary:{}, paySummary:{}, users:[], loading:true
  });

  useEffect(() => {
    (async () => {
      const calls = [
        studentAPI.getAll(),
        courseAPI.getAll(),
        paymentAPI.getAll(),
        expenseAPI.summary(),
        paymentAPI.summary(),
      ];
      if (isAdmin) calls.push(adminAPI.getUsers());
      const [sR, cR, pR, exR, psR, uR] = await Promise.all(calls);
      setState({
        students:   getResult(sR),
        courses:    getResult(cR),
        payments:   getResult(pR),
        summary:    (exR.ok ? exR.data?.result : {}) || {},
        paySummary: (psR.ok ? psR.data?.result : {}) || {},
        users:      uR ? getResult(uR) : [],
        loading: false,
      });
    })();
  }, []);

  if (state.loading) return <Spinner />;
  const { students, courses, payments, summary, paySummary, users } = state;

  const activeStudents = students.filter(s => s.enrollment_status === 'active').length;
  const totalPay   = summary.total_income  || payments.reduce((s,p)=>s+parseFloat(p.amount||0),0);
  const totalExp   = summary.total_expense || 0;
  const netProfit  = summary.net_profit    ?? (totalPay - totalExp);
  const cashTotal  = paySummary?.cash?.total   || 0;
  const onlineTotal= paySummary?.online?.total || 0;

  // Oylik dashboard ma'lumotlari
  const curMonth         = paySummary?.current_month        || '';
  const curExpected      = paySummary?.current_month_expected  || 0;
  const curReceived      = paySummary?.current_month_received  || 0;
  const curRemaining     = paySummary?.current_month_remaining || 0;
  const prevMonth        = paySummary?.prev_month            || '';
  const prevUnpaid       = paySummary?.prev_month_unpaid     || 0;
  const prevDebtors      = paySummary?.prev_month_debtors    || [];
  const prevDebtorCount  = paySummary?.prev_month_debtor_count || 0;

  const curPct = curExpected > 0 ? Math.round((curReceived / curExpected) * 100) : 0;

  const recentPays = [...payments].sort((a,b)=>new Date(b.payment_date)-new Date(a.payment_date)).slice(0,8);

  return (
    <div>
      {/* Asosiy statistika */}
      <div className="stats-grid mb-24">
        <StatCard icon="🎒" iconBg="#dbeafe" value={students.length}   label="Jami o'quvchilar" />
        <StatCard icon="✅" iconBg="#dcfce7" value={activeStudents}     label="Aktiv o'quvchilar" />
        <StatCard icon="📚" iconBg="#ede9fe" value={courses.length}    label="Kurslar" />
        {isAdmin && <StatCard icon="👥" iconBg="#fce7f3" value={users.length} label="Xodimlar" />}
      </div>

      {/* Moliyaviy statistika */}
      <div className="stats-grid mb-24">
        <StatCard icon="💰" iconBg="#dcfce7" value={money(totalPay)} label="Jami tushum"
          sub={`Naqd: ${money(cashTotal)} · Online: ${money(onlineTotal)}`} color="var(--green)" />
        <StatCard icon="💸" iconBg="#fee2e2" value={money(totalExp)} label="Jami harajat" color="var(--red)" />
        <StatCard
          icon={netProfit>=0?"📈":"📉"}
          iconBg={netProfit>=0?"#dcfce7":"#fee2e2"}
          value={money(Math.abs(netProfit))}
          label={netProfit>=0?"Sof foyda":"Zarar"}
          color={netProfit>=0?"var(--green)":"var(--red)"}
        />
      </div>

      {/* Oylik qarz dashboard */}
      <div className="grid-2 mb-24">

        {/* Joriy oy */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📅 Joriy oy to'lovlari</div>
            <span className="badge badge-blue">{curMonth}</span>
          </div>
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20 }}>
              <div style={{ textAlign:'center' }}>
                <div className="fw-700" style={{ fontSize:18, color:'var(--text)' }}>{money(curExpected)}</div>
                <div className="stat-label">Kutilayotgan</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div className="fw-700" style={{ fontSize:18, color:'var(--green)' }}>{money(curReceived)}</div>
                <div className="stat-label">Olingan</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div className="fw-700" style={{ fontSize:18, color:'var(--red)' }}>{money(curRemaining)}</div>
                <div className="stat-label">Qolgan</div>
              </div>
            </div>
            <div style={{ marginBottom:8, display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-4)' }}>
              <span>Bajarilish</span>
              <span className="fw-700" style={{ color:curPct>=80?'var(--green)':curPct>=50?'var(--amber)':'var(--red)' }}>{curPct}%</span>
            </div>
            <div className="progress-bar" style={{ height:10 }}>
              <div className="progress-fill" style={{
                width:`${Math.min(100,curPct)}%`,
                background: curPct>=80?'var(--green)':curPct>=50?'var(--amber)':'var(--red)',
                height:'100%',
              }} />
            </div>
          </div>
        </div>

        {/* O'tgan oy qarzlari */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ O'tgan oy qarzlari</div>
            <span className="badge badge-red">{prevMonth}</span>
          </div>
          <div className="card-body">
            {prevDebtorCount === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--green)' }}>
                <div style={{ fontSize:32 }}>✅</div>
                <div className="fw-700" style={{ marginTop:8 }}>Barcha to'lovlar amalga oshirilgan!</div>
              </div>
            ) : (
              <>
                <div className="info-box info-box-red mb-16">
                  <span>⚠️</span>
                  <span>
                    <strong>{prevDebtorCount} ta o'quvchi</strong> o'tgan oy to'lovini amalga oshirmagan.
                    Jami: <strong>{money(prevUnpaid)}</strong>
                  </span>
                </div>
                <div style={{ maxHeight:180, overflowY:'auto' }}>
                  {prevDebtors.map((d, i) => (
                    <div key={i} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13,
                    }}>
                      <div>
                        <span className="fw-700">{d.student_name}</span>
                      </div>
                      <div style={{ color:'var(--red)', fontWeight:700 }} className="mono">
                        {money(d.remaining)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* So'nggi to'lovlar */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">💳 So'nggi to'lovlar</div>
          <span className="badge badge-blue">{payments.length} ta jami</span>
        </div>
        <Table headers={["O'quvchi ID","Miqdor","Tur","Oy","Sana"]}>
          {recentPays.map(p => {
            const b = payBadge(p.payment_type);
            return (
              <tr key={p.id}>
                <td className="fw-700 color-blue">#{p.student_id}</td>
                <td className="mono fw-700" style={{color:'var(--green)'}}>{money(p.amount)}</td>
                <td><Badge cls={b.cls} label={b.label} /></td>
                <td>{p.for_month}</td>
                <td className="color-text-4">{dateStr(p.payment_date)}</td>
              </tr>
            );
          })}
        </Table>
      </div>
    </div>
  );
}
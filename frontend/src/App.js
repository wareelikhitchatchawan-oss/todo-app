import React, { useState } from 'react';
import { login, createUser } from './api';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import Sidebar from './components/Sidebar';
import styles from './App.module.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('dashboard');
  const [filterGroup, setFilterGroup] = useState(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) return setError('กรุณากรอกอีเมลและรหัสผ่าน');
    try {
      const u = await login(form.email, form.password);
      setUser(u);
      setUsers(prev => prev.find(x => x.id === u.id) ? prev : [...prev, u]);
      setError('');
    } catch (err) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return setError('กรุณากรอกข้อมูลให้ครบ');
    try {
      const u = await createUser(form);
      setUser(u);
      setUsers(prev => [...prev, u]);
      setError('');
    } catch (err) {
      setError('ไม่สามารถสร้างบัญชีได้ อีเมลอาจถูกใช้แล้ว');
    }
  };

  if (!user) return (
    <div className={styles.loginWrap}>
      <div className={styles.loginBox}>
        <h1>📋 Todo App</h1>
        <p>{mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}</p>
        {error && <div className={styles.errorMsg}>{error}</div>}
        <div className={styles.newUserForm}>
          {mode === 'register' && (
            <input placeholder="ชื่อ" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          )}
          <input placeholder="อีเมล" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <input placeholder="รหัสผ่าน" type="password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())} />
        </div>
        {mode === 'login' ? (
          <>
            <button className={styles.btnPrimary} onClick={handleLogin}>เข้าสู่ระบบ</button>
            <button className={styles.btnOutline} onClick={() => { setMode('register'); setError(''); }}>
              สร้างบัญชีใหม่
            </button>
          </>
        ) : (
          <>
            <button className={styles.btnPrimary} onClick={handleRegister}>สร้างบัญชี</button>
            <button className={styles.btnOutline} onClick={() => { setMode('login'); setError(''); }}>
              มีบัญชีแล้ว? เข้าสู่ระบบ
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.layout}>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        user={user}
        users={users}
        onUserChange={setUser}
        onUserAdd={u => setUsers(prev => [...prev, u])}
        onLogout={() => { setUser(null); setForm({ name: '', email: '', password: '' }); }}
        view={view}
        onViewChange={(v) => { setView(v); setSidebarOpen(false); }}
        filterGroup={filterGroup}
        onFilterGroup={(g) => { setFilterGroup(g); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
      />
      <main className={styles.main}>
        {view === 'dashboard'
          ? <Dashboard user={user} onViewTasks={() => setView('tasks')} />
          : <TaskList user={user} filterGroup={filterGroup} />
        }
      </main>
      <button className={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  );
}
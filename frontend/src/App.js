import React, { useState, useEffect } from 'react';
import { getUsers } from './api';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import Sidebar from './components/Sidebar';
import styles from './App.module.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('dashboard');
  const [filterGroup, setFilterGroup] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getUsers().then(data => {
      setUsers(data);
      if (data.length > 0) setUser(data[0]); // เลือก user แรก
    });
  }, []);

  if (!user) {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginBox}>
          <h1>📋 Todo App</h1>
          <p>ไม่มีผู้ใช้งานในระบบ</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        users={users}
        onUserChange={setUser}
        onLogout={() => setUser(null)}
        view={view}
        onViewChange={(v) => {
          setView(v);
          setSidebarOpen(false);
        }}
        filterGroup={filterGroup}
        onFilterGroup={(g) => {
          setFilterGroup(g);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
      />

      <main className={styles.main}>
        {view === 'dashboard' ? (
          <Dashboard user={user} onViewTasks={() => setView('tasks')} />
        ) : (
          <TaskList user={user} filterGroup={filterGroup} />
        )}
      </main>

      <button
        className={styles.menuBtn}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  );
}
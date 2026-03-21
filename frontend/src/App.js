import React, { useState, useEffect } from 'react';
import { getUsers, createUser } from './api';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import Sidebar from './components/Sidebar';
import styles from './App.module.css';

const GUEST_KEY = 'todo_guest_user_id';

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('dashboard');
  const [filterGroup, setFilterGroup] = useState(null);

  useEffect(() => {
    const init = async () => {
      const allUsers = await getUsers();
      setUsers(allUsers);

      // ตรวจว่ามี guest user เดิมใน localStorage หรือยัง
      const savedId = localStorage.getItem(GUEST_KEY);
      if (savedId) {
        const existing = allUsers.find(u => u.id === +savedId);
        if (existing) { setUser(existing); return; }
      }

      // สร้าง guest user ใหม่
      const guest = await createUser({
        name: 'Guest',
        email: `guest_${Date.now()}@temp.com`,
      });
      localStorage.setItem(GUEST_KEY, guest.id);
      setUsers(prev => [...prev, guest]);
      setUser(guest);
    };
    init();
  }, []);

  if (!user) return (
    <div className={styles.loginWrap}>
      <div className={styles.loginBox}>
        <p>กำลังโหลด...</p>
      </div>
    </div>
  );

  return (
    <div className={styles.layout}>
      <Sidebar
        user={user}
        users={users}
        onUserChange={setUser}
        view={view}
        onViewChange={setView}
        filterGroup={filterGroup}
        onFilterGroup={setFilterGroup}
      />
      <main className={styles.main}>
        {view === 'dashboard'
          ? <Dashboard user={user} onViewTasks={() => setView('tasks')} />
          : <TaskList user={user} filterGroup={filterGroup} />
        }
      </main>
    </div>
  );
}
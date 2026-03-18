import React, { useState, useEffect } from 'react';
import { getGroups, createGroup, deleteGroup, createUser } from '../api';
import styles from './Sidebar.module.css';

const COLORS = ['#6366f1','#22c55e','#ef4444','#f59e0b','#06b6d4','#ec4899'];

export default function Sidebar({ user, users, onUserChange, onUserAdd, onLogout, view, onViewChange, filterGroup, onFilterGroup, isOpen }) {
  const [groups, setGroups] = useState([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', color: COLORS[0] });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    if (user) getGroups(user.id).then(setGroups);
  }, [user]);

  const handleAddGroup = async () => {
    if (!newGroup.name) return;
    const g = await createGroup({ user_id: user.id, ...newGroup });
    setGroups(prev => [...prev, g]);
    setNewGroup({ name: '', color: COLORS[0] });
    setShowAddGroup(false);
  };

  const handleDeleteGroup = async (id, e) => {
    e.stopPropagation();
    await deleteGroup(id);
    setGroups(prev => prev.filter(g => g.id !== id));
    if (filterGroup === id) onFilterGroup(null);
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    const u = await createUser(newUser);
    onUserAdd(u);
    onUserChange(u);
    setNewUser({ name: '', email: '', password: '' });
    setShowAddUser(false);
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      {/* User info */}
      <div className={styles.userSection}>
        <div className={styles.avatar}>{user.name[0]}</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userEmail}>{user.email}</span>
        </div>
      </div>

      {/* Add User Button */}
      <div className={styles.addUserSection}>
        {showAddUser ? (
          <div className={styles.addUserForm}>
            <input placeholder="ชื่อ" value={newUser.name}
              onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} />
            <input placeholder="อีเมล" value={newUser.email}
              onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
            <input placeholder="รหัสผ่าน" type="password" value={newUser.password}
              onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAddUser()} />
            <div className={styles.addUserBtns}>
              <button className={styles.cancelUserBtn} onClick={() => setShowAddUser(false)}>ยกเลิก</button>
              <button className={styles.confirmBtn} onClick={handleAddUser}>สร้าง</button>
            </div>
          </div>
        ) : (
          <button className={styles.addUserBtn} onClick={() => setShowAddUser(true)}>
            + สร้างผู้ใช้ใหม่
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navBtn} ${view === 'dashboard' ? styles.active : ''}`}
          onClick={() => { onViewChange('dashboard'); onFilterGroup(null); }}>
          📊 Dashboard
        </button>
        <button
          className={`${styles.navBtn} ${view === 'tasks' && !filterGroup ? styles.active : ''}`}
          onClick={() => { onViewChange('tasks'); onFilterGroup(null); }}>
          📋 งานทั้งหมด
        </button>
      </nav>

      {/* Groups */}
      <div className={styles.groupSection}>
        <div className={styles.groupHeader}>
          <span>หมวดหมู่</span>
          <button className={styles.addGroupBtn} onClick={() => setShowAddGroup(!showAddGroup)}>+</button>
        </div>

        {showAddGroup && (
          <div className={styles.addGroupForm}>
            <input placeholder="ชื่อหมวดหมู่" value={newGroup.name}
              onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleAddGroup()} />
            <div className={styles.colorPicker}>
              {COLORS.map(c => (
                <button key={c} className={`${styles.colorDot} ${newGroup.color === c ? styles.selectedColor : ''}`}
                  style={{ background: c }} onClick={() => setNewGroup(p => ({ ...p, color: c }))} />
              ))}
            </div>
            <button className={styles.confirmBtn} onClick={handleAddGroup}>เพิ่ม</button>
          </div>
        )}

        {groups.map(g => (
          <button key={g.id}
            className={`${styles.groupBtn} ${filterGroup === g.id ? styles.activeGroup : ''}`}
            onClick={() => { onFilterGroup(g.id); onViewChange('tasks'); }}>
            <span className={styles.groupDot} style={{ background: g.color }} />
            <span className={styles.groupName}>{g.name}</span>
            <span className={styles.deleteGroup} onClick={e => handleDeleteGroup(g.id, e)}>×</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button className={styles.logoutBtn} onClick={onLogout}>
        🚪 ออกจากระบบ
      </button>
    </aside>
  );
}
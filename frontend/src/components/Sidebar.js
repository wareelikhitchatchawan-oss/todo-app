import React, { useState, useEffect } from 'react';
import { getGroups, createGroup, deleteGroup } from '../api';
import styles from './Sidebar.module.css';

const COLORS = ['#6366f1','#22c55e','#ef4444','#f59e0b','#06b6d4','#ec4899'];

export default function Sidebar({ user, users, onUserChange, view, onViewChange, filterGroup, onFilterGroup }) {
  const [groups, setGroups] = useState([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', color: COLORS[0] });

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

  return (
    <aside className={styles.sidebar}>
      <div className={styles.appHeader}>
        <span className={styles.appIcon}>📋</span>
        <span className={styles.appName}>Todo App</span>
      </div>

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
    </aside>
  );
}
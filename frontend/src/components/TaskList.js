import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask, getGroups, getUsers } from '../api';
import styles from './TaskList.module.css';

const PRIORITIES = { low: { label: 'ต่ำ', color: '#22c55e' }, medium: { label: 'กลาง', color: '#f59e0b' }, high: { label: 'สูง', color: '#ef4444' } };
const STATUSES = { todo: 'รอดำเนินการ', inprogress: 'กำลังทำ', done: 'เสร็จแล้ว' };

const emptyForm = { title: '', description: '', group_id: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' };

function MentionInput({ value, onChange, users }) {
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState([]);
  const ref = useRef();

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const atIdx = val.lastIndexOf('@');
    if (atIdx !== -1) {
      const q = val.slice(atIdx + 1);
      setQuery(q);
      setFiltered(users.filter(u => u.name.toLowerCase().includes(q.toLowerCase())));
      setShow(true);
    } else {
      setShow(false);
    }
  };

  const handleSelect = (name) => {
    const atIdx = value.lastIndexOf('@');
    onChange(value.slice(0, atIdx) + name);
    setShow(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <input
        value={value}
        onChange={handleChange}
        placeholder="พิมพ์ @ เพื่อแท็กเพื่อน"
      />
      {show && filtered.length > 0 && (
        <div className={styles.mentionDropdown}>
          {filtered.map(u => (
            <div key={u.id} className={styles.mentionItem} onClick={() => handleSelect(u.name)}>
              <span className={styles.mentionAvatar}>{u.name[0]}</span>
              {u.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskList({ user, filterGroup }) {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadTasks = useCallback(() => {
    getTasks(user.id, {
      search: search || undefined,
      status: filterStatus || undefined,
      priority: filterPriority || undefined,
      group_id: filterGroup || undefined,
    }).then(setTasks);
  }, [user.id, search, filterStatus, filterPriority, filterGroup]);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => { getGroups(user.id).then(setGroups); }, [user.id]);
  useEffect(() => { getUsers().then(setUsers); }, []);

  const openAdd = () => { setForm(emptyForm); setEditTask(null); setShowForm(true); };
  const openEdit = (task) => {
    setForm({
      title: task.title, description: task.description || '',
      group_id: task.group_id || '', status: task.status,
      priority: task.priority, due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assigned_to: task.assigned_to || ''
    });
    setEditTask(task);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title) return;
    if (editTask) {
      await updateTask(editTask.id, { ...form, user_id: user.id, group_id: form.group_id || null });
    } else {
      await createTask({ ...form, user_id: user.id, group_id: form.group_id || null });
    }
    setShowForm(false);
    loadTasks();
  };

  const handleStatusChange = async (id, status) => {
    await updateTaskStatus(id, status);
    loadTasks();
  };

  const handleDelete = async (id) => {
    if (window.confirm('ลบงานนี้หรือไม่?')) {
      await deleteTask(id);
      loadTasks();
    }
  };

  const groupName = filterGroup ? groups.find(g => g.id === filterGroup)?.name : null;

  return (
    <div className={styles.taskList}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{groupName ? `📁 ${groupName}` : '📋 งานทั้งหมด'}</h1>
          <p className={styles.count}>{tasks.length} รายการ</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>+ เพิ่มงานใหม่</button>
      </div>

      <div className={styles.filters}>
        <input className={styles.search} placeholder="🔍 ค้นหางาน..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className={styles.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">สถานะทั้งหมด</option>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={styles.select} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">ความสำคัญทั้งหมด</option>
          {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {tasks.length === 0
        ? <div className={styles.empty}>ไม่มีงานที่ตรงกับเงื่อนไข</div>
        : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>งาน</th>
                  <th>หมวดหมู่</th>
                  <th>สถานะ</th>
                  <th>ความสำคัญ</th>
                  <th>ผู้รับผิดชอบ</th>
                  <th>กำหนดส่ง</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  return (
                    <tr key={task.id} className={task.status === 'done' ? styles.donRow : ''}>
                      <td>
                        <div className={styles.taskTitle}>{task.title}</div>
                        {task.description && <div className={styles.taskDesc}>{task.description}</div>}
                      </td>
                      <td>
                        {task.group_name
                          ? <span className={styles.groupTag} style={{ background: task.group_color + '22', color: task.group_color }}>{task.group_name}</span>
                          : <span className={styles.noGroup}>-</span>}
                      </td>
                      <td>
                        <select className={styles.statusSelect}
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                          style={{ color: task.status === 'done' ? '#22c55e' : task.status === 'inprogress' ? '#f59e0b' : '#8888a8' }}>
                          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                      <td>
                        <span className={styles.priorityTag} style={{ color: PRIORITIES[task.priority].color, background: PRIORITIES[task.priority].color + '22' }}>
                          {PRIORITIES[task.priority].label}
                        </span>
                      </td>
                      <td className={styles.assignedCell}>
                        {task.assigned_to
                          ? <span className={styles.mentionTag}>@{task.assigned_to}</span>
                          : '-'}
                      </td>
                      <td className={`${styles.dueCell} ${isOverdue ? styles.overdue : ''}`}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.editBtn} onClick={() => openEdit(task)}>✏️</button>
                          <button className={styles.deleteBtn} onClick={() => handleDelete(task.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }

      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editTask ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>×</button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formFull}>
                <label>ชื่องาน *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="ระบุชื่องาน" />
              </div>
              <div className={styles.formFull}>
                <label>รายละเอียด</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
              </div>
              <div>
                <label>หมวดหมู่</label>
                <select value={form.group_id} onChange={e => setForm(p => ({ ...p, group_id: e.target.value }))}>
                  <option value="">ไม่ระบุ</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label>สถานะ</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label>ความสำคัญ</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label>กำหนดส่ง</label>
                <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div className={styles.formFull}>
                <label>แท็กผู้รับผิดชอบ</label>
                <MentionInput
                  value={form.assigned_to}
                  onChange={val => setForm(p => ({ ...p, assigned_to: val }))}
                  users={users}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button className={styles.submitBtn} onClick={handleSubmit}>
                {editTask ? 'บันทึกการแก้ไข' : 'เพิ่มงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
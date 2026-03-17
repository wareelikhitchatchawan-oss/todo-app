import React, { useState, useEffect } from 'react';
import { getStats, getTasks } from '../api';
import styles from './Dashboard.module.css';

const STATUS_LABELS = { todo: 'รอดำเนินการ', inprogress: 'กำลังทำ', done: 'เสร็จแล้ว' };
const STATUS_COLORS = { todo: '#8888a8', inprogress: '#f59e0b', done: '#22c55e' };

export default function Dashboard({ user, onViewTasks }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    getStats(user.id).then(setStats);
    getTasks(user.id).then(data => setRecent(data.slice(0, 5)));
  }, [user]);

  if (!stats) return <div className={styles.loading}>กำลังโหลด...</div>;

  const todo = stats.byStatus.find(s => s.status === 'todo')?.count || 0;
  const inprogress = stats.byStatus.find(s => s.status === 'inprogress')?.count || 0;
  const done = stats.byStatus.find(s => s.status === 'done')?.count || 0;
  const pct = stats.total > 0 ? Math.round((done / stats.total) * 100) : 0;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>สวัสดี, {user.name} 👋</h1>
          <p className={styles.sub}>มาดูภาพรวมงานของคุณกัน</p>
        </div>
        <button className={styles.viewAllBtn} onClick={onViewTasks}>ดูงานทั้งหมด →</button>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>งานทั้งหมด</span>
          <span className={styles.cardNum}>{stats.total}</span>
        </div>
        <div className={`${styles.card} ${styles.cardYellow}`}>
          <span className={styles.cardLabel}>กำลังทำ</span>
          <span className={styles.cardNum}>{inprogress}</span>
        </div>
        <div className={`${styles.card} ${styles.cardGreen}`}>
          <span className={styles.cardLabel}>เสร็จแล้ว</span>
          <span className={styles.cardNum}>{done}</span>
        </div>
        <div className={`${styles.card} ${styles.cardRed}`}>
          <span className={styles.cardLabel}>เกินกำหนด</span>
          <span className={styles.cardNum}>{stats.overdue}</span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>ความคืบหน้าโดยรวม</span>
          <span className={styles.pct}>{pct}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.progressLabels}>
          <span>{todo} รอ</span>
          <span>{inprogress} กำลังทำ</span>
          <span>{done} เสร็จ</span>
        </div>
      </div>

      <div className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>งานล่าสุด</h2>
        {recent.length === 0
          ? <p className={styles.empty}>ยังไม่มีงาน ลองเพิ่มงานใหม่ดูสิ!</p>
          : recent.map(task => (
            <div key={task.id} className={styles.recentTask}>
              <span className={styles.statusDot} style={{ background: STATUS_COLORS[task.status] }} />
              <div className={styles.taskInfo}>
                <span className={styles.taskTitle}>{task.title}</span>
                {task.group_name && (
                  <span className={styles.taskGroup} style={{ background: task.group_color + '22', color: task.group_color }}>
                    {task.group_name}
                  </span>
                )}
              </div>
              <span className={styles.taskStatus}>{STATUS_LABELS[task.status]}</span>
              {task.due_date && (
                <span className={styles.taskDue}>
                  {new Date(task.due_date).toLocaleDateString('th-TH')}
                </span>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
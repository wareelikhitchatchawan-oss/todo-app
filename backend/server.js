if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'todo_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// ---- USERS ----
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'ต้องระบุชื่อและอีเมล' });
  try {
    const [result] = await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password || null]);
    const [user] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json(user[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- LOGIN ----
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'ต้องระบุอีเมล' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    const user = rows[0];
    if (user.password && user.password !== password) {
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- GROUPS ----
app.get('/api/users/:userId/groups', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM task_groups WHERE user_id = ? ORDER BY created_at ASC', [req.params.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups', async (req, res) => {
  const { user_id, name, color } = req.body;
  if (!user_id || !name) return res.status(400).json({ error: 'ต้องระบุ user_id และชื่อกลุ่ม' });
  try {
    const [result] = await pool.query('INSERT INTO task_groups (user_id, name, color) VALUES (?, ?, ?)', [user_id, name, color || '#6366f1']);
    const [group] = await pool.query('SELECT * FROM task_groups WHERE id = ?', [result.insertId]);
    res.status(201).json(group[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM task_groups WHERE id = ?', [req.params.id]);
    res.json({ message: 'ลบกลุ่มสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- TASKS ----
app.get('/api/users/:userId/tasks', async (req, res) => {
  const { status, priority, group_id, search } = req.query;
  let query = `SELECT t.*, tg.name as group_name, tg.color as group_color FROM tasks t LEFT JOIN task_groups tg ON t.group_id = tg.id WHERE t.user_id = ?`;
  const params = [req.params.userId];
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (group_id) { query += ' AND t.group_id = ?'; params.push(group_id); }
  if (search) { query += ' AND t.title LIKE ?'; params.push(`%${search}%`); }
  query += ' ORDER BY t.created_at DESC';
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { user_id, group_id, title, description, status, priority, due_date, assigned_to } = req.body;
  if (!user_id || !title) return res.status(400).json({ error: 'ต้องระบุ user_id และชื่องาน' });
  try {
    const [result] = await pool.query(
      `INSERT INTO tasks (user_id, group_id, title, description, status, priority, due_date, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, group_id || null, title, description || null, status || 'todo', priority || 'medium', due_date || null, assigned_to || null]
    );
    const [task] = await pool.query(
      `SELECT t.*, tg.name as group_name, tg.color as group_color FROM tasks t LEFT JOIN task_groups tg ON t.group_id = tg.id WHERE t.id = ?`,
      [result.insertId]
    );
    res.status(201).json(task[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { group_id, title, description, status, priority, due_date, assigned_to } = req.body;
  try {
    await pool.query(
      `UPDATE tasks SET group_id=?, title=?, description=?, status=?, priority=?, due_date=?, assigned_to=? WHERE id=?`,
      [group_id || null, title, description || null, status, priority, due_date || null, assigned_to || null, req.params.id]
    );
    const [task] = await pool.query(
      `SELECT t.*, tg.name as group_name, tg.color as group_color FROM tasks t LEFT JOIN task_groups tg ON t.group_id = tg.id WHERE t.id = ?`,
      [req.params.id]
    );
    res.json(task[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['todo', 'inprogress', 'done'].includes(status)) return res.status(400).json({ error: 'status ไม่ถูกต้อง' });
  try {
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'อัปเดตสถานะสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'ลบ task สำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const [total] = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [req.params.userId]);
    const [byStatus] = await pool.query('SELECT status, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY status', [req.params.userId]);
    const [overdue] = await pool.query(`SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date < CURDATE() AND status != 'done'`, [req.params.userId]);
    const [dueToday] = await pool.query(`SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date = CURDATE() AND status != 'done'`, [req.params.userId]);
    res.json({ total: total[0].count, byStatus, overdue: overdue[0].count, dueToday: dueToday[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
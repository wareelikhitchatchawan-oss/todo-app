if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// สร้างตารางอัตโนมัติถ้ายังไม่มี
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS task_groups (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(20) DEFAULT '#6366f1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES task_groups(id) ON DELETE SET NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'todo',
      priority VARCHAR(20) DEFAULT 'medium',
      due_date DATE,
      assigned_to VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Tables ready');
};
initDB();

// ---- USERS ----
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'ต้องระบุชื่อและอีเมล' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, password || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- LOGIN ----
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'ต้องระบุอีเมล' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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
    const { rows } = await pool.query(
      'SELECT * FROM task_groups WHERE user_id = $1 ORDER BY created_at ASC',
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups', async (req, res) => {
  const { user_id, name, color } = req.body;
  if (!user_id || !name) return res.status(400).json({ error: 'ต้องระบุ user_id และชื่อกลุ่ม' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO task_groups (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [user_id, name, color || '#6366f1']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM task_groups WHERE id = $1', [req.params.id]);
    res.json({ message: 'ลบกลุ่มสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- TASKS ----
app.get('/api/users/:userId/tasks', async (req, res) => {
  const { status, priority, group_id, search } = req.query;
  let query = `SELECT t.*, tg.name as group_name, tg.color as group_color
               FROM tasks t LEFT JOIN task_groups tg ON t.group_id = tg.id
               WHERE t.user_id = $1`;
  const params = [req.params.userId];
  let i = 2;
  if (status)   { query += ` AND t.status = $${i++}`;   params.push(status); }
  if (priority) { query += ` AND t.priority = $${i++}`; params.push(priority); }
  if (group_id) { query += ` AND t.group_id = $${i++}`; params.push(group_id); }
  if (search)   { query += ` AND t.title ILIKE $${i++}`; params.push(`%${search}%`); }
  query += ' ORDER BY t.created_at DESC';
  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { user_id, group_id, title, description, status, priority, due_date, assigned_to } = req.body;
  if (!user_id || !title) return res.status(400).json({ error: 'ต้องระบุ user_id และชื่องาน' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (user_id, group_id, title, description, status, priority, due_date, assigned_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [user_id, group_id || null, title, description || null, status || 'todo', priority || 'medium', due_date || null, assigned_to || null]
    );
    const { rows: task } = await pool.query(
      `SELECT t.*, tg.name as group_name, tg.color as group_color
       FROM tasks t LEFT JOIN task_groups tg ON t.group_id = tg.id WHERE t.id = $1`,
      [rows[0].id]
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
      `UPDATE tasks SET group_id=$1, title=$2, description=$3, status=$4, priority=$5, due_date=$6, assigned_to=$7 WHERE id=$8`,
      [group_id || null, title, description || null, status, priority, due_date || null, assigned_to || null, req.params.id]
    );
    const { rows } = await pool.query(
      `SELECT t.*, tg.name as group_name, tg.color as group_color
       FROM tasks t LEFT JOIN task_groups tg ON t.group_id = tg.id WHERE t.id = $1`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['todo', 'inprogress', 'done'].includes(status)) return res.status(400).json({ error: 'status ไม่ถูกต้อง' });
  try {
    await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'อัปเดตสถานะสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'ลบ task สำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const { rows: total }    = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE user_id = $1', [req.params.userId]);
    const { rows: byStatus } = await pool.query('SELECT status, COUNT(*) as count FROM tasks WHERE user_id = $1 GROUP BY status', [req.params.userId]);
    const { rows: overdue }  = await pool.query(`SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND due_date < CURRENT_DATE AND status != 'done'`, [req.params.userId]);
    const { rows: dueToday } = await pool.query(`SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND due_date = CURRENT_DATE AND status != 'done'`, [req.params.userId]);
    res.json({ total: total[0].count, byStatus, overdue: overdue[0].count, dueToday: dueToday[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});